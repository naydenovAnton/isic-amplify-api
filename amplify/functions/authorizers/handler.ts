import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, Context } from 'aws-lambda';
import { getDataClient } from '../shared/amplifyClient';

export const handler = async (
    event: APIGatewayTokenAuthorizerEvent,
    context: Context
): Promise<APIGatewayAuthorizerResult> => {
    const authHeader = event.authorizationToken || '';
    const tokenValue = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    console.log('TOKEN:', tokenValue);

    if (!tokenValue) {
        console.log('❌ No token provided');
        return generatePolicy('unauthorized-user', 'Deny', event.methodArn);
    }

    const client = await getDataClient();

    try {
        // 1. Get token and contractor info
        const { data: tokens } = await client.models.ContractorToken.listContractorTokenByToken({
            token: tokenValue
        });

        const validToken = tokens?.find(t =>
            t.isActive &&
            new Date(t.expiresAt) > new Date()
        );

        if (!validToken) {
            console.log('❌ Token not found or inactive');
            return generatePolicy('unauthorized-user', 'Deny', event.methodArn);
        }

        // 2. Get contractor details
        const { data: contractor } = await client.models.Contractor.get({
            id: validToken.contractorId
        });

        if (!contractor?.isActive) {
            console.log('❌ Contractor not found or inactive');
            return generatePolicy('unauthorized-user', 'Deny', event.methodArn);
        }

        // 3. Check rate limit
        const rateLimit = contractor.rateLimit ?? 100; // Default to 100 if not set
        const rateLimitCheck = await checkRateLimit(
            client,
            validToken.contractorId,
            rateLimit
        );

        if (!rateLimitCheck.allowed) {

            console.log('❌ Rate limit exceeded');
            return {
                principalId: validToken.contractorId,
                policyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Action: 'execute-api:Invoke',
                        Effect: 'Deny',
                        Resource: event.methodArn
                    }],
                },
                context: {
                    'x-ratelimit-remaining': '0',
                    'x-ratelimit-reset': rateLimitCheck.resetAt.toISOString(),
                    'x-ratelimit-error': 'Rate limit exceeded',
                    message: 'Rate limit exceeded'
                }
            };
        }

        console.log('✅ Token valid, rate limit OK');

        return {
            principalId: validToken.contractorId,
            policyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Action: 'execute-api:Invoke',
                    Effect: 'Allow',
                    Resource: event.methodArn
                }],
            },
            context: {
                'x-contractor-id': validToken.contractorId,
                'x-token-id': validToken.id,
                'x-ratelimit-remaining': rateLimitCheck.remaining.toString(),
                'x-ratelimit-reset': rateLimitCheck.resetAt.toISOString(),
                'x-ratelimit-limit': rateLimit.toString(),
                message: 'Access granted'
            }
        };

    } catch (error) {
        console.error('Authorization error:', error);
        return generatePolicy('unauthorized-user', 'Deny', event.methodArn);
    }
}

/**
 * Check rate limit using RateLimitCounter model
 * Uses hourly rolling window: contractor-id-YYYY-MM-DD-HH
 */
async function checkRateLimit(
    client: any,
    contractorId: string,
    rateLimit: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, '0');
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const counterId = `${contractorId}-${date}-${hour}`;

    try {
        // 1. Try to get existing counter
        const { data: counter } = await client.models.RateLimitCounter.get({
            id: counterId
        });

        const currentCount = counter?.requestCount || 0;
        const allowed = currentCount < rateLimit;

        if (!allowed) {
            // Rate limit exceeded - return next hour reset time
            const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
            nextHour.setMinutes(0, 0, 0);

            return {
                allowed: false,
                remaining: 0,
                resetAt: nextHour
            };
        }

        // 2. Increment counter
        const expiresAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hour TTL

        if (counter) {
            // Update existing counter
            await client.models.RateLimitCounter.update({
                id: counterId,
                requestCount: currentCount + 1,
                expiresAt: expiresAt.toISOString()
            });
        } else {
            // Create new counter
            await client.models.RateLimitCounter.create({
                id: counterId,
                contractorId,
                hourWindow: `${date}-${hour}`,
                requestCount: 1,
                expiresAt: expiresAt.toISOString()
            });
        }

        // Calculate next hour for reset
        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
        nextHour.setMinutes(0, 0, 0);

        return {
            allowed: true,
            remaining: Math.max(0, rateLimit - (currentCount + 1)),
            resetAt: nextHour
        };

    } catch (error) {
        console.error('Rate limit check failed:', error);
        // Fail open - allow request if check fails
        // This prevents outages if rate limiter breaks
        return {
            allowed: true,
            remaining: -1,
            resetAt: new Date()
        };
    }
}

function generatePolicy(
    principalId: string,
    effect: 'Allow' | 'Deny',
    resource: string
): APIGatewayAuthorizerResult {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }],
        },
        context: {
            message: effect === 'Allow' ? 'Access granted' : 'Access denied'
        }
    };
}