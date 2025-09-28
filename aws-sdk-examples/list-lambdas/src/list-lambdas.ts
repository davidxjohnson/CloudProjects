/* Uses a paginator to itterate over pages returned by the Lambda SDK
   current AWS context assumed to be set prior to invocation
*/


import { Command, Option } from 'commander'
import { LambdaListOptions } from './lambda-lister.js';

export function parseCommandLineOptions(argv: string[] = process.argv): LambdaListOptions {
    const flag: Command = new Command()
    flag
        .addOption(new Option('-r --region <string>', 'The aws region name to use. (required)').default('us-east-1'))
        .addOption(new Option('-p --pagesize <number>', 'Number of items per page.').default(50))
        .showHelpAfterError()
        .parse(argv);

    const options: LambdaListOptions = {
        region: flag.opts()['region'],
        pagesize: flag.opts()['pagesize']
    };

    return options;
}

export async function runListLambdas(options: LambdaListOptions, lambdaLister: any): Promise<void> {
    await lambdaLister.listLambdas(options);
}

export async function main(): Promise<void> {
    try {
        const options = parseCommandLineOptions();
        // import the LambdaLister class here to avoid circular dependency issues
        const { LambdaLister } = await import('./lambda-lister.js');
        const lambdaLister = new LambdaLister(undefined, options.region);
        await runListLambdas(options, lambdaLister);
    } catch (error) {
        console.error('Error:', error);
            process.exit(1);
        }
    }
// Only run main if this file is executed directly (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
