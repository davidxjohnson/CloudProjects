/**
 * System Monitor Lambda Function
 * Monitors system metrics and returns health status
 */

interface SystemMetrics {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
}

interface HealthChecks {
    cpu: 'pass' | 'fail';
    memory: 'pass' | 'fail';
    disk: 'pass' | 'fail';
}

interface SystemMonitorResponse {
    status: 'healthy' | 'warning';
    timestamp: string;
    metrics: SystemMetrics;
    checks: HealthChecks;
    event: unknown;
}

export const handler = async (event: unknown): Promise<SystemMonitorResponse> => {
    const timestamp = new Date().toISOString();

    // Simulate system monitoring
    const metrics: SystemMetrics = {
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskUsage: Math.random() * 100,
        activeConnections: Math.floor(Math.random() * 1000),
    };

    const healthStatus: 'healthy' | 'warning' = metrics.cpuUsage < 80 && metrics.memoryUsage < 90 ? 'healthy' : 'warning';

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