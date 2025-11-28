import { format } from "date-fns";
import {
    FileText,
    Download,
    Eye,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Report } from "../types";
import { cn } from "@/lib/utils";

interface ReportCardProps {
    report: Report;
    onDownload: (report: Report) => void;
    onDelete: (reportId: string) => void;
    onRetry: (reportId: string) => void;
    isDownloading: boolean;
    isDeleting: boolean;
}

export function ReportCard({
    report,
    onDownload,
    onDelete,
    onRetry,
    isDownloading,
    isDeleting
}: ReportCardProps) {

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "pending":
                return {
                    icon: Clock,
                    color: "text-muted-foreground",
                    bg: "bg-muted/50",
                    label: "Pending"
                };
            case "processing":
                return {
                    icon: Loader2,
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                    label: "Generating",
                    animate: true
                };
            case "completed":
                return {
                    icon: CheckCircle,
                    color: "text-green-500",
                    bg: "bg-green-500/10",
                    label: "Ready"
                };
            case "failed":
                return {
                    icon: XCircle,
                    color: "text-red-500",
                    bg: "bg-red-500/10",
                    label: "Failed"
                };
            default:
                return {
                    icon: Clock,
                    color: "text-muted-foreground",
                    bg: "bg-muted",
                    label: status
                };
        }
    };

    const statusConfig = getStatusConfig(report.status);
    const StatusIcon = statusConfig.icon;

    return (
        <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card hover:shadow-md">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                            report.status === 'completed' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                            <FileText className="h-6 w-6" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold leading-none tracking-tight">
                                    {report.format.toUpperCase()} Report
                                </h3>
                                <Badge
                                    variant="secondary"
                                    className={cn("gap-1 font-normal", statusConfig.bg, statusConfig.color)}
                                >
                                    <StatusIcon className={cn("h-3 w-3", statusConfig.animate && "animate-spin")} />
                                    {statusConfig.label}
                                </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                Generated on {format(new Date(report.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>

                            {report.sections && (
                                <div className="flex gap-2 pt-1">
                                    {report.sections.split(',').slice(0, 2).map((section, i) => (
                                        <Badge key={i} variant="outline" className="text-[10px] text-muted-foreground">
                                            {section.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                        </Badge>
                                    ))}
                                    {report.sections.split(',').length > 2 && (
                                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                            +{report.sections.split(',').length - 2} more
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {report.status === "completed" && (
                            <>
                                {report.url && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2"
                                    onClick={() => onDownload(report)}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Download className="h-3 w-3" />
                                    )}
                                    Download
                                </Button>
                            </>
                        )}

                        {report.status === "failed" && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                                onClick={() => onRetry(report.id)}
                            >
                                <RefreshCw className="h-3 w-3" />
                                Retry
                            </Button>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete this report? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => onDelete(report.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                {report.status === "processing" && (
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Processing...</span>
                            <span>Estimated 2-3 mins</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full w-1/2 animate-[shimmer_2s_infinite] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
