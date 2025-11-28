import { OpenAIService } from "./services/openai";
import "./env"; // Load env vars

async function testChat() {
    const service = new OpenAIService();
    console.log("Starting test chat...");

    try {
        await service.streamAssistantResponse(
            "Hello, I want to explore the future of education.",
            {}, // context
            "copilot", // assistantType
            null, // threadId
            (chunk) => process.stdout.write(chunk),
            (threadId) => console.log("\nDone. Thread ID:", threadId),
            (error) => console.error("\nError:", error),
            undefined, // images
            undefined // abortSignal
        );
    } catch (error) {
        console.error("Test failed:", error);
    }
}

testChat();
