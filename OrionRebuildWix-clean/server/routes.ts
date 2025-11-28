import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { jobsService } from "./services/jobs";
import { z } from "zod";
import { authenticateToken, optionalAuth, generateToken, type AuthenticatedRequest } from "./middleware/auth";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {

  // ==========================================
  // USER ONBOARDING API
  // ==========================================

  app.post("/api/v1/auth/onboard", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const email = req.user!.email;
      const subscriptionTier = req.user!.subscriptionTier || 'basic';
      const subscriptionStatus = req.user!.subscriptionStatus || 'trial';

      let newToken: string | undefined;

      // Ensure user exists in database (create if not)
      let user = await storage.getUser(userId);
      if (!user) {
        // Check if a user with this email already exists
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          // User exists with this email - return existing user
          user = existingUser;
          console.log(`[Onboard] User with email ${email} already exists, using existing user ${user.id}`);

          // Generate new JWT with the correct userId from database
          newToken = generateToken({
            userId: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus,
          });
          console.log(`[Onboard] Generated new JWT for existing user ${user.id}`);
        } else {
          // Create new user
          user = await storage.createUser({
            id: userId,
            email,
            emailVerified: true,
            subscriptionTier,
            subscriptionStatus,
            role: 'user',
          });
          console.log(`[Onboard] Created new user ${userId} with email ${email}`);
        }
      }

      // Ensure user has a default project
      const defaultProject = await storage.ensureUserDefaultProject(user.id);

      res.json({
        user,
        defaultProject,
        ...(newToken ? { token: newToken } : {}),
      });
    } catch (error: any) {
      console.error("Failed to onboard user:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // ==========================================
  // PROJECTS API
  // ==========================================

  app.get("/api/v1/projects", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error: any) {
      console.error("Failed to get projects:", error);
      res.status(500).json({ error: "Failed to retrieve projects" });
    }
  });

  app.post("/api/v1/projects", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const email = req.user!.email;
      const { name, description } = req.body;

      // Ensure user exists in database before creating project
      let user = await storage.getUser(userId);
      if (!user) {
        console.log(`[POST /api/v1/projects] User ${userId} not found, creating user record`);
        user = await storage.createUser({
          id: userId,
          email,
          emailVerified: true,
          subscriptionTier: req.user!.subscriptionTier || 'basic',
          subscriptionStatus: req.user!.subscriptionStatus || 'active',
          role: 'user',
        });
      }

      const project = await storage.createProject({
        name,
        description,
        userId,
      });
      res.json(project);
    } catch (error: any) {
      console.error("Failed to create project:", error);
      if (error.message === "DUPLICATE_NAME") {
        return res.status(409).json({ error: "Project name already exists" });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.get("/api/v1/projects/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const project = await storage.getProject(req.params.id, userId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      console.error("Failed to get project:", error);
      res.status(500).json({ error: "Failed to retrieve project" });
    }
  });

  app.delete("/api/v1/projects/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const success = await storage.deleteProject(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "Cannot delete default project") {
        return res.status(403).json({ error: "Cannot delete default project" });
      }
      console.error("Failed to delete project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // ==========================================
  // DRIVING FORCES API
  // ==========================================

  app.get("/api/v1/scanning/forces", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const lens = req.query.lens;
      const type = req.query.type;
      const steep = req.query.steep;
      const search = req.query.search;
      const includeSignals = req.query.includeSignals === 'true';
      const limit = parseInt(req.query.limit || '10000');
      const offset = parseInt(req.query.offset || '0');

      console.log('[SCANNING/FORCES] Request:', { userId, projectId, lens, type, steep, search, includeSignals, limit, offset });

      // Handle dimensions parameter (can be an array)
      const dimensions = req.query.dimensions
        ? Array.isArray(req.query.dimensions)
          ? req.query.dimensions
          : [req.query.dimensions]
        : undefined;

      // Handle type parameter (can be comma-separated string)
      const types = type
        ? (type.includes(',') ? type.split(',') : [type])
        : undefined;

      const filters: any = {};
      if (types && types.length > 0) filters.type = types;
      if (steep && steep !== 'all') filters.steep = steep;
      if (search) filters.search = search;
      if (dimensions && dimensions.length > 0) filters.dimensions = dimensions;

      console.log('[SCANNING/FORCES] Filters:', filters);

      const result = await storage.getDrivingForces(projectId, lens, filters, {
        limit,
        offset,
        includeEmbeddings: false,
        includeSignals,
      }, userId);

      console.log('[SCANNING/FORCES] Result:', { forcesCount: result.forces.length, total: result.total });

      res.json(result);
    } catch (error: any) {
      console.error("[SCANNING/FORCES] Failed to get forces:", error);
      res.status(500).json({ error: "Failed to retrieve driving forces" });
    }
  });

  app.get("/api/v1/forces/search", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const searchTerm = req.query.q || req.query.search || '';
      const page = parseInt(req.query.page || '1');
      const pageSize = parseInt(req.query.pageSize || '100');
      const sort = req.query.sort || 'relevance';
      const sortOrder = req.query.sortOrder || 'desc';
      const includeFacets = req.query.includeFacets === 'true';
      const includeEmbeddings = req.query.includeEmbeddings === 'true';

      // Handle array parameters (types, dimensions, steep, sentiments, tags)
      const types = req.query.types
        ? Array.isArray(req.query.types)
          ? req.query.types
          : [req.query.types]
        : undefined;

      const dimensions = req.query.dimensions
        ? Array.isArray(req.query.dimensions)
          ? req.query.dimensions
          : [req.query.dimensions]
        : undefined;

      const steep = req.query.steep
        ? Array.isArray(req.query.steep)
          ? req.query.steep
          : [req.query.steep]
        : undefined;

      const sentiments = req.query.sentiments
        ? Array.isArray(req.query.sentiments)
          ? req.query.sentiments
          : [req.query.sentiments]
        : undefined;

      const tags = req.query.tags
        ? Array.isArray(req.query.tags)
          ? req.query.tags
          : [req.query.tags]
        : undefined;

      // Handle impact range
      const impactMin = req.query.impactMin ? parseInt(req.query.impactMin) : undefined;
      const impactMax = req.query.impactMax ? parseInt(req.query.impactMax) : undefined;
      const impactRange = impactMin !== undefined || impactMax !== undefined
        ? [impactMin || 1, impactMax || 10]
        : undefined;

      // Use queryForces for advanced search with all filters
      const result = await storage.queryForces({
        projectId,
        q: searchTerm,
        page,
        pageSize,
        sort,
        sortOrder,
        includeFacets,
        includeEmbeddings,
        types,
        dimensions,
        steep,
        sentiments,
        tags,
        impactRange,
      }, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Failed to search forces:", error);
      res.status(500).json({ error: "Failed to search driving forces" });
    }
  });

  app.get("/api/v1/forces/batch", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const ids = req.query.ids ? req.query.ids.split(',') : [];
      const forces = await storage.getDrivingForcesByIds(ids, projectId, {}, userId);
      res.json(forces);
    } catch (error: any) {
      console.error("Failed to get forces batch:", error);
      res.status(500).json({ error: "Failed to retrieve forces" });
    }
  });

  // ==========================================
  // CLUSTERS API
  // ==========================================

  app.get("/api/v1/clusters", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const clusters = await storage.getClusters(projectId, userId);
      res.json(clusters);
    } catch (error: any) {
      console.error("Failed to get clusters:", error);
      res.status(500).json({ error: "Failed to retrieve clusters" });
    }
  });

  // ==========================================
  // ANALYTICS & VISUALIZATION API
  // ==========================================

  app.get("/api/v1/analytics/overview", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.query.project_id || req.query.projectId;

      const { forces } = await storage.getDrivingForces(projectId, undefined, {}, {}, userId);
      const clusters = await storage.getClusters(projectId, userId);

      res.json({
        totalForces: forces.length,
        totalClusters: clusters.length,
        forcesByType: forces.reduce((acc: any, force: any) => {
          acc[force.type] = (acc[force.type] || 0) + 1;
          return acc;
        }, {}),
        forcesByDimension: forces.reduce((acc: any, force: any) => {
          acc[force.steep] = (acc[force.steep] || 0) + 1;
          return acc;
        }, {}),
      });
    } catch (error: any) {
      console.error("Failed to get analytics:", error);
      res.status(500).json({ error: "Failed to retrieve analytics" });
    }
  });

  // ==========================================
  // ANALYTICS - ADVANCED ENDPOINTS
  // ==========================================

  app.get("/api/v1/analytics/radar", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.query.project_id || req.query.projectId;

      console.log('[RADAR] Request received:', { userId, projectId, query: req.query });

      // Parse filter parameters
      const search = req.query.search;
      const types = req.query.types ? req.query.types.split(',') : undefined;
      const dimensions = req.query.dimensions ? req.query.dimensions.split(',') : undefined;
      const steep = req.query.steep ? req.query.steep.split(',') : undefined;
      const sentiments = req.query.sentiments ? req.query.sentiments.split(',') : undefined;
      const horizons = req.query.horizons ? req.query.horizons.split(',') : undefined;
      const tags = req.query.tags ? req.query.tags.split(',') : undefined;
      const impactMin = req.query.impactMin ? parseFloat(req.query.impactMin) : undefined;
      const impactMax = req.query.impactMax ? parseFloat(req.query.impactMax) : undefined;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 250;

      // Build filters object
      const filters: any = {};
      if (search) filters.search = search;
      if (types && types.length > 0) filters.types = types;
      if (dimensions && dimensions.length > 0) filters.dimensions = dimensions;
      if (steep && steep.length > 0) filters.steep = steep;
      if (sentiments && sentiments.length > 0) filters.sentiments = sentiments;
      if (horizons && horizons.length > 0) filters.horizons = horizons;
      if (tags && tags.length > 0) filters.tags = tags;
      if (impactMin !== undefined) filters.impactMin = impactMin;
      if (impactMax !== undefined) filters.impactMax = impactMax;

      console.log('[RADAR] Filters:', filters);

      // Fetch forces - default to curated forces only (exclude signals)
      const { forces, total } = await storage.getDrivingForces(projectId, undefined, filters, {
        limit: pageSize,
        includeSignals: false, // Only show curated forces (M, T, WS, WC)
      }, userId);

      console.log('[RADAR] Forces fetched:', { total, forcesCount: forces.length });

      // Transform forces into radar data points with all required fields
      const points = forces.map(force => ({
        id: force.id,
        driving_force: force.title, // Map title to driving_force
        description: force.text || force.title, // Map text to description
        type: force.type,
        dimension: force.dimension || force.steep, // Use dimension or fall back to steep
        magnitude: force.magnitude || 5, // Default magnitude if not set
        distance: force.distance || 5, // Default distance if not set
        color_hex: force.colorHex || '#64ffda', // Default color if not set
        level_of_impact: force.impact, // Map impact to level_of_impact
        feasibility: force.feasibility || 5, // Default if not set
        urgency: force.urgency || 5, // Default if not set
        time_to_market: force.ttm, // Map ttm to time_to_market
        sentiment: force.sentiment || 'neutral',
        source: force.source,
      }));

      console.log('[RADAR] Points transformed:', { pointsCount: points.length, samplePoint: points[0] });

      // Get unique dimensions and types for response
      const uniqueDimensions = [...new Set(forces.map(f => f.dimension || f.steep).filter(Boolean))];
      const uniqueTypes = [...new Set(forces.map(f => f.type).filter(Boolean))];

      console.log('[RADAR] Response:', { success: true, pointsCount: points.length, total, dimensionsCount: uniqueDimensions.length, typesCount: uniqueTypes.length });

      res.json({
        success: true,
        points,
        total,
        dimensions: uniqueDimensions,
        types: uniqueTypes,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[RADAR] Failed to get radar data:", error);
      res.status(500).json({ error: "Failed to retrieve radar data" });
    }
  });

  app.get("/api/v1/analytics/force-network/:projectId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const { projectId } = req.params;
      const clusters = await storage.getClusters(projectId, userId);

      // Return cluster network data
      res.json({
        nodes: clusters.map(c => ({
          id: c.id,
          label: c.label,
          size: c.forceIds?.length || 0,
        })),
        edges: [],
      });
    } catch (error: any) {
      console.error("Failed to get force network:", error);
      res.status(500).json({ error: "Failed to retrieve force network" });
    }
  });

  app.get("/api/v1/analytics/network", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const clusters = await storage.getClusters(projectId, userId);

      res.json({
        nodes: clusters.map(c => ({
          id: c.id,
          label: c.label,
          size: c.forceIds?.length || 0,
        })),
        edges: [],
      });
    } catch (error: any) {
      console.error("Failed to get network data:", error);
      res.status(500).json({ error: "Failed to retrieve network data" });
    }
  });

  // ==========================================
  // REPORTS API
  // ==========================================

  app.get("/api/v1/reports", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const reports = await storage.getReports(userId, projectId);
      res.json(reports);
    } catch (error: any) {
      console.error("Failed to get reports:", error);
      res.status(500).json({ error: "Failed to retrieve reports" });
    }
  });

  app.post("/api/v1/reports", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const report = await storage.createReport({ ...req.body, userId });

      // Trigger report generation in background
      jobsService.generateReport(report.id, report.projectId, report.format);

      res.json(report);
    } catch (error: any) {
      console.error("Failed to create report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.get("/api/v1/reports/download/:filename", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const filename = req.params.filename;
      // Use process.cwd() to ensure we target the project root's uploads directory
      const filePath = path.join(process.cwd(), 'uploads/reports', filename);

      if (!fs.existsSync(filePath)) {
        console.error(`File not found at path: ${filePath}`);
        return res.status(404).json({ error: "File not found" });
      }

      res.download(filePath);
    } catch (error: any) {
      console.error("Failed to download report:", error);
      res.status(500).json({ error: "Failed to download report" });
    }
  });

  app.put("/api/v1/reports/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const report = await storage.updateReport(req.params.id, req.body);
      res.json(report);
    } catch (error: any) {
      console.error("Failed to update report:", error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  app.delete("/api/v1/reports/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteReport(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to delete report:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // ==========================================
  // JOBS API
  // ==========================================

  app.get("/api/v1/jobs", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const status = req.query.status;
      const jobs = await storage.getJobs(userId, status);
      res.json(jobs);
    } catch (error: any) {
      console.error("Failed to get jobs:", error);
      res.status(500).json({ error: "Failed to retrieve jobs" });
    }
  });

  app.get("/api/v1/jobs/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const allJobs = await storage.getJobs(userId);
      const stats = {
        total: allJobs.length,
        pending: allJobs.filter((j: any) => j.status === 'pending').length,
        running: allJobs.filter((j: any) => j.status === 'running').length,
        completed: allJobs.filter((j: any) => j.status === 'completed').length,
        failed: allJobs.filter((j: any) => j.status === 'failed').length,
      };
      res.json(stats);
    } catch (error: any) {
      console.error("Failed to get job stats:", error);
      res.status(500).json({ error: "Failed to retrieve job statistics" });
    }
  });

  app.get("/api/v1/jobs/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error: any) {
      console.error("Failed to get job:", error);
      res.status(500).json({ error: "Failed to retrieve job" });
    }
  });

  // ==========================================
  // BATCH OPERATIONS
  // ==========================================

  app.get("/api/v1/scanning/forces/batch", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const projectIds = req.query.project_ids ? req.query.project_ids.split(',') : [];

      // Get forces for all projects
      const results = await Promise.all(
        projectIds.map(async (projectId: string) => {
          const { forces, total } = await storage.getDrivingForces(projectId, undefined, {}, {
            limit: 100,
            includeSignals: false,
          }, userId);
          return { projectId, forces, total };
        })
      );

      res.json(results);
    } catch (error: any) {
      console.error("Failed to batch get forces:", error);
      res.status(500).json({ error: "Failed to retrieve forces for projects" });
    }
  });

  // Batched force count statistics endpoint (optimized)
  const forceStatsSchema = z.object({
    projectIds: z.array(z.string()).min(1).max(100),
  });

  app.post("/api/v1/scanning/forces/stats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;

      // Validate request body with Zod schema
      const validation = forceStatsSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validation.error.errors,
        });
      }

      const { projectIds } = validation.data;

      // Get force counts for all projects in a single query
      const counts = await storage.getForceCountsByProjectIds(projectIds, userId);

      // Transform to array format for response
      const stats = projectIds.map(projectId => ({
        projectId,
        total: counts[projectId]?.total || 0,
      }));

      res.json({ stats });
    } catch (error: any) {
      console.error("Failed to get batched force statistics:", error);
      res.status(500).json({ error: "Failed to retrieve force statistics" });
    }
  });

  // ==========================================
  // AUTHENTICATION API
  // ==========================================

  // Development token generation endpoint (for testing only)
  app.post("/api/v1/auth/dev-token", async (req: any, res) => {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: "Development tokens are not available in production" });
      }

      const { userId, email, subscriptionTier, subscriptionStatus } = req.body;

      if (!userId || !email) {
        return res.status(400).json({ error: "userId and email are required" });
      }

      // Generate a test JWT token
      const { generateToken } = await import("./middleware/auth");
      const token = generateToken({
        userId,
        email,
        subscriptionTier: subscriptionTier || 'professional',
        subscriptionStatus: subscriptionStatus || 'active',
      }, '24h');

      res.json({ token });
    } catch (error: any) {
      console.error("Failed to generate development token:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  });

  // ==========================================
  // CHAT/COPILOT API
  // ==========================================

  app.post("/api/v1/chat/stream", authenticateToken, async (req: AuthenticatedRequest, res) => {
    // Create abort controller for client disconnect handling
    const abortController = new AbortController();
    let connectionClosed = false;

    // Handle client disconnect - idempotent cleanup
    const cleanup = () => {
      if (connectionClosed) return; // Already cleaned up
      connectionClosed = true;
      abortController.abort();
      if (!res.writableEnded) {
        res.end();
      }
    };

    // req.on('close', cleanup);
    req.on('error', cleanup);

    try {
      const { query, projectId, project_id, threadId, thread_id, assistantType, assistant_type, context, images } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }

      // Set up Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Enrich context with full driving force objects if IDs are provided
      let enrichedContext = context || {};
      if (context?.selectedForceIds && Array.isArray(context.selectedForceIds) && context.selectedForceIds.length > 0) {
        try {
          const actualProjectId = projectId || project_id;
          console.log(`[Chat Route] Fetching ${context.selectedForceIds.length} selected forces for project ${actualProjectId}`);

          const { forces, notFound } = await storage.getDrivingForcesByIds(
            context.selectedForceIds,
            actualProjectId,
            { includeEmbeddings: false, includeSignals: false }
          );

          if (notFound.length > 0) {
            console.warn(`[Chat Route] Could not find ${notFound.length} forces:`, notFound);
          }

          // Add full force objects to context
          enrichedContext = {
            ...context,
            selectedForces: forces,
            forcesCount: context.forcesCount || forces.length,
            clustersCount: context.clustersCount || 0
          };

          console.log(`[Chat Route] Enriched context with ${forces.length} driving forces`);
        } catch (error) {
          console.error('[Chat Route] Error fetching driving forces:', error);
          // Continue with original context if fetch fails
        }
      }

      const { openaiService } = await import("./services/openai");

      await openaiService.streamAssistantResponse(
        query,
        enrichedContext,
        (assistantType || assistant_type || 'copilot'),
        (threadId || thread_id || null),
        (chunk) => {
          // Send chunk via SSE only if connection is still open
          if (!connectionClosed && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
          }
        },
        (finalThreadId) => {
          // Send completion event only if connection is still open
          if (!connectionClosed && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'done', threadId: finalThreadId })}\n\n`);
            res.end();
          }
        },
        (error) => {
          // Send error event only if connection is still open
          if (!connectionClosed && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
            res.end();
          }
        },
        images,
        abortController.signal
      );

    } catch (error: any) {
      console.error("Chat streaming error:", error);
      // If headers not sent yet, send error as JSON
      if (!res.headersSent) {
        res.status(500).json({ error: "Chat service unavailable" });
      } else if (!connectionClosed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      }
    }
  });

  // ==========================================
  // IMAGE PROXY API
  // ==========================================

  app.get("/api/v1/chat/image/:fileId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { fileId } = req.params;
      const LOG_FILE = path.join(__dirname, 'debug.log');
      const logToFile = (msg: string) => { try { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { } };

      logToFile(`[Image Proxy] Request for file: ${fileId}`);
      console.log(`[Image Proxy] Request for file: ${fileId}`);

      if (!fileId) {
        return res.status(400).json({ error: "File ID is required" });
      }

      const { openaiService } = await import("./services/openai");
      const imageBuffer = await openaiService.getImageContent(fileId);

      if (!imageBuffer) {
        logToFile(`[Image Proxy] Image not found for ID: ${fileId}`);
        console.error(`[Image Proxy] Image not found for ID: ${fileId}`);
        return res.status(404).json({ error: "Image not found" });
      }

      logToFile(`[Image Proxy] Serving image ${fileId}, size: ${imageBuffer.byteLength} bytes`);
      console.log(`[Image Proxy] Serving image ${fileId}, size: ${imageBuffer.byteLength} bytes`);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(Buffer.from(imageBuffer));

    } catch (error: any) {
      console.error("Image proxy error:", error);
      res.status(500).json({ error: "Failed to retrieve image" });
    }
  });

  app.post("/api/v1/chat", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Placeholder for non-streaming chat
      res.json({
        message: "Use /api/v1/chat/stream for chat functionality",
        success: false
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Chat service unavailable" });
    }
  });

  // ==========================================
  // HEALTH CHECK
  // ==========================================

  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Conversations
  app.get("/api/v1/projects/:projectId/conversations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const conversations = await storage.getConversations(req.params.projectId);
      res.json(conversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/v1/projects/:projectId/conversations", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const conversation = await storage.createConversation({
        ...req.body,
        projectId: req.params.projectId,
        userId,
      });
      res.json(conversation);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.get("/api/v1/conversations/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  app.put("/api/v1/conversations/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const conversation = await storage.updateConversation(req.params.id, req.body);
      res.json(conversation);
    } catch (error) {
      console.error("Failed to update conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  app.delete("/api/v1/conversations/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // ==========================================
  // USER PROJECT STATE API
  // ==========================================

  app.get("/api/v1/users/:userId/projects/:projectId/state", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, projectId } = req.params;
      const requestUserId = req.user!.userId;

      // Validate that the requesting user matches the userId in the path
      if (requestUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized to access this user's project state" });
      }

      const { userProjectStateService } = await import("./services/userProjectState");
      const state = await userProjectStateService.getUserProjectState(userId, projectId);

      if (!state) {
        // Return empty state if none exists
        return res.json({
          selectedForces: [],
          searchedForces: [],
          scanningFilters: {},
          committedRadarFilters: {},
          copilotThreadId: null,
        });
      }

      res.json(state);
    } catch (error: any) {
      console.error("Failed to get user project state:", error);
      res.status(500).json({ error: "Failed to retrieve user project state" });
    }
  });

  app.put("/api/v1/users/:userId/projects/:projectId/state", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, projectId } = req.params;
      const requestUserId = req.user!.userId;

      // Validate that the requesting user matches the userId in the path
      if (requestUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized to modify this user's project state" });
      }

      const { userProjectStateService } = await import("./services/userProjectState");
      const state = await userProjectStateService.saveUserProjectState(userId, projectId, req.body);

      res.json(state);
    } catch (error: any) {
      console.error("Failed to save user project state:", error);
      res.status(500).json({ error: "Failed to save user project state" });
    }
  });

  app.delete("/api/v1/users/:userId/projects/:projectId/state", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, projectId } = req.params;
      const requestUserId = req.user!.userId;

      // Validate that the requesting user matches the userId in the path
      if (requestUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized to delete this user's project state" });
      }

      const { userProjectStateService } = await import("./services/userProjectState");
      const success = await userProjectStateService.deleteUserProjectState(userId, projectId);

      if (!success) {
        return res.status(404).json({ error: "Project state not found" });
      }

      res.sendStatus(204);
    } catch (error: any) {
      console.error("Failed to delete user project state:", error);
      res.status(500).json({ error: "Failed to delete user project state" });
    }
  });

  app.get("/api/v1/users/:userId/project-states", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const requestUserId = req.user!.userId;

      // Validate that the requesting user matches the userId in the path
      if (requestUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized to access this user's project states" });
      }

      const { userProjectStateService } = await import("./services/userProjectState");
      const states = await userProjectStateService.getAllUserProjectStates(userId);

      res.json(states);
    } catch (error: any) {
      console.error("Failed to get user project states:", error);
      res.status(500).json({ error: "Failed to retrieve user project states" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
