import { create } from "zustand";
import { persist } from "zustand/middleware";
import { scanningEvents } from "./scanningEvents";
import { apiRequest } from "./queryClient"; // Assuming we can use this or fetch directly

// Project-specific state that is isolated per project
export interface ProjectState {
  selectedForces: string[];
  searchedForces: string[];
  scanningFilters: ScanningFilters;
  committedRadarFilters: ScanningFilters;
  orionCopilotThreadId: string | null;
  lastSyncedAt?: number;
}

// Global application state
interface AppState {
  // Hydration state tracking
  _hasHydrated: boolean;
  _setHasHydrated: (hasHydrated: boolean) => void;

  // User Context
  userId: string | null;
  setUserId: (userId: string | null) => void;

  // Current project selection
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;

  // Project-specific states keyed by project ID
  projectStates: Record<string, ProjectState>;

  // Server Sync Actions
  loadUserProjectStates: () => Promise<void>;
  saveProjectState: (projectId: string) => Promise<void>;
  clearUserProjectStates: () => void;

  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Forces view mode
  viewMode: "curated" | "all";
  setViewMode: (mode: "curated" | "all") => void;

  // Job notifications
  jobNotifications: JobNotification[];
  addJobNotification: (notification: JobNotification) => void;
  removeJobNotification: (id: string) => void;
  clearJobNotifications: () => void;

  // Chat history - Global for now, but filtered by project in UI
  chatHistory: ChatSession[];
  addChatSession: (session: ChatSession) => void;
  updateChatSession: (id: string, session: Partial<ChatSession>) => void;
  clearChatHistory: () => void;

  // ORION Copilot integration mode (global flag)
  isOrionCopilotProjectModeActive: boolean;
  setOrionCopilotProjectMode: (active: boolean) => void;

  // PROXY METHODS - These operate on the CURRENT project's state
  toggleForceSelection: (forceId: string) => void;
  selectForces: (forceIds: string[], mode: 'add' | 'remove' | 'replace') => void;
  clearSelection: () => void;
  isForceSelected: (forceId: string) => boolean;

  setSearchedForces: (forceIds: string[]) => void;
  clearSearchedForces: () => void;

  setScanningFilters: (filters: Partial<ScanningFilters>) => void;
  resetScanningFilters: () => void;

  setCommittedRadarFilters: (filters: ScanningFilters) => void;

  setOrionCopilotThreadId: (threadId: string | null) => void;
}

interface JobNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
}

// Enhanced scanning filters that support advanced search capabilities
export interface ScanningFilters {
  search: string;
  types: string[];
  dimensions: string[];
  steep: string[];
  sentiments: string[];
  tags: string[];
  impactRange: [number, number];
  sort: string;
  showMode?: 'all' | 'searched' | 'selected';
  lens: "megatrends" | "trends" | "weak_signals" | "all";
  timeHorizon: string;
  sentimentFilter: string;
}

interface ChatSession {
  id: string;
  projectId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: any;
}

export const defaultScanningFilters: ScanningFilters = {
  search: "",
  types: ["M", "T", "WS", "WC"],
  dimensions: [],
  steep: [],
  sentiments: [],
  tags: [],
  impactRange: [1, 10] as [number, number],
  sort: "relevance",
  lens: "all",
  timeHorizon: "all",
  sentimentFilter: "all",
};

// Helper to get state for a project (safe access)
const getProjectState = (state: AppState, projectId: string | null): ProjectState => {
  if (!projectId) return createDefaultProjectState();
  return state.projectStates[projectId] || createDefaultProjectState();
};

const createDefaultProjectState = (): ProjectState => ({
  selectedForces: [],
  searchedForces: [],
  scanningFilters: { ...defaultScanningFilters },
  committedRadarFilters: { ...defaultScanningFilters },
  orionCopilotThreadId: null,
});

