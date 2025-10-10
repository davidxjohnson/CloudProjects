import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseCommandLineOptions, runListLambdas, main } from './list-lambdas.js'

vi.mock('./lambda-lister.js', () => {
    return {
        LambdaLister: class {
            private lambdaClient = {};
            listLambdas(options: any) {
                return Promise.resolve();
            }
        }
    };
});

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
        const { LambdaLister } = await import('./lambda-lister.js');
        const mockLambdaLister = new LambdaLister();
        mockLambdaLister.listLambdas = vi.fn().mockResolvedValue(undefined);
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

            // Use the mocked LambdaLister class
            const { LambdaLister } = await import('./lambda-lister.js');
            const mockLambdaLister = new LambdaLister();
            mockLambdaLister.listLambdas = vi.fn().mockResolvedValue(undefined);

            await runListLambdas(options, mockLambdaLister);

            expect(mockLambdaLister.listLambdas).toHaveBeenCalledWith(options);
        })

        it('should handle errors from lambda lister', async () => {
            const options = {
                region: 'us-east-1',
                pagesize: 10
            }

            const { LambdaLister } = await import('./lambda-lister.js');
            const mockLambdaLister = new LambdaLister();
            mockLambdaLister.listLambdas = vi.fn().mockRejectedValue(new Error('AWS API Error'));

            await expect(runListLambdas(options, mockLambdaLister)).rejects.toThrow('AWS API Error');
        })
    })

    describe('main', () => {
        it('should parse arguments and run lambda listing successfully', async () => {
            // Mock process.argv to simulate command line arguments
            const originalArgv = process.argv
            process.argv = ['node', 'list-lambdas.js', '--region', 'eu-central-1', '--pagesize', '30']

            const { LambdaLister } = await import('./lambda-lister.js');
            const listLambdasSpy = vi.spyOn(LambdaLister.prototype, 'listLambdas').mockResolvedValue(undefined);

            await main()

            // Verify the lambda lister was called
            expect(listLambdasSpy).toHaveBeenCalledWith({
                region: 'eu-central-1',
                pagesize: '30'
            })

            // Restore original argv
            process.argv = originalArgv
        })

        it('should handle errors and exit with code 1', async () => {
            const { LambdaLister } = await import('./lambda-lister.js');
            vi.spyOn(LambdaLister.prototype, 'listLambdas').mockRejectedValue(new Error('Test error'));

            await main();

            // Verify error handling
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', expect.any(Error));
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });

        it('should use default values when no arguments provided', async () => {
            // Mock process.argv with minimal arguments
            const originalArgv = process.argv
            process.argv = ['node', 'list-lambdas.js']

            const { LambdaLister } = await import('./lambda-lister.js');
            const listLambdasSpy = vi.spyOn(LambdaLister.prototype, 'listLambdas').mockResolvedValue(undefined);

            await main();

            expect(listLambdasSpy).toHaveBeenCalledWith({
                region: 'us-east-2',
                pagesize: 50
            });

            // Restore original argv
            process.argv = originalArgv
        })

        it('should create LambdaLister with correct region', async () => {
            const originalArgv = process.argv
            process.argv = ['node', 'list-lambdas.js', '--region', 'ap-northeast-1']

            const { LambdaLister } = await import('./lambda-lister.js');
            const listLambdasSpy = vi.spyOn(LambdaLister.prototype, 'listLambdas').mockResolvedValue(undefined);

            await main();


            // Verify LambdaLister was created with the correct region
            expect(listLambdasSpy).toHaveBeenCalledWith({
                region: 'ap-northeast-1',
                pagesize: 50
            })

            // Restore original argv
            process.argv = originalArgv
        })
    })
})