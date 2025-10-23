import {type ClientSchema, a, defineData} from "@aws-amplify/backend";

const schema = a.schema({

    Card: a.model({
        name: a.string().required(),
        price: a.float().required(),
        type: a.string().required(),
        description: a.string(),
        isActive: a.boolean().default(true),
        contractorCards: a.hasMany('ContractorCard', 'cardId'),
        requiredFields: a.hasMany('CardRequiredField', 'cardId'),
        requests: a.hasMany('CardRequest', 'cardId')
    }).authorization(allow => [
        allow.publicApiKey()
    ]),

    CardRequiredField: a.model({
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),
        fieldName: a.string().required(),
        fieldType: a.enum(['string', 'number', 'date', 'boolean', 'file']),
        isRequired: a.boolean().default(true),
        label: a.string(),
        placeholder: a.string(),
        validationRegex: a.string(),
        order: a.integer()
    }).authorization(allow => [allow.publicApiKey()]),

    CardRequest: a.model({
        userEmail: a.string().required(),
        userName: a.string().required(),
        userPhone: a.string().required(),
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),
        status: a.enum(['pending', 'approved', 'rejected', 'under_review']),
        submittedAt: a.datetime().required(),
        fieldValues: a.json().required(),
        ipAddress: a.string(),
        userAgent: a.string()
    }).authorization(allow => [allow.publicApiKey()]),

    Contractor: a.model({
        name: a.string().required(),
        email: a.string().required(),
        rateLimit: a.integer().default(100),
        isActive: a.boolean().default(true),
        contractorCards: a.hasMany('ContractorCard', 'contractorId'),
        accessTokens: a.hasMany('ContractorToken', 'contractorId')
    }).authorization(allow => [allow.publicApiKey()]),

    ContractorCard: a.model({
        discountPercent: a.float().required(),
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),
        contractorId: a.id().required(),
        contractor: a.belongsTo('Contractor', 'contractorId')
    }).authorization(allow => [allow.publicApiKey()]),

    ContractorToken: a.model({
        token: a.string().required(),
        expiresAt: a.datetime().required(),
        isActive: a.boolean().default(true),
        createdAt: a.datetime(),
        contractorId: a.id().required(),
        contractor: a.belongsTo('Contractor', 'contractorId')
    })
        .secondaryIndexes((index) => [index("token")])
        .authorization(allow => [
            allow.publicApiKey()
        ]),

    APILog: a.model({
        contractorId: a.id().required(),
        tokenId: a.id().required(),
        endpoint: a.string().required(),
        timestamp: a.datetime().required(),
        ipAddress: a.string()
    }).authorization(allow => [allow.publicApiKey()]),

    RateLimitCounter: a.model({
        id: a.id().required(),
        contractorId: a.id().required(),
        hourWindow: a.string().required(),
        requestCount: a.integer().default(0),
        expiresAt: a.datetime()
    })
        .secondaryIndexes(index => [index('contractorId')])
        .authorization(allow => [allow.publicApiKey()])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "apiKey",
        apiKeyAuthorizationMode: {
            expiresInDays: 30
        },
    },
});