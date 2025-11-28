var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  FEATURE_ACCESS: () => FEATURE_ACCESS,
  FORCE_TYPES: () => FORCE_TYPES,
  PAGE_ACCESS: () => PAGE_ACCESS,
  TIER_PERMISSIONS: () => TIER_PERMISSIONS,
  adminErrorResponseSchema: () => adminErrorResponseSchema,
  aiUsageTracking: () => aiUsageTracking,
  aiUsageTrackingRelations: () => aiUsageTrackingRelations,
  apiErrorResponseSchema: () => apiErrorResponseSchema,
  apiSuccessResponseSchema: () => apiSuccessResponseSchema,
  bulkEditFieldsSchema: () => bulkEditFieldsSchema,
  bulkEditFiltersSchema: () => bulkEditFiltersSchema,
  bulkEditPreviewSchema: () => bulkEditPreviewSchema,
  bulkEditRequestSchema: () => bulkEditRequestSchema,
  chatImageSchema: () => chatImageSchema,
  chatStreamRequestSchema: () => chatStreamRequestSchema,
  clusteringReports: () => clusteringReports,
  clusteringReportsRelations: () => clusteringReportsRelations,
  clusters: () => clusters,
  clustersRelations: () => clustersRelations,
  conversations: () => conversations,
  createCheckoutSessionRequestSchema: () => createCheckoutSessionRequestSchema,
  drivingForces: () => drivingForces,
  drivingForcesRelations: () => drivingForcesRelations,
  emailVerificationSchema: () => emailVerificationSchema,
  facetCountsSchema: () => facetCountsSchema,
  importClustersResponseSchema: () => importClustersResponseSchema,
  importStatusResponseSchema: () => importStatusResponseSchema,
  insertAiUsageTrackingSchema: () => insertAiUsageTrackingSchema,
  insertClusterSchema: () => insertClusterSchema,
  insertClusteringReportSchema: () => insertClusteringReportSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertDrivingForceSchema: () => insertDrivingForceSchema,
  insertInviteCodeSchema: () => insertInviteCodeSchema,
  insertJobSchema: () => insertJobSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertReportSchema: () => insertReportSchema,
  insertSavedSearchSchema: () => insertSavedSearchSchema,
  insertSubscriptionHistorySchema: () => insertSubscriptionHistorySchema,
  insertSubscriptionPlanSchema: () => insertSubscriptionPlanSchema,
  insertUserSchema: () => insertUserSchema,
  insertWorkspaceSchema: () => insertWorkspaceSchema,
  inviteCodes: () => inviteCodes,
  inviteCodesRelations: () => inviteCodesRelations,
  jobs: () => jobs,
  parseCommandRequestSchema: () => parseCommandRequestSchema,
  passwordResetRequestSchema: () => passwordResetRequestSchema,
  passwordResetSchema: () => passwordResetSchema,
  projectTypeEnum: () => projectTypeEnum,
  projectTypeSchema: () => projectTypeSchema,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  reports: () => reports,
  reportsRelations: () => reportsRelations,
  savedSearches: () => savedSearches,
  savedSearchesRelations: () => savedSearchesRelations,
  searchFiltersSchema: () => searchFiltersSchema,
  searchQuerySchema: () => searchQuerySchema,
  searchResponseSchema: () => searchResponseSchema,
  sessions: () => sessions,
  subscriptionHistory: () => subscriptionHistory,
  subscriptionHistoryRelations: () => subscriptionHistoryRelations,
  subscriptionPlans: () => subscriptionPlans,
  subscriptionStatusEnum: () => subscriptionStatusEnum,
  subscriptionStatusResponseSchema: () => subscriptionStatusResponseSchema,
  subscriptionTierEnum: () => subscriptionTierEnum,
  updateDrivingForceSchema: () => updateDrivingForceSchema,
  updateProfileSchema: () => updateProfileSchema,
  userLoginSchema: () => userLoginSchema,
  userRegistrationSchema: () => userRegistrationSchema,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  usersRelations: () => usersRelations,
  workspaces: () => workspaces,
  workspacesRelations: () => workspacesRelations
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb, boolean, pgEnum, index, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var projectTypeEnum, subscriptionStatusEnum, subscriptionTierEnum, userRoleEnum, PAGE_ACCESS, FEATURE_ACCESS, TIER_PERMISSIONS, FORCE_TYPES, sessions, users, projects, drivingForces, clusters, clusteringReports, workspaces, jobs, reports, subscriptionPlans, subscriptionHistory, aiUsageTracking, inviteCodes, usersRelations, inviteCodesRelations, projectsRelations, drivingForcesRelations, clustersRelations, workspacesRelations, clusteringReportsRelations, reportsRelations, subscriptionHistoryRelations, aiUsageTrackingRelations, projectTypeSchema, insertProjectSchema, insertDrivingForceSchema, updateDrivingForceSchema, insertClusterSchema, insertWorkspaceSchema, insertJobSchema, insertClusteringReportSchema, insertReportSchema, insertSubscriptionPlanSchema, insertSubscriptionHistorySchema, insertAiUsageTrackingSchema, insertInviteCodeSchema, insertUserSchema, userRegistrationSchema, userLoginSchema, passwordResetRequestSchema, passwordResetSchema, emailVerificationSchema, updateProfileSchema, conversations, insertConversationSchema, savedSearches, savedSearchesRelations, searchQuerySchema, facetCountsSchema, searchResponseSchema, insertSavedSearchSchema, bulkEditFieldsSchema, bulkEditFiltersSchema, bulkEditRequestSchema, parseCommandRequestSchema, bulkEditPreviewSchema, searchFiltersSchema, chatImageSchema, chatStreamRequestSchema, importStatusResponseSchema, importClustersResponseSchema, adminErrorResponseSchema, apiSuccessResponseSchema, apiErrorResponseSchema, createCheckoutSessionRequestSchema, subscriptionStatusResponseSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    projectTypeEnum = pgEnum("project_type", ["full_orion", "megatrends", "early_warning", "new_project"]);
    subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "unpaid", "trialing", "incomplete", "incomplete_expired"]);
    subscriptionTierEnum = pgEnum("subscription_tier", ["basic", "professional", "enterprise"]);
    userRoleEnum = pgEnum("user_role", ["user", "admin"]);
    PAGE_ACCESS = {
      DASHBOARD: "dashboard",
      SCANNING: "scanning",
      ANALYTICS: "analytics",
      REPORTS: "reports",
      COPILOT: "copilot"
    };
    FEATURE_ACCESS = {
      API_ACCESS: "api_access",
      TEAM_SHARING: "team_sharing",
      CUSTOM_REPORTS: "custom_reports",
      ADVANCED_ANALYTICS: "advanced_analytics",
      PRIORITY_SUPPORT: "priority_support"
    };
    TIER_PERMISSIONS = {
      basic: {
        pages: [PAGE_ACCESS.DASHBOARD, PAGE_ACCESS.SCANNING, PAGE_ACCESS.ANALYTICS],
        features: []
      },
      professional: {
        pages: [PAGE_ACCESS.DASHBOARD, PAGE_ACCESS.SCANNING, PAGE_ACCESS.ANALYTICS, PAGE_ACCESS.REPORTS, PAGE_ACCESS.COPILOT],
        features: [FEATURE_ACCESS.CUSTOM_REPORTS]
      },
      enterprise: {
        pages: [PAGE_ACCESS.DASHBOARD, PAGE_ACCESS.SCANNING, PAGE_ACCESS.ANALYTICS, PAGE_ACCESS.REPORTS, PAGE_ACCESS.COPILOT],
        features: [FEATURE_ACCESS.API_ACCESS, FEATURE_ACCESS.TEAM_SHARING, FEATURE_ACCESS.CUSTOM_REPORTS, FEATURE_ACCESS.ADVANCED_ANALYTICS, FEATURE_ACCESS.PRIORITY_SUPPORT]
      }
    };
    FORCE_TYPES = {
      MEGATRENDS: "Megatrends",
      TRENDS: "Trends",
      WEAK_SIGNALS: "Weak Signals",
      WILDCARDS: "Wildcards",
      SCENARIOS: "Signals"
    };
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique().notNull(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      // Custom authentication fields
      passwordHash: varchar("password_hash"),
      // bcrypt hashed password
      emailVerified: boolean("email_verified").default(false).notNull(),
      emailVerificationToken: varchar("email_verification_token"),
      emailVerificationExpiresAt: timestamp("email_verification_expires_at"),
      passwordResetToken: varchar("password_reset_token"),
      passwordResetExpiresAt: timestamp("password_reset_expires_at"),
      loginAttempts: integer("login_attempts").default(0).notNull(),
      lockedUntil: timestamp("locked_until"),
      lastLoginAt: timestamp("last_login_at"),
      // Additional profile fields for SaaS onboarding
      companyName: varchar("company_name"),
      jobTitle: varchar("job_title"),
      industry: varchar("industry"),
      country: varchar("country"),
      // Stripe integration fields
      stripeCustomerId: varchar("stripe_customer_id"),
      stripeSubscriptionId: varchar("stripe_subscription_id"),
      subscriptionTier: subscriptionTierEnum("subscription_tier"),
      subscriptionStatus: subscriptionStatusEnum("subscription_status"),
      subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
      subscriptionCancelAtPeriodEnd: boolean("subscription_cancel_at_period_end").default(false),
      trialEndsAt: timestamp("trial_ends_at"),
      // User role and invite tracking
      role: userRoleEnum("role").default("user").notNull(),
      invitedByCode: varchar("invited_by_code"),
      invitedByUserId: varchar("invited_by_user_id"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    projects = pgTable("projects", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      // Nullable initially for migration
      name: text("name").notNull(),
      description: text("description"),
      projectType: projectTypeEnum("project_type").notNull().default("new_project"),
      isDefault: boolean("is_default").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    drivingForces = pgTable("driving_forces", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      projectId: varchar("project_id").references(() => projects.id).notNull(),
      title: text("title").notNull(),
      type: text("type").notNull(),
      // M/T/WS/WC/S
      steep: text("steep").notNull(),
      // Social/Technological/Economic/Environmental/Political
      dimension: text("dimension"),
      // New column for radar visualization - corresponds to radar CSV "dimension" field
      scope: text("scope"),
      impact: real("impact"),
      // 1-10 scale (Level of Impact)
      ttm: text("ttm"),
      // time to market (Time to Market)
      sentiment: text("sentiment"),
      // Positive/Negative/Neutral
      source: text("source"),
      tags: text("tags").array(),
      text: text("text").notNull(),
      embeddingVector: real("embedding_vector").array(),
      embeddingModel: text("embedding_model").default("text-embedding-3-large"),
      // Cluster assignment fields
      clusterId: varchar("cluster_id").references(() => clusters.id),
      clusterLabel: text("cluster_label"),
      // Radar visualization fields
      magnitude: real("magnitude"),
      // Magnitude for radar positioning
      distance: real("distance"),
      // Distance from center in radar
      colorHex: text("color_hex"),
      // Hex color for radar points
      feasibility: real("feasibility"),
      // Feasibility score (1-10)
      urgency: real("urgency"),
      // Urgency score (1-10)
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    clusters = pgTable("clusters", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      projectId: varchar("project_id").references(() => projects.id).notNull(),
      label: text("label").notNull(),
      method: text("method").notNull(),
      // orion (ORION clustering only)
      params: jsonb("params"),
      forceIds: text("force_ids").array(),
      centroid: real("centroid").array(),
      size: integer("size").notNull(),
      // Quality metrics
      silhouetteScore: real("silhouette_score"),
      cohesion: real("cohesion"),
      separation: real("separation"),
      inertia: real("inertia"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    clusteringReports = pgTable("clustering_reports", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      projectId: varchar("project_id").references(() => projects.id).notNull(),
      algorithm: text("algorithm").notNull(),
      params: jsonb("params"),
      executionTime: integer("execution_time"),
      recommendedClusters: integer("recommended_clusters"),
      // Overall quality metrics
      averageSilhouette: real("average_silhouette"),
      daviesBouldinIndex: real("davies_bouldin_index"),
      calinskiHarabaszIndex: real("calinski_harabasz_index"),
      totalInertia: real("total_inertia"),
      clustersCount: integer("clusters_count"),
      forcesProcessed: integer("forces_processed"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    workspaces = pgTable("workspaces", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      projectId: varchar("project_id").references(() => projects.id).notNull(),
      name: text("name").notNull(),
      lens: text("lens").notNull(),
      // megatrends/trends/weak_signals
      filtersJson: jsonb("filters_json"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    jobs = pgTable("jobs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      type: text("type").notNull(),
      // preprocess/report/etc
      status: text("status").notNull().default("pending"),
      // pending/running/done/failed
      progress: integer("progress").default(0),
      metaJson: jsonb("meta_json"),
      error: text("error"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      finishedAt: timestamp("finished_at")
    });
    reports = pgTable("reports", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      projectId: varchar("project_id").references(() => projects.id).notNull(),
      format: text("format").notNull(),
      // pdf/docx/xlsx
      status: text("status").notNull().default("pending"),
      url: text("url"),
      sections: text("sections"),
      // Comma-separated list of sections to include
      selectedForceIds: text("selected_force_ids").array(),
      // Array of selected force IDs for the report
      chatHistory: jsonb("chat_history"),
      // Store full chat history for Copilot reports
      reportType: text("report_type").default("standard"),
      // 'standard' or 'chat'
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    subscriptionPlans = pgTable("subscription_plans", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      tier: subscriptionTierEnum("tier").unique().notNull(),
      name: text("name").notNull(),
      description: text("description"),
      price: integer("price").notNull(),
      // Price in cents
      currency: varchar("currency", { length: 3 }).notNull().default("USD"),
      stripePriceId: varchar("stripe_price_id").notNull(),
      features: jsonb("features").notNull(),
      // JSON array of feature descriptions
      limits: jsonb("limits").notNull(),
      // JSON object with feature limits
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    subscriptionHistory = pgTable("subscription_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      fromTier: subscriptionTierEnum("from_tier"),
      toTier: subscriptionTierEnum("to_tier").notNull(),
      stripeEventId: varchar("stripe_event_id"),
      eventType: text("event_type").notNull(),
      // subscription_created, tier_changed, canceled, etc.
      metadata: jsonb("metadata"),
      // Additional event data
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    aiUsageTracking = pgTable("ai_usage_tracking", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id).notNull(),
      month: varchar("month", { length: 7 }).notNull(),
      // Format: YYYY-MM
      queriesUsed: integer("queries_used").default(0).notNull(),
      resetAt: timestamp("reset_at").notNull(),
      // When the monthly counter resets
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    }, (table) => [
      // Unique constraint on userId + month to prevent duplicates
      index("idx_ai_usage_user_month").on(table.userId, table.month)
    ]);
    inviteCodes = pgTable("invite_codes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      code: varchar("code").unique().notNull(),
      // The actual invite code string
      createdByUserId: varchar("created_by_user_id").references(() => users.id).notNull(),
      description: text("description"),
      // Optional note about this invite code
      maxUses: integer("max_uses"),
      // null = unlimited uses
      currentUses: integer("current_uses").default(0).notNull(),
      trialDays: integer("trial_days").default(7).notNull(),
      // How many days of trial this code grants
      expiresAt: timestamp("expires_at"),
      // null = never expires
      isActive: boolean("is_active").default(true).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    }, (table) => [
      index("idx_invite_code_lower").on(sql`lower(${table.code})`)
      // Case-insensitive lookup
    ]);
    usersRelations = relations(users, ({ many }) => ({
      projects: many(projects),
      subscriptionHistory: many(subscriptionHistory),
      aiUsageTracking: many(aiUsageTracking),
      createdInviteCodes: many(inviteCodes)
    }));
    inviteCodesRelations = relations(inviteCodes, ({ one }) => ({
      createdBy: one(users, {
        fields: [inviteCodes.createdByUserId],
        references: [users.id]
      })
    }));
    projectsRelations = relations(projects, ({ many, one }) => ({
      user: one(users, {
        fields: [projects.userId],
        references: [users.id]
      }),
      drivingForces: many(drivingForces),
      clusters: many(clusters),
      clusteringReports: many(clusteringReports),
      workspaces: many(workspaces),
      reports: many(reports)
    }));
    drivingForcesRelations = relations(drivingForces, ({ one }) => ({
      project: one(projects, {
        fields: [drivingForces.projectId],
        references: [projects.id]
      })
    }));
    clustersRelations = relations(clusters, ({ one }) => ({
      project: one(projects, {
        fields: [clusters.projectId],
        references: [projects.id]
      })
    }));
    workspacesRelations = relations(workspaces, ({ one }) => ({
      project: one(projects, {
        fields: [workspaces.projectId],
        references: [projects.id]
      })
    }));
    clusteringReportsRelations = relations(clusteringReports, ({ one }) => ({
      project: one(projects, {
        fields: [clusteringReports.projectId],
        references: [projects.id]
      })
    }));
    reportsRelations = relations(reports, ({ one }) => ({
      project: one(projects, {
        fields: [reports.projectId],
        references: [projects.id]
      })
    }));
    subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
      user: one(users, {
        fields: [subscriptionHistory.userId],
        references: [users.id]
      })
    }));
    aiUsageTrackingRelations = relations(aiUsageTracking, ({ one }) => ({
      user: one(users, {
        fields: [aiUsageTracking.userId],
        references: [users.id]
      })
    }));
    projectTypeSchema = z.enum(["full_orion", "megatrends", "early_warning", "new_project"]);
    insertProjectSchema = createInsertSchema(projects).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      projectType: projectTypeSchema.optional()
      // Allow validation with proper enum values
    });
    insertDrivingForceSchema = createInsertSchema(drivingForces).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    updateDrivingForceSchema = createInsertSchema(drivingForces).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).partial();
    insertClusterSchema = createInsertSchema(clusters).omit({
      id: true,
      createdAt: true
    });
    insertWorkspaceSchema = createInsertSchema(workspaces).omit({
      id: true,
      createdAt: true
    });
    insertJobSchema = createInsertSchema(jobs).omit({
      id: true,
      createdAt: true,
      finishedAt: true
    });
    insertClusteringReportSchema = createInsertSchema(clusteringReports).omit({
      id: true,
      createdAt: true
    });
    insertReportSchema = createInsertSchema(reports).omit({
      id: true,
      createdAt: true
    });
    insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSubscriptionHistorySchema = createInsertSchema(subscriptionHistory).omit({
      id: true,
      createdAt: true
    });
    insertAiUsageTrackingSchema = createInsertSchema(aiUsageTracking).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertInviteCodeSchema = createInsertSchema(inviteCodes).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      currentUses: true
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      emailVerificationToken: true,
      emailVerificationExpiresAt: true,
      passwordResetToken: true,
      passwordResetExpiresAt: true,
      loginAttempts: true,
      lockedUntil: true,
      lastLoginAt: true
    });
    userRegistrationSchema = z.object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters").regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter").regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter").regex(/(?=.*\d)/, "Password must contain at least one number"),
      firstName: z.string().min(1, "First name is required").max(50),
      lastName: z.string().min(1, "Last name is required").max(50),
      companyName: z.string().optional(),
      jobTitle: z.string().optional(),
      industry: z.string().optional(),
      country: z.string().optional()
    });
    userLoginSchema = z.object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(1, "Password is required")
    });
    passwordResetRequestSchema = z.object({
      email: z.string().email("Please enter a valid email address")
    });
    passwordResetSchema = z.object({
      token: z.string().min(1, "Reset token is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/(?=.*[a-z])/, "Password must contain at least one lowercase letter").regex(/(?=.*[A-Z])/, "Password must contain at least one uppercase letter").regex(/(?=.*\d)/, "Password must contain at least one number")
    });
    emailVerificationSchema = z.object({
      token: z.string().min(1, "Verification token is required")
    });
    updateProfileSchema = z.object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      companyName: z.string().max(100).optional(),
      jobTitle: z.string().max(100).optional(),
      industry: z.string().max(100).optional(),
      country: z.string().max(100).optional()
    });
    conversations = pgTable("conversations", {
      id: uuid("id").defaultRandom().primaryKey(),
      projectId: uuid("project_id").notNull(),
      userId: text("user_id").notNull(),
      title: text("title").notNull(),
      messages: jsonb("messages").$type().notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    insertConversationSchema = createInsertSchema(conversations).pick({
      projectId: true,
      title: true,
      messages: true
    });
    savedSearches = pgTable("saved_searches", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id),
      projectId: varchar("project_id").references(() => projects.id).notNull(),
      name: text("name").notNull(),
      description: text("description"),
      query: jsonb("query").notNull(),
      // Stores search parameters
      isDefault: boolean("is_default").default(false),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    savedSearchesRelations = relations(savedSearches, ({ one }) => ({
      project: one(projects, {
        fields: [savedSearches.projectId],
        references: [projects.id]
      })
    }));
    searchQuerySchema = z.object({
      q: z.string().optional(),
      // Full-text search query
      projectId: z.string().optional(),
      // Filter by project
      types: z.array(z.enum(["M", "T", "WS", "WC", "S"])).optional(),
      // Multiple force types
      steep: z.array(z.enum(["Social", "Technological", "Economic", "Environmental", "Political"])).optional(),
      // Multiple STEEP categories
      sentiments: z.array(z.enum(["Positive", "Negative", "Neutral"])).optional(),
      // Multiple sentiments
      impactMin: z.number().min(1).max(10).optional(),
      // Minimum impact score
      impactMax: z.number().min(1).max(10).optional(),
      // Maximum impact score
      horizons: z.array(z.string()).optional(),
      // Time horizons (TTM values)
      tags: z.array(z.string()).optional(),
      // Specific tags to include
      dimensions: z.array(z.string()).optional(),
      // Dimension filters
      source: z.string().optional(),
      // Source filter
      scope: z.string().optional(),
      // Scope filter
      selectedForceIds: z.array(z.string()).optional(),
      // Selected force IDs for radar filtering
      forceIds: z.array(z.string()).optional(),
      // Specific force IDs to query
      createdAfter: z.string().datetime().optional(),
      // Created after date
      createdBefore: z.string().datetime().optional(),
      // Created before date
      sort: z.enum(["relevance", "impact", "created_at", "updated_at", "title"]).default("relevance"),
      // Sort options
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      // Sort direction
      page: z.number().int().min(1).default(1),
      // Page number
      pageSize: z.number().int().min(1).max(1e3).default(50),
      // Results per page
      includeFacets: z.boolean().default(true),
      // Whether to include facet counts
      includeEmbeddings: z.boolean().default(false)
      // Include embedding vectors
    });
    facetCountsSchema = z.object({
      types: z.record(z.string(), z.number()),
      // Type counts: M: 100, T: 200, etc.
      steep: z.record(z.string(), z.number()),
      // STEEP counts: Social: 150, etc.
      sentiments: z.record(z.string(), z.number()),
      // Sentiment counts
      impactRanges: z.object({
        "1-3": z.number(),
        "4-6": z.number(),
        "7-8": z.number(),
        "9-10": z.number()
      }),
      horizons: z.record(z.string(), z.number()),
      // Horizon counts
      sources: z.record(z.string(), z.number()).optional(),
      // Top sources with counts
      scopes: z.record(z.string(), z.number()).optional(),
      // Scope counts
      tags: z.record(z.string(), z.number()).optional()
      // Popular tags with counts
    });
    searchResponseSchema = z.object({
      forces: z.array(z.object({
        id: z.string(),
        projectId: z.string(),
        title: z.string(),
        type: z.string(),
        steep: z.string(),
        scope: z.string().nullable(),
        impact: z.number().nullable(),
        ttm: z.string().nullable(),
        sentiment: z.string().nullable(),
        source: z.string().nullable(),
        tags: z.array(z.string()).nullable(),
        text: z.string(),
        embeddingVector: z.array(z.number()).optional(),
        embeddingModel: z.string().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
        relevanceScore: z.number().optional()
        // Search relevance score
      })),
      total: z.number(),
      // Total matching results
      page: z.number(),
      // Current page
      pageSize: z.number(),
      // Results per page
      totalPages: z.number(),
      // Total number of pages
      hasMore: z.boolean(),
      // Whether there are more results
      facets: facetCountsSchema.optional(),
      // Facet counts for filtering
      took: z.number()
      // Query execution time in ms
    });
    insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    bulkEditFieldsSchema = z.object({
      type: z.enum(["M", "T", "WS", "WC", "S"]).optional(),
      steep: z.enum(["Social", "Technological", "Economic", "Environmental", "Political"]).optional(),
      scope: z.string().optional(),
      impact: z.number().min(1).max(10).optional(),
      ttm: z.string().optional(),
      sentiment: z.enum(["Positive", "Negative", "Neutral"]).optional()
    });
    bulkEditFiltersSchema = z.object({
      forceIds: z.array(z.string()).optional(),
      // Specific force IDs to update
      steep: z.array(z.string()).optional(),
      // Filter by STEEP dimensions
      type: z.array(z.string()).optional(),
      // Filter by force types
      selectedOnly: z.boolean().optional(),
      // Update only selected forces
      searchPattern: z.string().optional(),
      // Update forces matching pattern
      count: z.number().positive().optional(),
      // Limit number of forces to update
      position: z.enum(["first", "last"]).optional()
      // Take first/last N forces
    });
    bulkEditRequestSchema = z.object({
      projectId: z.string().min(1, "Project ID is required"),
      filters: bulkEditFiltersSchema,
      updates: bulkEditFieldsSchema
    });
    parseCommandRequestSchema = z.object({
      projectId: z.string().min(1, "Project ID is required"),
      message: z.string().min(1, "Message is required"),
      selectedForces: z.array(z.string()).optional()
    });
    bulkEditPreviewSchema = z.object({
      affectedForces: z.array(z.object({
        id: z.string(),
        title: z.string(),
        currentValues: z.record(z.any()),
        newValues: z.record(z.any())
      })),
      totalCount: z.number(),
      summary: z.string()
    });
    searchFiltersSchema = searchQuerySchema.omit({
      page: true,
      pageSize: true,
      sort: true,
      sortOrder: true,
      includeFacets: true,
      includeEmbeddings: true
    });
    chatImageSchema = z.object({
      data: z.string(),
      // base64 encoded image data
      type: z.string(),
      // MIME type (image/png, image/jpeg, etc.)
      name: z.string(),
      // Original filename
      size: z.number()
      // File size in bytes
    });
    chatStreamRequestSchema = z.object({
      project_id: z.string().min(1, "Project ID is required"),
      query: z.string().min(1, "Query is required"),
      assistant_type: z.enum(["copilot", "scanning"]).default("copilot"),
      thread_id: z.string().nullable().optional(),
      mode: z.string().optional(),
      images: z.array(chatImageSchema).optional(),
      // Array of images for multimodal requests
      context: z.any().optional()
      // Additional context data
    });
    importStatusResponseSchema = z.object({
      success: z.boolean(),
      data: z.object({
        hasLegacyClusters: z.boolean(),
        legacyClusterCount: z.number(),
        totalForcesInLegacyClusters: z.number()
      })
    });
    importClustersResponseSchema = z.object({
      success: z.boolean(),
      message: z.string(),
      data: z.object({
        clustersCreated: z.number(),
        forcesMapped: z.number()
        // CONSISTENT FIELD NAME: forcesMapped (not forcesMaped)
      }).optional(),
      error: z.string().optional()
    });
    adminErrorResponseSchema = z.object({
      success: z.literal(false),
      error: z.string(),
      hint: z.string().optional()
    });
    apiSuccessResponseSchema = (dataSchema) => z.object({
      success: z.literal(true),
      data: dataSchema,
      message: z.string().optional()
    });
    apiErrorResponseSchema = z.object({
      success: z.literal(false),
      error: z.string(),
      details: z.any().optional()
    });
    createCheckoutSessionRequestSchema = z.object({
      tier: z.enum(["basic", "professional", "enterprise"]),
      successUrl: z.string().url().optional(),
      cancelUrl: z.string().url().optional()
    });
    subscriptionStatusResponseSchema = z.object({
      hasActiveSubscription: z.boolean(),
      tier: z.enum(["basic", "professional", "enterprise"]).nullable(),
      status: z.enum(["active", "canceled", "past_due", "unpaid", "trialing", "incomplete", "incomplete_expired"]).nullable(),
      currentPeriodEnd: z.string().nullable(),
      cancelAtPeriodEnd: z.boolean(),
      trialEndsAt: z.string().nullable()
    });
  }
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
var pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      // Maximum number of clients in the pool
      idleTimeoutMillis: 3e4,
      // Close idle clients after 30 seconds
      connectionTimeoutMillis: 1e4
      // Timeout trying to connect after 10 seconds
    });
    pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
    });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/middleware/auth.ts
