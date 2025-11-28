import { pdfService } from './services/pdf_service';

// Mock data with potential edge cases
const project = {
    name: "Test Project",
    description: "Test Description"
};

const forces = [
    {
        title: "Force 1",
        description: "Description 1 with enough text to justify. ".repeat(10)
    },
    {
        title: "Force 2",
        description: null // Null description
    },
    {
        title: "Force 3",
        description: undefined // Undefined description
    },
    {
        title: "Force 4",
        description: "" // Empty description
    }
];

const sections = ['executive_summary', 'driving_forces_list'];

async function run() {
    try {
        console.log("Generating report...");
        const buffer = await pdfService.generateStandardReport({
            project,
            forces,
            sections
        });
        console.log("Report generated successfully. Buffer size:", buffer.length);
    } catch (error) {
        console.error("Error generating report:", error);
        console.error(error);
    }
}

run();
