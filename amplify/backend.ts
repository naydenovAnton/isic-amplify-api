import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi, Cors } from 'aws-cdk-lib/aws-apigateway';
import { data } from './data/resource';

// Lambda functions for REST API (external users)
const readCards = defineFunction({
    name: 'readCards',
    entry: './functions/cards/read/handler.ts',
});

const createCards = defineFunction({
    name: 'createCards',
    entry: './functions/cards/create/handler.ts',
});

// Define backend with GraphQL data (for admin)
const backend = defineBackend({
    data,
    readCards,
    createCards,
});

// Create API stack for REST API (external users)
const apiStack = backend.createStack('rest-api-stack');

// Create REST API
const restApi = new RestApi(apiStack, 'ExternalCardsApi', {
    restApiName: 'ExternalCardsApi',
    description: 'REST API for external users',
    deploy: true,
    deployOptions: {
        stageName: 'api',
    },
    defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
    },
});

// Create Lambda integrations
const readCardsIntegration = new LambdaIntegration(backend.readCards.resources.lambda);
const createCardsIntegration = new LambdaIntegration(backend.createCards.resources.lambda);

// Create /cards resource
const cardsResource = restApi.root.addResource('cards');

// Create /cards/list endpoint (GET)
const listResource = cardsResource.addResource('list');
listResource.addMethod('GET', readCardsIntegration);

// Create /cards/create endpoint (POST)
const createResource = cardsResource.addResource('create');
createResource.addMethod('POST', createCardsIntegration);

// Add outputs
backend.addOutput({
    custom: {
        API: {
            REST_API_ENDPOINT: restApi.url,
            REST_API_NAME: restApi.restApiName,
        },
    },
});

export { backend };