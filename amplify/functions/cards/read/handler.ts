import type { APIGatewayProxyHandler } from 'aws-lambda';

import { getDataClient } from '../../shared/amplifyClient';
import { logAPIRequest } from '../../shared/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        console.log('Fetching partner cards from database...');

        // Extract and validate authorization token
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Valid authorization token required'
                }),
            };
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('Processing request for token:', token.substring(0, 8) + '...');

        const client = getDataClient();

        // Step 1: Validate token and get contractor
        const { data: tokens, errors: tokenErrors } = await client.models.ContractorToken.list({
            filter: {
                token: { eq: token },
                isActive: { eq: true },
                expiresAt: { ge: new Date().toISOString() }
            }
        });

        if (tokenErrors) {
            console.error('Errors validating token:', tokenErrors);
            throw new Error(tokenErrors[0].message);
        }

        if (!tokens || tokens.length === 0) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Invalid or expired token'
                }),
            };
        }

        const validToken = tokens[0];
        console.log(`Valid token found for contractor: ${validToken.contractorId}`);

        // Step 2: Get contractor details to check if active
        const { data: contractors, errors: contractorErrors } = await client.models.Contractor.list({
            filter: {
                id: { eq: validToken.contractorId },
                isActive: { eq: true }
            }
        });

        if (contractorErrors) {
            console.error('Errors fetching contractor:', contractorErrors);
            throw new Error(contractorErrors[0].message);
        }

        if (!contractors || contractors.length === 0) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Unauthorized',
                    message: 'Contractor not found or inactive'
                }),
            };
        }

        const contractor = contractors[0];
        console.log(`Contractor found: ${contractor.name}`);

        // Log the API request with contractor context
        logAPIRequest(event).catch(console.error);

        // Step 3: Get cards assigned to this contractor via ContractorCard
        const { data: contractorCards, errors: cardErrors } = await client.models.ContractorCard.list({
            filter: {
                contractorId: { eq: validToken.contractorId }
            }
        });

        if (cardErrors) {
            console.error('Errors fetching contractor cards:', cardErrors);
            throw new Error(cardErrors[0].message);
        }

        console.log(`Found ${contractorCards.length} card assignments for contractor`);

        // Extract card IDs from assignments
        const cardIds = contractorCards.map(cc => cc.cardId).filter(Boolean);

        if (cardIds.length === 0) {
            console.log('No cards assigned to this contractor');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                body: JSON.stringify({
                    success: true,
                    cards: []
                }),
            };
        }

        // Step 4: Get all active cards and filter in memory
        const { data: allActiveCards, errors: cardsErrors } = await client.models.Card.list({
            filter: {
                isActive: { eq: true }
            }
        });

        if (cardsErrors) {
            console.error('Errors fetching cards:', cardsErrors);
            throw new Error(cardsErrors[0].message);
        }

        // Filter to only cards assigned to this contractor
        const cards = allActiveCards.filter(card => cardIds.includes(card.id));

        // Step 5: Format response with only required fields and discounted price
        const formattedCards = cards.map(card => {
            const contractorCard = contractorCards.find(cc => cc.cardId === card.id);
            const discountPercent = contractorCard?.discountPercent || 0;
            const originalPrice = card.price || 0;
            const discountedPrice = originalPrice * (1 - discountPercent / 100);

            return {
                id: card.id,
                name: card.name,
                type: card.type,
                description: card.description,
                price: parseFloat(discountedPrice.toFixed(2)), // Format to 2 decimal places
            };
        });

        console.log(`Successfully fetched ${formattedCards.length} active cards for contractor`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*'
            },
            body: JSON.stringify({
                success: true,
                cards: formattedCards
            }),
        };
    } catch (error) {
        console.error('Error fetching partner cards:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to read cards',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};