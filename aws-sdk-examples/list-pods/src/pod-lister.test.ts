import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as k8s from '@kubernetes/client-node'
import { KubernetesPodLister, PodListOptions } from './pod-lister.js'

// Mock the entire kubernetes client-node module
vi.mock('@kubernetes/client-node', () => ({
    KubeConfig: vi.fn(),
    CoreV1Api: vi.fn()
}))

describe('KubernetesPodLister', () => {
    let mockKubeConfig: any
    let mockK8sApi: any
    let consoleSpy: any

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks()

        // Mock console methods
        consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { })
        vi.spyOn(console, 'error').mockImplementation(() => { })

        // Create mock instances
        mockK8sApi = {
            listNamespacedPod: vi.fn(),
        }

        mockKubeConfig = {
            loadFromDefault: vi.fn(),
            makeApiClient: vi.fn().mockReturnValue(mockK8sApi),
            getCurrentCluster: vi.fn().mockReturnValue({ name: 'test-cluster' }),
        }

        // Mock the KubeConfig constructor
        vi.mocked(k8s.KubeConfig).mockImplementation(() => mockKubeConfig)
    })

    afterEach(() => {
        consoleSpy.mockRestore()
    })

    describe('constructor', () => {
        it('should initialize with default config', () => {
            const podLister = new KubernetesPodLister()

            expect(podLister).toBeInstanceOf(KubernetesPodLister)
            expect(mockKubeConfig.loadFromDefault).toHaveBeenCalled()
        })

        it('should accept a custom KubeConfig', () => {
            const customKubeConfig = new k8s.KubeConfig()
            const podLister = new KubernetesPodLister(customKubeConfig)

            expect(podLister).toBeInstanceOf(KubernetesPodLister)
            expect(mockKubeConfig.loadFromDefault).not.toHaveBeenCalled()
        })
    })

    describe('listPods', () => {
        it('should list pods without pagination', async () => {
            // Arrange
            const mockPods = [
                { metadata: { name: 'pod1' } },
                { metadata: { name: 'pod2' } },
            ]

            mockK8sApi.listNamespacedPod.mockResolvedValue({
                items: mockPods,
                metadata: {}
            })

            const options: PodListOptions = {
                namespace: 'default',
                pagelimit: 10,
                timeout: 30,
                dump: false
            }

            // Act
            const podLister = new KubernetesPodLister()
            await podLister.listPods(options)

            // Assert
            expect(mockK8sApi.listNamespacedPod).toHaveBeenCalledWith({
                namespace: 'default',
                limit: 10,
                _continue: undefined,
                timeoutSeconds: 30
            })

            expect(console.info).toHaveBeenCalledWith('pod1')
            expect(console.info).toHaveBeenCalledWith('pod2')
        })

        it('should handle pagination correctly', async () => {
            // Arrange
            const firstPagePods = [{ metadata: { name: 'pod1' } }]
            const secondPagePods = [{ metadata: { name: 'pod2' } }]

            mockK8sApi.listNamespacedPod
                .mockResolvedValueOnce({
                    items: firstPagePods,
                    metadata: { _continue: 'next-token' }
                })
                .mockResolvedValueOnce({
                    items: secondPagePods,
                    metadata: {}
                })

            const options: PodListOptions = {
                namespace: 'kube-system',
                pagelimit: 1,
                timeout: 10,
                dump: false
            }

            // Act
            const podLister = new KubernetesPodLister()
            await podLister.listPods(options)

            // Assert
            expect(mockK8sApi.listNamespacedPod).toHaveBeenCalledTimes(2)
            expect(mockK8sApi.listNamespacedPod).toHaveBeenNthCalledWith(1, {
                namespace: 'kube-system',
                limit: 1,
                _continue: undefined,
                timeoutSeconds: 10
            })
            expect(mockK8sApi.listNamespacedPod).toHaveBeenNthCalledWith(2, {
                namespace: 'kube-system',
                limit: 1,
                _continue: 'next-token',
                timeoutSeconds: 10
            })
        })

        it('should dump full pod data when dump option is true', async () => {
            // Arrange
            const mockPods = [
                {
                    metadata: { name: 'pod1', namespace: 'default' },
                    spec: { containers: [{ name: 'container1' }] }
                }
            ]

            mockK8sApi.listNamespacedPod.mockResolvedValue({
                items: mockPods,
                metadata: {}
            })

            const options: PodListOptions = {
                namespace: 'default',
                pagelimit: 10,
                timeout: 30,
                dump: true
            }

            // Act
            const podLister = new KubernetesPodLister()
            await podLister.listPods(options)

            // Assert
            expect(console.info).toHaveBeenCalledWith(
                JSON.stringify(mockPods, null, 2)
            )
        })

        it('should handle API errors with body', async () => {
            // Arrange
            const apiError = {
                body: { message: 'Namespace not found' }
            }

            mockK8sApi.listNamespacedPod.mockRejectedValue(apiError)

            const options: PodListOptions = {
                namespace: 'nonexistent',
                pagelimit: 10,
                timeout: 30,
                dump: false
            }

            // Act
            const podLister = new KubernetesPodLister()
            await podLister.listPods(options)

            // Assert
            expect(console.error).toHaveBeenCalledWith(
                'k8s api returned error:', 'Namespace not found'
            )
        })

        it('should handle connection errors', async () => {
            // Arrange
            const connectionError = new Error('Connection refused')

            mockK8sApi.listNamespacedPod.mockRejectedValue(connectionError)

            const options: PodListOptions = {
                namespace: 'default',
                pagelimit: 10,
                timeout: 30,
                dump: false
            }

            // Act
            const podLister = new KubernetesPodLister()
            await podLister.listPods(options)

            // Assert
            expect(console.error).toHaveBeenCalledWith(
                'k8s api not reachable:', connectionError
            )
        })
    })
})