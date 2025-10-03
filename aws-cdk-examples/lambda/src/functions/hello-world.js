exports.handler = async (event) => {
    console.log('Hello World Lambda invoked', { event });
    
    const name = (event.queryStringParameters && event.queryStringParameters.name) || 'World';
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            message: `Hello, ${name}!`,
            timestamp: new Date().toISOString(),
            requestId: event.requestContext && event.requestContext.requestId,
        }),
    };
};