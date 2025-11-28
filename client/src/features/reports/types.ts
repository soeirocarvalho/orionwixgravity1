import { z } from "zod";
import { insertReportSchema } from "@shared/schema";

export type ReportStatus = "pending" | "processing" | "completed" | "failed";

export interface Report {
    id: string;
    projectId: string;
    format: string;
    status: ReportStatus;
    url?: string;
    createdAt: string;
    updatedAt: string;
    sections?: string;
    metadata?: Record<string, any>;
}

export type CreateReportInput = z.infer<typeof insertReportSchema>;

export interface ReportSection {
    id: string;
    label: string;
    description: string;
}

export const REPORT_SECTIONS: ReportSection[] = [
    {
        id: "executive_summary",
        label: "Executive Summary",
        description: "High-level strategic overview and key findings"
    },
    {
        id: "driving_forces_list",
        label: "Driving Forces Analysis",
        description: "Detailed breakdown of driving forces with dimensions and impact"
    },
    {
        id: "implications",
        label: "Strategic Implications",
        description: "Analysis of potential impacts and future scenarios"
    },
];
