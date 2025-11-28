import { storage } from './storage';
import { db } from './db';

async function run() {
    try {
        console.log("Fetching user...");
        // @ts-ignore
        const users = await db.query.users.findMany({ limit: 1 });
        if (users.length === 0) {
            console.log("No users found");
            return;
        }
        const userId = users[0].id;
        console.log("User:", userId);

        console.log("Fetching project...");
        let projects = await storage.getProjects(userId);
        if (projects.length === 0) {
            console.log("No projects found, creating default project...");
            await storage.ensureUserDefaultProject(userId);
            projects = await storage.getProjects(userId);
        }
        const projectId = projects[0].id;
        console.log("Project:", projectId);

        console.log("Creating report with exact client payload...");
        const reportData = {
            userId,
            projectId,
            format: 'pdf',
            sections: 'executive_summary,driving_forces_list', // Comma-separated string
            selectedForceIds: [], // Empty array like the client sends
            // reportType is optional and defaults to 'standard' in the schema
        };

        console.log("Report data:", JSON.stringify(reportData, null, 2));
        const report = await storage.createReport(reportData);
        console.log("Report created successfully:", report.id);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        if (error instanceof Error) {
            console.error("Stack:", error.stack);
        }
        process.exit(1);
    }
}

run();
