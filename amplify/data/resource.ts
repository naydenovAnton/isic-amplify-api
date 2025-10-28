import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({

    // 1) Reusable fields
    CardRequiredField: a.model({
        fieldName: a.string().required(),
        fieldType: a.enum(['string', 'number', 'date', 'boolean', 'file', 'select']),
        validationRegex: a.string(),

        // relationships
        options: a.hasMany('FieldOption', 'fieldId'),
        cards: a.hasMany('CardFieldLink', 'fieldId'),

        // ✅ backref required by CardFieldOptionLink.field (belongsTo 'fieldId')
        optionPrices: a.hasMany('CardFieldOptionLink', 'fieldId'),
    }).authorization(allow => [allow.publicApiKey()]),

    // 2) Select options (no base price here)
    FieldOption: a.model({
        fieldId: a.id().required(),
        field: a.belongsTo('CardRequiredField', 'fieldId'),
        label: a.string().required(),
        value: a.string().required(),
        order: a.integer(),

        // backref for CardFieldOptionLink.option
        optionPrices: a.hasMany('CardFieldOptionLink', 'optionId'),
    }).authorization(allow => [allow.publicApiKey()]),

    // 3) Cards
    Card: a.model({
        name: a.string().required(),
        price: a.float().required(),
        type: a.string().required(),
        description: a.string(),
        isActive: a.boolean().default(true),

        contractorCards: a.hasMany('ContractorCard', 'cardId'),
        requiredFields: a.hasMany('CardFieldLink', 'cardId'),

        // backref for CardFieldOptionLink.card
        optionPrices: a.hasMany('CardFieldOptionLink', 'cardId'),
    }).authorization(allow => [allow.publicApiKey()]),

    // 4) Card ↔ Field link (per-card overrides)
    CardFieldLink: a.model({
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),

        fieldId: a.id().required(),
        field: a.belongsTo('CardRequiredField', 'fieldId'),

        // per-card overrides
        isRequired: a.boolean().default(true),
        label: a.string(),
        placeholder: a.string(),
        order: a.integer(),

        // does this select field influence price?
        affectsPrice: a.boolean().default(false),

        // backref for CardFieldOptionLink.link
        optionPrices: a.hasMany('CardFieldOptionLink', 'cardFieldLinkId'),
    }).authorization(allow => [allow.publicApiKey()]),

    // 5) Card ↔ Option link (per-option price override)
    CardFieldOptionLink: a.model({
        // anchor to specific card–field link
        cardFieldLinkId: a.id().required(),
        link: a.belongsTo('CardFieldLink', 'cardFieldLinkId'),

        // redundants for easy querying
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),

        fieldId: a.id().required(),
        field: a.belongsTo('CardRequiredField', 'fieldId'),

        optionId: a.id().required(),
        option: a.belongsTo('FieldOption', 'optionId'),

        // pricing behavior (no .default() allowed on enums in gen2)
        mode: a.enum(['set', 'add']),
        price: a.float().required(),
    })
        // gen2 supports single-field secondary indexes only
        .secondaryIndexes(index => [
            index('cardId'),
            index('fieldId'),
            index('optionId'),
            index('cardFieldLinkId'),
        ])
        .authorization(allow => [allow.publicApiKey()]),

    // 6) Contractors
    Contractor: a.model({
        name: a.string().required(),
        email: a.string().required(),
        rateLimit: a.integer().default(100),
        isActive: a.boolean().default(true),
        contractorCards: a.hasMany('ContractorCard', 'contractorId'),
        accessTokens: a.hasMany('ContractorToken', 'contractorId'),
    }).authorization(allow => [allow.publicApiKey()]),

    // 7) Contractor ↔ Card
    ContractorCard: a.model({
        discountPercent: a.float().required(),
        cardId: a.id().required(),
        card: a.belongsTo('Card', 'cardId'),
        contractorId: a.id().required(),
        contractor: a.belongsTo('Contractor', 'contractorId'),
    }).authorization(allow => [allow.publicApiKey()]),

    // 8) Contractor Tokens
    ContractorToken: a.model({
        token: a.string().required(),
        expiresAt: a.datetime().required(),
        isActive: a.boolean().default(true),
        createdAt: a.datetime(),
        contractorId: a.id().required(),
        contractor: a.belongsTo('Contractor', 'contractorId'),
    })
        .secondaryIndexes(index => [index('token')])
        .authorization(allow => [allow.publicApiKey()]),

    // 9) API Logs
    APILog: a.model({
        contractorId: a.id().required(),
        tokenId: a.id().required(),
        endpoint: a.string().required(),
        timestamp: a.datetime().required(),
        ipAddress: a.string(),
    }).authorization(allow => [allow.publicApiKey()]),

    // 10) Rate limiting
    RateLimitCounter: a.model({
        id: a.id().required(),
        contractorId: a.id().required(),
        hourWindow: a.string().required(),
        requestCount: a.integer().default(0),
        expiresAt: a.datetime(),
    })
        .secondaryIndexes(index => [index('contractorId')])
        .authorization(allow => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: "apiKey",
        apiKeyAuthorizationMode: { expiresInDays: 30 },
    },
});
