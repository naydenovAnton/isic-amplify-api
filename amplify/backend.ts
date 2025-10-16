import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { data } from './data/resource';

// Lambda: /cards/list
const readCards = defineFunction({
    name: 'readCards',
    entry: './functions/cards/read/handler.ts',
});

// Lambda: /cards/create
const createCards = defineFunction({
    name: 'createCards',
    entry: './functions/cards/create/handler.ts',
});

// Define backend
const backend = defineBackend({
    data,
    readCards,
    createCards,
});

// Create API stack
const apiStack = backend.createStack('api-stack');

// Create REST API
const myRestApi = new RestApi(apiStack, 'CardsApi', {
    restApiName: 'CardsApi',
    deploy: true,
    deployOptions: {
        stageName: 'dev',
    },
});

// Create Lambda integrations
const readCardsIntegration = new LambdaIntegration(backend.readCards.resources.lambda);
const createCardsIntegration = new LambdaIntegration(backend.createCards.resources.lambda);

// Create /cards resource
const cardsResource = myRestApi.root.addResource('cards');

// Create /cards/list endpoint
const listResource = cardsResource.addResource('list');
listResource.addMethod('GET', readCardsIntegration);

// Create /cards/create endpoint
const createResource = cardsResource.addResource('create');
createResource.addMethod('POST', createCardsIntegration);

export { backend };