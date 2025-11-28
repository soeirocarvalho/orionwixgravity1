import "../server/env"; // Load env with override
import OpenAI from "openai";

async function verify() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error("❌ OPENAI_API_KEY is missing");
        process.exit(1);
    }

    console.log(`🔑 Using API Key: ${apiKey.substring(0, 10)}...`);
    const openai = new OpenAI({ apiKey });

    try {
        console.log("📡 Testing connection to OpenAI...");
        const models = await openai.models.list();
        console.log("✅ Connection successful. Available models: " + models.data.length);
    } catch (error: any) {
        console.error("❌ Connection failed:", error.message);
        process.exit(1);
    }

    const assistants = [
        { name: "Copilot", id: process.env.ORION_COPILOT_ASSISTANT_ID },
        { name: "Scanning", id: process.env.ORION_SCANNING_ASSISTANT_ID },
    ];

    for (const { name, id } of assistants) {
        if (!id) {
            console.warn(`⚠️ ${name} Assistant ID is missing in .env`);
            continue;
        }

        try {
            console.log(`🔍 Verifying ${name} Assistant (${id})...`);
            const assistant = await openai.beta.assistants.retrieve(id);
            console.log(`✅ Found ${name} Assistant: ${assistant.name} (Model: ${assistant.model})`);
        } catch (error: any) {
            console.error(`❌ Failed to retrieve ${name} Assistant (${id}):`, error.message);
        }
    }
}

verify().catch(console.error);
