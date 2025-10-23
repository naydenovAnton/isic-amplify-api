// amplify/functions/cards/get/handler.ts
import type { APIGatewayProxyHandler } from 'aws-lambda';

import { getDataClient } from '../../shared/amplifyClient';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        console.log('Fetching card details from database...');

        // Extract card ID from path parameters
        const cardId = event.pathParameters?.cardId;
        if (!cardId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Bad Request',
                    message: 'Card ID is required'
                }),
            };
        }

        // Extract contractor ID from the request context - UPDATED KEY
        const contractorId = event.requestContext?.authorizer?.['x-contractor-id'];

        console.log('event', event)

        if (!contractorId) {
            console.log('Authorizer context:', JSON.stringify(event.requestContext?.authorizer));
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
                    message: 'Contractor ID not found in authorizer context'
                }),
            };
        }

        console.log(`Fetching card ${cardId} for contractor ${contractorId}`);

        const client = getDataClient();

        // Step 1: Check if this card is assigned to the contractor
        const { data: contractorCards, errors: contractorCardErrors } = await client.models.ContractorCard.list({
            filter: {
                contractorId: { eq: contractorId },
                cardId: { eq: cardId }
            }
        });

        if (contractorCardErrors) {
            console.error('Errors checking card assignment:', contractorCardErrors);
            throw new Error(contractorCardErrors[0].message);
        }

        if (!contractorCards || contractorCards.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Not Found',
                    message: 'Card not found or not assigned to this partner'
                }),
            };
        }

        // Step 2: Get the card details
        const { data: cards, errors: cardErrors } = await client.models.Card.list({
            filter: {
                id: { eq: cardId },
                isActive: { eq: true }
            }
        });

        if (cardErrors) {
            console.error('Errors fetching card:', cardErrors);
            throw new Error(cardErrors[0].message);
        }

        if (!cards || cards.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Not Found',
                    message: 'Card not found or inactive'
                }),
            };
        }

        const card = cards[0];

        // Step 3: Get required fields for this card
        const { data: requiredFields, errors: fieldsErrors } = await client.models.CardRequiredField.list({
            filter: {
                cardId: { eq: cardId }
            }
        });

        if (fieldsErrors) {
            console.error('Errors fetching required fields:', fieldsErrors);
            throw new Error(fieldsErrors[0].message);
        }

        // Sort required fields by order if specified
        const sortedFields = (requiredFields || []).sort((a, b) => {
            const orderA = a.order || 0;
            const orderB = b.order || 0;
            return orderA - orderB;
        });

        // Step 4: Format response with card details and required fields
        const contractorCard = contractorCards[0];
        const discountPercent = contractorCard?.discountPercent || 0;
        const originalPrice = card.price || 0;
        const discountedPrice = originalPrice * (1 - discountPercent / 100);

        const formattedCard = {
            id: card.id,
            name: card.name,
            type: card.type,
            description: card.description,
            price: parseFloat(discountedPrice.toFixed(2)),
            formFields: sortedFields.map(field => ({
                fieldName: field.fieldName,
                fieldType: field.fieldType,
                isRequired: field.isRequired,
                label: field.label,
                placeholder: field.placeholder,
                validationRegex: field.validationRegex,
                order: field.order
            }))
        };

        console.log(`Successfully fetched card details with ${sortedFields.length} required fields`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*'
            },
            body: JSON.stringify({
                success: true,
                card: formattedCard
            }),
        };
    } catch (error) {
        console.error('Error fetching card details:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to read card details',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};