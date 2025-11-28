import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { insertReportSchema } from "@shared/schema";
import { REPORT_SECTIONS, CreateReportInput } from "../types";

interface CreateReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: FormValues) => void;
    isSubmitting: boolean;
    selectedForcesCount: number;
    projectId: string;
}

const formSchema = insertReportSchema.extend({
    sections: z.array(z.string()).min(1, "Select at least one section"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateReportDialog({
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
    selectedForcesCount,
    projectId,
}: CreateReportDialogProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            projectId,
            format: "pdf",
            sections: ["executive_summary", "driving_forces_list"],
        },
    });

    const handleSubmit = (data: FormValues) => {
        onSubmit(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Generate New Report</DialogTitle>
                    <DialogDescription>
                        Create a comprehensive report based on your {selectedForcesCount} selected driving forces.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="format"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Report Format</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select format" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="pdf">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-red-500" />
                                                    <span>PDF Document</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="docx" disabled>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-blue-500" />
                                                    <span>Word Document (Coming Soon)</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sections"
                            render={() => (
                                <FormItem>
                                    <FormLabel className="mb-4 block">Report Sections</FormLabel>
                                    <div className="space-y-4 rounded-lg border p-4">
                                        {REPORT_SECTIONS.map((section) => (
                                            <FormField
                                                key={section.id}
                                                control={form.control}
                                                name="sections"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={section.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(section.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, section.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== section.id
                                                                                )
                                                                            );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="font-normal">
                                                                    {section.label}
                                                                </FormLabel>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {section.description}
                                                                </p>
                                                            </div>
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Report
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
