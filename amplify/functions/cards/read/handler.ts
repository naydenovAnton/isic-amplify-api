import { defineFunction } from '@aws-amplify/backend';

export const handler = defineFunction({
    name: 'read-cards',
    entry: './handler-impl.ts',
});
