import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { LambdaIntegration, RestApi, Cors } from 'aws-cdk-lib/aws-apigateway';
import { data } from './data/resource';
import { auth } from './auth/resource';

// import { readCards } from './functions/cards/read/resources';
// import { getCard } from './functions/cards/get/resources';
// import {tokenAuthorizer} from "./functions/authorizers/resource";

// Define backend with GraphQL data (for admin)
const backend = defineBackend({
    data,
    auth
});

// Create a new stack for REST API
// const apiStack = backend.createStack('api-stack');
//
// // Create REST API Gateway
// const restApi = new RestApi(apiStack, 'CardsRestApi', {
//     restApiName: 'CardsRestApi',
//     description: 'REST API for external users',
//     deploy: true,
//     deployOptions: {
//         stageName: 'api',
//     },
//     defaultCorsPreflightOptions: {
//         allowOrigins: Cors.ALL_ORIGINS,
//         allowMethods: Cors.ALL_METHODS,
//         allowHeaders: Cors.DEFAULT_HEADERS,
//     },
// });

// Define all endpoints in one configuration array
// const endpointConfigs = [
//     {
//         path: 'cards',
//         methods: [
//             {
//                 type: 'GET',
//                 pathFragment: 'list',
//                 functionName: 'readCards',
//                 lambda: backend.readCards.resources.lambda
//             },
//             {
//                 type: 'GET',
//                 pathFragment: '{cardId}',
//                 functionName: 'getCard',
//                 lambda: backend.getCard.resources.lambda
//             }
//         ]
//     }
// ];

// Create all API resources and methods dynamically
// endpointConfigs.forEach(config => {
//     const resource = restApi.root.addResource(config.path);
//
//     config.methods.forEach(method => {
//         const integration = new LambdaIntegration(method.lambda);
//
//         if (method.pathFragment) {
//             // For endpoints like /cards/list, /cards/create
//             const methodResource = resource.addResource(method.pathFragment);
//             methodResource.addMethod(method.type, integration);
//         } else {
//             // For direct resource methods like /cards (GET, POST, etc.)
//             resource.addMethod(method.type, integration);
//         }
//     });
// });

// Export backend
export { backend };