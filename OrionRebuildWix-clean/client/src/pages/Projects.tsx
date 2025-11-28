import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAppActions, useCurrentProject } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  Plus,
  Search,
  Calendar,
  Folder,
  MoreHorizontal,
  Trash2,
  Copy,
  Crown,
  Info
} from "lucide-react";
import type { z } from "zod";
import type { Project, DrivingForce } from "@shared/schema";

type InsertProject = z.infer<typeof insertProjectSchema>;

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string; isDefault: boolean } | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { setCurrentProject } = useAppActions();
  const currentProjectId = useCurrentProject();
  const { isAuthenticated } = useAuth();

  // Onboarding is handled by Welcome page, no need to call here

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/v1/projects"],
  });

  // Auto-select default project if no current project is set
  useEffect(() => {
    if (!isLoading && projects.length > 0 && !currentProjectId) {
      const defaultProject = projects.find((p) => p.isDefault);
      if (defaultProject) {
        console.log("Auto-selecting default project:", defaultProject.name);
        setCurrentProject(defaultProject.id);
      }
    }
  }, [projects, isLoading, currentProjectId, setCurrentProject]);

  // Function to handle project selection - optimized with useCallback
  const handleProjectClick = useCallback((project: Project) => {
    setCurrentProject(project.id);
    setLocation("/scanning"); // Navigate to scanning page with the selected project's driving forces
  }, [setCurrentProject, setLocation]);

  // Get all project statistics using batched endpoint (single query for all projects)
  const projectIds = projects.map((p) => p.id);

  // Fetch force counts for all projects in a single batched API call
  const { data: allForces = [] } = useQuery<Array<{ projectId: string; total: number }>>({
    queryKey: ["/api/v1/scanning/forces/stats", [...projectIds].sort().join(",")],
    queryFn: async () => {
      if (projectIds.length === 0) return [];

      // Single POST request to get all project statistics at once
      const response = await apiRequest("POST", "/api/v1/scanning/forces/stats", {
        projectIds,
      });
      const data = await response.json();
      return data.stats || [];
    },
    enabled: projectIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });


  // Convert allForces to Map for O(1) lookup performance
  const statsMap = useMemo(() => {
    const map = new Map<string, number>();
    allForces.forEach((stat) => {
      map.set(stat.projectId, stat.total);
    });
    return map;
  }, [allForces]);

  // Helper function to get stats for a specific project - optimized with useCallback
  const getProjectStats = useCallback((projectId: string) => {
    const forcesCount = statsMap.get(projectId) || 0;
    return { forcesCount };
  }, [statsMap]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertProject) => {
      const response = await apiRequest("POST", "/api/v1/projects", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/scanning/forces/stats"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: { id: string; isDefault: boolean }) => {
      if (data.isDefault) {
        throw new Error("Cannot delete default project");
      }
      await apiRequest("DELETE", `/api/v1/projects/${data.id}`);
    },
    onSuccess: () => {
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/v1/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/scanning/forces/stats"] });
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      toast({
        title: "Error",
        description: error.message === "Cannot delete default project"
          ? "Cannot delete the default ORION project."
          : "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      projectType: "new_project",
    },
  });

  const onSubmit = (data: InsertProject) => {
    createMutation.mutate(data);
  };

  // Optimize filtering and sorting with useMemo
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project: Project) =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by default status first (default project appears first)
        // Then alphabetically by name for consistent ordering
        return Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name);
      });
  }, [projects, searchTerm]);

  return (
    <div className="flex flex-col h-full relative">
      <Header
        title="Projects"
        subtitle="Manage your strategic intelligence projects"
      />

      <div className="flex-1 p-6 overflow-y-auto relative z-10">
        {/* Search and Create */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 transform -translate-y-1/2" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-full bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              data-testid="input-search-projects"
            />
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-8 shadow-lg hover:shadow-xl transition-all" data-testid="button-create-project">
                <Plus className="w-5 h-5 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project name" {...field} data-testid="input-project-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter project description"
                            {...field}
                            value={field.value || ""}
                            data-testid="textarea-project-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-create"
                    >
                      {createMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-8 animate-pulse">
                <div className="h-8 w-3/4 bg-muted rounded mb-4" />
                <div className="h-4 w-full bg-muted rounded mb-2" />
                <div className="h-4 w-2/3 bg-muted rounded mb-6" />
                <div className="space-y-3">
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Folder className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-semibold mb-3">
              {searchTerm ? "No Results" : "Welcome to ORION"}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-md text-center">
              {searchTerm
                ? "Try different search terms"
                : "Create your first project to start analyzing strategic intelligence"
              }
            </p>
            {!searchTerm && (
              <Button
                size="lg"
                onClick={() => setIsCreateDialogOpen(true)}
                data-testid="button-create-first-project"
                className="rounded-full px-8 shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project: Project, index) => {
              const stats = getProjectStats(project.id);
              const isDefault = project.isDefault;
              const isCurrentProject = currentProjectId === project.id;

              return (
                <Card
                  key={project.id}
                  className={`
                    group p-8 cursor-pointer relative
                    transform transition-all duration-300
                    hover:-translate-y-1 hover:shadow-2xl
                    border-2
                    ${isCurrentProject
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                    }
                    animate-fade-in-up
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleProjectClick(project)}
                  data-testid={`project-card-${project.id}`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-semibold" data-testid={`project-name-${project.id}`}>
                          {project.name}
                        </h3>
                        {isDefault && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Crown className="w-5 h-5 text-amber-500" />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Master ORION database with pre-loaded strategic intelligence</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {isDefault
                          ? "Pre-loaded ORION strategic intelligence database with curated driving forces and insights."
                          : (project.description || "No description provided")
                        }
                      </p>
                    </div>
                  </div>

                  {/* Simplified stats */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                    <div>
                      <span className="font-semibold text-foreground">{stats.forcesCount}</span> forces
                    </div>
                    <div>
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions - appear on hover */}
                  <div className="mt-6 pt-6 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isDefault}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isDefault) {
                                    setProjectToDelete({ id: project.id, name: project.name, isDefault });
                                    setDeleteConfirmOpen(true);
                                  }
                                }}
                                data-testid={`button-delete-${project.id}`}
                                className={isDefault ? "opacity-50 cursor-not-allowed" : "hover:text-destructive"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isDefault ? "Cannot delete the default ORION project" : "Delete this project"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone and all data associated with this project will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (projectToDelete && !projectToDelete.isDefault) {
                  deleteMutation.mutate({ id: projectToDelete.id, isDefault: projectToDelete.isDefault });
                  setProjectToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add custom animation styles */}
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}
