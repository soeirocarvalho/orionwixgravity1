import { storage } from "./storage";
import "./env";

async function testConversations() {
    console.log("Starting conversation debug...");

    try {
        // 1. Get a user
        const users = await storage.getUserByEmail("user@example.com"); // Adjust if needed or create one
        let user = users;
        if (!user) {
            console.log("Creating test user...");
            user = await storage.createUser({
                email: "debug@test.com",
                emailVerified: true,
                role: "user",
                subscriptionStatus: "active",
                subscriptionTier: "professional"
            });
        }

        // 2. Get a project
        const projects = await storage.getProjects(user.id);
        let project = projects[0];
        if (!project) {
            console.log("Creating test project...");
            project = await storage.createProject({
                name: "Debug Project",
                description: "For debugging",
                userId: user.id
            });
        }

        console.log(`Using User: ${user.id}, Project: ${project.id}`);

        // 3. Create conversation
        const messages = [
            { id: "1", role: "user", content: "Hello", timestamp: new Date() },
            { id: "2", role: "assistant", content: "Hi there", timestamp: new Date() }
        ];

        console.log("Creating conversation...");
        const conv = await storage.createConversation({
            projectId: project.id,
            userId: user.id,
            title: "Debug Chat",
            messages: messages
        });
        console.log("Created conversation:", conv.id);

        // 4. Fetch list
        console.log("Fetching list...");
        const list = await storage.getConversations(project.id);
        console.log(`Found ${list.length} conversations`);
        const foundInList = list.find(c => c.id === conv.id);
        console.log("Found in list:", foundInList ? "Yes" : "No");
        if (foundInList) {
            console.log("Messages in list item:", foundInList.messages ? "Present" : "Missing");
        }

        // 5. Fetch detail
        console.log("Fetching detail...");
        const detail = await storage.getConversation(conv.id);
        console.log("Fetched detail:", detail ? "Yes" : "No");
        if (detail) {
            console.log("Messages in detail:", detail.messages ? JSON.stringify(detail.messages).substring(0, 100) : "Missing");
        }

    } catch (error) {
        console.error("Debug failed:", error);
    }
}

testConversations();
