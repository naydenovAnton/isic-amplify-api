import type { APIGatewayProxyHandler } from 'aws-lambda';
import { getDataClient } from '../../shared/amplifyClient';

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        console.log('Fetching card details...');

        // --- 1️⃣ Validate input
        const cardId = event.pathParameters?.cardId;
        if (!cardId) return badRequest('Card ID is required');

        const contractorId = event.requestContext?.authorizer?.['x-contractor-id'];
        if (!contractorId) return unauthorized('Contractor ID not found in authorizer context');

        const client = getDataClient();
        console.log(`Card ${cardId} for contractor ${contractorId}`);

        // --- 2️⃣ Verify contractor ↔ card assignment
        const { data: contractorCards, errors: contractorCardErrors } = await client.models.ContractorCard.list({
            filter: { contractorId: { eq: contractorId }, cardId: { eq: cardId } },
        });
        if (contractorCardErrors?.length) throw new Error(contractorCardErrors[0].message);
        if (!contractorCards?.length) return notFound('Card not assigned to this partner');
        const contractorCard = contractorCards[0];
        const discountPercent = contractorCard.discountPercent ?? 0;

        // --- 3️⃣ Get card
        const { data: cards, errors: cardErrors } = await client.models.Card.list({
            filter: { id: { eq: cardId }, isActive: { eq: true } },
        });
        if (cardErrors?.length) throw new Error(cardErrors[0].message);
        if (!cards?.length) return notFound('Card not found or inactive');
        const card = cards[0];

        const basePrice = card.price ?? 0;
        const discountedBase = applyDiscount(basePrice, discountPercent);

        // --- 4️⃣ Load field links
        const { data: fieldLinks, errors: fieldLinkErrors } = await client.models.CardFieldLink.list({
            filter: { cardId: { eq: card.id } },
        });
        if (fieldLinkErrors?.length) throw new Error(fieldLinkErrors[0].message);

        const sortedLinks = [...fieldLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const formFields: any[] = [];
        let dynamicPrice = false;
        const dynamicPrices: number[] = [];

        for (const link of sortedLinks) {
            const { data: field } = await client.models.CardRequiredField.get({ id: link.fieldId });
            if (!field) continue;

            const affectsPrice = link.affectsPrice ?? false;

            // --- determine regex
            const regex =
                (field.validationRegex ?? undefined) ||
                getDefaultRegex(String(field.fieldName ?? ''), String(field.fieldType ?? ''));

            const fieldOut: any = {
                id: field.id,
                fieldName: field.fieldName,
                fieldType: field.fieldType,
                label: link.label || field.fieldName,
                placeholder: link.placeholder || '',
                isRequired: link.isRequired ?? true,
                affectsPrice,
                order: link.order ?? 0,
                validationRegex: regex,
            };

            // --- 5️⃣ Handle select fields
            if (field.fieldType === 'select') {
                const { data: options } = await client.models.FieldOption.list({
                    filter: { fieldId: { eq: field.id } },
                });

                const enrichedOptions: any[] = [];

                for (const opt of options) {
                    const optOut: any = {
                        id: opt.id,
                        label: opt.label,
                        value: opt.value,
                    };

                    // Only add price if this field affects final card price
                    if (affectsPrice) {
                        const { data: overrides } = await client.models.CardFieldOptionLink.list({
                            filter: {
                                cardFieldLinkId: { eq: link.id },
                                optionId: { eq: opt.id },
                            },
                        });

                        const rawPrice = overrides?.[0]?.price ?? basePrice;
                        const discounted = applyDiscount(rawPrice, discountPercent);
                        optOut.price = discounted;

                        dynamicPrices.push(discounted);
                    }

                    enrichedOptions.push(optOut);
                }

                fieldOut.options = enrichedOptions;
                if (affectsPrice) dynamicPrice = true;
            }

            formFields.push(fieldOut);
        }

        // --- 6️⃣ Compute card price
        let price: number | string = round2(discountedBase);
        if (dynamicPrice && dynamicPrices.length) {
            const min = Math.min(...dynamicPrices);
            const max = Math.max(...dynamicPrices);
            price = `${fmtMoney(min)}-${fmtMoney(max)}`;
        }

        // --- 7️⃣ Final response
        const formattedCard = {
            id: card.id,
            name: card.name,
            type: card.type,
            description: card.description ?? null,
            dynamicPrice,
            price,
            formFields,
        };

        console.log(
            `✅ Card ${card.id} fetched (${formFields.length} fields, dynamic=${dynamicPrice})`
        );

        return ok({ card: formattedCard });
    } catch (error) {
        console.error('❌ Error fetching card details:', error);
        return errorResponse(error);
    }
};

// ---------- helpers ----------
const cors = () => ({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
});

const ok = (body: any) => ({
    statusCode: 200,
    headers: cors(),
    body: JSON.stringify({ success: true, ...body }),
});
const badRequest = (msg: string) => ({
    statusCode: 400,
    headers: cors(),
    body: JSON.stringify({ success: false, error: 'Bad Request', message: msg }),
});
const unauthorized = (msg: string) => ({
    statusCode: 401,
    headers: cors(),
    body: JSON.stringify({ success: false, error: 'Unauthorized', message: msg }),
});
const notFound = (msg: string) => ({
    statusCode: 404,
    headers: cors(),
    body: JSON.stringify({ success: false, error: 'Not Found', message: msg }),
});
const errorResponse = (err: any) => ({
    statusCode: 500,
    headers: cors(),
    body: JSON.stringify({
        success: false,
        error: 'Failed to read card details',
        message: err instanceof Error ? err.message : 'Unknown error',
    }),
});

function applyDiscount(amount: number, pct: number) {
    const v = amount * (1 - (pct || 0) / 100);
    return Number.isFinite(v) ? v : 0;
}
function round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
function fmtMoney(n: number) {
    const r = round2(n);
    return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

// --- Default regex rules for frontend validation ---
function getDefaultRegex(name: string, type: string) {
    if (type === 'number') return '^\\d+(\\.\\d+)?$';
    if (type === 'date') return '^\\d{4}-\\d{2}-\\d{2}$';
    if (name.toLowerCase().includes('email')) return '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
    if (name.toLowerCase().includes('phone')) return '^\\+?[0-9\\s-]{7,15}$';
    if (name.toLowerCase().includes('name')) return '^[A-Za-zА-Яа-я\\s\\-]{2,}$';
    return '.*'; // allow anything by default
}
