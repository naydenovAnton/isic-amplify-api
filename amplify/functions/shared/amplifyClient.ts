
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import outputs from '../../../amplify_outputs.json'; // Adjust relative path if needed
import type { Schema } from '../../data/resource';

let client: ReturnType<typeof generateClient<Schema>> | null = null;

export function getDataClient() {
    if (!client) {
        Amplify.configure(outputs);
        client = generateClient<Schema>();
    }
    return client;
}
