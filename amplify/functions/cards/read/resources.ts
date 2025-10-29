
import { defineFunction } from '@aws-amplify/backend';

export const readCards = defineFunction({
    name: 'read-cards',
    entry: './handler.ts',
});
