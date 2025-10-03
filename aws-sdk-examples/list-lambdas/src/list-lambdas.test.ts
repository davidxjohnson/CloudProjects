import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseCommandLineOptions, runListLambdas, main } from './list-lambdas.js'

// Mock the lambda-lister module
vi.mock('./lambda-lister.js', () => ({
    LambdaLister: vi.fn(() => ({
        listLambdas: vi.fn().mockResolvedValue(undefined)
    }))
}))

describe('List Lambdas CLI', () => {
    let mockListLambdas: any
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

        // Get the mocked listLambdas function
        const { LambdaLister } = await import('./lambda-lister.js')
        const MockedLister = LambdaLister as any
        mockListLambdas = vi.fn().mockResolvedValue(undefined)
        MockedLister.mockImplementation(() => ({
            listLambdas: mockListLambdas
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
                'list-lambdas.js',
                '--region', 'eu-west-1',
                '--pagesize', '25'
            ]

            const options = parseCommandLineOptions(argv)

            expect(options.region).toBe('eu-west-1')
            expect(options.pagesize).toBe('25')
        })

        it('should use default values when no arguments are provided', () => {
            const argv = ['node', 'list-lambdas.js']

            const options = parseCommandLineOptions(argv)

            expect(options.region).toBe('us-east-2')
            expect(options.pagesize).toBe(50)
        })

        it('should handle short form flags', () => {
            const argv = [
                'node',
                'list-lambdas.js',
                '-r', 'ap-southeast-1',
                '-p', '100'
            ]

            const options = parseCommandLineOptions(argv)

            expect(options.region).toBe('ap-southeast-1')
            expect(options.pagesize).toBe('100')
        })

        it('should handle mixed short and long form flags', () => {
            const argv = [
                'node',
                'list-lambdas.js',
                '--region', 'ca-central-1',
                '-p', '75'
            ]

            const options = parseCommandLineOptions(argv)

            expect(options.region).toBe('ca-central-1')
            expect(options.pagesize).toBe('75')
        })
    })

    describe('runListLambdas', () => {
        it('should create lambda lister and call listLambdas with provided options', async () => {
            const options = {
                region: 'us-west-2',
                pagesize: 20
            }

            const mockLambdaLister = {
                listLambdas: vi.fn().mockResolvedValue(undefined)
            }

            await runListLambdas(options, mockLambdaLister)

            expect(mockLambdaLister.listLambdas).toHaveBeenCalledWith(options)
        })

        it('should handle errors from lambda lister', async () => {
            const options = {
                region: 'us-east-1',
                pagesize: 10
            }

            const mockLambdaLister = {
                listLambdas: vi.fn().mockRejectedValue(new Error('AWS API Error'))
            }

            await expect(runListLambdas(options, mockLambdaLister)).rejects.toThrow('AWS API Error')
        })
    })

    describe('main', () => {
        it('should parse arguments and run lambda listing successfully', async () => {
            // Mock process.argv to simulate command line arguments
            const originalArgv = process.argv
            process.argv = ['node', 'list-lambdas.js', '--region', 'eu-central-1', '--pagesize', '30']

            await main()

            // Verify the lambda lister was called
            expect(mockListLambdas).toHaveBeenCalledWith({
                region: 'eu-central-1',
                pagesize: '30'
            })

            // Restore original argv
            process.argv = originalArgv
        })

        it('should handle errors and exit with code 1', async () => {
            // Make listLambdas throw an error
            mockListLambdas.mockRejectedValue(new Error('Test error'))

            await main()

            // Verify error handling
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error))
            expect(processExitSpy).toHaveBeenCalledWith(1)
        })

        it('should use default values when no arguments provided', async () => {
            // Mock process.argv with minimal arguments
            const originalArgv = process.argv
            process.argv = ['node', 'list-lambdas.js']

            await main()

            // Verify default values were used
            expect(mockListLambdas).toHaveBeenCalledWith({
                region: 'us-east-2',
                pagesize: 50
            })

            // Restore original argv
            process.argv = originalArgv
        })

        it('should create LambdaLister with correct region', async () => {
            const originalArgv = process.argv
            process.argv = ['node', 'list-lambdas.js', '--region', 'ap-northeast-1']

            const { LambdaLister } = await import('./lambda-lister.js')

            await main()

            // Verify LambdaLister was created with the correct region
            expect(LambdaLister).toHaveBeenCalledWith(undefined, 'ap-northeast-1')

            // Restore original argv
            process.argv = originalArgv
        })
    })
})