var auth_exports = {};
__export(auth_exports, {
  authenticateToken: () => authenticateToken,
  generateToken: () => generateToken,
  optionalAuth: () => optionalAuth
});
import jwt from "jsonwebtoken";
import * as fs2 from "fs";
import * as path4 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
function logToFile(message) {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  const logMessage = `[${timestamp2}] ${message}
`;
  try {
    fs2.appendFileSync(LOG_FILE, logMessage);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1] || req.query.token;
  if (!token) {
    logToFile("[Auth] No token found in header or query");
    console.log("[Auth] No token found in header or query");
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    logToFile(`[Auth] Token verified for user: ${decoded.userId}`);
    next();
  } catch (error) {
    logToFile(`[Auth] JWT verification failed: ${error}`);
    console.error("JWT verification failed:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    console.error("Optional JWT verification failed:", error);
  }
  next();
}
function generateToken(user, expiresIn = "24h") {
  return jwt.sign(user, JWT_SECRET, { expiresIn });
}
var JWT_SECRET, __filename3, __dirname3, LOG_FILE;
var init_auth = __esm({
  "server/middleware/auth.ts"() {
    "use strict";
    JWT_SECRET = process.env.JWT_SECRET || "orion-development-secret-change-in-production";
    __filename3 = fileURLToPath3(import.meta.url);
    __dirname3 = path4.dirname(__filename3);
    LOG_FILE = path4.join(__dirname3, "../debug.log");
  }
});

// server/services/openai.ts
var openai_exports = {};
__export(openai_exports, {
  OpenAIService: () => OpenAIService,
  openaiService: () => openaiService
});
import OpenAI from "openai";
function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR;
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}
var openai, OpenAIService, openaiService;
var init_openai = __esm({
  "server/services/openai.ts"() {
    "use strict";
    openai = null;
    OpenAIService = class {
      getAssistantId(assistantType) {
        return assistantType === "copilot" ? process.env.ORION_COPILOT_ASSISTANT_ID : process.env.ORION_SCANNING_ASSISTANT_ID;
      }
      async getImageContent(fileId) {
        try {
          const client = getOpenAIClient();
          const response = await client.files.content(fileId);
          return await response.arrayBuffer();
        } catch (error) {
          console.error(`[OpenAI Service] Failed to retrieve image content for file ${fileId}:`, error);
          return null;
        }
      }
      async streamAssistantResponse(query, context, assistantType = "copilot", threadId = null, onChunk, onComplete, onError, images, abortSignal) {
        try {
          const assistantId = this.getAssistantId(assistantType);
          if (!assistantId) {
            throw new Error(`Missing assistant ID for type: ${assistantType}`);
          }
          const client = getOpenAIClient();
          let thread;
          if (threadId) {
            try {
              thread = await client.beta.threads.retrieve(threadId);
            } catch {
              thread = await client.beta.threads.create();
            }
          } else {
            thread = await client.beta.threads.create();
          }
          let fullMessage = query;
          if (context && Object.keys(context).length > 0) {
            fullMessage = `${query}

Context:
- Total forces: ${context.forcesCount || 0}
- Active clusters: ${context.clustersCount || 0}`;
            if (context.recentForces?.length) {
              fullMessage += `
- Recent forces: ${context.recentForces.slice(0, 3).map((f) => f.title).join(", ")}`;
            }
            if (context.selectedForces?.length > 0) {
              console.log(
                `[OpenAI Service] Including ${context.selectedForces.length} selected forces in context:`,
                context.selectedForces.slice(0, 3).map((f) => f.title || "Untitled")
              );
              fullMessage = `\u{1F3AF} **USER HAS SELECTED ${context.selectedForces.length} SPECIFIC DRIVING FORCES FOR ANALYSIS:**

${context.selectedForces.map((force, index2) => {
                let forceInfo = `${index2 + 1}. **${force.title || "Untitled Force"}**`;
                if (force.type) forceInfo += ` (Type: ${force.type})`;
                if (force.dimension) forceInfo += ` [${force.dimension}]`;
                if (force.scope) forceInfo += ` - Scope: ${force.scope}`;
                if (force.impact) forceInfo += ` - Impact: ${force.impact}`;
                return forceInfo;
              }).join("\n")}

\u{1F525} **CRITICAL INSTRUCTION:** The user has SPECIFICALLY SELECTED these ${context.selectedForces.length} forces. Always refer to these when discussing "selected forces" or "my selected forces". DO NOT refer to the general database - only these specific forces above.

---

**USER'S QUESTION:** ${query}

**Additional Context:**
- Total forces in database: ${context.forcesCount || 0}
- Active clusters: ${context.clustersCount || 0}`;
              if (context.recentForces?.length) {
                fullMessage += `
- Recent forces: ${context.recentForces.slice(0, 3).map((f) => f.title).join(", ")}`;
              }
            } else {
              console.log(`[OpenAI Service] No selected forces provided in context`);
            }
          }
          let messageContent;
          if (images && images.length > 0) {
            messageContent = [
              {
                type: "text",
                text: fullMessage
              }
            ];
            for (const image of images) {
              messageContent.push({
                type: "image_url",
                image_url: `data:${image.type};base64,${image.data}`
              });
            }
          } else {
            messageContent = fullMessage;
          }
          await client.beta.threads.messages.create(thread.id, {
            role: "user",
            content: messageContent
          });
          const stream = await client.beta.threads.runs.stream(thread.id, {
            assistant_id: assistantId
          });
          for await (const event of stream) {
            if (abortSignal?.aborted) {
              console.log("[OpenAI Service] Client disconnected, aborting stream");
              return;
            }
            if (event.event === "thread.message.delta") {
              const delta = event.data.delta;
              if (delta.content) {
                for (const content of delta.content) {
                  if (content.type === "text" && content.text?.value) {
                    onChunk(content.text.value);
                  } else if (content.type === "image_file" && content.image_file?.file_id) {
                    try {
                      const fileId = content.image_file.file_id;
                      if (fileId) {
                        console.log(`[OpenAI] Detected image_file with ID: ${fileId}`);
                        const imageMarkdown = `

![Generated Image](/api/v1/chat/image/${fileId})

`;
                        onChunk(imageMarkdown);
                      }
                    } catch (fileError) {
                      console.error("[OpenAI Service] Error retrieving generated image:", fileError);
                      onChunk("\n\n*[Error generating image]*\n\n");
                    }
                  }
                }
              }
            } else if (event.event === "thread.run.completed") {
              onComplete(thread.id);
              return;
            } else if (event.event === "thread.run.failed") {
              throw new Error(event.data.last_error?.message || "Assistant run failed");
            }
          }
          onComplete(thread.id);
        } catch (error) {
          console.error("OpenAI Assistant streaming error:", error);
          onError("I apologize, but I encountered an error processing your request. Please try again.");
        }
      }
      // Legacy method for backward compatibility - now uses Assistant API
      async streamResponse(query, context, mode, onChunk, onComplete) {
        await this.streamAssistantResponse(
          query,
          context,
          "copilot",
          null,
          onChunk,
          () => onComplete(),
          (error) => {
            onChunk(error);
            onComplete();
          }
        );
      }
      // This method is no longer needed as prompts are handled by the Assistant API
      // The system prompts are now configured in the OpenAI Assistant settings
      buildSystemPrompt(context, mode) {
        const basePrompt = `You are ORION, an AI strategic intelligence analyst specializing in futures research and scenario planning. You help analyze driving forces, trends, and strategic implications.

Current project context:
- Total driving forces: ${context.forcesCount}
- Active clusters: ${context.clustersCount}
- Recent forces: ${context.recentForces?.map((f) => `${f.title} (${f.steep}, Impact: ${f.impact})`).join(", ")}
- Key clusters: ${context.clusters?.map((c) => c.label).join(", ")}

Guidelines:
- Provide strategic insights based on the data
- Focus on implications and scenarios
- Be concise but analytical
- Highlight patterns and connections
- Suggest actionable next steps when appropriate`;
        switch (mode) {
          case "summarize":
            return basePrompt + "\n\nFocus on summarizing key insights and patterns from the provided cluster or data set.";
          case "labels":
            return basePrompt + "\n\nFocus on suggesting meaningful labels and categorizations for the driving forces or clusters.";
          case "risks":
            return basePrompt + "\n\nFocus on identifying uncertainties, risks, and potential disruptions from the strategic intelligence.";
          default:
            return basePrompt + "\n\nProvide comprehensive strategic analysis and answer the user's specific question.";
        }
      }
      async generateClusterLabels(forces) {
        try {
          const client = getOpenAIClient();
          const forceTitles = forces.map((f) => f.title).slice(0, 20).join(", ");
          const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [{
              role: "system",
              content: "You are an expert in strategic foresight. Generate 3-5 concise, meaningful labels for this cluster of driving forces. Return only the labels as a JSON array."
            }, {
              role: "user",
              content: `Generate cluster labels for these driving forces: ${forceTitles}`
            }],
            response_format: { type: "json_object" },
            temperature: 1
          });
          const result = JSON.parse(response.choices[0].message.content || "{}");
          return result.labels || [`Cluster ${Date.now()}`];
        } catch (error) {
          console.error("Label generation error:", error);
          return [`Cluster ${Date.now()}`];
        }
      }
      async analyzeSentiment(text2) {
        try {
          const client = getOpenAIClient();
          const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are a sentiment analysis expert. Analyze the sentiment of the text and provide a rating from 1 to 5 stars, confidence score between 0 and 1, and sentiment label (Positive/Negative/Neutral). Respond with JSON in this format: { 'rating': number, 'confidence': number, 'sentiment': string }"
              },
              {
                role: "user",
                content: text2
              }
            ],
            response_format: { type: "json_object" },
            temperature: 1
          });
          const result = JSON.parse(response.choices[0].message.content || "{}");
          return {
            rating: Math.max(1, Math.min(5, Math.round(result.rating || 3))),
            confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
            sentiment: result.sentiment || "Neutral"
          };
        } catch (error) {
          console.error("Sentiment analysis error:", error);
          return {
            rating: 3,
            confidence: 0.5,
            sentiment: "Neutral"
          };
        }
      }
      async generateEmbedding(text2, model = "text-embedding-3-large") {
        try {
          const client = getOpenAIClient();
          const response = await client.embeddings.create({
            model,
            input: text2.replace(/\n/g, " ").trim(),
            encoding_format: "float"
          });
          return response.data[0].embedding;
        } catch (error) {
          console.error("OpenAI embedding error:", error);
          throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      async generateEmbeddingsBatch(texts, model = "text-embedding-3-large", batchSize = 100) {
        const results = [];
        for (let i = 0; i < texts.length; i += batchSize) {
          const batch = texts.slice(i, i + batchSize);
          const cleanedBatch = batch.map((text2) => text2.replace(/\n/g, " ").trim());
          try {
            const client = getOpenAIClient();
            const response = await client.embeddings.create({
              model,
              input: cleanedBatch,
              encoding_format: "float"
            });
            const embeddings = response.data.map((item) => item.embedding);
            results.push(...embeddings);
            if (i + batchSize < texts.length) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.error(`OpenAI batch embedding error for batch ${i}:`, error);
            for (const text2 of cleanedBatch) {
              try {
                const embedding = await this.generateEmbedding(text2, model);
                results.push(embedding);
              } catch (individualError) {
                console.error(`Failed to generate embedding for text: ${text2.substring(0, 100)}...`, individualError);
                results.push(new Array(model === "text-embedding-3-large" ? 3072 : 1536).fill(0));
              }
            }
          }
        }
        return results;
      }
      async generateEmbeddingForForce(force, model = "text-embedding-3-large") {
        const combinedText = `${force.title}

${force.text}`;
        return this.generateEmbedding(combinedText, model);
      }
      async calculateCosineSimilarity(embedding1, embedding2) {
        if (embedding1.length !== embedding2.length) {
          throw new Error("Embeddings must have the same dimension");
        }
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        for (let i = 0; i < embedding1.length; i++) {
          dotProduct += embedding1[i] * embedding2[i];
          norm1 += embedding1[i] * embedding1[i];
          norm2 += embedding2[i] * embedding2[i];
        }
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
      }
    };
    openaiService = new OpenAIService();
  }
});

