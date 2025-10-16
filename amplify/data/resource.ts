import {type ClientSchema, a, defineData} from "@aws-amplify/backend";

const schema = a.schema({
    Card: a.model({
        name: a.string().required(),
        price: a.float().required(),
        type: a.string().required(),
        description: a.string(),
        isActive: a.boolean().default(true),
        // Relationships
        contractorCards: a.hasMany('ContractorCard', 'cardId'),
        requiredFields: a.hasMany('CardRequiredField', 'cardId'),
        requests: a.hasMany('CardRequest', 'cardId')
    }).authorization(allow => [allow.publicApiKey()]),

    // Define what fields are required for each card type
    CardRequiredField: a.model({
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),
        fieldName: a.string().required(), // e.g., "birth_date", "income", "address"
        fieldType: a.enum(['string', 'number', 'date', 'boolean', 'file']),
        isRequired: a.boolean().default(true),
        label: a.string(), // User-friendly label
        placeholder: a.string(),
        validationRegex: a.string(),
        order: a.integer() // For form ordering
    }).authorization(allow => [allow.publicApiKey()]),

    // Card requests from users
    CardRequest: a.model({
        // Common required fields for all cards
        userEmail: a.string().required(),
        userName: a.string().required(),
        userPhone: a.string().required(),

        // Card relationship
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),

        // Request status - FIXED: Remove .default() from enum
        status: a.enum(['pending', 'approved', 'rejected', 'under_review']),
        submittedAt: a.datetime().required(),

        // Dynamic field values stored as JSON
        fieldValues: a.json().required(),

        // Additional metadata
        ipAddress: a.string(),
        userAgent: a.string()
    }).authorization(allow => [allow.publicApiKey()]),

    Contractor: a.model({
        name: a.string().required(),
        email: a.string().required(),
        rateLimit: a.integer().default(100),
        isActive: a.boolean().default(true),
        // Relationship to ContractorCard
        contractorCards: a.hasMany('ContractorCard', 'contractorId'),
        // Relationship to ContractorToken
        accessTokens: a.hasMany('ContractorToken', 'contractorId')
    }).authorization(allow => [allow.publicApiKey()]),

    ContractorCard: a.model({
        discountPercent: a.float().required(),
        // Card relationship
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),
        // Contractor relationship
        contractorId: a.id().required(),
        contractor: a.belongsTo('Contractor', 'contractorId')
    }).authorization(allow => [allow.publicApiKey()]),

    ContractorToken: a.model({
        token: a.string().required(),
        expiresAt: a.datetime().required(),
        isActive: a.boolean().default(true),
        createdAt: a.datetime(),
        // Contractor relationship
        contractorId: a.id().required(),
        contractor: a.belongsTo('Contractor', 'contractorId')
    }).authorization(allow => [allow.publicApiKey()]),

    APILog: a.model({
        contractorId: a.id().required(),
        tokenId: a.id().required(),
        endpoint: a.string().required(),
        timestamp: a.datetime().required(),
        ipAddress: a.string()
    }).authorization(allow => [allow.publicApiKey()])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "apiKey",
        // API Key is used for a.allow.public() rules
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});