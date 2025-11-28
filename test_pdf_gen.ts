import { pdfService } from './server/services/pdf_service';
import fs from 'fs';

async function testPdfGeneration() {
    const chatHistory = [
        { role: 'user', content: 'Hello, Copilot!', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Hello! How can I help you today?', timestamp: new Date().toISOString() },
        { role: 'user', content: 'Tell me about the future of AI.', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'AI is evolving rapidly...', timestamp: new Date().toISOString() }
    ];

    const project = {
        name: 'Test Project',
        description: 'A test project for PDF generation'
    };

    try {
        console.log('Generating PDF...');
        const buffer = await pdfService.generateChatReport(chatHistory as any[], project);
        fs.writeFileSync('test_report.pdf', buffer);
        console.log('PDF generated successfully: test_report.pdf');
    } catch (error) {
        console.error('Failed to generate PDF:', error);
    }
}

testPdfGeneration();
