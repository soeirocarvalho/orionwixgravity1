import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AuthUser {
  userId: string;
  email: string;
  subscriptionTier?: 'basic' | 'professional' | 'enterprise';
  subscriptionStatus?: 'active' | 'trial' | 'expired';
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser(payload);

        // Sync with store
        import('./store').then(({ useAppStore }) => {
          useAppStore.getState().setUserId(payload.userId);
          useAppStore.getState().loadUserProjectStates();
        });

        setIsLoading(false);
        console.log('[Auth] Restored session from localStorage:', payload.email);
      } catch (error) {
        console.error('Failed to parse stored token:', error);
        localStorage.removeItem('auth_token');
        setIsLoading(false);
      }
    } else {
      // No stored token - wait for Wix parent window or timeout
      const timeout = setTimeout(() => {
        console.log('[Auth] No authentication received, continuing as unauthenticated');
        setIsLoading(false);
      }, 2000); // 2 second timeout

      return () => clearTimeout(timeout);
    }
  }, []);

  // Listen for postMessage from Wix parent window
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Security: Validate origin in production
      // For now, accept any origin for development
      // In production, check: if (event.origin !== 'https://your-wix-site.com') return;

      if (event.data && event.data.type === 'ORION_AUTH') {
        const receivedToken = event.data.token;
        console.log('[Auth] Received authentication token from parent');

        if (receivedToken) {
          try {
            // Decode JWT to extract user info
            const payload = JSON.parse(atob(receivedToken.split('.')[1]));

            // Store token
            localStorage.setItem('auth_token', receivedToken);
            setToken(receivedToken);
            setUser(payload);

            // Sync with store
            import('./store').then(({ useAppStore }) => {
              useAppStore.getState().setUserId(payload.userId);
              useAppStore.getState().loadUserProjectStates();
            });

            setIsLoading(false);

            console.log('[Auth] User authenticated:', payload.email);

            // Send confirmation back to parent
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'ORION_AUTH_SUCCESS' }, '*');
            }
          } catch (error) {
            console.error('[Auth] Failed to process token:', error);
            setIsLoading(false);
          }
        }
      }
    }

    window.addEventListener('message', handleMessage);

    // Request authentication token from parent window on load
    if (window.parent && window.parent !== window) {
      console.log('[Auth] Requesting authentication from parent window');
      window.parent.postMessage({ type: 'ORION_REQUEST_AUTH' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = (newToken: string) => {
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      localStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(payload);

      // Sync with store
      import('./store').then(({ useAppStore }) => {
        useAppStore.getState().setUserId(payload.userId);
        useAppStore.getState().loadUserProjectStates();
      });
    } catch (error) {
      console.error('Failed to parse token:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);

    // Clear store state
    import('./store').then(({ useAppStore }) => {
      useAppStore.getState().clearUserProjectStates();
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
