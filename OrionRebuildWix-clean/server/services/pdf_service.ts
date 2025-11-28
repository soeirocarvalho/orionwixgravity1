import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

interface ProjectInfo {
    name: string;
    description?: string;
}

export class PdfService {
    async generateChatReport(chatHistory: ChatMessage[], project: ProjectInfo): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers: Buffer[] = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Header
                doc.fontSize(20).text('Copilot Conversation Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(14).text(`Project: ${project.name}`, { align: 'center' });
                doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
                doc.moveDown(2);

                // Chat History
                chatHistory.forEach((msg) => {
                    const isUser = msg.role === 'user';
                    const color = isUser ? '#2563eb' : '#000000'; // Blue for user, Black for assistant
                    const align = 'left';

                    // Role Label
                    doc.font('Helvetica-Bold').fontSize(10).fillColor(color).text(isUser ? 'You' : 'Copilot', { align });

                    // Timestamp (if available)
                    if (msg.timestamp) {
                        doc.font('Helvetica').fontSize(8).fillColor('#666666').text(new Date(msg.timestamp).toLocaleString(), { align });
                    }

                    doc.moveDown(0.5);

                    // Content
                    // Simple text rendering for now. 
                    // TODO: Add markdown parsing if needed for bold/italic/lists in assistant responses
                    doc.font('Helvetica').fontSize(11).fillColor('#000000').text(msg.content, {
                        align,
                        indent: 10,
                        width: 450
                    });

                    doc.moveDown(1.5);
                });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    async generateStandardReport(data: {
        project: ProjectInfo;
        forces?: any[];
        selectedForceIds?: string[];
        sections?: string[];
    }): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4'
                });
                const buffers: Buffer[] = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Title Page
                doc.fontSize(24).font('Helvetica-Bold').text('ORION Strategic Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(18).text(data.project.name, { align: 'center' });

                if (data.project.description) {
                    doc.moveDown(0.5);
                    doc.fontSize(12).font('Helvetica').fillColor('#666666').text(data.project.description, { align: 'center' });
                }

                doc.moveDown();
                doc.fontSize(10).fillColor('#999999').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
                doc.moveDown(3);

                // Executive Summary Section
                doc.fontSize(16).font('Helvetica-Bold').fillColor('#000000').text('Executive Summary');
                doc.moveDown();

                const forceCount = data.selectedForceIds?.length || data.forces?.length || 0;
                doc.fontSize(11).font('Helvetica').text(
                    `This report analyzes ${forceCount} driving forces from the ${data.project.name} project. ` +
                    `The analysis includes strategic insights, trends, and key findings relevant to your organization's future planning.`
                );
                doc.moveDown(2);

                // Forces Summary Section
                if (data.forces && data.forces.length > 0) {
                    doc.fontSize(16).font('Helvetica-Bold').text('Driving Forces Overview');
                    doc.moveDown();

                    // Group forces by type
                    const forcesByType: Record<string, any[]> = {};
                    data.forces.forEach(force => {
                        if (!forcesByType[force.type]) {
                            forcesByType[force.type] = [];
                        }
                        forcesByType[force.type].push(force);
                    });

                    // Type mapping
                    const typeNames: Record<string, string> = {
                        'M': 'Megatrends',
                        'T': 'Trends',
                        'WS': 'Weak Signals',
                        'WC': 'Wildcards',
                        'S': 'Signals'
                    };

                    // Display summary by type
                    Object.entries(forcesByType).forEach(([type, forces]) => {
                        const typeName = typeNames[type] || type;
                        doc.fontSize(14).font('Helvetica-Bold').text(`${typeName} (${forces.length})`);
                        doc.moveDown(0.5);

                        // List first 10 forces of this type
                        forces.slice(0, 10).forEach((force, index) => {
                            doc.fontSize(10).font('Helvetica').text(
                                `${index + 1}. ${force.title}`,
                                { indent: 20 }
                            );
                        });

                        if (forces.length > 10) {
                            doc.fontSize(9).fillColor('#666666').text(
                                `... and ${forces.length - 10} more`,
                                { indent: 20 }
                            );
                            doc.fillColor('#000000');
                        }

                        doc.moveDown();
                    });
                }

                // Sections (if provided)
                if (data.sections && data.sections.length > 0) {
                    doc.addPage();
                    doc.fontSize(16).font('Helvetica-Bold').text('Detailed Analysis');
                    doc.moveDown();

                    data.sections.forEach(section => {
                        doc.fontSize(12).font('Helvetica').text(section);
                        doc.moveDown();
                    });
                }

                // Footer on last page
                doc.moveDown(2);
                doc.fontSize(8).fillColor('#999999').text(
                    'Generated by ORION - Strategic Intelligence Platform',
                    { align: 'center' }
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

export const pdfService = new PdfService();
