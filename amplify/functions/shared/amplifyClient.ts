import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/read-cards"; // 👈 replace with YOUR function name
import type { Schema } from "../../data/resource";

let client: ReturnType<typeof generateClient<Schema>> | null = null;

export async function getDataClient() {
    if (client) return client;

    try {
        // ✅ Fetch Amplify-managed config dynamically (from env vars)
        const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
        Amplify.configure(resourceConfig, libraryOptions);

        client = generateClient<Schema>();
        console.log("✅ Amplify client initialized:", Object.keys((client as any).models));
        return client;
    } catch (err) {
        console.error("❌ Amplify data client config failed:", err);
        throw err;
    }
}
