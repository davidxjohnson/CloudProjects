exports.handler = async (event, context) => {
    console.log('Data Processor Lambda invoked', { event, context });
    
    const startTime = Date.now();
    
    // Simulate data processing
    const data = Array.isArray(event.data) ? event.data : [event.data || 'sample data'];
    
    const processedData = data.map((item, index) => ({
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