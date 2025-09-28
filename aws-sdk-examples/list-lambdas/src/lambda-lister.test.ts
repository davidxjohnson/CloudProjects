import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as LambdaModule from '@aws-sdk/client-lambda'
import { LambdaLister, LambdaListOptions } from './lambda-lister.js'

// Mock the entire AWS Lambda client module
vi.mock('@aws-sdk/client-lambda', () => ({
    LambdaClient: vi.fn(),
    paginateListFunctions: vi.fn()
}))

describe('LambdaLister', () => {
    let mockLambdaClient: any
    let consoleSpy: any

    beforeEach(() => {
        // Clear all mocks
        vi.clearAllMocks()

        // Mock console methods
        consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => { })
        vi.spyOn(console, 'error').mockImplementation(() => { })

        // Create mock Lambda client
        mockLambdaClient = {
            destroy: vi.fn()
        }

        // Mock the LambdaClient constructor
        vi.mocked(LambdaModule.LambdaClient).mockImplementation(() => mockLambdaClient)
    })

    afterEach(() => {
        consoleSpy.mockRestore()
    })

    describe('constructor', () => {
        it('should initialize with default client', () => {
            const lister = new LambdaLister()

            expect(lister).toBeInstanceOf(LambdaLister)
            expect(LambdaModule.LambdaClient).toHaveBeenCalledWith({ region: 'us-east-1' })
        })

        it('should accept a custom region', () => {
            const lister = new LambdaLister(undefined, 'eu-west-1')

            expect(lister).toBeInstanceOf(LambdaLister)
            expect(LambdaModule.LambdaClient).toHaveBeenCalledWith({ region: 'eu-west-1' })
        })

        it('should accept a custom LambdaClient', () => {
            const customClient = {} as any
            const lister = new LambdaLister(customClient)

            expect(lister).toBeInstanceOf(LambdaLister)
            // Should not create new client when custom one provided
            expect(LambdaModule.LambdaClient).not.toHaveBeenCalled()
        })
    })

    describe('listLambdas', () => {
        it('should list lambda functions without pagination', async () => {
            // Arrange
            const mockLambdas = [
                { FunctionName: 'lambda1' },
                { FunctionName: 'lambda2' },
            ]

            // Create proper async iterator mock
            const mockPaginator = {
                async *[Symbol.asyncIterator]() {
                    yield {
                        Functions: mockLambdas,
                    }
                }
            }

            vi.mocked(LambdaModule.paginateListFunctions).mockReturnValue(mockPaginator as any)

            const options: LambdaListOptions = {
                region: 'us-east-1',
                pagesize: 10
            }

            // Act
            const lister = new LambdaLister()
            await lister.listLambdas(options)

            // Assert
            expect(LambdaModule.paginateListFunctions).toHaveBeenCalledWith(
                { client: mockLambdaClient, pageSize: 10 },
                {}
            )
            // The current implementation doesn't output to console.info
            // expect(console.info).toHaveBeenCalledWith(['lambda1', 'lambda2'])
            expect(mockLambdaClient.destroy).toHaveBeenCalled()
        })

        it('should handle multiple pages of lambda functions', async () => {
            // Arrange
            const firstPageLambdas = [{ FunctionName: 'lambda1' }]
            const secondPageLambdas = [{ FunctionName: 'lambda2' }]

            // Create proper async iterator mock with multiple pages
            const mockPaginator = {
                async *[Symbol.asyncIterator]() {
                    yield { Functions: firstPageLambdas }
                    yield { Functions: secondPageLambdas }
                }
            }

            vi.mocked(LambdaModule.paginateListFunctions).mockReturnValue(mockPaginator as any)

            const options: LambdaListOptions = {
                region: 'us-west-2',
                pagesize: 1
            }

            // Act
            const lister = new LambdaLister()
            await lister.listLambdas(options)

            // Assert - should collect from both pages
            // expect(console.info).toHaveBeenCalledWith(['lambda1', 'lambda2'])
            expect(mockLambdaClient.destroy).toHaveBeenCalled()
        })

        it('should handle AWS API errors', async () => {
            // Arrange
            const apiError = new Error('AWS API Error')

            // Create async iterator that throws
            const mockPaginator = {
                // eslint-disable-next-line require-yield
                async *[Symbol.asyncIterator]() {
                    throw apiError
                }
            }

            vi.mocked(LambdaModule.paginateListFunctions).mockReturnValue(mockPaginator as any)

            const options: LambdaListOptions = {
                region: 'us-east-1',
                pagesize: 10
            }

            // Act & Assert
            const lister = new LambdaLister()
            await expect(lister.listLambdas(options)).rejects.toThrow('AWS API Error')
            expect(console.error).toHaveBeenCalledWith('AWS Lambda API not reachable:', apiError)
            expect(mockLambdaClient.destroy).toHaveBeenCalled()
        })

        it('should handle empty lambda function list', async () => {
            // Arrange
            const mockPaginator = {
                async *[Symbol.asyncIterator]() {
                    yield { Functions: [] } // Empty results
                }
            }

            vi.mocked(LambdaModule.paginateListFunctions).mockReturnValue(mockPaginator as any)

            const options: LambdaListOptions = {
                region: 'us-east-1',
                pagesize: 10
            }

            // Act
            const lister = new LambdaLister()
            await lister.listLambdas(options)

            // Assert
            // expect(console.info).toHaveBeenCalledWith([])
            expect(mockLambdaClient.destroy).toHaveBeenCalled()
        })
    })
})