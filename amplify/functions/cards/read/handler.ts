import type { APIGatewayProxyHandler } from 'aws-lambda';
import { getDataClient } from '../../shared/amplifyClient';
// import { logAPIRequest } from '../../shared/logger';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {

        console.log('Fetching partner cards from database...');

        // 1) Auth
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return unauthorized('Valid authorization token required');
        }
        const token = authHeader.replace('Bearer ', '').trim();

        const client = await getDataClient();

        // 2) Validate token
        const { data: tokens, errors: tokenErrors } = await client.models.ContractorToken.list({
            filter: {
                token: { eq: token },
                isActive: { eq: true },
                expiresAt: { ge: new Date().toISOString() },
            },
        });

        if (tokenErrors?.length) throw new Error(tokenErrors[0].message);
        if (!tokens?.length) return unauthorized('Invalid or expired token');
        const validToken = tokens[0];

        // 3) Validate contractor
        const { data: contractors, errors: contractorErrors } = await client.models.Contractor.list({
            filter: { id: { eq: validToken.contractorId }, isActive: { eq: true } },
        });
        if (contractorErrors?.length) throw new Error(contractorErrors[0].message);
        if (!contractors?.length) return unauthorized('Contractor not found or inactive');
        const contractor = contractors[0];
        console.log(`Contractor: ${contractor.name}`);

        // log (async)
        // logAPIRequest(event).catch(console.error);

        // 4) Contractor ↔ Card relations
        const { data: contractorCards, errors: cardErrors } = await client.models.ContractorCard.list({
            filter: { contractorId: { eq: validToken.contractorId } },
        });
        if (cardErrors?.length) throw new Error(cardErrors[0].message);
        if (!contractorCards?.length) return ok({ cards: [] });

        const cardIds = contractorCards.map((cc) => cc.cardId);

        // 5) Get active cards
        const { data: allActiveCards, errors: cardsErrors } = await client.models.Card.list({
            filter: { isActive: { eq: true } },
        });
        if (cardsErrors?.length) throw new Error(cardsErrors[0].message);

        const cards = allActiveCards.filter((c) => cardIds.includes(c.id));
        const results: Array<{
            id: string;
            name: string;
            type: string;
            description?: string | null;
            dynamicPrice: boolean;
            price: number | string; // number when static; "min-max" when dynamic
        }> = [];

        // 6) Build output cards
        for (const card of cards) {
            const contractorCard = contractorCards.find((cc) => cc.cardId === card.id);
            const discountPercent = contractorCard?.discountPercent || 0;
            const basePrice = card.price || 0;

            // Discounted base (static case)
            const discountedBase = applyDiscount(basePrice, discountPercent);

            // Is there a price-affecting select link?
            const { data: links } = await client.models.CardFieldLink.list({
                filter: { cardId: { eq: card.id }, affectsPrice: { eq: true } },
            });

            let dynamicPrice = false;
            let priceOut: number | string = round2(discountedBase);

            const priceLink = links[0]; // admin UI enforces max 1, but be defensive
            if (priceLink) {
                const { data: field } = await client.models.CardRequiredField.get({ id: priceLink.fieldId });
                if (field?.fieldType === 'select') {
                    dynamicPrice = true;

                    // Load select options
                    const { data: options } = await client.models.FieldOption.list({
                        filter: { fieldId: { eq: field.id } },
                    });

                    // For each option, use override price if present; otherwise base card price.
                    // Apply partner discount in BOTH cases.
                    const perOptionDiscounted: number[] = [];
                    for (const opt of options) {
                        const { data: overrides } = await client.models.CardFieldOptionLink.list({
                            filter: {
                                cardFieldLinkId: { eq: priceLink.id },
                                optionId: { eq: opt.id },
                            },
                        });

                        const rawOptionPrice = overrides?.[0]?.price ?? basePrice;
                        const discountedOptionPrice = applyDiscount(rawOptionPrice, discountPercent);
                        perOptionDiscounted.push(discountedOptionPrice);
                    }

                    if (perOptionDiscounted.length) {
                        const min = Math.min(...perOptionDiscounted);
                        const max = Math.max(...perOptionDiscounted);
                        priceOut = `${fmtMoney(min)}-${fmtMoney(max)}`;
                    } else {
                        // no options → treat as static
                        dynamicPrice = false;
                        priceOut = round2(discountedBase);
                    }
                }
            }

            results.push({
                id: card.id,
                name: card.name,
                type: card.type,
                description: card.description ?? null,
                dynamicPrice,
                price: dynamicPrice ? (priceOut as string) : round2(discountedBase),
            });
        }

        return ok({ cards: results });
    } catch (error) {
        console.error('❌ Error fetching partner cards:', error);
        return errorResponse(error);
    }
};

// ---------- helpers ----------

const ok = (body: any) => ({
    statusCode: 200,
    headers: cors(),
    body: JSON.stringify({ success: true, ...body }),
});

const unauthorized = (message: string) => ({
    statusCode: 401,
    headers: cors(),
    body: JSON.stringify({ success: false, error: 'Unauthorized', message }),
});

const errorResponse = (err: any) => ({
    statusCode: 500,
    headers: cors(),
    body: JSON.stringify({
        success: false,
        error: 'Failed to read cards',
        message: err instanceof Error ? err.message : 'Unknown error',
    }),
});

const cors = () => ({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
});

function applyDiscount(amount: number, pct: number) {
    const v = amount * (1 - (pct || 0) / 100);
    return Number.isFinite(v) ? v : 0;
}

function round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

// “0-40” style; no forced trailing .00
function fmtMoney(n: number) {
    const r = round2(n);
    return Number.isInteger(r) ? String(r) : r.toFixed(2);
}
