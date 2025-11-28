/**
 * JWT Utility Functions
 * Handles JSON Web Token parsing and validation
 */

export interface JWTPayload {
    userId: string;
    email?: string;
    role?: string;
    exp?: number;
    iat?: number;
    [key: string]: any;
}

/**
 * Safely decode a JWT token without verification
 * @param token - The JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
    try {
        if (!token || typeof token !== 'string') {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const payload = parts[1];
        const decoded = JSON.parse(atob(payload));

        return decoded as JWTPayload;
    } catch (error) {
        console.warn('[JWT] Failed to decode token:', error);
        return null;
    }
}

/**
 * Check if a JWT token is expired
 * @param token - The JWT token string
 * @returns true if expired, false if valid, null if cannot determine
 */
export function isTokenExpired(token: string): boolean | null {
    const payload = decodeJWT(token);

    if (!payload || !payload.exp) {
        return null;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime >= expirationTime;
}

/**
 * Get user ID from JWT token
 * @param token - The JWT token string
 * @returns User ID or null if not found
 */
export function getUserIdFromToken(token: string): string | null {
    const payload = decodeJWT(token);
    return payload?.userId || null;
}

/**
 * Get token expiration time as Date object
 * @param token - The JWT token string
 * @returns Date object or null if no expiration
 */
export function getTokenExpiration(token: string): Date | null {
    const payload = decodeJWT(token);

    if (!payload || !payload.exp) {
        return null;
    }

    return new Date(payload.exp * 1000);
}

/**
 * Check if token will expire soon (within specified minutes)
 * @param token - The JWT token string
 * @param minutesThreshold - Minutes before expiration to consider "soon" (default: 5)
 * @returns true if expiring soon, false otherwise
 */
export function isTokenExpiringSoon(token: string, minutesThreshold: number = 5): boolean {
    const expirationDate = getTokenExpiration(token);

    if (!expirationDate) {
        return false;
    }

    const thresholdTime = Date.now() + (minutesThreshold * 60 * 1000);
    return expirationDate.getTime() <= thresholdTime;
}
