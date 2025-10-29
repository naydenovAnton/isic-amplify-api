import { defineFunction } from '@aws-amplify/backend';

export const getCard = defineFunction({
    name: 'getCard',
    entry: './handler.ts'
});