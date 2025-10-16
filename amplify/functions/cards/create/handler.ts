import { defineFunction } from '@aws-amplify/backend';

export const handler = defineFunction({
    name: 'create-cards',
    entry: './handler-impl.ts',
});
