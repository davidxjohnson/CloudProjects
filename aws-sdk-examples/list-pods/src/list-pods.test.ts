import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseCommandLineOptions, runListPods, main } from './list-pods.js'

// Mock the pod-lister module
vi.mock('./pod-lister', () => ({
  KubernetesPodLister: vi.fn(() => ({
    listPods: vi.fn().mockResolvedValue(undefined)
  }))
}))

describe('List Pods CLI', () => {
  let mockListPods: any
  let consoleErrorSpy: any
  let processExitSpy: any
  let originalExit: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Save original process.exit
    originalExit = process.exit

    // Mock process.exit to prevent actual exit during tests
    processExitSpy = vi.fn()
    process.exit = processExitSpy as any

    // Spy on console.error
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    // Get the mocked listPods function
    const { KubernetesPodLister } = await import('./pod-lister')
    const MockedLister = KubernetesPodLister as any
    mockListPods = vi.fn().mockResolvedValue(undefined)
    MockedLister.mockImplementation(() => ({
      listPods: mockListPods
    }))
  })

  afterEach(() => {
    // Restore original process.exit
    process.exit = originalExit

    // Clear all mocks
    vi.clearAllMocks()
    consoleErrorSpy?.mockRestore()
  })

  describe('parseCommandLineOptions', () => {
    it('should parse command line arguments correctly', () => {
      const argv = [
        'node',
        'list-pods.js',
        '--namespace', 'test-namespace',
        '--pagelimit', '5',
        '--timeout', '20',
        '--dump'
      ]

      const options = parseCommandLineOptions(argv)

      expect(options.namespace).toBe('test-namespace')
      expect(options.pagelimit).toBe('5')
      expect(options.timeout).toBe('20')
      expect(options.dump).toBe(true)
    })

    it('should use default values when no arguments are provided', () => {
      const argv = ['node', 'list-pods.js']

      const options = parseCommandLineOptions(argv)

      expect(options.namespace).toBe('kube-system')
      expect(options.pagelimit).toBe(10)
      expect(options.timeout).toBe(10)
      expect(options.dump).toBe(false)
    })
  })

  describe('runListPods', () => {
    it('should create pod lister and call listPods with provided options', async () => {
      const options = {
        namespace: 'test-namespace',
        pagelimit: 5,
        timeout: 15,
        dump: true
      }

      await runListPods(options)

      expect(mockListPods).toHaveBeenCalledWith(options)
    })
  })

  describe('main', () => {
    it('should handle errors and exit with code 1', async () => {
      // Make listPods throw an error
      mockListPods.mockRejectedValue(new Error('Test error'))

      await main()

      // Verify error handling
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error))
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })
  })
})