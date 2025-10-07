import { App, Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

/**
 * Lambda Stack with multiple functions for demonstration
 * 
 * Deploys three Lambda functions:
 * 1. HelloWorld - API Gateway integrated function for HTTP requests
 * 2. DataProcessor - Event-driven function for data processing
 * 3. SystemMonitor - Monitoring function for system health checks
 * 
 * The HelloWorld function is exposed via API Gateway for easy testing
 */

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Lambda Function 1: Hello World (API Gateway integrated)
        const helloWorldFunction = new Function(this, 'HelloWorldFunction', {
            functionName: 'hello-world-function',
            runtime: Runtime.NODEJS_18_X,
            handler: 'hello-world.handler',
            code: Code.fromAsset('./src/functions'),
            timeout: Duration.seconds(30),
            description: 'Simple Hello World Lambda function with API Gateway integration',
        });

        // Lambda Function 2: Data Processor
        const dataProcessorFunction = new Function(this, 'DataProcessorFunction', {
            functionName: 'data-processor-function',
            runtime: Runtime.NODEJS_18_X,
            handler: 'data-processor.handler',
            code: Code.fromAsset('./src/functions'),
            timeout: Duration.seconds(60),
            description: 'Data processing Lambda function for transformation tasks',
        });

        // Lambda Function 3: System Monitor
        const systemMonitorFunction = new Function(this, 'SystemMonitorFunction', {
            functionName: 'system-monitor-function',
            runtime: Runtime.NODEJS_18_X,
            handler: 'system-monitor.handler',
            code: Code.fromAsset('./src/functions'),
            timeout: Duration.seconds(30),
            description: 'System monitoring Lambda function for health checks',
        });

        // API Gateway for Hello World function
        const api = new RestApi(this, 'LambdaApi', {
            restApiName: 'Lambda Functions API',
            description: 'API Gateway for Lambda functions demo',
        });

        // Integrate Hello World function with API Gateway
        const helloWorldIntegration = new LambdaIntegration(helloWorldFunction, {
            requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        });

        api.root.addMethod('GET', helloWorldIntegration);
        api.root.addResource('hello').addMethod('GET', helloWorldIntegration);

        // Output the API URL for easy testing
        new CfnOutput(this, 'ApiUrl', {
            value: api.url,
            description: 'API Gateway URL for Hello World function',
        });

        // Output Lambda function names for the list-lambdas CLI tool
        new CfnOutput(this, 'LambdaFunctions', {
            value: [
                helloWorldFunction.functionName,
                dataProcessorFunction.functionName,
                systemMonitorFunction.functionName,
            ].join(', '),
            description: 'Deployed Lambda function names',
        });
    }
}

const app = new App();
new LambdaStack(app, 'LambdaStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});

app.synth();