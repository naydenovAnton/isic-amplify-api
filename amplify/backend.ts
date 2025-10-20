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

const readOrders = defineFunction({
    name: 'readOrders',
    entry: './functions/orders/read/handler.ts',
});

// Define backend with GraphQL data (for admin)
const backend = defineBackend({
    data,
    readCards,
    createCards,
    readOrders
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

// Define all endpoints in one configuration array
const endpointConfigs = [
    {
        path: 'cards',
        methods: [
            {
                type: 'GET',
                pathFragment: 'list',
                functionName: 'readCards',
                lambda: backend.readCards.resources.lambda
            },
            {
                type: 'POST',
                pathFragment: 'create',
                functionName: 'createCards',
                lambda: backend.createCards.resources.lambda
            }
        ]
    },
    {
        path: 'orders',
        methods: [
            {
                type: 'GET',
                pathFragment: 'list',
                functionName: 'readOrders',
                lambda: backend.readOrders.resources.lambda
            }
        ]
    }
];

// Create all API resources and methods dynamically
endpointConfigs.forEach(config => {
    const resource = restApi.root.addResource(config.path);

    config.methods.forEach(method => {
        const integration = new LambdaIntegration(method.lambda);

        if (method.pathFragment) {
            // For endpoints like /cards/list, /cards/create
            const methodResource = resource.addResource(method.pathFragment);
            methodResource.addMethod(method.type, integration);
        } else {
            // For direct resource methods like /cards (GET, POST, etc.)
            resource.addMethod(method.type, integration);
        }
    });
});

// Export backend
export { backend };