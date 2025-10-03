import {
    LambdaClient, paginateListFunctions, LambdaPaginationConfiguration,
    ListFunctionsCommandInput, ListFunctionsCommandOutput
} from "@aws-sdk/client-lambda"

export interface LambdaListOptions {
    region: string
    pagesize: number
    // any other options you want to add
}

export class LambdaLister {
    private lambdaClient: LambdaClient

    constructor(customClient?: LambdaClient, region?: string) {
        if (customClient) {
            this.lambdaClient = customClient
        } else {
            // Initialize new client with region
            this.lambdaClient = new LambdaClient({ region: region || 'us-east-2' })
        }
    }

    async listLambdas(options: LambdaListOptions): Promise<void> {
        const clientInput: ListFunctionsCommandInput = {} //FunctionVersion: 'ALL', MasterRegion: defaultRegion }
        const paginatorConfig: LambdaPaginationConfiguration = { client: this.lambdaClient, pageSize: options.pagesize } //, stopOnSameToken: false }
        const paginator: AsyncIterable<ListFunctionsCommandOutput> = paginateListFunctions(paginatorConfig, clientInput)

        // using the nice features of SDK V3 to get a list of lambda names
        process.stdout.write('processing')
        const funcList: string[] = []; // populate some useful object, depending on what data you want

        try {
            for await (const page of paginator) { // itterate through pages
                // the ! after the 'Functions' object tells the compiler to 'just trust me' ...
                // the object will never be null or undefined.
                for (const func of page.Functions!) { // itterate through functions in the current page
                    funcList.push(func.FunctionName!)
                }
            }

            // Output the results
            console.log('')  // New line after processing dots
            console.log(JSON.stringify(funcList, null, 2))
            console.log('success!')
        } catch (error: unknown) {
            const errorObj = error as { body?: { message?: string } }
            if (errorObj.body) {
                // AWS API specific error
                console.error('AWS Lambda API returned error:', errorObj.body.message || errorObj.body)
            } else {
                // Connection or other error
                console.error('AWS Lambda API not reachable:', error)
            }
            throw error // Let the CLI layer decide what to do
        } finally {
            this.lambdaClient.destroy()
        }
    }
}