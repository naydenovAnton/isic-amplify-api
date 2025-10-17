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

// Create a new stack for REST API
const apiStack = backend.createStack('api-stack');

// Create REST API Gateway
const restApi = new RestApi(apiStack, 'CardsRestApi', {
    restApiName: 'CardsRestApi',
    description: 'REST API for external users',
    deploy: true,
    deployOptions: {
        stageName: 'api',
    },
    defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
    },
});

// Get Lambda functions from backend
const readCardsLambda = backend.readCards.resources.lambda;
const createCardsLambda = backend.createCards.resources.lambda;

// Create Lambda integrations
const readCardsIntegration = new LambdaIntegration(readCardsLambda);
const createCardsIntegration = new LambdaIntegration(createCardsLambda);

// Create /cards resource
const cardsResource = restApi.root.addResource('cards');

// Create /cards/list endpoint (GET)
const listResource = cardsResource.addResource('list');
listResource.addMethod('GET', readCardsIntegration);

// Create /cards/create endpoint (POST)
const createResource = cardsResource.addResource('create');
createResource.addMethod('POST', createCardsIntegration);

// Export backend
export { backend };