// server/services/userProjectState.ts
var userProjectState_exports = {};
__export(userProjectState_exports, {
  UserProjectStateService: () => UserProjectStateService,
  userProjectStateService: () => userProjectStateService
});
import { sql as sql3 } from "drizzle-orm";
var UserProjectStateService, userProjectStateService;
var init_userProjectState = __esm({
  "server/services/userProjectState.ts"() {
    "use strict";
    init_db();
    UserProjectStateService = class {
      /**
       * Get user's state for a specific project
       */
      async getUserProjectState(userId, projectId) {
        try {
          const result = await db.execute(sql3`
        SELECT * FROM user_project_state
        WHERE user_id = ${userId} AND project_id = ${projectId}
        LIMIT 1
      `);
          if (result.rows.length === 0) {
            return null;
          }
          const row = result.rows[0];
          return {
            id: row.id,
            userId: row.user_id,
            projectId: row.project_id,
            selectedForces: row.selected_forces || [],
            searchedForces: row.searched_forces || [],
            scanningFilters: row.scanning_filters || {},
            committedRadarFilters: row.committed_radar_filters || {},
            copilotThreadId: row.copilot_thread_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        } catch (error) {
          console.error("[UserProjectStateService] Error getting user project state:", error);
          throw error;
        }
      }
      /**
       * Save or update user's state for a specific project
       */
      async saveUserProjectState(userId, projectId, state) {
        try {
          const result = await db.execute(sql3`
        INSERT INTO user_project_state (
          user_id,
          project_id,
          selected_forces,
          searched_forces,
          scanning_filters,
          committed_radar_filters,
          copilot_thread_id
        )
        VALUES (
          ${userId},
          ${projectId},
          ${JSON.stringify(state.selectedForces || [])}::jsonb,
          ${JSON.stringify(state.searchedForces || [])}::jsonb,
          ${JSON.stringify(state.scanningFilters || {})}::jsonb,
          ${JSON.stringify(state.committedRadarFilters || {})}::jsonb,
          ${state.copilotThreadId || null}
        )
        ON CONFLICT (user_id, project_id)
        DO UPDATE SET
          selected_forces = EXCLUDED.selected_forces,
          searched_forces = EXCLUDED.searched_forces,
          scanning_filters = EXCLUDED.scanning_filters,
          committed_radar_filters = EXCLUDED.committed_radar_filters,
          copilot_thread_id = EXCLUDED.copilot_thread_id,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `);
          const row = result.rows[0];
          return {
            id: row.id,
            userId: row.user_id,
            projectId: row.project_id,
            selectedForces: row.selected_forces || [],
            searchedForces: row.searched_forces || [],
            scanningFilters: row.scanning_filters || {},
            committedRadarFilters: row.committed_radar_filters || {},
            copilotThreadId: row.copilot_thread_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          };
        } catch (error) {
          console.error("[UserProjectStateService] Error saving user project state:", error);
          throw error;
        }
      }
      /**
       * Delete user's state for a specific project
       */
      async deleteUserProjectState(userId, projectId) {
        try {
          const result = await db.execute(sql3`
        DELETE FROM user_project_state
        WHERE user_id = ${userId} AND project_id = ${projectId}
      `);
          return (result.rowCount || 0) > 0;
        } catch (error) {
          console.error("[UserProjectStateService] Error deleting user project state:", error);
          throw error;
        }
      }
      /**
       * Get all project states for a user
       */
      async getAllUserProjectStates(userId) {
        try {
          const result = await db.execute(sql3`
        SELECT * FROM user_project_state
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `);
          return result.rows.map((row) => ({
            id: row.id,
            userId: row.user_id,
            projectId: row.project_id,
            selectedForces: row.selected_forces || [],
            searchedForces: row.searched_forces || [],
            scanningFilters: row.scanning_filters || {},
            committedRadarFilters: row.committed_radar_filters || {},
            copilotThreadId: row.copilot_thread_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          }));
        } catch (error) {
          console.error("[UserProjectStateService] Error getting all user project states:", error);
          throw error;
        }
      }
    };
    userProjectStateService = new UserProjectStateService();
  }
});

// server/env.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true
});
console.log("[ENV] Environment variables loaded with override.");

