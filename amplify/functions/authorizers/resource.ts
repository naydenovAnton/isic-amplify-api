import { defineFunction } from '@aws-amplify/backend';

export const tokenAuthorizer = defineFunction({
    // optionally specify a name for the Function (defaults to directory name)
    name: 'token-authorizer',
    // optionally specify a path to your handler (defaults to "./handler.ts")
    entry: './handler.ts',

});