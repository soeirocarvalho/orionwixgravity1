import { pdfService } from "./pdf_service";
import { storage } from "../storage";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class JobsService {
  async generateReport(reportId: string, projectId: string, format: string) {
    try {
      await storage.updateReport(reportId, { status: "processing" });

      // Get report data to check type
      const reports = await storage.getReports(undefined, projectId);
      const report = reports.find(r => r.id === reportId);

      if (!report) {
        throw new Error("Report not found");
      }

      let reportBuffer: Buffer;
      let filename: string;

      // Get project data
      const project = await storage.getProject(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      if (report.reportType === 'chat' && report.chatHistory) {
        // Generate Chat Report
        reportBuffer = await pdfService.generateChatReport(report.chatHistory as any[], {
          name: project.name,
          description: project.description || ''
        });
        filename = `Chat-Report-${new Date().toISOString().split('T')[0]}-${reportId}.pdf`;
      } else {
        // Generate Standard Report with proper PDF
        const forces = await storage.getDrivingForces(projectId);

        // Get selected forces if specified in report
        let reportForces = forces.forces;
        if (report.selectedForceIds && Array.isArray(report.selectedForceIds) && report.selectedForceIds.length > 0) {
          reportForces = forces.forces.filter(f => f.id && (report.selectedForceIds as string[]).includes(f.id));
        }

        reportBuffer = await pdfService.generateStandardReport({
          project: {
            name: project.name,
            description: project.description || ''
          },
          forces: reportForces,
          selectedForceIds: report.selectedForceIds || undefined,
          sections: report.sections ? report.sections.split(',') : undefined
        });

        filename = `Report-${new Date().toISOString().split('T')[0]}-${reportId}.pdf`;
      }

      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads/reports');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Save file to disk
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, reportBuffer);

      // Update report with URL
      const reportUrl = `/api/v1/reports/download/${filename}`;

      await storage.updateReport(reportId, {
        status: "completed",
        url: reportUrl
      });

    } catch (error) {
      console.error("Report generation error:", error);
      await storage.updateReport(reportId, {
        status: "failed"
      });
    }
  }

  async getRunningJobs(): Promise<any[]> {
    return await storage.getJobs("running");
  }

  async getJobStats(): Promise<any> {
    const jobs = await storage.getJobs();

    const stats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === "pending").length,
      running: jobs.filter(j => j.status === "running").length,
      completed: jobs.filter(j => j.status === "done").length,
      failed: jobs.filter(j => j.status === "failed").length,
    };

    return stats;
  }
}

export const jobsService = new JobsService();
