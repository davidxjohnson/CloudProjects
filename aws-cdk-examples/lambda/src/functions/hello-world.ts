import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Hello World Lambda Function
 * A simple function that returns a greeting message
 */
export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log('Hello World Lambda invoked', { event });

    const name = event.queryStringParameters?.name || 'World';

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            message: `Hello, ${name}!`,
            timestamp: new Date().toISOString(),
            requestId: event.requestContext?.requestId,
        }),
    };
};