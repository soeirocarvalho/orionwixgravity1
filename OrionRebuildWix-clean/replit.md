# ORION - Strategic Intelligence Platform

## Overview

ORION is a strategic intelligence and futures research platform designed for analyzing driving forces, trends, and scenario planning using a three-lens scanning approach (Megatrends, Trends, and Weak Signals & Wildcards). It provides analytics, AI-powered insights, and report generation for strategic decision-making, aiming to support business vision and market potential. The platform is a full-stack TypeScript application integrating with OpenAI's GPT models for intelligent analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## Codebase Structure

### Core Directories
- **`client/`** - React frontend application (TypeScript + Vite)
- **`server/`** - Express.js backend API (TypeScript)
- **`shared/`** - Shared types and schemas (TypeScript)
- **`backend/`** - Python services for ML clustering
- **`scripts/`** - Maintenance utilities
  - `seed-subscription-plans.ts` - Seed Stripe subscription plans
  - `export-seed-data.ts` - Export database seed data
  - `validate-build.js` - Build validation
- **`attached_assets/`** - ML and legacy data files
  - `precomputed_features_1758013839680.pkl` - Precomputed embeddings for clustering
  - `old_cluster_data.json` - Legacy cluster mappings for import

### Configuration Files
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `drizzle.config.ts` - Database ORM configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `pyproject.toml` - Python dependencies for ML services

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript, built using Vite.
- **UI Components**: Shadcn/ui (Radix UI-based) for accessible components.
- **Styling**: Tailwind CSS with CSS custom properties for theming (dark/light modes).
- **State Management**: Zustand for global state with localStorage persistence, TanStack Query for server state.
  - Search input persists immediately to prevent race conditions during navigation
  - Debounced search (300ms) used only for API calls to reduce server load
- **Routing**: Wouter for client-side routing.
- **Data Visualization**: Placeholder components for D3.js/Plotly.js charts.
- Custom ORION logo integrated throughout the application interface.
- Floating particles animation implemented on key unauthenticated and project pages.
- Simplified project creation process, removing complex project type selectors.
- Users start with a clean slate (zero projects) and create them intentionally.
- Confirmation dialogs for destructive actions like report deletion.

### Technical Implementations
- **Backend**: Node.js with Express.js, TypeScript, and ESM modules.
- **API Design**: RESTful API with structured route handlers.
- **Database ORM**: Drizzle ORM for type-safe operations with PostgreSQL.
- **Real-time Communication**: Server-sent events (SSE) for streaming AI responses and job status.
  - `/api/v1/chat/stream` endpoint handles streaming chat for both Scanning Assistant and ORION Copilot
  - Implements proper client disconnect handling using AbortController to prevent resource leaks
  - SSE events: `chunk` (text deltas), `done` (completion with threadId), `error` (error messages)
  - Idempotent cleanup prevents double execution when both 'close' and 'error' events fire
- **Background Jobs**: System for long-running tasks.
- **Authentication**: JWT-based authentication with Wix integration via iframe postMessage.
  - Frontend receives JWT tokens from Wix parent window
  - Tokens stored in localStorage and attached to all API requests as Bearer tokens
  - Development endpoint (/api/v1/auth/dev-token) generates test tokens for local testing
  - Automatic token expiration handling: detects 401/403 responses, clears expired tokens, redirects to login
  - User-friendly error messages for expired sessions during onboarding
- **Authorization**: Admin and user roles, with multi-tenant data isolation enforced at storage layer.
- **Core Business Logic**:
    - Three-Lens Framework: Categorizes driving forces (Megatrends, Trends, Weak Signals/Wildcards).
    - STEEP Analysis: Classifies forces by Social, Technological, Economic, Environmental, and Political dimensions.
    - Clustering Engine: Machine learning for grouping related driving forces using embeddings.
    - Impact Assessment: Scoring system for evaluating force impact and time-to-market.
    - Sentiment Analysis: Classification of driving forces.
    - Duplication Prevention: User projects start empty, falling back to a global default project based on subscription tier.
    - Project Context: ORION Copilot and Scanning Assistant access project-specific driving forces for context-aware analysis.

### System Design Choices
- **Primary Database**: PostgreSQL with Neon serverless hosting.
- **Schema Design**: Normalized tables for projects, driving forces, clusters, workspaces, jobs, and reports, supporting arrays, JSON objects, and vector references.
- **Migration System**: Drizzle Kit for schema versioning.
- **Multi-Tenant Architecture**:
  - All user-scoped tables (projects, clusters, clusteringReports, workspaces, jobs, reports, savedSearches) include userId column with NOT NULL constraint and FK to users table
  - System user (ID: '00000000-0000-0000-0000-000000000000') owns the 29,770 default driving forces
  - Storage layer validates project ownership before allowing access to project-scoped data
  - Cross-tenant data access prevented via ownership validation at storage layer
  - User onboarding creates user record and default empty project on first login
  - Users access system forces based on subscription tier (no force duplication)
- **Automatic Database Seeding**: On first server startup, the database automatically seeds 29,770 driving forces from a bundled JSON file. This process is idempotent, handles partial imports, and validates the exact count.
- **Subscription Enforcement**: Users require an active subscription or trial to access ORION features. Protected routes enforce access based on subscription tiers (Basic, Professional, Enterprise) and trial status.
- **Subscription Management Page**: Allows users to view current plan, change plans, manage payment methods via Stripe billing portal, and cancel/reactivate subscriptions.

## External Dependencies

### AI and Machine Learning
- **OpenAI Assistant API**: Used for ORION Scanning Intelligence Assistant and ORION Strategic Copilot.
- **Image Analysis**: OpenAI visual processing for PNG, JPG, JPEG, GIF, WebP.
- **Text Embeddings**: OpenAI's `text-embedding-3-large` model.

### Database and Hosting
- **Neon Database**: Serverless PostgreSQL hosting.
- **Database Driver**: `@neondatabase/serverless`.

### Development and Deployment
- **Replit Platform**: Development environment.
- **Build Tools**: Vite (frontend), esbuild (backend).
- **Package Manager**: NPM.

### UI and Visualization Libraries
- **Radix UI**: Accessible UI primitives.
- **React Hook Form**: Form handling with validation.
- **Date-fns**: Date manipulation.
- **D3.js**: Data visualization library (planned).

### Utility Libraries
- **Zod**: Schema validation.
- **Clsx/Tailwind Merge**: CSS class name utilities.
- **Nanoid**: Unique ID generation.

### Payment Processing
- **Stripe**: For subscription management, checkout, and webhooks. Configured for Live Mode with Basic, Professional, and Enterprise plans.