// Native fetch is available in Node.js 18+
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5001';
// Use the token from localStorage or a hardcoded one if available. 
// Since we don't have easy access to a valid token without login flow, 
// we might need to rely on the fact that we can use the existing user-123 context if we mock it or use a known secret.
// But wait, I can use the same token generation logic as before if I have the secret.
// I updated the secret in test-user-isolation.mjs to 'orion-development-secret-change-in-production'.

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdGVYQGdtYWlsLmNvbSIsInN1YnNjcmlwdGlvblRpZXIiOiJwcm9mZXNzaW9uYWwiLCJzdWJzY3JpcHRpb25TdGF0dXMiOiJhY3RpdmUiLCJpYXQiOjE3NjQxODA5OTIsImV4cCI6MTc2NDI2NzM5Mn0.TSvclWHdPNNEOqwTBibqjNAvvuAql6ndNy-nBmvnHkY';

async function testReportGeneration() {
    console.log('🧪 Testing PDF Report Generation...');

    const token = TOKEN;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // 1. Get a project ID (use default or first available)
    const projectsRes = await fetch(`${API_BASE}/api/v1/projects`, { headers });
    const projects = await projectsRes.json();
    const projectId = projects[0].id;
    console.log(`Using project: ${projects[0].name} (${projectId})`);

    // 2. Create a report
    console.log('Creating report...');
    const createRes = await fetch(`${API_BASE}/api/v1/reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            projectId,
            type: 'report',
            format: 'pdf',
            sections: 'Executive Summary,Key Findings',
            selectedForceIds: [] // Empty for now, or pick some if available
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
            const downloadUrl = `${API_BASE}${updatedReport.url}`;
            // Note: The URL might be relative, so prepend API_BASE if needed. 
            // The API returns `/api/v1/reports/download/...` which is relative path from root, 
            // but fetch needs full URL.

            const pdfRes = await fetch(`${API_BASE}${updatedReport.url}`, { headers });
            const arrayBuffer = await pdfRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const header = buffer.slice(0, 5).toString();
            console.log(`File header: ${header}`);

            if (header === '%PDF-') {
                console.log('✅ SUCCESS: Valid PDF generated!');
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

testReportGeneration().catch(console.error);
