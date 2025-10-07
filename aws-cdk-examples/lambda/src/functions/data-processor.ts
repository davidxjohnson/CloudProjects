import { Context } from 'aws-lambda';

/**
 * Data Processing Lambda Function
 * Processes data and returns transformation results
 */

interface DataProcessorEvent {
    data?: unknown;
}

interface ProcessedItem {
    id: number;
    original: unknown;
    processed: string;
    timestamp: string;
}

interface DataProcessorResponse {
    success: boolean;
    itemsProcessed: number;
    processingTimeMs: number;
    data: ProcessedItem[];
    functionName: string;
    requestId: string;
}

export const handler = async (event: DataProcessorEvent, context: Context): Promise<DataProcessorResponse> => {
    console.log('Data Processor Lambda invoked', { event, context });

    const startTime = Date.now();

    // Simulate data processing
    const data = Array.isArray(event.data) ? event.data : [event.data || 'sample data'];

    const processedData: ProcessedItem[] = data.map((item: unknown, index: number) => ({
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