// server/index.ts
import express2 from "express";
import multer from "multer";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
init_schema();
init_db();
import { eq, and, desc, asc, sql as sql2, ne, or, ilike, between, inArray, count, gte, lte } from "drizzle-orm";
var DatabaseStorage = class {
  // Helper method to convert null values to undefined for compatibility with TypeScript types
  convertNullToUndefined(obj) {
    const result = { ...obj };
    for (const key in result) {
      if (result[key] === null) {
        result[key] = void 0;
      }
    }
    return result;
  }
  // User operations (MANDATORY for Replit Auth)
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // User onboarding
  async ensureUserDefaultProject(userId) {
    const [existingDefault] = await db.select().from(projects).where(and(eq(projects.userId, userId), eq(projects.isDefault, true))).limit(1);
    if (existingDefault) {
      return existingDefault;
    }
    const [defaultProject] = await db.insert(projects).values({
      userId,
      name: "My ORION Project",
      description: "Your personal strategic intelligence workspace - select forces from the ORION Global Dataset",
      isDefault: true
    }).returning();
    return defaultProject;
  }
  // Helper method to populate a project with forces based on subscription tier
  async populateProjectWithTierForces(projectId, tier) {
    const mainDefaultProject = await this.ensureDefaultProject();
    let forceTypeFilter;
    if (tier === "basic") {
      forceTypeFilter = ["M", "T", "WS", "WC"];
    } else {
      forceTypeFilter = ["M", "T", "WS", "WC", "S"];
    }
    const forcesToCopy = await db.select().from(drivingForces).where(and(
      eq(drivingForces.projectId, mainDefaultProject.id),
      inArray(drivingForces.type, forceTypeFilter)
    ));
    if (forcesToCopy.length > 0) {
      const newForces = forcesToCopy.map((force) => ({
        ...force,
        id: void 0,
        // Let database generate new ID
        projectId,
        clusterId: void 0,
        // Clear cluster assignments for new project
        clusterLabel: void 0,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }));
      const batchSize = 150;
      const totalBatches = Math.ceil(newForces.length / batchSize);
      console.log(`[populateProjectWithTierForces] Populating project ${projectId} with ${newForces.length} ${tier} tier forces in ${totalBatches} batches`);
      for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, newForces.length);
        const batch = newForces.slice(startIndex, endIndex);
        await db.insert(drivingForces).values(batch);
      }
      console.log(`[populateProjectWithTierForces] Successfully populated project ${projectId} with ${newForces.length} forces for ${tier} tier`);
    }
  }
  // Projects
  async ensureDefaultProject() {
    console.log("[ensureDefaultProject] Starting default project validation...");
    const [totalForceCount] = await db.select({ count: sql2`count(*)` }).from(drivingForces);
    const totalForces = totalForceCount?.count || 0;
    console.log(`[ensureDefaultProject] Total forces in database: ${totalForces}`);
    const defaultProjects = await db.select().from(projects).where(eq(projects.isDefault, true)).orderBy(desc(projects.createdAt));
    if (defaultProjects.length === 0) {
      console.log("[ensureDefaultProject] No default project found, creating one...");
      const [defaultProject] = await db.insert(projects).values({
        name: "New Project",
        description: "Default project containing all ORION strategic intelligence forces",
        isDefault: true
      }).returning();
      const result = await db.update(drivingForces).set({ projectId: defaultProject.id, updatedAt: /* @__PURE__ */ new Date() }).where(sql2`project_id IS NULL`);
      const movedCount = result.rowCount || 0;
      console.log(`[ensureDefaultProject] Moved ${movedCount} forces to new default project`);
      const [assignedCount] = await db.select({ count: sql2`count(*)` }).from(drivingForces).where(eq(drivingForces.projectId, defaultProject.id));
      const assignedForces = assignedCount?.count || 0;
      console.log(`[ensureDefaultProject] Default project now contains ${assignedForces}/${totalForces} forces`);
      if (assignedForces !== totalForces) {
        console.warn(`[ensureDefaultProject] WARNING: Force count mismatch! Expected ${totalForces}, got ${assignedForces}`);
      }
      console.log(`[ensureDefaultProject] Created default project: ${defaultProject.id}`);
      return defaultProject;
    }
    if (defaultProjects.length === 1) {
      const defaultProject = defaultProjects[0];
      console.log(`[ensureDefaultProject] Found exactly one default project: ${defaultProject.id}`);
      const [assignedCount] = await db.select({ count: sql2`count(*)` }).from(drivingForces).where(eq(drivingForces.projectId, defaultProject.id));
      const assignedForces = assignedCount?.count || 0;
      console.log(`[ensureDefaultProject] Default project contains ${assignedForces}/${totalForces} forces`);
      if (assignedForces < totalForces) {
        console.log(`[ensureDefaultProject] Fixing orphaned forces - assigning to default project`);
        const result = await db.update(drivingForces).set({ projectId: defaultProject.id, updatedAt: /* @__PURE__ */ new Date() }).where(sql2`project_id IS NULL`);
        const movedCount = result.rowCount || 0;
        console.log(`[ensureDefaultProject] Moved ${movedCount} orphaned forces to default project`);
        const [newAssignedCount] = await db.select({ count: sql2`count(*)` }).from(drivingForces).where(eq(drivingForces.projectId, defaultProject.id));
        const newAssignedForces = newAssignedCount?.count || 0;
        console.log(`[ensureDefaultProject] Default project now contains ${newAssignedForces}/${totalForces} forces`);
      }
      return defaultProject;
    }
    console.log(`[ensureDefaultProject] Found ${defaultProjects.length} default projects, consolidating...`);
    const [newestDefault, ...oldDefaults] = defaultProjects;
    const oldDefaultIds = oldDefaults.map((p) => p.id);
    console.log(`[ensureDefaultProject] Keeping newest default: ${newestDefault.id}`);
    console.log(`[ensureDefaultProject] Migrating forces from old defaults: ${oldDefaultIds.join(", ")}`);
    const migrationResult = await db.update(drivingForces).set({ projectId: newestDefault.id, updatedAt: /* @__PURE__ */ new Date() }).where(inArray(drivingForces.projectId, oldDefaultIds));
    const migratedCount = migrationResult.rowCount || 0;
    console.log(`[ensureDefaultProject] Migrated ${migratedCount} forces from old defaults`);
    const orphanResult = await db.update(drivingForces).set({ projectId: newestDefault.id, updatedAt: /* @__PURE__ */ new Date() }).where(sql2`project_id IS NULL`);
    const orphanCount = orphanResult.rowCount || 0;
    if (orphanCount > 0) {
      console.log(`[ensureDefaultProject] Also moved ${orphanCount} orphaned forces to default`);
    }
    await db.update(projects).set({ isDefault: false, updatedAt: /* @__PURE__ */ new Date() }).where(inArray(projects.id, oldDefaultIds));
    console.log(`[ensureDefaultProject] Set ${oldDefaults.length} old defaults to non-default`);
    const [finalCount] = await db.select({ count: sql2`count(*)` }).from(drivingForces).where(eq(drivingForces.projectId, newestDefault.id));
    const finalForces = finalCount?.count || 0;
    console.log(`[ensureDefaultProject] Final verification: default project contains ${finalForces}/${totalForces} forces`);
    if (finalForces !== totalForces) {
      console.error(`[ensureDefaultProject] CRITICAL: Force count mismatch after consolidation! Expected ${totalForces}, got ${finalForces}`);
    }
    return newestDefault;
  }
  async getProject(id, userId) {
    if (userId) {
      const [project2] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
      return project2 || void 0;
    }
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || void 0;
  }
  async getProjects(userId) {
    if (userId) {
      const userProjects = await db.select().from(projects).where(
        or(
          eq(projects.userId, userId),
          eq(projects.isDefault, true)
        )
      ).orderBy(desc(projects.isDefault), desc(projects.createdAt));
      return userProjects;
    }
    return await db.select().from(projects).orderBy(desc(projects.isDefault), desc(projects.createdAt));
  }
  async getProjectsByUser(userId) {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.isDefault), desc(projects.createdAt));
  }
  /**
   * Initialize a project with driving forces based on its type
   * Must be called within a transaction
   * DISABLED: Force copying removed to prevent database duplication
   * All projects now start empty - users select forces manually
   */
  async initializeProjectByType(tx, projectId, projectType) {
    console.log(`[initializeProjectByType] Project ${projectId} initialized as ${projectType} (empty - no force duplication)`);
    return 0;
  }
  async createProject(project) {
    const { isDefault, ...projectData } = project;
    if (!projectData.userId) {
      throw new Error("userId is required to create a project");
    }
    try {
      const result = await db.transaction(async (tx) => {
        console.log(`[createProject] Starting transaction for project: ${projectData.name} (user: ${projectData.userId})`);
        const existingProjects = await tx.select().from(projects).where(and(
          sql2`LOWER(name) = LOWER(${projectData.name})`,
          eq(projects.userId, projectData.userId)
        ));
        if (existingProjects.length > 0) {
          throw new Error("DUPLICATE_NAME");
        }
        const [created] = await tx.insert(projects).values({
          ...projectData,
          isDefault: false
        }).returning();
        if (!created) {
          throw new Error("Failed to create project");
        }
        console.log(`[createProject] Project created in DB: ${created.id} - ${created.name} (user: ${created.userId})`);
        const forcesCount = await this.initializeProjectByType(tx, created.id, projectData.projectType || "new_project");
        console.log(`[createProject] Transaction completed successfully: ${created.id} - ${created.name} (type: ${projectData.projectType || "new_project"}) with ${forcesCount} forces`);
        return { project: created, forcesCount };
      });
      return result.project;
    } catch (error) {
      console.error(`[createProject] Transaction failed for project "${projectData.name}":`, error.message);
      if (error.message === "DUPLICATE_NAME") {
        throw error;
      }
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }
  async updateProject(id, userId, project) {
    const { isDefault, ...projectData } = project;
    const [existingProject] = await db.select().from(projects).where(eq(projects.id, id));
    if (!existingProject) {
      throw new Error("Project not found");
    }
    if (existingProject.userId !== userId) {
      throw new Error(`User ${userId} does not have permission to update project ${id}`);
    }
    if (projectData.name) {
      const existingProjects = await db.select().from(projects).where(and(
        sql2`LOWER(name) = LOWER(${projectData.name})`,
        ne(projects.id, id)
        // Exclude the current project
      ));
      if (existingProjects.length > 0) {
        throw new Error("DUPLICATE_NAME");
      }
    }
    const [updated] = await db.update(projects).set({ ...projectData, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(projects.id, id), eq(projects.userId, userId))).returning();
    if (!updated) {
      throw new Error("Project not found");
    }
    return updated;
  }
  async deleteProject(id, userId) {
    try {
      const [project] = await db.select().from(projects).where(eq(projects.id, id));
      if (!project) {
        return false;
      }
      if (project.userId !== userId) {
        throw new Error(`User ${userId} does not have permission to delete project ${id}`);
      }
      if (project.isDefault) {
        throw new Error("Cannot delete default project");
      }
      console.log(`[deleteProject] Starting cascade deletion for project: ${id} - ${project.name} (user: ${userId})`);
      const savedSearchesResult = await db.delete(savedSearches).where(eq(savedSearches.projectId, id));
      console.log(`[deleteProject] Deleted ${savedSearchesResult.rowCount || 0} saved searches`);
      const reportsResult = await db.delete(reports).where(eq(reports.projectId, id));
      console.log(`[deleteProject] Deleted ${reportsResult.rowCount || 0} reports`);
      const workspacesResult = await db.delete(workspaces).where(eq(workspaces.projectId, id));
      console.log(`[deleteProject] Deleted ${workspacesResult.rowCount || 0} workspaces`);
      const clusteringReportsResult = await db.delete(clusteringReports).where(eq(clusteringReports.projectId, id));
      console.log(`[deleteProject] Deleted ${clusteringReportsResult.rowCount || 0} clustering reports`);
      const clustersResult = await db.delete(clusters).where(eq(clusters.projectId, id));
      console.log(`[deleteProject] Deleted ${clustersResult.rowCount || 0} clusters`);
      const drivingForcesResult = await db.delete(drivingForces).where(eq(drivingForces.projectId, id));
      console.log(`[deleteProject] Deleted ${drivingForcesResult.rowCount || 0} driving forces`);
      const projectResult = await db.delete(projects).where(eq(projects.id, id));
      console.log(`[deleteProject] Deleted project: ${project.name}`);
      return projectResult.rowCount > 0;
    } catch (error) {
      if (error.message === "Cannot delete default project") {
        throw error;
      }
      console.error(`[deleteProject] Unexpected error deleting project ${id}:`, error);
      throw new Error("Failed to delete project due to database constraints");
    }
  }
  async duplicateProject(id, newName, userId, selectedForceIds) {
    const [originalProject] = await db.select().from(projects).where(eq(projects.id, id));
    if (!originalProject) {
      throw new Error("Project not found");
    }
    if (originalProject.userId !== userId) {
      throw new Error(`User ${userId} does not have permission to duplicate project ${id}`);
    }
    if (originalProject.isDefault && (!selectedForceIds || selectedForceIds.length === 0)) {
      throw new Error("FULL_COPY_FROM_DEFAULT_FORBIDDEN");
    }
    const existingProjects = await db.select().from(projects).where(sql2`LOWER(name) = LOWER(${newName})`);
    if (existingProjects.length > 0) {
      throw new Error("DUPLICATE_NAME");
    }
    const [newProject] = await db.insert(projects).values({
      userId,
      name: newName,
      description: originalProject.description || "",
      isDefault: false
      // Duplicated projects are never default
    }).returning();
    let forcesToCopy;
    if (selectedForceIds && selectedForceIds.length > 0) {
      console.log(`Duplicating project with ${selectedForceIds.length} selected forces`);
      const existingForces = await db.select().from(drivingForces).where(and(
        eq(drivingForces.projectId, id),
        inArray(drivingForces.id, selectedForceIds)
      ));
      if (existingForces.length !== selectedForceIds.length) {
        const foundIds = existingForces.map((f) => f.id);
        const missingIds = selectedForceIds.filter((id2) => !foundIds.includes(id2));
        throw new Error(`Some selected forces not found in project: ${missingIds.join(", ")}`);
      }
      forcesToCopy = existingForces;
      console.log("Skipping cluster copying for selective duplication");
    } else {
      console.log("Duplicating entire project (all forces)");
      forcesToCopy = await db.select().from(drivingForces).where(eq(drivingForces.projectId, id));
      const originalClusters = await db.select().from(clusters).where(eq(clusters.projectId, id));
      if (originalClusters.length > 0) {
        const newClusters = originalClusters.map((cluster) => ({
          ...cluster,
          id: void 0,
          // Let database generate new ID
          projectId: newProject.id,
          createdAt: /* @__PURE__ */ new Date()
        }));
        await db.insert(clusters).values(newClusters);
        console.log(`Copied ${originalClusters.length} clusters`);
      }
    }
    if (forcesToCopy.length > 0) {
      const newForces = forcesToCopy.map((force) => ({
        ...force,
        id: void 0,
        // Let database generate new ID
        projectId: newProject.id,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }));
      const batchSize = 150;
      const totalBatches = Math.ceil(newForces.length / batchSize);
      let insertedCount = 0;
      console.log(`Inserting ${newForces.length} forces in ${totalBatches} batches of ${batchSize}`);
      for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, newForces.length);
        const batch = newForces.slice(startIndex, endIndex);
        try {
          await db.insert(drivingForces).values(batch);
          insertedCount += batch.length;
          console.log(`Batch ${i + 1}/${totalBatches}: Inserted ${batch.length} forces (${insertedCount}/${newForces.length} total)`);
        } catch (error) {
          console.error(`Failed to insert batch ${i + 1}/${totalBatches}:`, error.message);
          throw new Error(`Failed to insert driving forces batch ${i + 1}: ${error.message}`);
        }
      }
      console.log(`Copied ${insertedCount} driving forces`);
    } else {
      console.log("No forces to copy");
    }
    return newProject;
  }
  // Driving Forces
  async getDrivingForce(id) {
    const [force] = await db.select().from(drivingForces).where(eq(drivingForces.id, id));
    if (!force) return void 0;
    return this.convertNullToUndefined(force);
  }
  async getDrivingForces(projectId, lens, filters, options = {}, userId) {
    const { limit = 1e4, offset = 0, includeEmbeddings = false, includeSignals = false, forceTypeRestrictions = null } = options;
    if (userId && projectId) {
      const project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
      if (!project || project.length === 0) {
        throw new Error("Project not found or access denied");
      }
    }
    let effectiveProjectId = projectId;
    if (projectId) {
      const [projectForceCount] = await db.select({ count: sql2`count(*)` }).from(drivingForces).where(eq(drivingForces.projectId, projectId));
      const forceCount = Number(projectForceCount?.count || 0);
      console.log(`[getDrivingForces] Project ${projectId} has ${forceCount} forces`);
      if (forceCount === 0) {
        const defaultProject = await this.ensureDefaultProject();
        effectiveProjectId = defaultProject.id;
        console.log(`[getDrivingForces] Project is empty - falling back to global default project ${effectiveProjectId}`);
      }
    }
    const conditions = [];
    if (effectiveProjectId) {
      conditions.push(eq(drivingForces.projectId, effectiveProjectId));
    }
    const searchTerm = filters?.search || filters?.q || filters?.searchTerm;
    if (searchTerm) {
      console.log(`[getDrivingForces] Applying search filter: "${searchTerm}"`);
      const searchCondition = or(
        ilike(drivingForces.title, `%${searchTerm}%`),
        ilike(drivingForces.text, `%${searchTerm}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    if (filters?.steep) {
      if (Array.isArray(filters.steep) && filters.steep.length > 0) {
        conditions.push(inArray(drivingForces.steep, filters.steep));
      } else if (typeof filters.steep === "string") {
        conditions.push(eq(drivingForces.steep, filters.steep));
      }
    }
    if (filters?.type) {
      conditions.push(eq(drivingForces.type, filters.type));
    } else if (filters?.types && filters.types.length > 0) {
      conditions.push(inArray(drivingForces.type, filters.types));
    }
    if (filters?.sentiments && filters.sentiments.length > 0) {
      conditions.push(inArray(drivingForces.sentiment, filters.sentiments));
    }
    if (filters?.impactMin !== void 0 && filters.impactMax !== void 0) {
      conditions.push(between(drivingForces.impact, filters.impactMin, filters.impactMax));
    } else if (filters?.impactMin !== void 0) {
      conditions.push(gte(drivingForces.impact, filters.impactMin));
    } else if (filters?.impactMax !== void 0) {
      conditions.push(lte(drivingForces.impact, filters.impactMax));
    }
    if (filters?.horizons && filters.horizons.length > 0) {
      conditions.push(inArray(drivingForces.ttm, filters.horizons));
    }
    if (filters?.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(
        (tag) => sql2`${drivingForces.tags} @> ARRAY[${tag}]::text[]`
      );
      conditions.push(or(...tagConditions));
    }
    if (filters?.dimensions && filters.dimensions.length > 0) {
      conditions.push(inArray(drivingForces.dimension, filters.dimensions));
    }
    if (lens) {
      if (lens === "megatrends") {
        conditions.push(eq(drivingForces.type, "M"));
      } else if (lens === "trends") {
        conditions.push(eq(drivingForces.type, "T"));
      } else if (lens === "weak_signals") {
        conditions.push(eq(drivingForces.type, "WS"));
      } else if (lens === "wildcards") {
        conditions.push(eq(drivingForces.type, "WC"));
      }
    }
    if (forceTypeRestrictions && forceTypeRestrictions.length > 0) {
      console.log(`[getDrivingForces] Applying tier restrictions:`, forceTypeRestrictions);
      conditions.push(inArray(drivingForces.type, forceTypeRestrictions));
    } else if (!includeSignals) {
      console.log(`[getDrivingForces] Excluding signals (type 'S')`);
      conditions.push(ne(drivingForces.type, "S"));
    } else {
      console.log(`[getDrivingForces] Including all types including signals`);
    }
    console.log(`[getDrivingForces] Using effectiveProjectId: ${effectiveProjectId}, conditions count: ${conditions.length}`);
    const whereCondition = conditions.length > 0 ? and(...conditions) : void 0;
    if (includeEmbeddings) {
      const baseQuery = db.select().from(drivingForces);
      const baseCountQuery = db.select({ count: sql2`count(*)` }).from(drivingForces);
      const [forces, totalResult] = await Promise.all([
        whereCondition ? baseQuery.where(whereCondition).orderBy(desc(drivingForces.createdAt)).limit(limit).offset(offset) : baseQuery.orderBy(desc(drivingForces.createdAt)).limit(limit).offset(offset),
        whereCondition ? baseCountQuery.where(whereCondition) : baseCountQuery
      ]);
      const total = totalResult[0]?.count || 0;
      const convertedForces = forces.map((force) => this.convertNullToUndefined(force));
      const forcesWithClusters = await this.attachClusterInfoToForces(convertedForces, projectId);
      return { forces: forcesWithClusters, total };
    } else {
      const selectFields = {
        id: drivingForces.id,
        projectId: drivingForces.projectId,
        title: drivingForces.title,
        type: drivingForces.type,
        steep: drivingForces.steep,
        dimension: drivingForces.dimension,
        scope: drivingForces.scope,
        impact: drivingForces.impact,
        ttm: drivingForces.ttm,
        sentiment: drivingForces.sentiment,
        source: drivingForces.source,
        tags: drivingForces.tags,
        text: drivingForces.text,
        embeddingModel: drivingForces.embeddingModel,
        // Radar visualization fields
        magnitude: drivingForces.magnitude,
        distance: drivingForces.distance,
        colorHex: drivingForces.colorHex,
        feasibility: drivingForces.feasibility,
        urgency: drivingForces.urgency,
        createdAt: drivingForces.createdAt,
        updatedAt: drivingForces.updatedAt
      };
      const baseQuery = db.select(selectFields).from(drivingForces);
      const baseCountQuery = db.select({ count: sql2`count(*)` }).from(drivingForces);
      const [forces, totalResult] = await Promise.all([
        whereCondition ? baseQuery.where(whereCondition).orderBy(desc(drivingForces.createdAt)).limit(limit).offset(offset) : baseQuery.orderBy(desc(drivingForces.createdAt)).limit(limit).offset(offset),
        whereCondition ? baseCountQuery.where(whereCondition) : baseCountQuery
      ]);
      const total = totalResult[0]?.count || 0;
      const convertedForces = forces.map((force) => this.convertNullToUndefined(force));
      const forcesWithClusters = await this.attachClusterInfoToForces(convertedForces, projectId);
      return { forces: forcesWithClusters, total };
    }
  }
  // Helper method to attach cluster information to driving forces
  async attachClusterInfoToForces(forces, projectId) {
    if (!projectId || forces.length === 0) {
      return forces;
    }
    try {
      const projectClusters = await this.getClusters(projectId);
      const forceToClusterMap = /* @__PURE__ */ new Map();
      for (const cluster of projectClusters) {
        if (cluster.forceIds && Array.isArray(cluster.forceIds)) {
          for (const forceId of cluster.forceIds) {
            forceToClusterMap.set(forceId, {
              clusterId: cluster.id,
              clusterLabel: cluster.label
            });
          }
        }
      }
      return forces.map((force) => {
        const clusterInfo = forceToClusterMap.get(force.id);
        return {
          ...force,
          clusterId: clusterInfo?.clusterId,
          clusterLabel: clusterInfo?.clusterLabel
        };
      });
    } catch (error) {
      console.error("Error attaching cluster info to forces:", error);
      return forces;
    }
  }
  async createDrivingForce(force) {
    const [created] = await db.insert(drivingForces).values(force).returning();
    return this.convertNullToUndefined(created);
  }
  async createDrivingForces(forces) {
    if (forces.length === 0) {
      return [];
    }
    if (forces.length <= 150) {
      const created = await db.insert(drivingForces).values(forces).returning();
      return created.map((force) => this.convertNullToUndefined(force));
    }
    const batchSize = 150;
    const totalBatches = Math.ceil(forces.length / batchSize);
    const allCreated = [];
    console.log(`Creating ${forces.length} forces in ${totalBatches} batches of ${batchSize}`);
    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, forces.length);
      const batch = forces.slice(startIndex, endIndex);
      try {
        const batchCreated = await db.insert(drivingForces).values(batch).returning();
        allCreated.push(...batchCreated.map((force) => this.convertNullToUndefined(force)));
        console.log(`Batch ${i + 1}/${totalBatches}: Created ${batch.length} forces (${allCreated.length}/${forces.length} total)`);
      } catch (error) {
        console.error(`Failed to create batch ${i + 1}/${totalBatches}:`, error.message);
        throw new Error(`Failed to create driving forces batch ${i + 1}: ${error.message}`);
      }
    }
    return allCreated;
  }
  async getDrivingForcesByIds(ids, projectId, options = {}, userId) {
    const { includeEmbeddings = false, includeSignals = false } = options;
    if (ids.length === 0) {
      return { forces: [], notFound: [] };
    }
    if (userId && projectId) {
      const project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
      if (!project || project.length === 0) {
        throw new Error("Project not found or access denied");
      }
    }
    let effectiveProjectId = projectId;
    if (projectId) {
      const [projectForceCount] = await db.select({ count: sql2`count(*)` }).from(drivingForces).where(eq(drivingForces.projectId, projectId));
      const forceCount = Number(projectForceCount?.count || 0);
      if (forceCount === 0) {
        console.log(`[getDrivingForcesByIds] Project ${projectId} is empty, falling back to global default project`);
        const defaultProject = await this.ensureDefaultProject();
        effectiveProjectId = defaultProject.id;
      }
    }
    const conditions = [inArray(drivingForces.id, ids)];
    if (effectiveProjectId) {
      conditions.push(eq(drivingForces.projectId, effectiveProjectId));
    }
    if (!includeSignals) {
      conditions.push(ne(drivingForces.type, "S"));
    }
    const whereCondition = and(...conditions);
    let forces = [];
    if (includeEmbeddings) {
      forces = await db.select().from(drivingForces).where(whereCondition);
    } else {
      const selectFields = {
        id: drivingForces.id,
        projectId: drivingForces.projectId,
        title: drivingForces.title,
        type: drivingForces.type,
        steep: drivingForces.steep,
        dimension: drivingForces.dimension,
        scope: drivingForces.scope,
        impact: drivingForces.impact,
        ttm: drivingForces.ttm,
        sentiment: drivingForces.sentiment,
        source: drivingForces.source,
        tags: drivingForces.tags,
        text: drivingForces.text,
        embeddingModel: drivingForces.embeddingModel,
        // Radar visualization fields
        magnitude: drivingForces.magnitude,
        distance: drivingForces.distance,
        colorHex: drivingForces.colorHex,
        feasibility: drivingForces.feasibility,
        urgency: drivingForces.urgency,
        createdAt: drivingForces.createdAt,
        updatedAt: drivingForces.updatedAt
      };
      forces = await db.select(selectFields).from(drivingForces).where(whereCondition);
    }
    const convertedForces = forces.map((force) => this.convertNullToUndefined(force));
    const forcesWithClusters = await this.attachClusterInfoToForces(convertedForces, projectId);
    const foundIds = new Set(forcesWithClusters.map((f) => f.id));
    const notFound = ids.filter((id) => !foundIds.has(id));
    return { forces: forcesWithClusters, notFound };
  }
  async getForceCountsByProjectIds(projectIds, userId) {
    if (projectIds.length === 0) {
      return {};
    }
    if (userId && projectIds.length > 0) {
      const userProjects = await db.select().from(projects).where(and(
        inArray(projects.id, projectIds),
        eq(projects.userId, userId)
      ));
      const validProjectIds = new Set(userProjects.map((p) => p.id));
      const invalidProjects = projectIds.filter((id) => !validProjectIds.has(id));
      if (invalidProjects.length > 0) {
        throw new Error("Project not found or access denied");
      }
    }
    const counts = await db.select({
      projectId: drivingForces.projectId,
      total: sql2`count(*)::int`
    }).from(drivingForces).where(inArray(drivingForces.projectId, projectIds)).groupBy(drivingForces.projectId);
    let userStateCounts = [];
    if (userId) {
      try {
        console.log(`[getForceCountsByProjectIds] Querying user_project_state for user ${userId} and projects:`, projectIds);
        for (const projectId of projectIds) {
          try {
            const result2 = await db.execute(sql2`
              SELECT project_id, jsonb_array_length(selected_forces) as total
              FROM user_project_state
              WHERE user_id = ${userId} AND project_id = ${projectId}
            `);
            if (result2.rows.length > 0) {
              userStateCounts.push(result2.rows[0]);
            }
          } catch (err) {
            console.warn(`[getForceCountsByProjectIds] Failed to query project ${projectId}:`, err);
          }
        }
        console.log(`[getForceCountsByProjectIds] Found user state counts:`, userStateCounts);
      } catch (error) {
        console.warn("[getForceCountsByProjectIds] Failed to query user_project_state:", error);
      }
    } else {
      console.log("[getForceCountsByProjectIds] No userId provided, skipping user_project_state query");
    }
    const result = {};
    for (const projectId of projectIds) {
      result[projectId] = { total: 0 };
    }
    for (const { projectId, total } of counts) {
      result[projectId] = { total: Number(total) };
    }
    for (const row of userStateCounts) {
      const projectId = row.project_id;
      const total = Number(row.total || 0);
      console.log(`[getForceCountsByProjectIds] Merging count for ${projectId}: existing=${result[projectId].total}, new=${total}`);
      if (result[projectId].total === 0 && total > 0) {
        result[projectId] = { total };
      }
    }
    return result;
  }
  async updateDrivingForce(id, force) {
    const [updated] = await db.update(drivingForces).set({ ...force, updatedAt: /* @__PURE__ */ new Date() }).where(eq(drivingForces.id, id)).returning();
    return this.convertNullToUndefined(updated);
  }
  async deleteDrivingForce(id) {
    const result = await db.delete(drivingForces).where(eq(drivingForces.id, id));
    return result.rowCount > 0;
  }
  // Clusters
  async getCluster(id) {
    const [cluster] = await db.select().from(clusters).where(eq(clusters.id, id));
    return cluster || void 0;
  }
  async getClusters(projectId, userId, method) {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error(`Project ${projectId} not found or user ${userId} does not have access`);
    }
    const conditions = [eq(clusters.projectId, projectId), eq(clusters.userId, userId)];
    if (method) {
      conditions.push(eq(clusters.method, method));
    }
    return await db.select().from(clusters).where(and(...conditions)).orderBy(desc(clusters.createdAt));
  }
  async createCluster(cluster) {
    try {
      console.log("Creating single cluster:", {
        projectId: cluster.projectId,
        userId: cluster.userId,
        label: cluster.label,
        method: cluster.method,
        size: cluster.size
      });
      if (!cluster.projectId || !cluster.userId || !cluster.label || !cluster.method || !cluster.size) {
        throw new Error("Cluster validation failed: missing required fields (projectId, userId, label, method, or size)");
      }
      if (!Array.isArray(cluster.forceIds)) {
        throw new Error("Cluster validation failed: forceIds must be an array");
      }
      const [created] = await db.insert(clusters).values(cluster).returning();
      console.log("Successfully created cluster:", created.id);
      return created;
    } catch (error) {
      console.error("Failed to create cluster:", error);
      console.error("Cluster data:", cluster);
      throw new Error(`Cluster creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  async updateCluster(id, cluster) {
    const [updated] = await db.update(clusters).set(cluster).where(eq(clusters.id, id)).returning();
    return updated;
  }
  async createClusters(clusterList) {
    if (clusterList.length === 0) {
      console.log("No clusters to create - empty cluster list");
      return [];
    }
    const startTime = Date.now();
    console.log(`Creating ${clusterList.length} clusters in database with batched insertion`);
    try {
      for (let i = 0; i < clusterList.length; i++) {
        const cluster = clusterList[i];
        if (!cluster.projectId || !cluster.userId || !cluster.label || !cluster.method || cluster.size === void 0 || cluster.size === null) {
          console.error(`Cluster validation failed at index ${i}:`, {
            projectId: cluster.projectId,
            userId: cluster.userId,
            label: cluster.label,
            method: cluster.method,
            size: cluster.size,
            hasParams: !!cluster.params,
            forceIdsLength: Array.isArray(cluster.forceIds) ? cluster.forceIds.length : "not_array"
          });
          throw new Error(`Cluster validation failed at index ${i}: missing required fields (projectId, userId, label, method, or size)`);
        }
        if (!Array.isArray(cluster.forceIds)) {
          console.error(`Cluster forceIds validation failed at index ${i}:`, {
            forceIds: cluster.forceIds,
            type: typeof cluster.forceIds
          });
          throw new Error(`Cluster validation failed at index ${i}: forceIds must be an array, got ${typeof cluster.forceIds}`);
        }
        if (cluster.forceIds.length === 0) {
          console.error(`Cluster has empty forceIds at index ${i}:`, cluster.label);
          throw new Error(`Cluster validation failed at index ${i}: forceIds array cannot be empty`);
        }
        if (cluster.centroid !== void 0 && cluster.centroid !== null && !Array.isArray(cluster.centroid)) {
          console.error(`Cluster centroid validation failed at index ${i}:`, {
            centroid: cluster.centroid,
            type: typeof cluster.centroid
          });
          throw new Error(`Cluster validation failed at index ${i}: centroid must be an array or null`);
        }
        if (typeof cluster.size !== "number" || cluster.size < 1) {
          throw new Error(`Cluster validation failed at index ${i}: size must be a positive number, got ${cluster.size}`);
        }
        const numericFields = ["silhouetteScore", "cohesion", "separation", "inertia"];
        for (const field of numericFields) {
          const value = cluster[field];
          if (value !== void 0 && value !== null && (typeof value !== "number" || isNaN(value))) {
            throw new Error(`Cluster validation failed at index ${i}: ${field} must be a valid number, got ${value}`);
          }
        }
      }
      console.log(`All ${clusterList.length} clusters passed validation in ${Date.now() - startTime}ms`);
      const BATCH_SIZE = 10;
      const allResults = [];
      console.log(`Inserting ${clusterList.length} clusters in batches of ${BATCH_SIZE}`);
      for (let i = 0; i < clusterList.length; i += BATCH_SIZE) {
        const batch = clusterList.slice(i, i + BATCH_SIZE);
        console.log(`Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} clusters`);
        try {
          const results = await db.insert(clusters).values(batch).returning();
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} completed: ${results.length} clusters inserted`);
          if (results.length !== batch.length) {
            throw new Error(`Batch insertion failed: expected ${batch.length} clusters, got ${results.length}`);
          }
          allResults.push(...results);
        } catch (batchError) {
          console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, {
            error: batchError instanceof Error ? batchError.message : String(batchError),
            batchSize: batch.length,
            startIndex: i
          });
          throw new Error(`Database insert failed for batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError instanceof Error ? batchError.message : "Unknown error"}`);
        }
      }
      const totalTime = Date.now() - startTime;
      console.log(`SUCCESS: Created ${allResults.length} clusters in database in ${totalTime}ms`);
      console.log(`Cluster IDs:`, allResults.map((c) => c.id));
      if (allResults.length !== clusterList.length) {
        throw new Error(`Total insertion mismatch: expected ${clusterList.length} clusters, got ${allResults.length}`);
      }
      return allResults;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error("CRITICAL: Cluster persistence failed", {
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : void 0,
        clusterCount: clusterList.length,
        timeElapsed: totalTime
      });
      throw new Error(`Cluster persistence failed after ${totalTime}ms: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  async deleteCluster(id) {
    const result = await db.delete(clusters).where(eq(clusters.id, id));
    return result.rowCount > 0;
  }
  async deleteClustersByProject(projectId, userId) {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error(`Project ${projectId} not found or user ${userId} does not have access`);
    }
    const result = await db.delete(clusters).where(
      and(eq(clusters.projectId, projectId), eq(clusters.userId, userId))
    );
    return result.rowCount > 0;
  }
  // Clustering Reports
  async getClusteringReport(id) {
    const [report] = await db.select().from(clusteringReports).where(eq(clusteringReports.id, id));
    return report || void 0;
  }
  async getClusteringReports(projectId, userId) {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error(`Project ${projectId} not found or user ${userId} does not have access`);
    }
    return await db.select().from(clusteringReports).where(and(eq(clusteringReports.projectId, projectId), eq(clusteringReports.userId, userId))).orderBy(desc(clusteringReports.createdAt));
  }
  async createClusteringReport(report) {
    if (!report.userId) {
      throw new Error("userId is required to create a clustering report");
    }
    const [created] = await db.insert(clusteringReports).values(report).returning();
    return created;
  }
  async updateClusteringReport(id, report) {
    const [updated] = await db.update(clusteringReports).set(report).where(eq(clusteringReports.id, id)).returning();
    return updated;
  }
  async deleteClusteringReport(id) {
    const result = await db.delete(clusteringReports).where(eq(clusteringReports.id, id));
    return result.rowCount > 0;
  }
  // Workspaces
  async getWorkspace(id) {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace || void 0;
  }
  async getWorkspaces(projectId, userId) {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error(`Project ${projectId} not found or user ${userId} does not have access`);
    }
    return await db.select().from(workspaces).where(and(eq(workspaces.projectId, projectId), eq(workspaces.userId, userId))).orderBy(desc(workspaces.createdAt));
  }
  async createWorkspace(workspace) {
    if (!workspace.userId) {
      throw new Error("userId is required to create a workspace");
    }
    const [created] = await db.insert(workspaces).values(workspace).returning();
    return created;
  }
  async updateWorkspace(id, workspace) {
    const [updated] = await db.update(workspaces).set(workspace).where(eq(workspaces.id, id)).returning();
    return updated;
  }
  async deleteWorkspace(id) {
    const result = await db.delete(workspaces).where(eq(workspaces.id, id));
    return result.rowCount > 0;
  }
  // Jobs
  async getJob(id) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || void 0;
  }
  async getJobs(userId, status) {
    const conditions = [];
    if (userId) {
      conditions.push(eq(jobs.userId, userId));
    }
    if (status) {
      conditions.push(eq(jobs.status, status));
    }
    if (conditions.length > 0) {
      return await db.select().from(jobs).where(and(...conditions)).orderBy(desc(jobs.createdAt));
    }
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }
  async createJob(job) {
    if (!job.userId) {
      throw new Error("userId is required to create a job");
    }
    const [created] = await db.insert(jobs).values(job).returning();
    return created;
  }
  async updateJob(id, job) {
    const [updated] = await db.update(jobs).set(job).where(eq(jobs.id, id)).returning();
    return updated;
  }
  async deleteJob(id) {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return result.rowCount > 0;
  }
  // Reports
  async getReport(id) {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || void 0;
  }
  async getReports(userId, projectId) {
    const conditions = [];
    if (userId) {
      conditions.push(eq(reports.userId, userId));
    }
    if (projectId) {
      conditions.push(eq(reports.projectId, projectId));
    }
    if (conditions.length > 0) {
      return await db.select().from(reports).where(and(...conditions)).orderBy(desc(reports.createdAt));
    }
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }
  async createReport(report) {
    if (!report.userId) {
      throw new Error("userId is required to create a report");
    }
    const [created] = await db.insert(reports).values(report).returning();
    return created;
  }
  async updateReport(id, report) {
    const [updated] = await db.update(reports).set(report).where(eq(reports.id, id)).returning();
    return updated;
  }
  async deleteReport(id) {
    const result = await db.delete(reports).where(eq(reports.id, id));
    return result.rowCount > 0;
  }
  // Advanced Search
  async queryForces(query, userId) {
    const startTime = Date.now();
    const { page, pageSize, sort, sortOrder, includeFacets, includeEmbeddings, ...filters } = query;
    if (userId && filters.projectId) {
      const project = await db.select().from(projects).where(and(eq(projects.id, filters.projectId), eq(projects.userId, userId))).limit(1);
      if (!project || project.length === 0) {
        throw new Error("Project not found or access denied");
      }
    }
    let effectiveProjectId = filters.projectId;
    if (filters.projectId) {
      const [projectForceCount] = await db.select({ count: sql2`count(*)` }).from(drivingForces).where(eq(drivingForces.projectId, filters.projectId));
      const forceCount = Number(projectForceCount?.count || 0);
      if (forceCount === 0) {
        console.log(`[queryForces] Project ${filters.projectId} is empty, falling back to global default project`);
        const defaultProject = await this.ensureDefaultProject();
        effectiveProjectId = defaultProject.id;
      }
    }
    const conditions = [];
    if (effectiveProjectId) {
      conditions.push(eq(drivingForces.projectId, effectiveProjectId));
    }
    if (filters.types && filters.types.length > 0) {
      const curatedTypes = filters.types.filter((t) => t !== "S");
      if (curatedTypes.length > 0) {
        conditions.push(inArray(drivingForces.type, curatedTypes));
      }
    } else {
      conditions.push(ne(drivingForces.type, "S"));
    }
    if (filters.steep && filters.steep.length > 0) {
      conditions.push(inArray(drivingForces.steep, filters.steep));
    }
    if (filters.sentiments && filters.sentiments.length > 0) {
      conditions.push(inArray(drivingForces.sentiment, filters.sentiments));
    }
    if (filters.impactMin !== void 0 && filters.impactMax !== void 0) {
      conditions.push(between(drivingForces.impact, filters.impactMin, filters.impactMax));
    } else if (filters.impactMin !== void 0) {
      conditions.push(gte(drivingForces.impact, filters.impactMin));
    } else if (filters.impactMax !== void 0) {
      conditions.push(lte(drivingForces.impact, filters.impactMax));
    }
    if (filters.horizons && filters.horizons.length > 0) {
      conditions.push(inArray(drivingForces.ttm, filters.horizons));
    }
    if (filters.source) {
      conditions.push(ilike(drivingForces.source, `%${filters.source}%`));
    }
    if (filters.scope) {
      conditions.push(ilike(drivingForces.scope, `%${filters.scope}%`));
    }
    if (filters.createdAfter) {
      conditions.push(gte(drivingForces.createdAt, new Date(filters.createdAfter)));
    }
    if (filters.createdBefore) {
      conditions.push(lte(drivingForces.createdAt, new Date(filters.createdBefore)));
    }
    if (filters.q) {
      const searchCondition = this.parseSearchQuery(filters.q);
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(
        (tag) => sql2`${drivingForces.tags} @> ARRAY[${tag}]::text[]`
      );
      conditions.push(or(...tagConditions));
    }
    if (filters.forceIds && filters.forceIds.length > 0) {
      conditions.push(inArray(drivingForces.id, filters.forceIds));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const sortOrderDir = sortOrder === "asc" ? asc : desc;
    let orderBy;
    switch (sort) {
      case "impact":
        orderBy = sortOrderDir(drivingForces.impact);
        break;
      case "created_at":
        orderBy = sortOrderDir(drivingForces.createdAt);
        break;
      case "updated_at":
        orderBy = sortOrderDir(drivingForces.updatedAt);
        break;
      case "title":
        orderBy = sortOrderDir(drivingForces.title);
        break;
      case "relevance":
      default:
        if (filters.q) {
          orderBy = desc(drivingForces.updatedAt);
        } else {
          orderBy = desc(drivingForces.createdAt);
        }
        break;
    }
    const totalQuery = db.select({ count: count() }).from(drivingForces);
    if (whereClause) {
      totalQuery.where(whereClause);
    }
    const [{ count: total }] = await totalQuery;
    const selectFields = {
      id: drivingForces.id,
      projectId: drivingForces.projectId,
      title: drivingForces.title,
      type: drivingForces.type,
      steep: drivingForces.steep,
      dimension: drivingForces.dimension,
      scope: drivingForces.scope,
      impact: drivingForces.impact,
      ttm: drivingForces.ttm,
      sentiment: drivingForces.sentiment,
      source: drivingForces.source,
      tags: drivingForces.tags,
      text: drivingForces.text,
      clusterId: drivingForces.clusterId,
      clusterLabel: drivingForces.clusterLabel,
      // Radar visualization fields
      magnitude: drivingForces.magnitude,
      distance: drivingForces.distance,
      colorHex: drivingForces.colorHex,
      feasibility: drivingForces.feasibility,
      urgency: drivingForces.urgency,
      createdAt: drivingForces.createdAt,
      updatedAt: drivingForces.updatedAt,
      ...includeEmbeddings && {
        embeddingVector: drivingForces.embeddingVector,
        embeddingModel: drivingForces.embeddingModel
      }
    };
    const mainQuery = db.select(selectFields).from(drivingForces).limit(pageSize).offset((page - 1) * pageSize);
    if (whereClause) {
      mainQuery.where(whereClause);
    }
    if (orderBy) {
      mainQuery.orderBy(orderBy);
    }
    let forces = await mainQuery;
    if (filters.projectId && forces.length > 0) {
      forces = await this.attachClusterInfoToForces(forces, filters.projectId);
    }
    let facets;
    if (includeFacets) {
      facets = await this.generateFacetCounts(filters.projectId, whereClause);
    }
    const took = Date.now() - startTime;
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;
    return {
      forces: forces.map((force) => ({
        ...force,
        scope: force.scope ?? void 0,
        // Convert null to undefined
        dimension: force.dimension ?? void 0,
        // Convert null to undefined
        embeddingVector: force.embeddingVector ?? void 0,
        // Convert null to undefined
        embeddingModel: force.embeddingModel ?? void 0,
        // Convert null to undefined
        createdAt: force.createdAt.toISOString(),
        updatedAt: force.updatedAt.toISOString(),
        relevanceScore: filters.q ? Math.random() * 0.5 + 0.5 : void 0
        // Simplified relevance
      })),
      total,
      page,
      pageSize,
      totalPages,
      hasMore,
      facets,
      took
    };
  }
  /**
   * Parse search query to handle boolean operators (AND, OR) and quoted phrases
   * Examples:
   * - "artificial intelligence" → exact phrase match
   * - artificial AND intelligence → both terms must be present
   * - AI OR machine → either term can be present
   * - "artificial intelligence" AND blockchain → phrase AND term
   */
  parseSearchQuery(query) {
    if (!query || !query.trim()) {
      return null;
    }
    const normalizedQuery = query.trim();
    if (normalizedQuery === "*") {
      return null;
    }
    if (!normalizedQuery.includes("AND") && !normalizedQuery.includes("OR") && !normalizedQuery.includes('"')) {
      const searchTerm2 = `%${normalizedQuery}%`;
      return or(
        ilike(drivingForces.title, searchTerm2),
        ilike(drivingForces.text, searchTerm2)
      );
    }
    if (normalizedQuery.includes(" OR ")) {
      return this.parseSimpleORQuery(normalizedQuery);
    }
    if (normalizedQuery.includes(" AND ")) {
      return this.parseSimpleANDQuery(normalizedQuery);
    }
    if (normalizedQuery.includes('"')) {
      return this.parseQuotedQuery(normalizedQuery);
    }
    const searchTerm = `%${normalizedQuery}%`;
    return or(
      ilike(drivingForces.title, searchTerm),
      ilike(drivingForces.text, searchTerm)
    );
  }
  parseSimpleORQuery(query) {
    const terms = query.split(" OR ").map((term) => term.trim()).filter((term) => term.length > 0);
    if (terms.length < 2) {
      const searchTerm = `%${query}%`;
      return or(
        ilike(drivingForces.title, searchTerm),
        ilike(drivingForces.text, searchTerm)
      );
    }
    const termConditions = terms.map((term) => {
      const searchTerm = `%${term}%`;
      return or(
        ilike(drivingForces.title, searchTerm),
        ilike(drivingForces.text, searchTerm)
      );
    });
    return termConditions.reduce(
      (acc, condition) => acc ? or(acc, condition) : condition
    );
  }
  parseSimpleANDQuery(query) {
    const terms = query.split(" AND ").map((term) => term.trim()).filter((term) => term.length > 0);
    if (terms.length < 2) {
      const searchTerm = `%${query}%`;
      return or(
        ilike(drivingForces.title, searchTerm),
        ilike(drivingForces.text, searchTerm)
      );
    }
    const termConditions = terms.map((term) => {
      const searchTerm = `%${term}%`;
      return or(
        ilike(drivingForces.title, searchTerm),
        ilike(drivingForces.text, searchTerm)
      );
    });
    return termConditions.reduce(
      (acc, condition) => acc ? and(acc, condition) : condition
    );
  }
  parseQuotedQuery(query) {
    const phraseRegex = /"([^"]+)"/g;
    const phrases = [];
    let match;
    while ((match = phraseRegex.exec(query)) !== null) {
      phrases.push(match[1]);
    }
    if (phrases.length === 0) {
      const searchTerm = `%${query}%`;
      return or(
        ilike(drivingForces.title, searchTerm),
        ilike(drivingForces.text, searchTerm)
      );
    }
    if (phrases.length === 1) {
      const searchTerm = `%${phrases[0]}%`;
      return or(
        ilike(drivingForces.title, searchTerm),
        ilike(drivingForces.text, searchTerm)
      );
    }
    const phraseConditions = phrases.map((phrase) => {
      const searchTerm = `%${phrase}%`;
      return or(
        ilike(drivingForces.title, searchTerm),
        ilike(drivingForces.text, searchTerm)
      );
    });
    return phraseConditions.reduce(
      (acc, condition) => acc ? or(acc, condition) : condition
    );
  }
  async generateFacetCounts(projectId, baseWhere) {
    const conditions = [];
    if (projectId) {
      conditions.push(eq(drivingForces.projectId, projectId));
    }
    if (baseWhere) {
      conditions.push(baseWhere);
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const query = db.select({
      type: drivingForces.type,
      steep: drivingForces.steep,
      sentiment: drivingForces.sentiment,
      impact: drivingForces.impact,
      ttm: drivingForces.ttm,
      source: drivingForces.source,
      scope: drivingForces.scope,
      tags: drivingForces.tags
    }).from(drivingForces);
    if (whereClause) {
      query.where(whereClause);
    }
    const records = await query;
    const typeCounts = {};
    const steepCounts = {};
    const sentimentCounts = {};
    const horizonCounts = {};
    const sourceCounts = {};
    const scopeCounts = {};
    const tagCounts = {};
    const impactRanges = {
      "1-3": 0,
      "4-6": 0,
      "7-8": 0,
      "9-10": 0
    };
    records.forEach((record) => {
      if (record.type) {
        typeCounts[record.type] = (typeCounts[record.type] || 0) + 1;
      }
      if (record.steep) {
        steepCounts[record.steep] = (steepCounts[record.steep] || 0) + 1;
      }
      if (record.sentiment) {
        sentimentCounts[record.sentiment] = (sentimentCounts[record.sentiment] || 0) + 1;
      }
      if (record.impact !== null && record.impact !== void 0) {
        if (record.impact >= 1 && record.impact <= 3) impactRanges["1-3"]++;
        else if (record.impact >= 4 && record.impact <= 6) impactRanges["4-6"]++;
        else if (record.impact >= 7 && record.impact <= 8) impactRanges["7-8"]++;
        else if (record.impact >= 9 && record.impact <= 10) impactRanges["9-10"]++;
      }
      if (record.ttm) {
        horizonCounts[record.ttm] = (horizonCounts[record.ttm] || 0) + 1;
      }
      if (record.source) {
        sourceCounts[record.source] = (sourceCounts[record.source] || 0) + 1;
      }
      if (record.scope) {
        scopeCounts[record.scope] = (scopeCounts[record.scope] || 0) + 1;
      }
      if (record.tags && Array.isArray(record.tags)) {
        record.tags.forEach((tag) => {
          if (tag) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    });
    const topSources = Object.entries(sourceCounts).sort(([, a], [, b]) => b - a).slice(0, 10).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    const topTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 20).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    return {
      types: typeCounts,
      steep: steepCounts,
      sentiments: sentimentCounts,
      impactRanges,
      horizons: horizonCounts,
      sources: topSources,
      scopes: scopeCounts,
      tags: topTags
    };
  }
  // Conversations
  async getConversations(projectId) {
    return await db.select().from(conversations).where(eq(conversations.projectId, projectId)).orderBy(desc(conversations.updatedAt));
  }
  async getConversation(id) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }
  async createConversation(conversation) {
    const [newConversation] = await db.insert(conversations).values({
      ...conversation,
      messages: conversation.messages || []
    }).returning();
    return newConversation;
  }
  async updateConversation(id, conversation) {
    const [updatedConversation] = await db.update(conversations).set({
      ...conversation,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(conversations.id, id)).returning();
    return updatedConversation;
  }
  async deleteConversation(id) {
    const [deletedConversation] = await db.delete(conversations).where(eq(conversations.id, id)).returning();
    return !!deletedConversation;
  }
  // Saved Searches
  async getSavedSearch(id) {
    const [search] = await db.select().from(savedSearches).where(eq(savedSearches.id, id));
    return search || void 0;
  }
  async getSavedSearches(projectId, userId) {
    const project = await this.getProject(projectId, userId);
    if (!project) {
      throw new Error(`Project ${projectId} not found or user ${userId} does not have access`);
    }
    return await db.select().from(savedSearches).where(and(eq(savedSearches.projectId, projectId), eq(savedSearches.userId, userId))).orderBy(desc(savedSearches.createdAt));
  }
  async createSavedSearch(search) {
    if (!search.userId) {
      throw new Error("userId is required to create a saved search");
    }
    const [created] = await db.insert(savedSearches).values(search).returning();
    return created;
  }
  async updateSavedSearch(id, search) {
    const [updated] = await db.update(savedSearches).set({ ...search, updatedAt: /* @__PURE__ */ new Date() }).where(eq(savedSearches.id, id)).returning();
    return updated;
  }
  async deleteSavedSearch(id) {
    const result = await db.delete(savedSearches).where(eq(savedSearches.id, id));
    return result.rowCount > 0;
  }
  // Optimized paginated force retrieval for clustering with only needed fields
  async getDrivingForcesForClustering(projectId, options = {}) {
    const { pageSize = 750, includeSignals = false } = options;
    const conditions = [eq(drivingForces.projectId, projectId)];
    if (!includeSignals) {
      conditions.push(ne(drivingForces.type, "S"));
    }
    const whereCondition = and(...conditions);
    const [countResult] = await db.select({ count: sql2`count(*)` }).from(drivingForces).where(whereCondition);
    const totalCount = countResult?.count || 0;
    const getPage = async (pageIndex) => {
      const offset = pageIndex * pageSize;
      const forces = await db.select({
        id: drivingForces.id,
        title: drivingForces.title,
        text: drivingForces.text,
        embeddingVector: drivingForces.embeddingVector
      }).from(drivingForces).where(whereCondition).orderBy(desc(drivingForces.createdAt)).limit(pageSize).offset(offset);
      return forces.map((f) => ({
        ...f,
        embeddingVector: f.embeddingVector ? f.embeddingVector : void 0
      }));
    };
    return { totalCount, getPage };
  }
  // Bulk Edit Operations for Enhanced Scanning Assistant
  async getDrivingForcesBulkEditPreview(projectId, filters) {
    let conditions = [eq(drivingForces.projectId, projectId)];
    if (filters.forceIds && filters.forceIds.length > 0) {
      conditions.push(inArray(drivingForces.id, filters.forceIds));
    }
    if (filters.steep && filters.steep.length > 0) {
      conditions.push(inArray(drivingForces.steep, filters.steep));
    }
    if (filters.type && filters.type.length > 0) {
      conditions.push(inArray(drivingForces.type, filters.type));
    }
    if (filters.searchPattern) {
      const searchCondition = or(
        ilike(drivingForces.title, `%${filters.searchPattern}%`),
        ilike(drivingForces.text, `%${filters.searchPattern}%`)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    let query = db.select().from(drivingForces).where(and(...conditions));
    if (filters.position === "first" || filters.position === "last") {
      const orderDirection = filters.position === "first" ? asc : desc;
      query = query.orderBy(orderDirection(drivingForces.createdAt));
    } else {
      query = query.orderBy(desc(drivingForces.createdAt));
    }
    if (filters.count && filters.count > 0) {
      query = query.limit(filters.count);
    }
    const result = await query;
    return result.map((force) => this.convertNullToUndefined(force));
  }
  async updateDrivingForcesBulk(projectId, filters, updates) {
    const forcesToUpdate = await this.getDrivingForcesBulkEditPreview(projectId, filters);
    if (forcesToUpdate.length === 0) {
      return [];
    }
    const forceIds = forcesToUpdate.map((f) => f.id);
    const updateData = {};
    if (updates.type !== void 0) updateData.type = updates.type;
    if (updates.steep !== void 0) updateData.steep = updates.steep;
    if (updates.scope !== void 0) updateData.scope = updates.scope;
    if (updates.impact !== void 0) updateData.impact = updates.impact;
    if (updates.ttm !== void 0) updateData.ttm = updates.ttm;
    if (updates.sentiment !== void 0) updateData.sentiment = updates.sentiment;
    updateData.updatedAt = /* @__PURE__ */ new Date();
    const result = await db.update(drivingForces).set(updateData).where(and(
      eq(drivingForces.projectId, projectId),
      inArray(drivingForces.id, forceIds.filter((id) => id !== void 0))
    )).returning();
    return result.map((force) => this.convertNullToUndefined(force));
  }
  // Subscription Management
  async getSubscriptionPlans() {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }
  async getSubscriptionPlan(tier) {
    const [plan] = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.tier, tier), eq(subscriptionPlans.isActive, true)));
    return plan;
  }
  async getSubscriptionPlanById(id) {
    const [plan] = await db.select().from(subscriptionPlans).where(and(eq(subscriptionPlans.id, id), eq(subscriptionPlans.isActive, true)));
    return plan;
  }
  async createSubscriptionPlan(plan) {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }
  async updateSubscriptionPlan(id, plan) {
    const [updatedPlan] = await db.update(subscriptionPlans).set({ ...plan, updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptionPlans.id, id)).returning();
    return updatedPlan;
  }
  // User subscription operations
  async updateUserSubscription(userId, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    return user;
  }
  async getUserSubscriptionStatus(userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return {
        hasActiveSubscription: false,
        tier: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null
      };
    }
    const hasActiveSubscription = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";
    return {
      hasActiveSubscription,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd || false,
      trialEndsAt: user.trialEndsAt
    };
  }
  // Subscription history
  async createSubscriptionHistory(history) {
    const [newHistory] = await db.insert(subscriptionHistory).values(history).returning();
    return newHistory;
  }
  async getSubscriptionHistory(userId) {
    return await db.select().from(subscriptionHistory).where(eq(subscriptionHistory.userId, userId)).orderBy(desc(subscriptionHistory.createdAt));
  }
  // AI Usage Tracking
  async getOrCreateAiUsage(userId, month) {
    const [existing] = await db.select().from(aiUsageTracking).where(and(eq(aiUsageTracking.userId, userId), eq(aiUsageTracking.month, month))).limit(1);
    if (existing) {
      return existing;
    }
    const resetDate = /* @__PURE__ */ new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1);
    resetDate.setHours(0, 0, 0, 0);
    const [created] = await db.insert(aiUsageTracking).values({
      userId,
      month,
      queriesUsed: 0,
      resetAt: resetDate
    }).returning();
    return created;
  }
  async incrementAiUsage(userId) {
    const now = /* @__PURE__ */ new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const subscriptionStatus = await this.getUserSubscriptionStatus(userId);
    if (!subscriptionStatus.hasActiveSubscription || !subscriptionStatus.tier) {
      return { success: false, remaining: 0, limit: 0 };
    }
    const tierLimits = {
      basic: 50,
      professional: 500,
      enterprise: 5e3
    };
    const limit = tierLimits[subscriptionStatus.tier];
    const usage = await this.getOrCreateAiUsage(userId, month);
    if (usage.queriesUsed >= limit) {
      return { success: false, remaining: 0, limit };
    }
    const [updated] = await db.update(aiUsageTracking).set({
      queriesUsed: usage.queriesUsed + 1,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(aiUsageTracking.userId, userId), eq(aiUsageTracking.month, month))).returning();
    const remaining = limit - updated.queriesUsed;
    return { success: true, remaining, limit };
  }
  async getAiUsageForMonth(userId, month) {
    const [usage] = await db.select().from(aiUsageTracking).where(and(eq(aiUsageTracking.userId, userId), eq(aiUsageTracking.month, month))).limit(1);
    return usage;
  }
  async resetMonthlyAiUsage(userId) {
    const now = /* @__PURE__ */ new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await db.update(aiUsageTracking).set({
      queriesUsed: 0,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(aiUsageTracking.userId, userId), eq(aiUsageTracking.month, month)));
  }
  // Additional user lookup methods for webhooks
  async getUserByStripeCustomerId(customerId) {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    return user;
  }
  async getSubscriptionPlanByPriceId(priceId) {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.stripePriceId, priceId)).limit(1);
    return plan;
  }
  // Unified user update method that webhooks can use
  async updateUser(userId, updates) {
    const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    return user;
  }
  async createInviteCode(codeData) {
    const [code] = await db.insert(inviteCodes).values(codeData).returning();
    return code;
  }
  async getInviteCode(code) {
    const [inviteCode] = await db.select().from(inviteCodes).where(sql2`lower(${inviteCodes.code}) = lower(${code})`).limit(1);
    return inviteCode;
  }
  async getInviteCodeById(id) {
    const [inviteCode] = await db.select().from(inviteCodes).where(eq(inviteCodes.id, id)).limit(1);
    return inviteCode;
  }
  async listInviteCodes(createdByUserId) {
    if (createdByUserId) {
      return await db.select().from(inviteCodes).where(eq(inviteCodes.createdByUserId, createdByUserId)).orderBy(desc(inviteCodes.createdAt));
    }
    return await db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt));
  }
  async validateInviteCode(code) {
    const invite = await this.getInviteCode(code);
    if (!invite) {
      return { valid: false, reason: "Invite code not found" };
    }
    if (!invite.isActive) {
      return { valid: false, invite, reason: "Invite code is no longer active" };
    }
    if (invite.expiresAt && /* @__PURE__ */ new Date() > invite.expiresAt) {
      return { valid: false, invite, reason: "Invite code has expired" };
    }
    if (invite.maxUses !== null && invite.currentUses >= invite.maxUses) {
      return { valid: false, invite, reason: "Invite code has reached maximum uses" };
    }
    return { valid: true, invite };
  }
  async redeemInviteCode(code) {
    const invite = await this.getInviteCode(code);
    if (!invite) {
      throw new Error("Invite code not found");
    }
    const newUses = invite.currentUses + 1;
    const shouldDeactivate = invite.maxUses !== null && newUses >= invite.maxUses;
    const [updated] = await db.update(inviteCodes).set({
      currentUses: newUses,
      isActive: shouldDeactivate ? false : invite.isActive,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(inviteCodes.id, invite.id)).returning();
    if (!updated) {
      throw new Error("Failed to redeem invite code");
    }
    return updated;
  }
  async updateInviteCode(id, updates) {
    const [updated] = await db.update(inviteCodes).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(inviteCodes.id, id)).returning();
    if (!updated) {
      throw new Error("Invite code not found");
    }
    return updated;
  }
  async deleteInviteCode(id) {
    const result = await db.delete(inviteCodes).where(eq(inviteCodes.id, id)).returning();
    return result.length > 0;
  }
};
var storage = new DatabaseStorage();