// Debounce timer for saving state
let saveTimeout: NodeJS.Timeout | null = null;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false, // Start false, set to true after hydration
      _setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

      userId: null,
      setUserId: (userId) => set({ userId }),

      currentProjectId: null,
      setCurrentProjectId: (id) => set((state) => {
        if (state.currentProjectId === id) return {};
        console.log('[Store] Switching project from', state.currentProjectId, 'to', id);

        // Ensure the new project has a state entry if it doesn't exist
        const projectStates = { ...state.projectStates };
        if (id && !projectStates[id]) {
          projectStates[id] = createDefaultProjectState();
        }

        return {
          currentProjectId: id,
          projectStates,
          // Reset global UI flags that shouldn't persist across project switches if needed
          isOrionCopilotProjectModeActive: false
        };
      }),

      projectStates: {},

      // Server Sync Actions
      loadUserProjectStates: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          // Fetch all project states for this user
          const response = await fetch(`/api/v1/users/${userId}/project-states`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });

          if (response.ok) {
            const states = await response.json();
            const projectStates: Record<string, ProjectState> = {};

            states.forEach((s: any) => {
              projectStates[s.projectId] = {
                selectedForces: s.selectedForces || [],
                searchedForces: s.searchedForces || [],
                scanningFilters: s.scanningFilters || { ...defaultScanningFilters },
                committedRadarFilters: s.committedRadarFilters || { ...defaultScanningFilters },
                orionCopilotThreadId: s.copilotThreadId,
                lastSyncedAt: Date.now()
              };
            });

            console.log('[Store] Loaded project states from server:', Object.keys(projectStates).length);
            set({ projectStates });
          }
        } catch (error) {
          console.error('[Store] Failed to load project states:', error);
        }
      },

      saveProjectState: async (projectId: string) => {
        const { userId, projectStates } = get();
        if (!userId || !projectId) return;

        const stateToSave = projectStates[projectId];
        if (!stateToSave) return;

        // Debounce the save
        if (saveTimeout) clearTimeout(saveTimeout);

        saveTimeout = setTimeout(async () => {
          try {
            await fetch(`/api/v1/users/${userId}/projects/${projectId}/state`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({
                selectedForces: stateToSave.selectedForces,
                searchedForces: stateToSave.searchedForces,
                scanningFilters: stateToSave.scanningFilters,
                committedRadarFilters: stateToSave.committedRadarFilters,
                copilotThreadId: stateToSave.orionCopilotThreadId
              })
            });
            console.log('[Store] Saved state for project:', projectId);
          } catch (error) {
            console.error('[Store] Failed to save project state:', error);
          }
        }, 1000); // 1 second debounce
      },

      clearUserProjectStates: () => set({ projectStates: {}, userId: null }),

      // UI State
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      theme: "dark",
      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        if (theme === "dark") {
          root.classList.add("dark"); root.classList.remove("light");
        } else if (theme === "light") {
          root.classList.add("light"); root.classList.remove("dark");
        } else {
          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          root.classList.toggle("dark", prefersDark);
          root.classList.toggle("light", !prefersDark);
        }
      },

      viewMode: "curated",
      setViewMode: (mode) => set({ viewMode: mode }),

      jobNotifications: [],
      addJobNotification: (notification) => set((state) => ({
        jobNotifications: [notification, ...state.jobNotifications].slice(0, 10),
      })),
      removeJobNotification: (id) => set((state) => ({
        jobNotifications: state.jobNotifications.filter((n) => n.id !== id),
      })),
      clearJobNotifications: () => set({ jobNotifications: [] }),

      chatHistory: [],
      addChatSession: (session) => set((state) => ({
        chatHistory: [session, ...state.chatHistory],
      })),
      updateChatSession: (id, updates) => set((state) => ({
        chatHistory: state.chatHistory.map((session) =>
          session.id === id ? { ...session, ...updates, updatedAt: new Date() } : session
        ),
      })),
      clearChatHistory: () => set({ chatHistory: [] }),

      isOrionCopilotProjectModeActive: false,
      setOrionCopilotProjectMode: (active) => set({ isOrionCopilotProjectModeActive: active }),

      // =================================================================
      // PROXY METHODS - IMPLEMENTATION
      // =================================================================

      toggleForceSelection: (forceId) => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();
        const selectedSet = new Set(currentState.selectedForces);

        if (selectedSet.has(forceId)) selectedSet.delete(forceId);
        else selectedSet.add(forceId);

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            selectedForces: Array.from(selectedSet)
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },

      selectForces: (forceIds, mode) => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();
        const selectedSet = new Set(currentState.selectedForces);

        if (mode === 'replace') {
          selectedSet.clear();
          forceIds.forEach(id => selectedSet.add(id));
        } else if (mode === 'add') {
          forceIds.forEach(id => selectedSet.add(id));
        } else if (mode === 'remove') {
          forceIds.forEach(id => selectedSet.delete(id));
        }

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            selectedForces: Array.from(selectedSet)
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },

      clearSelection: () => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            selectedForces: []
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },

      isForceSelected: (forceId) => {
        const { currentProjectId, projectStates } = get();
        if (!currentProjectId) return false;
        const state = projectStates[currentProjectId];
        return state ? state.selectedForces.includes(forceId) : false;
      },

      setSearchedForces: (forceIds) => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            searchedForces: forceIds
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },

      clearSearchedForces: () => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            searchedForces: []
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },

      setScanningFilters: (filters) => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();

        // Sanitize filters
        const sanitizedFilters = { ...filters };
        if (sanitizedFilters.types !== undefined && sanitizedFilters.types.length === 0) {
          sanitizedFilters.types = defaultScanningFilters.types;
        }

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            scanningFilters: { ...currentState.scanningFilters, ...sanitizedFilters }
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },

      resetScanningFilters: () => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            scanningFilters: { ...defaultScanningFilters }
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },

      setCommittedRadarFilters: (filters) => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            committedRadarFilters: filters
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },

      setOrionCopilotThreadId: (threadId) => {
        const { currentProjectId, projectStates, saveProjectState } = get();
        if (!currentProjectId) return;

        const currentState = projectStates[currentProjectId] || createDefaultProjectState();

        const newProjectStates = {
          ...projectStates,
          [currentProjectId]: {
            ...currentState,
            orionCopilotThreadId: threadId
          }
        };

        set({ projectStates: newProjectStates });
        saveProjectState(currentProjectId);
      },
    }),
    {
      name: "orion-app-state",
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        viewMode: state.viewMode,
        chatHistory: state.chatHistory,
        projectStates: state.projectStates, // Persist all project states locally as well
        userId: state.userId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._setHasHydrated(true);
          // Initialize filter commit subscription if needed
          initializeFilterCommitSubscription();
        }
      },
    }
  )
);

