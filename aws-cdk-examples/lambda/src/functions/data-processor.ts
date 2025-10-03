import { Context } from 'aws-lambda';

/**
 * Data Processing Lambda Function
 * Processes data and returns transformation results
 */
export const handler = async (event: any, context: Context) => {
    console.log('Data Processor Lambda invoked', { event, context });

    const startTime = Date.now();

    // Simulate data processing
    const data = Array.isArray(event.data) ? event.data : [event.data || 'sample data'];

    const processedData = data.map((item: any, index: number) => ({
        id: index + 1,
        original: item,
        processed: typeof item === 'string' ? item.toUpperCase() : JSON.stringify(item),
        timestamp: new Date().toISOString(),
    }));

    const processingTime = Date.now() - startTime;

    return {
        success: true,
        itemsProcessed: processedData.length,
        processingTimeMs: processingTime,
        data: processedData,
        functionName: context.functionName,
        requestId: context.awsRequestId,
    };
};