// server/services/pdf_service.ts
import PDFDocument from "pdfkit";
import path2 from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var PdfService = class {
  async generateChatReport(chatHistory, project) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: "A4"
        });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.fontSize(24).font("Helvetica-Bold").text("ORION Copilot Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(18).text(project.name, { align: "center" });
        if (project.description) {
          doc.moveDown(0.5);
          doc.fontSize(12).font("Helvetica").fillColor("#666666").text(project.description, { align: "center" });
        }
        doc.moveDown();
        doc.fontSize(10).fillColor("#999999").text(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()}`, { align: "center" });
        doc.moveDown(3);
        doc.fontSize(16).font("Helvetica-Bold").fillColor("#000000").text("Conversation History");
        doc.moveDown();
        chatHistory.forEach((msg) => {
          const isUser = msg.role === "user";
          const color = isUser ? "#2563eb" : "#000000";
          const align = "left";
          doc.font("Helvetica-Bold").fontSize(10).fillColor(color).text(isUser ? "You" : "Copilot", { align });
          if (msg.timestamp) {
            doc.font("Helvetica").fontSize(8).fillColor("#666666").text(new Date(msg.timestamp).toLocaleString(), { align });
          }
          doc.moveDown(0.5);
          doc.font("Helvetica").fontSize(11).fillColor("#000000").text(msg.content, {
            align,
            indent: 10,
            width: 450
          });
          if (msg.images && msg.images.length > 0) {
            doc.moveDown(0.5);
            msg.images.forEach((img) => {
              try {
                const base64Data = img.data.replace(/^data:image\/\w+;base64,/, "");
                const imgBuffer = Buffer.from(base64Data, "base64");
                doc.image(imgBuffer, {
                  fit: [400, 300]
                });
                doc.moveDown(0.5);
              } catch (err) {
                console.error("Error rendering image in PDF:", err);
                doc.fontSize(9).fillColor("red").text("[Error rendering image]");
              }
            });
          }
          doc.moveDown(1.5);
        });
        doc.moveDown(2);
        doc.fontSize(8).fillColor("#999999").text(
          "Generated by ORION - Strategic Intelligence Platform",
          { align: "center" }
        );
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  async generateStandardReport(data) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: "A4"
        });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.fontSize(24).font("Helvetica-Bold").text("ORION Strategic Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(18).text(data.project.name, { align: "center" });
        if (data.project.description) {
          doc.moveDown(0.5);
          doc.fontSize(12).font("Helvetica").fillColor("#666666").text(data.project.description, { align: "center" });
        }
        doc.moveDown();
        doc.fontSize(10).fillColor("#999999").text(`Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()}`, { align: "center" });
        doc.moveDown(3);
        doc.fontSize(16).font("Helvetica-Bold").fillColor("#000000").text("Executive Summary");
        doc.moveDown();
        const forceCount = data.selectedForceIds?.length || data.forces?.length || 0;
        doc.fontSize(11).font("Helvetica").text(
          `This report analyzes ${forceCount} driving forces from the ${data.project.name} project. The analysis includes strategic insights, trends, and key findings relevant to your organization's future planning.`
        );
        doc.moveDown(2);
        if (data.forces && data.forces.length > 0) {
          doc.fontSize(16).font("Helvetica-Bold").text("Driving Forces Overview");
          doc.moveDown();
          const forcesByType = {};
          data.forces.forEach((force) => {
            if (!forcesByType[force.type]) {
              forcesByType[force.type] = [];
            }
            forcesByType[force.type].push(force);
          });
          const typeNames = {
            "M": "Megatrends",
            "T": "Trends",
            "WS": "Weak Signals",
            "WC": "Wildcards",
            "S": "Signals"
          };
          Object.entries(forcesByType).forEach(([type, forces]) => {
            const typeName = typeNames[type] || type;
            doc.fontSize(14).font("Helvetica-Bold").text(`${typeName} (${forces.length})`);
            doc.moveDown(0.5);
            forces.slice(0, 10).forEach((force, index2) => {
              doc.fontSize(10).font("Helvetica").text(
                `${index2 + 1}. ${force.title}`,
                { indent: 20 }
              );
            });
            if (forces.length > 10) {
              doc.fontSize(9).fillColor("#666666").text(
                `... and ${forces.length - 10} more`,
                { indent: 20 }
              );
              doc.fillColor("#000000");
            }
            doc.moveDown();
          });
        }
        if (data.sections && data.sections.length > 0) {
          doc.addPage();
          doc.fontSize(16).font("Helvetica-Bold").text("Detailed Analysis");
          doc.moveDown();
          data.sections.forEach((section) => {
            doc.fontSize(12).font("Helvetica").text(section);
            doc.moveDown();
          });
        }
        doc.moveDown(2);
        doc.fontSize(8).fillColor("#999999").text(
          "Generated by ORION - Strategic Intelligence Platform",
          { align: "center" }
        );
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
};
var pdfService = new PdfService();

