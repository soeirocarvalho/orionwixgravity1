
// Native fetch is available in Node.js 18+
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5001';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdGVYQGdtYWlsLmNvbSIsInN1YnNjcmlwdGlvblRpZXIiOiJwcm9mZXNzaW9uYWwiLCJzdWJzY3JpcHRpb25TdGF0dXMiOiJhY3RpdmUiLCJpYXQiOjE3NjQxODA5OTIsImV4cCI6MTc2NDI2NzM5Mn0.TSvclWHdPNNEOqwTBibqjNAvvuAql6ndNy-nBmvnHkY';

async function testChatReportGeneration() {
    console.log('🧪 Testing Chat Report PDF Generation...');

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    // 1. Get a project ID (use default or first available)
    const projectsRes = await fetch(`${API_BASE}/api/v1/projects`, { headers });
    const projects = await projectsRes.json();
    const projectId = projects[0].id;
    console.log(`Using project: ${projects[0].name} (${projectId})`);

    // 2. Create a chat report
    console.log('Creating chat report...');
    const createRes = await fetch(`${API_BASE}/api/v1/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            projectId,
            type: 'chat',
            format: 'pdf',
            chatHistory: [
                { role: 'user', content: 'What are the key trends in AI?', timestamp: new Date().toISOString() },
                { role: 'assistant', content: 'Key trends include Generative AI, Edge AI, and AI Ethics.', timestamp: new Date().toISOString() }
            ]
        })
    });

    if (!createRes.ok) {
        throw new Error(`Failed to create report: ${createRes.status} ${await createRes.text()}`);
    }

    const report = await createRes.json();
    console.log(`Report created: ${report.id} (status: ${report.status})`);

    // 3. Poll for completion
    let status = report.status;
    let attempts = 0;
    while (status !== 'completed' && status !== 'failed' && attempts < 10) {
        await new Promise(r => setTimeout(r, 1000));
        const pollRes = await fetch(`${API_BASE}/api/v1/reports`, { headers });
        const reports = await pollRes.json();
        const updatedReport = reports.find(r => r.id === report.id);
        status = updatedReport.status;
        console.log(`Report status: ${status}`);
        attempts++;

        if (status === 'completed') {
            console.log(`Report URL: ${updatedReport.url}`);

            // 4. Download and verify PDF header
            const pdfRes = await fetch(`${API_BASE}${updatedReport.url}`, { headers });
            const arrayBuffer = await pdfRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const header = buffer.slice(0, 5).toString();
            console.log(`File header: ${header}`);

            if (header === '%PDF-') {
                console.log('✅ SUCCESS: Valid Chat Report PDF generated!');
            } else {
                console.log('❌ FAIL: Not a valid PDF');
                console.log('First 50 bytes:', buffer.slice(0, 50).toString());
            }
            return;
        }
    }

    if (status !== 'completed') {
        console.log('❌ FAIL: Report generation timed out or failed');
    }
}

testChatReportGeneration().catch(console.error);
