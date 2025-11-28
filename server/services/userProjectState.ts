import { db } from "../db";
import { sql, eq, and } from "drizzle-orm";

// User project state interface
export interface UserProjectState {
    id: string;
    userId: string;
    projectId: string;
    selectedForces: string[];
    searchedForces: string[];
    scanningFilters: any;
    committedRadarFilters: any;
    copilotThreadId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface InsertUserProjectState {
    userId: string;
    projectId: string;
    selectedForces?: string[];
    searchedForces?: string[];
    scanningFilters?: any;
    committedRadarFilters?: any;
    copilotThreadId?: string | null;
}

export class UserProjectStateService {
    /**
     * Get user's state for a specific project
     */
    async getUserProjectState(userId: string, projectId: string): Promise<UserProjectState | null> {
        try {
            const result = await db.execute(sql`
        SELECT * FROM user_project_state
        WHERE user_id = ${userId} AND project_id = ${projectId}
        LIMIT 1
      `);

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0] as any;
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
                updatedAt: row.updated_at,
            };
        } catch (error) {
            console.error('[UserProjectStateService] Error getting user project state:', error);
            throw error;
        }
    }

    /**
     * Save or update user's state for a specific project
     */
    async saveUserProjectState(
        userId: string,
        projectId: string,
        state: Partial<InsertUserProjectState>
    ): Promise<UserProjectState> {
        try {
            const result = await db.execute(sql`
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

            const row = result.rows[0] as any;
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
                updatedAt: row.updated_at,
            };
        } catch (error) {
            console.error('[UserProjectStateService] Error saving user project state:', error);
            throw error;
        }
    }

    /**
     * Delete user's state for a specific project
     */
    async deleteUserProjectState(userId: string, projectId: string): Promise<boolean> {
        try {
            const result = await db.execute(sql`
        DELETE FROM user_project_state
        WHERE user_id = ${userId} AND project_id = ${projectId}
      `);

            return (result.rowCount || 0) > 0;
        } catch (error) {
            console.error('[UserProjectStateService] Error deleting user project state:', error);
            throw error;
        }
    }

    /**
     * Get all project states for a user
     */
    async getAllUserProjectStates(userId: string): Promise<UserProjectState[]> {
        try {
            const result = await db.execute(sql`
        SELECT * FROM user_project_state
        WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `);

            return result.rows.map((row: any) => ({
                id: row.id,
                userId: row.user_id,
                projectId: row.project_id,
                selectedForces: row.selected_forces || [],
                searchedForces: row.searched_forces || [],
                scanningFilters: row.scanning_filters || {},
                committedRadarFilters: row.committed_radar_filters || {},
                copilotThreadId: row.copilot_thread_id,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }));
        } catch (error) {
            console.error('[UserProjectStateService] Error getting all user project states:', error);
            throw error;
        }
    }
}

export const userProjectStateService = new UserProjectStateService();