// server/services/jobs.ts
import fs from "fs";
import path3 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var JobsService = class {
  async generateReport(reportId, projectId, format) {
    try {
      await storage.updateReport(reportId, { status: "processing" });
      const reports2 = await storage.getReports(void 0, projectId);
      const report = reports2.find((r) => r.id === reportId);
      if (!report) {
        throw new Error("Report not found");
      }
      let reportBuffer;
      let filename;
      const project = await storage.getProject(projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      if (report.reportType === "chat" && report.chatHistory) {
        reportBuffer = await pdfService.generateChatReport(report.chatHistory, {
          name: project.name,
          description: project.description || ""
        });
        filename = `Chat-Report-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}-${reportId}.pdf`;
      } else {
        const forces = await storage.getDrivingForces(projectId);
        let reportForces = forces.forces;
        if (report.selectedForceIds && Array.isArray(report.selectedForceIds) && report.selectedForceIds.length > 0) {
          reportForces = forces.forces.filter((f) => f.id && report.selectedForceIds.includes(f.id));
        }
        reportBuffer = await pdfService.generateStandardReport({
          project: {
            name: project.name,
            description: project.description || ""
          },
          forces: reportForces,
          selectedForceIds: report.selectedForceIds || void 0,
          sections: report.sections ? report.sections.split(",") : void 0
        });
        filename = `Report-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}-${reportId}.pdf`;
      }
      const uploadsDir = path3.join(process.cwd(), "uploads/reports");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path3.join(uploadsDir, filename);
      fs.writeFileSync(filePath, reportBuffer);
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
  async getRunningJobs() {
    return await storage.getJobs("running");
  }
  async getJobStats() {
    const jobs2 = await storage.getJobs();
    const stats = {
      total: jobs2.length,
      pending: jobs2.filter((j) => j.status === "pending").length,
      running: jobs2.filter((j) => j.status === "running").length,
      completed: jobs2.filter((j) => j.status === "done").length,
      failed: jobs2.filter((j) => j.status === "failed").length
    };
    return stats;
  }
};
var jobsService = new JobsService();

// server/routes.ts
init_auth();
import { z as z2 } from "zod";
import * as fs3 from "fs";
import * as path5 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";
var __filename4 = fileURLToPath4(import.meta.url);
var __dirname4 = path5.dirname(__filename4);
async function registerRoutes(app2) {
  app2.post("/api/v1/auth/onboard", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const email = req.user.email;
      const subscriptionTier = req.user.subscriptionTier || "basic";
      const subscriptionStatus = req.user.subscriptionStatus || "trial";
      let newToken;
      let user = await storage.getUser(userId);
      if (!user) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          user = existingUser;
          console.log(`[Onboard] User with email ${email} already exists, using existing user ${user.id}`);
          newToken = generateToken({
            userId: user.id,
            email: user.email,
            subscriptionTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus
          });
          console.log(`[Onboard] Generated new JWT for existing user ${user.id}`);
        } else {
          user = await storage.createUser({
            id: userId,
            email,
            emailVerified: true,
            subscriptionTier,
            subscriptionStatus,
            role: "user"
          });
          console.log(`[Onboard] Created new user ${userId} with email ${email}`);
        }
      }
      const defaultProject = await storage.ensureUserDefaultProject(user.id);
      res.json({
        user,
        defaultProject,
        ...newToken ? { token: newToken } : {}
      });
    } catch (error) {
      console.error("Failed to onboard user:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });
  app2.get("/api/v1/projects", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projects2 = await storage.getProjects(userId);
      res.json(projects2);
    } catch (error) {
      console.error("Failed to get projects:", error);
      res.status(500).json({ error: "Failed to retrieve projects" });
    }
  });
  app2.post("/api/v1/projects", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const email = req.user.email;
      const { name, description } = req.body;
      let user = await storage.getUser(userId);
      if (!user) {
        console.log(`[POST /api/v1/projects] User ${userId} not found, creating user record`);
        user = await storage.createUser({
          id: userId,
          email,
          emailVerified: true,
          subscriptionTier: req.user.subscriptionTier || "basic",
          subscriptionStatus: req.user.subscriptionStatus || "active",
          role: "user"
        });
      }
      const project = await storage.createProject({
        name,
        description,
        userId
      });
      res.json(project);
    } catch (error) {
      console.error("Failed to create project:", error);
      if (error.message === "DUPLICATE_NAME") {
        return res.status(409).json({ error: "Project name already exists" });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });
  app2.get("/api/v1/projects/:id", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const project = await storage.getProject(req.params.id, userId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Failed to get project:", error);
      res.status(500).json({ error: "Failed to retrieve project" });
    }
  });
  app2.delete("/api/v1/projects/:id", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const success = await storage.deleteProject(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      if (error.message === "Cannot delete default project") {
        return res.status(403).json({ error: "Cannot delete default project" });
      }
      console.error("Failed to delete project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });
  app2.get("/api/v1/scanning/forces", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const lens = req.query.lens;
      const type = req.query.type;
      const steep = req.query.steep;
      const search = req.query.search;
      const includeSignals = req.query.includeSignals === "true";
      const limit = parseInt(req.query.limit || "10000");
      const offset = parseInt(req.query.offset || "0");
      console.log("[SCANNING/FORCES] Request:", { userId, projectId, lens, type, steep, search, includeSignals, limit, offset });
      const dimensions = req.query.dimensions ? Array.isArray(req.query.dimensions) ? req.query.dimensions : [req.query.dimensions] : void 0;
      const types = type ? type.includes(",") ? type.split(",") : [type] : void 0;
      const filters = {};
      if (types && types.length > 0) filters.type = types;
      if (steep && steep !== "all") filters.steep = steep;
      if (search) filters.search = search;
      if (dimensions && dimensions.length > 0) filters.dimensions = dimensions;
      console.log("[SCANNING/FORCES] Filters:", filters);
      const result = await storage.getDrivingForces(projectId, lens, filters, {
        limit,
        offset,
        includeEmbeddings: false,
        includeSignals
      }, userId);
      console.log("[SCANNING/FORCES] Result:", { forcesCount: result.forces.length, total: result.total });
      res.json(result);
    } catch (error) {
      console.error("[SCANNING/FORCES] Failed to get forces:", error);
      res.status(500).json({ error: "Failed to retrieve driving forces" });
    }
  });
  app2.get("/api/v1/forces/search", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const searchTerm = req.query.q || req.query.search || "";
      const page = parseInt(req.query.page || "1");
      const pageSize = parseInt(req.query.pageSize || "100");
      const sort = req.query.sort || "relevance";
      const sortOrder = req.query.sortOrder || "desc";
      const includeFacets = req.query.includeFacets === "true";
      const includeEmbeddings = req.query.includeEmbeddings === "true";
      const types = req.query.types ? Array.isArray(req.query.types) ? req.query.types : [req.query.types] : void 0;
      const dimensions = req.query.dimensions ? Array.isArray(req.query.dimensions) ? req.query.dimensions : [req.query.dimensions] : void 0;
      const steep = req.query.steep ? Array.isArray(req.query.steep) ? req.query.steep : [req.query.steep] : void 0;
      const sentiments = req.query.sentiments ? Array.isArray(req.query.sentiments) ? req.query.sentiments : [req.query.sentiments] : void 0;
      const tags = req.query.tags ? Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags] : void 0;
      const impactMin = req.query.impactMin ? parseInt(req.query.impactMin) : void 0;
      const impactMax = req.query.impactMax ? parseInt(req.query.impactMax) : void 0;
      const impactRange = impactMin !== void 0 || impactMax !== void 0 ? [impactMin || 1, impactMax || 10] : void 0;
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
        impactRange
      }, userId);
      res.json(result);
    } catch (error) {
      console.error("Failed to search forces:", error);
      res.status(500).json({ error: "Failed to search driving forces" });
    }
  });
  app2.get("/api/v1/forces/batch", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const ids = req.query.ids ? req.query.ids.split(",") : [];
      const forces = await storage.getDrivingForcesByIds(ids, projectId, {}, userId);
      res.json(forces);
    } catch (error) {
      console.error("Failed to get forces batch:", error);
      res.status(500).json({ error: "Failed to retrieve forces" });
    }
  });
  app2.get("/api/v1/clusters", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const clusters2 = await storage.getClusters(projectId, userId);
      res.json(clusters2);
    } catch (error) {
      console.error("Failed to get clusters:", error);
      res.status(500).json({ error: "Failed to retrieve clusters" });
    }
  });
  app2.get("/api/v1/analytics/overview", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const { forces } = await storage.getDrivingForces(projectId, void 0, {}, {}, userId);
      const clusters2 = await storage.getClusters(projectId, userId);
      res.json({
        totalForces: forces.length,
        totalClusters: clusters2.length,
        forcesByType: forces.reduce((acc, force) => {
          acc[force.type] = (acc[force.type] || 0) + 1;
          return acc;
        }, {}),
        forcesByDimension: forces.reduce((acc, force) => {
          acc[force.steep] = (acc[force.steep] || 0) + 1;
          return acc;
        }, {})
      });
    } catch (error) {
      console.error("Failed to get analytics:", error);
      res.status(500).json({ error: "Failed to retrieve analytics" });
    }
  });
  app2.get("/api/v1/analytics/radar", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectId = req.query.project_id || req.query.projectId;
      console.log("[RADAR] Request received:", { userId, projectId, query: req.query });
      const search = req.query.search;
      const types = req.query.types ? req.query.types.split(",") : void 0;
      const dimensions = req.query.dimensions ? req.query.dimensions.split(",") : void 0;
      const steep = req.query.steep ? req.query.steep.split(",") : void 0;
      const sentiments = req.query.sentiments ? req.query.sentiments.split(",") : void 0;
      const horizons = req.query.horizons ? req.query.horizons.split(",") : void 0;
      const tags = req.query.tags ? req.query.tags.split(",") : void 0;
      const impactMin = req.query.impactMin ? parseFloat(req.query.impactMin) : void 0;
      const impactMax = req.query.impactMax ? parseFloat(req.query.impactMax) : void 0;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 250;
      const filters = {};
      if (search) filters.search = search;
      if (types && types.length > 0) filters.types = types;
      if (dimensions && dimensions.length > 0) filters.dimensions = dimensions;
      if (steep && steep.length > 0) filters.steep = steep;
      if (sentiments && sentiments.length > 0) filters.sentiments = sentiments;
      if (horizons && horizons.length > 0) filters.horizons = horizons;
      if (tags && tags.length > 0) filters.tags = tags;
      if (impactMin !== void 0) filters.impactMin = impactMin;
      if (impactMax !== void 0) filters.impactMax = impactMax;
      console.log("[RADAR] Filters:", filters);
      const { forces, total } = await storage.getDrivingForces(projectId, void 0, filters, {
        limit: pageSize,
        includeSignals: false
        // Only show curated forces (M, T, WS, WC)
      }, userId);
      console.log("[RADAR] Forces fetched:", { total, forcesCount: forces.length });
      const points = forces.map((force) => ({
        id: force.id,
        driving_force: force.title,
        // Map title to driving_force
        description: force.text || force.title,
        // Map text to description
        type: force.type,
        dimension: force.dimension || force.steep,
        // Use dimension or fall back to steep
        magnitude: force.magnitude || 5,
        // Default magnitude if not set
        distance: force.distance || 5,
        // Default distance if not set
        color_hex: force.colorHex || "#64ffda",
        // Default color if not set
        level_of_impact: force.impact,
        // Map impact to level_of_impact
        feasibility: force.feasibility || 5,
        // Default if not set
        urgency: force.urgency || 5,
        // Default if not set
        time_to_market: force.ttm,
        // Map ttm to time_to_market
        sentiment: force.sentiment || "neutral",
        source: force.source
      }));
      console.log("[RADAR] Points transformed:", { pointsCount: points.length, samplePoint: points[0] });
      const uniqueDimensions = [...new Set(forces.map((f) => f.dimension || f.steep).filter(Boolean))];
      const uniqueTypes = [...new Set(forces.map((f) => f.type).filter(Boolean))];
      console.log("[RADAR] Response:", { success: true, pointsCount: points.length, total, dimensionsCount: uniqueDimensions.length, typesCount: uniqueTypes.length });
      res.json({
        success: true,
        points,
        total,
        dimensions: uniqueDimensions,
        types: uniqueTypes,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("[RADAR] Failed to get radar data:", error);
      res.status(500).json({ error: "Failed to retrieve radar data" });
    }
  });
  app2.get("/api/v1/analytics/force-network/:projectId", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { projectId } = req.params;
      const clusters2 = await storage.getClusters(projectId, userId);
      res.json({
        nodes: clusters2.map((c) => ({
          id: c.id,
          label: c.label,
          size: c.forceIds?.length || 0
        })),
        edges: []
      });
    } catch (error) {
      console.error("Failed to get force network:", error);
      res.status(500).json({ error: "Failed to retrieve force network" });
    }
  });
  app2.get("/api/v1/analytics/network", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const clusters2 = await storage.getClusters(projectId, userId);
      res.json({
        nodes: clusters2.map((c) => ({
          id: c.id,
          label: c.label,
          size: c.forceIds?.length || 0
        })),
        edges: []
      });
    } catch (error) {
      console.error("Failed to get network data:", error);
      res.status(500).json({ error: "Failed to retrieve network data" });
    }
  });
  app2.get("/api/v1/reports", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectId = req.query.project_id || req.query.projectId;
      const reports2 = await storage.getReports(userId, projectId);
      res.json(reports2);
    } catch (error) {
      console.error("Failed to get reports:", error);
      res.status(500).json({ error: "Failed to retrieve reports" });
    }
  });
  app2.post("/api/v1/reports", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const report = await storage.createReport({ ...req.body, userId });
      jobsService.generateReport(report.id, report.projectId, report.format);
      res.json(report);
    } catch (error) {
      console.error("Failed to create report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });
  app2.get("/api/v1/reports/download/:filename", authenticateToken, async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path5.join(process.cwd(), "uploads/reports", filename);
      if (!fs3.existsSync(filePath)) {
        console.error(`File not found at path: ${filePath}`);
        return res.status(404).json({ error: "File not found" });
      }
      res.download(filePath);
    } catch (error) {
      console.error("Failed to download report:", error);
      res.status(500).json({ error: "Failed to download report" });
    }
  });
  app2.put("/api/v1/reports/:id", authenticateToken, async (req, res) => {
    try {
      const report = await storage.updateReport(req.params.id, req.body);
      res.json(report);
    } catch (error) {
      console.error("Failed to update report:", error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });
  app2.delete("/api/v1/reports/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteReport(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete report:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });
  app2.get("/api/v1/jobs", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const status = req.query.status;
      const jobs2 = await storage.getJobs(userId, status);
      res.json(jobs2);
    } catch (error) {
      console.error("Failed to get jobs:", error);
      res.status(500).json({ error: "Failed to retrieve jobs" });
    }
  });
  app2.get("/api/v1/jobs/stats", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const allJobs = await storage.getJobs(userId);
      const stats = {
        total: allJobs.length,
        pending: allJobs.filter((j) => j.status === "pending").length,
        running: allJobs.filter((j) => j.status === "running").length,
        completed: allJobs.filter((j) => j.status === "completed").length,
        failed: allJobs.filter((j) => j.status === "failed").length
      };
      res.json(stats);
    } catch (error) {
      console.error("Failed to get job stats:", error);
      res.status(500).json({ error: "Failed to retrieve job statistics" });
    }
  });
  app2.get("/api/v1/jobs/:id", authenticateToken, async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Failed to get job:", error);
      res.status(500).json({ error: "Failed to retrieve job" });
    }
  });
  app2.get("/api/v1/scanning/forces/batch", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const projectIds = req.query.project_ids ? req.query.project_ids.split(",") : [];
      const results = await Promise.all(
        projectIds.map(async (projectId) => {
          const { forces, total } = await storage.getDrivingForces(projectId, void 0, {}, {
            limit: 100,
            includeSignals: false
          }, userId);
          return { projectId, forces, total };
        })
      );
      res.json(results);
    } catch (error) {
      console.error("Failed to batch get forces:", error);
      res.status(500).json({ error: "Failed to retrieve forces for projects" });
    }
  });
  const forceStatsSchema = z2.object({
    projectIds: z2.array(z2.string()).min(1).max(100)
  });
  app2.post("/api/v1/scanning/forces/stats", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const validation = forceStatsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid request body",
          details: validation.error.errors
        });
      }
      const { projectIds } = validation.data;
      const counts = await storage.getForceCountsByProjectIds(projectIds, userId);
      const stats = projectIds.map((projectId) => ({
        projectId,
        total: counts[projectId]?.total || 0
      }));
      res.json({ stats });
    } catch (error) {
      console.error("Failed to get batched force statistics:", error);
      res.status(500).json({ error: "Failed to retrieve force statistics" });
    }
  });
  app2.post("/api/v1/auth/dev-token", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({ error: "Development tokens are not available in production" });
      }
      const { userId, email, subscriptionTier, subscriptionStatus } = req.body;
      if (!userId || !email) {
        return res.status(400).json({ error: "userId and email are required" });
      }
      const { generateToken: generateToken2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
      const token = generateToken2({
        userId,
        email,
        subscriptionTier: subscriptionTier || "professional",
        subscriptionStatus: subscriptionStatus || "active"
      }, "24h");
      res.json({ token });
    } catch (error) {
      console.error("Failed to generate development token:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  });
  app2.post("/api/v1/chat/stream", authenticateToken, async (req, res) => {
    const abortController = new AbortController();
    let connectionClosed = false;
    const cleanup = () => {
      if (connectionClosed) return;
      connectionClosed = true;
      abortController.abort();
      if (!res.writableEnded) {
        res.end();
      }
    };
    req.on("error", cleanup);
    try {
      const { query, projectId, project_id, threadId, thread_id, assistantType, assistant_type, context, images } = req.body;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
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
          enrichedContext = {
            ...context,
            selectedForces: forces,
            forcesCount: context.forcesCount || forces.length,
            clustersCount: context.clustersCount || 0
          };
          console.log(`[Chat Route] Enriched context with ${forces.length} driving forces`);
        } catch (error) {
          console.error("[Chat Route] Error fetching driving forces:", error);
        }
      }
      const { openaiService: openaiService2 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
      await openaiService2.streamAssistantResponse(
        query,
        enrichedContext,
        assistantType || assistant_type || "copilot",
        threadId || thread_id || null,
        (chunk) => {
          if (!connectionClosed && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}

`);
          }
        },
        (finalThreadId) => {
          if (!connectionClosed && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: "done", threadId: finalThreadId })}

`);
            res.end();
          }
        },
        (error) => {
          if (!connectionClosed && !res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: "error", error })}

`);
            res.end();
          }
        },
        images,
        abortController.signal
      );
    } catch (error) {
      console.error("Chat streaming error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Chat service unavailable" });
      } else if (!connectionClosed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}

`);
        res.end();
      }
    }
  });
  app2.get("/api/v1/chat/image/:fileId", authenticateToken, async (req, res) => {
    try {
      const { fileId } = req.params;
      const LOG_FILE2 = path5.join(__dirname4, "debug.log");
      const logToFile2 = (msg) => {
        try {
          fs3.appendFileSync(LOG_FILE2, `[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}
`);
        } catch (e) {
        }
      };
      logToFile2(`[Image Proxy] Request for file: ${fileId}`);
      console.log(`[Image Proxy] Request for file: ${fileId}`);
      if (!fileId) {
        return res.status(400).json({ error: "File ID is required" });
      }
      const { openaiService: openaiService2 } = await Promise.resolve().then(() => (init_openai(), openai_exports));
      const imageBuffer = await openaiService2.getImageContent(fileId);
      if (!imageBuffer) {
        logToFile2(`[Image Proxy] Image not found for ID: ${fileId}`);
        console.error(`[Image Proxy] Image not found for ID: ${fileId}`);
        return res.status(404).json({ error: "Image not found" });
      }
      logToFile2(`[Image Proxy] Serving image ${fileId}, size: ${imageBuffer.byteLength} bytes`);
      console.log(`[Image Proxy] Serving image ${fileId}, size: ${imageBuffer.byteLength} bytes`);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      res.send(Buffer.from(imageBuffer));
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(500).json({ error: "Failed to retrieve image" });
    }
  });
  app2.post("/api/v1/chat", authenticateToken, async (req, res) => {
    try {
      res.json({
        message: "Use /api/v1/chat/stream for chat functionality",
        success: false
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Chat service unavailable" });
    }
  });
  app2.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.get("/api/v1/projects/:projectId/conversations", authenticateToken, async (req, res) => {
    try {
      const conversations2 = await storage.getConversations(req.params.projectId);
      res.json(conversations2);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/v1/projects/:projectId/conversations", authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const conversation = await storage.createConversation({
        ...req.body,
        projectId: req.params.projectId,
        userId
      });
      res.json(conversation);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });
  app2.get("/api/v1/conversations/:id", authenticateToken, async (req, res) => {
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
  app2.put("/api/v1/conversations/:id", authenticateToken, async (req, res) => {
    try {
      const conversation = await storage.updateConversation(req.params.id, req.body);
      res.json(conversation);
    } catch (error) {
      console.error("Failed to update conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });
  app2.delete("/api/v1/conversations/:id", authenticateToken, async (req, res) => {
    try {
      await storage.deleteConversation(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });
  app2.get("/api/v1/users/:userId/projects/:projectId/state", authenticateToken, async (req, res) => {
    try {
      const { userId, projectId } = req.params;
      const requestUserId = req.user.userId;
      if (requestUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized to access this user's project state" });
      }
      const { userProjectStateService: userProjectStateService2 } = await Promise.resolve().then(() => (init_userProjectState(), userProjectState_exports));
      const state = await userProjectStateService2.getUserProjectState(userId, projectId);
      if (!state) {
        return res.json({
          selectedForces: [],
          searchedForces: [],
          scanningFilters: {},
          committedRadarFilters: {},
          copilotThreadId: null
        });
      }
      res.json(state);
    } catch (error) {
      console.error("Failed to get user project state:", error);
      res.status(500).json({ error: "Failed to retrieve user project state" });
    }
  });
  app2.put("/api/v1/users/:userId/projects/:projectId/state", authenticateToken, async (req, res) => {
    try {
      const { userId, projectId } = req.params;
      const requestUserId = req.user.userId;
      if (requestUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized to modify this user's project state" });
      }
      const { userProjectStateService: userProjectStateService2 } = await Promise.resolve().then(() => (init_userProjectState(), userProjectState_exports));
      const state = await userProjectStateService2.saveUserProjectState(userId, projectId, req.body);
      res.json(state);
    } catch (error) {
      console.error("Failed to save user project state:", error);
      res.status(500).json({ error: "Failed to save user project state" });
    }
  });
  app2.delete("/api/v1/users/:userId/projects/:projectId/state", authenticateToken, async (req, res) => {
    try {
      const { userId, projectId } = req.params;
      const requestUserId = req.user.userId;
      if (requestUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized to delete this user's project state" });
      }
      const { userProjectStateService: userProjectStateService2 } = await Promise.resolve().then(() => (init_userProjectState(), userProjectState_exports));
      const success = await userProjectStateService2.deleteUserProjectState(userId, projectId);
      if (!success) {
        return res.status(404).json({ error: "Project state not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      console.error("Failed to delete user project state:", error);
      res.status(500).json({ error: "Failed to delete user project state" });
    }
  });
  app2.get("/api/v1/users/:userId/project-states", authenticateToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const requestUserId = req.user.userId;
      if (requestUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized to access this user's project states" });
      }
      const { userProjectStateService: userProjectStateService2 } = await Promise.resolve().then(() => (init_userProjectState(), userProjectState_exports));
      const states = await userProjectStateService2.getAllUserProjectStates(userId);
      res.json(states);
    } catch (error) {
      console.error("Failed to get user project states:", error);
      res.status(500).json({ error: "Failed to retrieve user project states" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs4 from "fs";
import path7 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path6 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path6.resolve(import.meta.dirname, "client", "src"),
      "@shared": path6.resolve(import.meta.dirname, "shared"),
      "@assets": path6.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path6.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path6.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path7.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path7.resolve(import.meta.dirname, "public");
  if (!fs4.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path7.resolve(distPath, "index.html"));
  });
}

// server/services/fixed-data-loader.ts
import { readFileSync, existsSync as existsSync2 } from "fs";
import { createHash } from "crypto";
import * as XLSX from "xlsx";
var StartupIntegrityError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "StartupIntegrityError";
  }
};
var DEFAULT_DATASET_FILE = "data/ORION_Scanning_DB_Updated.parquet";
var DEFAULT_FEATURES_FILE = "data/precomputed_features.pkl";
var REQUIRED_FEATURES_COLUMNS = [
  "id",
  "cluster_labels",
  "cluster_titles",
  "umap2d_x",
  "umap2d_y"
];
var OPTIONAL_FEATURES_COLUMNS = [
  "tsne_x",
  "tsne_y",
  "tsne_z",
  "umap3d_x",
  "umap3d_y",
  "umap3d_z"
];
var _cachedDataset = null;
var _cachedFeatures = null;
var _cachedMergedData = null;
var _featuresColumnsPresent = null;
function getFilePaths() {
  const datasetFile = process.env.DATASET_FILE || DEFAULT_DATASET_FILE;
  const featuresFile = process.env.FEATURES_FILE || DEFAULT_FEATURES_FILE;
  const strictMode = (process.env.STRICT_FEATURES || "true").toLowerCase() === "true";
  return { datasetFile, featuresFile, strictMode };
}
function deriveIdFromContent(row) {
  const contentParts = [];
  if (row.title || row.Title) {
    contentParts.push(String(row.title || row.Title || ""));
  }
  if (row.type || row.Type || row["Driving Force"]) {
    contentParts.push(String(row.type || row.Type || row["Driving Force"] || ""));
  }
  if (row.steep || row.STEEP) {
    contentParts.push(String(row.steep || row.STEEP || ""));
  }
  if (row.source || row.Source) {
    contentParts.push(String(row.source || row.Source || ""));
  }
  if (contentParts.length === 0) {
    contentParts.push(String(Math.random()));
  }
  const contentString = contentParts.join("|");
  return createHash("sha256").update(contentString).digest("hex").substring(0, 16);
}
async function loadDataset(datasetFile) {
  console.log(`Loading dataset from: ${datasetFile}`);
  let filePath = datasetFile;
  if (datasetFile.endsWith(".parquet")) {
    const xlsxFile = datasetFile.replace(".parquet", ".xlsx");
    if (existsSync2(xlsxFile)) {
      filePath = xlsxFile;
      console.log(`Using Excel fallback: ${xlsxFile}`);
    } else {
      throw new Error(`Parquet support not fully implemented yet. Please provide Excel file: ${xlsxFile}`);
    }
  }
  if (!existsSync2(filePath)) {
    throw new Error(`Dataset file not found: ${filePath}`);
  }
  try {
    const buffer = readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("No sheets found in Excel file");
    }
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    console.log(`Successfully loaded ${data.length} rows from dataset`);
    data.forEach((row, index2) => {
      if (!row.id && !row.ID) {
        row.id = deriveIdFromContent(row);
      } else if (row.ID && !row.id) {
        row.id = String(row.ID);
      }
    });
    return data;
  } catch (error) {
    throw new Error(`Failed to load dataset: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function loadFeatures(featuresFile) {
  console.log(`Loading features from: ${featuresFile}`);
  if (!existsSync2(featuresFile)) {
    throw new Error(`Features file not found: ${featuresFile}`);
  }
  let features;
  if (featuresFile.endsWith(".pkl")) {
    throw new Error(`Pickle support not implemented yet. Please provide JSON version of features file.`);
  } else if (featuresFile.endsWith(".json")) {
    try {
      const data = readFileSync(featuresFile, "utf-8");
      features = JSON.parse(data);
    } catch (error) {
      throw new Error(`Failed to load JSON features: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  } else {
    throw new Error(`Unsupported features file format: ${featuresFile}`);
  }
  const missingColumns = REQUIRED_FEATURES_COLUMNS.filter((col) => !(col in features));
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns in features file: ${missingColumns.join(", ")}`);
  }
  const availableColumns = Object.keys(features);
  const optionalPresent = OPTIONAL_FEATURES_COLUMNS.filter((col) => col in features);
  console.log(`Features file contains ${availableColumns.length} columns:`);
  console.log(`- Required: ${REQUIRED_FEATURES_COLUMNS.filter((col) => col in features).join(", ")}`);
  if (optionalPresent.length > 0) {
    console.log(`- Optional: ${optionalPresent.join(", ")}`);
  }
  _featuresColumnsPresent = availableColumns;
  return features;
}
function mergeDatasetAndFeatures(dataset, features, strictMode) {
  console.log(`Merging dataset (${dataset.length} rows) with features (${features.id.length} entries)`);
  const datasetIdSet = new Set(dataset.map((row) => row.id).filter(Boolean));
  const featuresIdSet = new Set(features.id);
  const intersection = new Set(Array.from(datasetIdSet).filter((id) => id !== void 0 && featuresIdSet.has(id)));
  const coverage = intersection.size / datasetIdSet.size;
  console.log(`Dataset-Features coverage: ${(coverage * 100).toFixed(1)}% (${intersection.size}/${datasetIdSet.size})`);
  if (strictMode && coverage < 0.95) {
    throw new StartupIntegrityError(
      `Insufficient dataset-features coverage: ${(coverage * 100).toFixed(1)}% < 95%. Expected high coverage in strict mode.`
    );
  }
  const featuresMap = /* @__PURE__ */ new Map();
  features.id.forEach((id, index2) => {
    featuresMap.set(id, {
      cluster_label: features.cluster_labels[index2],
      cluster_title: features.cluster_titles[index2],
      umap2d_x: features.umap2d_x[index2],
      umap2d_y: features.umap2d_y[index2],
      // Include optional features if present
      ...features.tsne_x && { tsne_x: features.tsne_x[index2] },
      ...features.tsne_y && { tsne_y: features.tsne_y[index2] },
      ...features.tsne_z && { tsne_z: features.tsne_z[index2] },
      ...features.umap3d_x && { umap3d_x: features.umap3d_x[index2] },
      ...features.umap3d_y && { umap3d_y: features.umap3d_y[index2] },
      ...features.umap3d_z && { umap3d_z: features.umap3d_z[index2] }
    });
  });
  const mergedData = dataset.map((row) => {
    const featuresData = featuresMap.get(row.id);
    return {
      ...row,
      ...featuresData
    };
  });
  const mergedWithFeatures = mergedData.filter((row) => row.cluster_label !== void 0).length;
  console.log(`Merged dataset: ${mergedData.length} total rows, ${mergedWithFeatures} with features`);
  return mergedData;
}
async function getDataset() {
  if (_cachedDataset) {
    return _cachedDataset;
  }
  const { datasetFile } = getFilePaths();
  _cachedDataset = await loadDataset(datasetFile);
  return _cachedDataset;
}
async function getFeatures() {
  if (_cachedFeatures) {
    return _cachedFeatures;
  }
  const { featuresFile } = getFilePaths();
  _cachedFeatures = await loadFeatures(featuresFile);
  return _cachedFeatures;
}
async function getMergedData() {
  if (_cachedMergedData) {
    return _cachedMergedData;
  }
  const { strictMode } = getFilePaths();
  const dataset = await getDataset();
  const features = await getFeatures();
  _cachedMergedData = mergeDatasetAndFeatures(dataset, features, strictMode);
  return _cachedMergedData;
}
async function getIntegrityStatus() {
  const { datasetFile, featuresFile, strictMode } = getFilePaths();
  const status = {
    valid: true,
    dataset: { loaded: false, file: datasetFile, rows: void 0 },
    features: { loaded: false, file: featuresFile, entries: void 0, columns: void 0 },
    merged: { created: false, rows: void 0, coverage: void 0 },
    strictMode,
    errors: []
  };
  try {
    const dataset = await getDataset();
    status.dataset.loaded = true;
    status.dataset.rows = dataset.length;
  } catch (error) {
    status.valid = false;
    status.errors.push(`Dataset loading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  try {
    const features = await getFeatures();
    status.features.loaded = true;
    status.features.entries = features.id.length;
    status.features.columns = _featuresColumnsPresent || [];
  } catch (error) {
    status.valid = false;
    status.errors.push(`Features loading failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  try {
    const merged = await getMergedData();
    status.merged.created = true;
    status.merged.rows = merged.length;
    if (status.dataset.loaded && status.features.loaded) {
      const datasetRows = status.dataset.rows || 0;
      const mergedWithFeatures = merged.filter((row) => row.cluster_label !== void 0).length;
      status.merged.coverage = datasetRows > 0 ? mergedWithFeatures / datasetRows : 0;
    }
  } catch (error) {
    status.valid = false;
    status.errors.push(`Data merging failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  return status;
}
function isFixedLoaderEnabled() {
  return !!(process.env.FEATURES_FILE || process.env.DATASET_FILE);
}
async function validateStartupIntegrity() {
  if (!isFixedLoaderEnabled()) {
    return;
  }
  const { strictMode } = getFilePaths();
  if (!strictMode) {
    return;
  }
  console.log("\u{1F50D} Running startup integrity validation in strict mode...");
  const status = await getIntegrityStatus();
  if (!status.valid) {
    throw new StartupIntegrityError(
      `Startup integrity validation failed in strict mode:
${status.errors.join("\n")}`
    );
  }
  console.log("\u2705 Startup integrity validation passed");
}

// server/services/integrity-validator.ts
import { readFileSync as readFileSync2, writeFileSync, existsSync as existsSync3 } from "fs";
import { createHash as createHash2 } from "crypto";
import { execSync } from "child_process";
function calculateFileHash(filePath) {
  const integrity = {
    path: filePath,
    exists: existsSync3(filePath)
  };
  if (!integrity.exists) {
    integrity.error = "File does not exist";
    return integrity;
  }
  try {
    const buffer = readFileSync2(filePath);
    integrity.size = buffer.length;
    integrity.sha256 = createHash2("sha256").update(buffer).digest("hex");
    integrity.readable = true;
  } catch (error) {
    integrity.readable = false;
    integrity.error = error instanceof Error ? error.message : "Unknown error";
  }
  return integrity;
}
function getAppVersion() {
  if (process.env.APP_VERSION) {
    return process.env.APP_VERSION;
  }
  try {
    const gitHash = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
      cwd: process.cwd()
    }).trim();
    return `git-${gitHash}`;
  } catch {
    try {
      const packageJson = JSON.parse(readFileSync2("package.json", "utf-8"));
      return `pkg-${packageJson.version || "unknown"}`;
    } catch {
      return "unknown";
    }
  }
}
async function generateIntegrityManifest() {
  console.log("\u{1F50D} Generating integrity manifest...");
  const { datasetFile, featuresFile, strictMode } = getFilePaths();
  const allowReprocess = (process.env.ALLOW_REPROCESS || "false").toLowerCase() === "true";
  const files = [
    calculateFileHash(datasetFile),
    calculateFileHash(featuresFile)
  ];
  const fixedLoaderStatus = await getIntegrityStatus();
  const dataIntegrity = {
    dataset: {
      loaded: fixedLoaderStatus.dataset.loaded,
      rows: fixedLoaderStatus.dataset.rows,
      hasId: true
      // Assume true since we derive IDs
    },
    features: {
      loaded: fixedLoaderStatus.features.loaded,
      entries: fixedLoaderStatus.features.entries,
      requiredColumns: ["id", "cluster_labels", "cluster_titles", "umap2d_x", "umap2d_y"],
      optionalColumns: fixedLoaderStatus.features.columns
    }
  };
  if (fixedLoaderStatus.dataset.loaded && fixedLoaderStatus.features.loaded && fixedLoaderStatus.merged.coverage !== void 0) {
    const datasetRows = fixedLoaderStatus.dataset.rows || 0;
    const featuresEntries = fixedLoaderStatus.features.entries || 0;
    const intersectionCount = Math.round((fixedLoaderStatus.merged.coverage || 0) * datasetRows);
    dataIntegrity.coverage = {
      datasetIds: datasetRows,
      featuresIds: featuresEntries,
      intersection: intersectionCount,
      percentage: fixedLoaderStatus.merged.coverage || 0
    };
  }
  const validation = {
    passed: fixedLoaderStatus.valid,
    errors: [...fixedLoaderStatus.errors],
    warnings: []
  };
  files.forEach((file) => {
    if (!file.exists) {
      validation.errors.push(`Missing file: ${file.path}`);
    } else if (!file.readable) {
      validation.errors.push(`Unreadable file: ${file.path} - ${file.error}`);
    }
  });
  if (dataIntegrity.coverage && dataIntegrity.coverage.percentage < 0.9) {
    validation.warnings.push(
      `Low dataset-features coverage: ${(dataIntegrity.coverage.percentage * 100).toFixed(1)}%`
    );
  }
  if (strictMode && validation.errors.length > 0) {
    validation.passed = false;
  }
  const manifest = {
    version: getAppVersion(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    environment: {
      strictFeatures: strictMode,
      allowReprocess,
      featuresFile,
      datasetFile
    },
    files,
    data: dataIntegrity,
    validation,
    checksum: ""
    // Will be calculated after
  };
  const { checksum, ...manifestForChecksum } = manifest;
  manifest.checksum = createHash2("sha256").update(JSON.stringify(manifestForChecksum, null, 2)).digest("hex");
  return manifest;
}
async function performIntegrityCheck() {
  console.log("\u{1F50D} Performing comprehensive integrity check...");
  if (!isFixedLoaderEnabled()) {
    return {
      status: "healthy",
      manifest: {},
      summary: "Fixed loader not enabled - using standard data loading"
    };
  }
  try {
    const manifest = await generateIntegrityManifest();
    let status;
    let summary;
    if (!manifest.validation.passed) {
      status = "critical";
      summary = `Critical integrity failures: ${manifest.validation.errors.length} errors`;
    } else if (manifest.validation.warnings.length > 0) {
      status = "degraded";
      summary = `Integrity check passed with ${manifest.validation.warnings.length} warnings`;
    } else {
      status = "healthy";
      summary = "All integrity checks passed";
    }
    console.log(`\u2705 Integrity check complete: ${status.toUpperCase()} - ${summary}`);
    return { status, manifest, summary };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`\u274C Integrity check failed: ${errorMessage}`);
    return {
      status: "critical",
      manifest: {},
      summary: `Integrity check failed: ${errorMessage}`
    };
  }
}
async function validateStartupIntegrity2() {
  if (!isFixedLoaderEnabled()) {
    return;
  }
  const { strictMode } = getFilePaths();
  if (!strictMode) {
    return;
  }
  console.log("\u{1F512} Running startup integrity validation in strict mode...");
  const integrityCheck = await performIntegrityCheck();
  if (integrityCheck.status === "critical") {
    throw new StartupIntegrityError(
      `Startup integrity validation failed in strict mode: ${integrityCheck.summary}`
    );
  }
  if (integrityCheck.status === "degraded") {
    console.warn(`\u26A0\uFE0F  Startup integrity validation passed with warnings: ${integrityCheck.summary}`);
  } else {
    console.log("\u2705 Startup integrity validation passed");
  }
}

// server/services/database-seeder.ts
init_db();
init_schema();
import { readFileSync as readFileSync3, existsSync as existsSync4 } from "fs";
import { join as join3 } from "path";
import { eq as eq3, sql as sql4 } from "drizzle-orm";
var DatabaseSeeder = class {
  seedFilePath;
  constructor() {
    this.seedFilePath = join3(process.cwd(), "server/seed-data/driving-forces.json");
  }
  /**
   * Check if seeding is needed and execute if necessary
   */
  async seedIfNeeded() {
    try {
      console.log("[DatabaseSeeder] Checking if seeding is needed...");
      if (!existsSync4(this.seedFilePath)) {
        console.log("[DatabaseSeeder] No seed file found, skipping auto-seed");
        return;
      }
      const seedData = JSON.parse(readFileSync3(this.seedFilePath, "utf-8"));
      const expectedCount = seedData.length;
      const defaultProject = await this.ensureDefaultProject();
      const [forceCount] = await db.select({ count: sql4`count(*)` }).from(drivingForces).where(eq3(drivingForces.projectId, defaultProject.id));
      const count2 = Number(forceCount?.count || 0);
      if (count2 === expectedCount) {
        console.log(`[DatabaseSeeder] Default project has complete dataset (${count2}/${expectedCount} forces), skipping seed`);
        return;
      }
      if (count2 > 0 && count2 < expectedCount) {
        console.warn(`[DatabaseSeeder] \u26A0\uFE0F  PARTIAL DATASET DETECTED! Found ${count2}/${expectedCount} forces`);
        console.warn(`[DatabaseSeeder] This likely means a previous import failed mid-way.`);
        console.warn(`[DatabaseSeeder] Clearing incomplete data and retrying full import...`);
        await db.delete(drivingForces).where(eq3(drivingForces.projectId, defaultProject.id));
        console.log("[DatabaseSeeder] Cleared partial data, starting fresh import...");
      } else if (count2 === 0) {
        console.log("[DatabaseSeeder] Default project is empty, starting seed process...");
      }
      await this.importSeedData(defaultProject.id);
    } catch (error) {
      console.error("[DatabaseSeeder] Seeding failed:", error);
      console.error("[DatabaseSeeder] Server will continue with empty database");
    }
  }
  /**
   * Ensure default project exists
   */
  async ensureDefaultProject() {
    const [existingDefault] = await db.select().from(projects).where(eq3(projects.isDefault, true)).limit(1);
    if (existingDefault) {
      return existingDefault;
    }
    console.log("[DatabaseSeeder] Creating default project...");
    const [newDefault] = await db.insert(projects).values({
      name: "ORION Global Dataset",
      description: "Global strategic intelligence database with 29,770+ driving forces",
      isDefault: true
    }).returning();
    return newDefault;
  }
  /**
   * Import seed data from JSON file
   */
  async importSeedData(projectId) {
    console.log(`[DatabaseSeeder] Reading seed file: ${this.seedFilePath}`);
    const seedData = JSON.parse(
      readFileSync3(this.seedFilePath, "utf-8")
    );
    console.log(`[DatabaseSeeder] Loaded ${seedData.length} forces from seed file`);
    const forcesToInsert = seedData.map((force) => {
      const insertData = {
        projectId,
        title: force.title,
        type: force.type
      };
      if (force.steep !== void 0) insertData.steep = force.steep;
      if (force.dimension !== void 0) insertData.dimension = force.dimension;
      if (force.scope !== void 0) insertData.scope = force.scope;
      if (force.impact !== void 0) insertData.impact = force.impact;
      if (force.ttm !== void 0) insertData.ttm = force.ttm;
      if (force.sentiment !== void 0) insertData.sentiment = force.sentiment;
      if (force.source !== void 0) insertData.source = force.source;
      if (force.tags !== void 0) insertData.tags = force.tags;
      if (force.text !== void 0) insertData.text = force.text;
      if (force.magnitude !== void 0) insertData.magnitude = force.magnitude;
      if (force.distance !== void 0) insertData.distance = force.distance;
      if (force.colorHex !== void 0) insertData.colorHex = force.colorHex;
      if (force.feasibility !== void 0) insertData.feasibility = force.feasibility;
      if (force.urgency !== void 0) insertData.urgency = force.urgency;
      return insertData;
    });
    const batchSize = 500;
    const totalBatches = Math.ceil(forcesToInsert.length / batchSize);
    console.log(`[DatabaseSeeder] Importing ${forcesToInsert.length} forces in ${totalBatches} batches...`);
    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, forcesToInsert.length);
      const batch = forcesToInsert.slice(startIndex, endIndex);
      await db.insert(drivingForces).values(batch);
      const progress = ((i + 1) / totalBatches * 100).toFixed(1);
      console.log(`[DatabaseSeeder] Progress: ${progress}% (batch ${i + 1}/${totalBatches})`);
    }
    const [finalCount] = await db.select({ count: sql4`count(*)` }).from(drivingForces).where(eq3(drivingForces.projectId, projectId));
    const imported = Number(finalCount?.count || 0);
    if (imported !== forcesToInsert.length) {
      console.error(`[DatabaseSeeder] \u274C Import verification FAILED! Expected ${forcesToInsert.length} but got ${imported} forces`);
      throw new Error(`Incomplete import: ${imported}/${forcesToInsert.length} forces`);
    }
    console.log(`[DatabaseSeeder] \u2705 Successfully imported ${imported} driving forces`);
    const typeStats = await db.select({
      type: drivingForces.type,
      count: sql4`count(*)`
    }).from(drivingForces).where(eq3(drivingForces.projectId, projectId)).groupBy(drivingForces.type);
    console.log("[DatabaseSeeder] Type distribution:");
    typeStats.forEach((stat) => {
      const typeName = {
        "M": "Megatrends",
        "T": "Trends",
        "WS": "Weak Signals",
        "WC": "Wildcards",
        "S": "Signals"
      }[stat.type] || stat.type;
      console.log(`  ${typeName}: ${stat.count}`);
    });
  }
};
var databaseSeeder = new DatabaseSeeder();

// server/index.ts
function validateEnvironment() {
  const required = ["DATABASE_URL"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error("\u274C FATAL: Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nProduction deployment requires these variables to be set.");
    console.error("See replit.md for deployment checklist.");
    process.exit(1);
  }
  const optional = ["OPENAI_API_KEY"];
  const missingOptional = optional.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn("\u26A0\uFE0F  Optional environment variables not set (some features may be unavailable):");
    missingOptional.forEach((key) => {
      console.warn(`   - ${key}`);
    });
  }
}
if (process.env.NODE_ENV === "production") {
  validateEnvironment();
}
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Promise Rejection:", reason);
  console.error("Promise:", promise);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.set("etag", false);
app.disable("etag");
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024
    // 200MB limit for large database imports
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/json"];
    const allowedExtensions = [".csv", ".xls", ".xlsx", ".json"];
    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some((ext) => file.originalname.toLowerCase().endsWith(ext));
    if (hasValidType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV, Excel, and JSON files are allowed."));
    }
  }
});
app.locals.upload = upload;
app.use((req, res, next) => {
  const start = Date.now();
  const path8 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path8.startsWith("/api")) {
      let logLine = `${req.method} ${path8} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    log("Ensuring default project invariant...");
    await storage.ensureDefaultProject();
    log("Default project invariant verified");
    log("Checking database seed status...");
    await databaseSeeder.seedIfNeeded();
    log("Database seed check completed");
    log("Running fixed loader startup integrity validation...");
    try {
      await validateStartupIntegrity();
      await validateStartupIntegrity2();
      log("Fixed loader integrity validation completed");
    } catch (error) {
      if (error instanceof Error && error.name === "StartupIntegrityError") {
        console.error("\u{1F6A8} CRITICAL: Fixed loader integrity validation failed");
        console.error(error.message);
        console.error("\u26A0\uFE0F  Continuing with degraded functionality...");
      } else {
        console.warn("Fixed loader integrity check encountered issues:", error instanceof Error ? error.message : error);
      }
    }
  } catch (error) {
    console.error("Failed to ensure default project:", error);
    throw error;
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("[Express Error Handler]", err);
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
