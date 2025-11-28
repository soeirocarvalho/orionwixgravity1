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

        console.log("Creating report...");
        const report = await storage.createReport({
            userId,
            projectId,
            format: 'pdf',
            status: 'pending',
            sections: 'executive_summary,driving_forces_list',
            selectedForceIds: [], // Empty array
            reportType: 'standard'
        });
        console.log("Report created:", report.id);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
