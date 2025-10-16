// This is the correct approach for Amplify Gen 2
// File: amplify/backend.ts

import { defineBackend } from '@aws-amplify/backend';
import { data } from './data/resource';

// Import your Lambda functions
import { handler as readCards } from './functions/cards/read/handler';
import { handler as createCards } from './functions/cards/create/handler';

// Define your backend stack
const backend = defineBackend({
    data,
    functions: {
        readCards,
        createCards
    },
    api: {
        rest: {
            routes: [
                { path: '/cards/list', method: 'GET', function: readCards },
                { path: '/cards/create', method: 'POST', function: createCards },
            ],
        },
    },
});