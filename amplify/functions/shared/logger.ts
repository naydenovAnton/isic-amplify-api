import { getDataClient } from './amplifyClient';

/**
 * Logs API requests to APILog model.
 * Should be called from inside endpoint handlers, not authorizers.
 */
export async function logAPIRequest(event: any): Promise<void> {
    try {
        const { authorizer } = event.requestContext || {};
        const contractorId = authorizer?.['x-contractor-id'];
        const tokenId = authorizer?.['x-token-id'];
        const endpoint = event.resource || 'unknown';
        const ipAddress =
            event.requestContext?.identity?.sourceIp ||
            event.headers['x-forwarded-for'] ||
            'unknown';

        if (!contractorId || !tokenId) {
            console.warn('⚠️ Skipping log: missing contractor/token info');
            return;
        }

        const client = await getDataClient();

        await client.models.APILog.create({
            contractorId,
            tokenId,
            endpoint,
            timestamp: new Date().toISOString(),
            ipAddress,
        });

        console.log('✅ API request logged:', { contractorId, endpoint });
    } catch (error) {
        console.error('❌ Failed to log API request:', error);
        // Don’t throw — logging should never block main flow
    }
}