// Selectors
export const useHasHydrated = () => useAppStore((state) => state._hasHydrated);
export const useCurrentProject = () => useAppStore((state) => state.currentProjectId);
export const useTheme = () => useAppStore((state) => state.theme);
export const useViewMode = () => useAppStore((state) => state.viewMode);

// Project-specific selectors (computed from current project)
export const useScanningFilters = () => {
  const currentProjectId = useAppStore((state) => state.currentProjectId);
  const projectState = useAppStore((state) =>
    currentProjectId ? state.projectStates[currentProjectId] : null
  );
  return projectState?.scanningFilters || defaultScanningFilters;
};

export const useCommittedRadarFilters = () => {
  const currentProjectId = useAppStore((state) => state.currentProjectId);
  const projectState = useAppStore((state) =>
    currentProjectId ? state.projectStates[currentProjectId] : null
  );
  return projectState?.committedRadarFilters || defaultScanningFilters;
};

export const useSelectedForces = () => {
  const currentProjectId = useAppStore((state) => state.currentProjectId);
  const projectState = useAppStore((state) =>
    currentProjectId ? state.projectStates[currentProjectId] : null
  );
  return new Set(projectState?.selectedForces || []);
};

export const useSearchedForces = () => {
  const currentProjectId = useAppStore((state) => state.currentProjectId);
  const projectState = useAppStore((state) =>
    currentProjectId ? state.projectStates[currentProjectId] : null
  );
  return projectState?.searchedForces || [];
};

export const useOrionCopilotThreadId = () => {
  const currentProjectId = useAppStore((state) => state.currentProjectId);
  const projectState = useAppStore((state) =>
    currentProjectId ? state.projectStates[currentProjectId] : null
  );
  return projectState?.orionCopilotThreadId || null;
};

export const useJobNotifications = () => useAppStore((state) => state.jobNotifications);
export const useChatHistory = (projectId?: string) =>
  useAppStore((state) =>
    projectId
      ? state.chatHistory.filter((session) => session.projectId === projectId)
      : state.chatHistory
  );

export const useOrionCopilotProjectMode = () => useAppStore((state) => state.isOrionCopilotProjectModeActive);

// Actions
export const useAppActions = () => {
  const store = useAppStore();
  return {
    setCurrentProject: store.setCurrentProjectId,
    toggleSidebar: () => store.setSidebarCollapsed(!store.sidebarCollapsed),
    setTheme: store.setTheme,
    setViewMode: store.setViewMode,
    addJobNotification: store.addJobNotification,
    removeJobNotification: store.removeJobNotification,
    setScanningFilters: store.setScanningFilters,
    resetScanningFilters: store.resetScanningFilters,
    addChatSession: store.addChatSession,
    updateChatSession: store.updateChatSession,
    toggleForceSelection: store.toggleForceSelection,
    selectForces: store.selectForces,
    clearSelection: store.clearSelection,
    setSearchedForces: store.setSearchedForces,
    clearSearchedForces: store.clearSearchedForces,
    setOrionCopilotProjectMode: store.setOrionCopilotProjectMode,
    setOrionCopilotThreadId: store.setOrionCopilotThreadId,
    setCommittedRadarFilters: store.setCommittedRadarFilters,
    loadUserProjectStates: store.loadUserProjectStates,
    clearUserProjectStates: store.clearUserProjectStates,
    setUserId: store.setUserId,
  };
};

// Initialize filter commit subscription
let filterCommitUnsubscribe: (() => void) | null = null;
let isFilterCommitSubscriptionInitialized = false;

function initializeFilterCommitSubscription() {
  if (isFilterCommitSubscriptionInitialized || typeof window === "undefined") return;

  isFilterCommitSubscriptionInitialized = true;

  filterCommitUnsubscribe = scanningEvents.on('filtersCommitted', (filters) => {
    // Get current committed filters from the CURRENT PROJECT
    const store = useAppStore.getState();
    const currentProjectId = store.currentProjectId;

    if (!currentProjectId) return;

    const currentCommitted = store.projectStates[currentProjectId]?.committedRadarFilters || defaultScanningFilters;
    const hasChanged = JSON.stringify(currentCommitted) !== JSON.stringify(filters);

    if (hasChanged) {
      store.setCommittedRadarFilters(filters);
    }
  });

  window.addEventListener('beforeunload', () => {
    if (filterCommitUnsubscribe) {
      filterCommitUnsubscribe();
      filterCommitUnsubscribe = null;
      isFilterCommitSubscriptionInitialized = false;
    }
  });
}

if (typeof window !== "undefined") {
  const theme = useAppStore.getState().theme;
  useAppStore.getState().setTheme(theme);
  initializeFilterCommitSubscription();
}
