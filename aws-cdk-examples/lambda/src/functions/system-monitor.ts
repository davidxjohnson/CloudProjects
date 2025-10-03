/**
 * System Monitor Lambda Function
 * Monitors system metrics and returns health status
 */
export const handler = async (event: any) => {
    const timestamp = new Date().toISOString();

    // Simulate system monitoring
    const metrics = {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        activeConnections: Math.floor(Math.random() * 1000),
    };

    const healthStatus = metrics.cpuUsage < 80 && metrics.memoryUsage < 90 ? 'healthy' : 'warning';

    return {
        status: healthStatus,
        timestamp,
        metrics,
        checks: {
            cpu: metrics.cpuUsage < 80 ? 'pass' : 'fail',
            memory: metrics.memoryUsage < 90 ? 'pass' : 'fail',
            disk: metrics.diskUsage < 95 ? 'pass' : 'fail',
        },
        event,
    };
};