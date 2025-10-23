import { defineFunction } from '@aws-amplify/backend';

export const readCards = defineFunction({
    // optionally specify a name for the Function (defaults to directory name)
    name: 'read-cards',
    // optionally specify a path to your handler (defaults to "./handler.ts")
    entry: './handler.ts',

});