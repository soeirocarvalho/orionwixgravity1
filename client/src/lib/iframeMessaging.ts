/**
 * Centralized iframe messaging module for ORION <-> Wix parent window communication
 * Provides secure postMessage handling with origin validation
 */

// Message types for communication between ORION and Wix parent
export type MessageType = 
  | 'ORION_REQUEST_AUTH'      // ORION requests auth token from parent
  | 'ORION_AUTH'              // Parent sends auth token to ORION
  | 'ORION_AUTH_SUCCESS'      // ORION confirms successful authentication
  | 'ORION_RESIZE'            // ORION requests iframe height adjustment
  | 'ORION_NAVIGATION'        // ORION notifies parent of navigation
  | 'ORION_ERROR'             // ORION reports error to parent
  | 'ORION_READY';            // ORION signals it's ready for interaction

export interface OrionMessage {
  type: MessageType;
  payload?: any;
  timestamp?: number;
}

/**
 * Configuration for iframe messaging
 */
interface MessagingConfig {
  allowedOrigins: string[];
  enableLogging?: boolean;
}

/**
 * Default configuration - can be overridden via environment variables
 */
const getDefaultConfig = (): MessagingConfig => {
  const parentOrigin = import.meta.env.VITE_PARENT_ORIGIN;
  const isDevelopment = import.meta.env.DEV;
  
  const allowedOrigins = [
    // Production Wix domain
    'https://www.ifforesight.com',
    'https://ifforesight.com',
  ];

  // Allow localhost in development
  if (isDevelopment) {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://localhost:5001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5001'
    );
  }

  // Add custom parent origin if specified
  if (parentOrigin && !allowedOrigins.includes(parentOrigin)) {
    allowedOrigins.push(parentOrigin);
  }

  return {
    allowedOrigins,
    enableLogging: isDevelopment,
  };
};

/**
 * Check if the current window is running inside an iframe
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    // If we can't access window.top due to cross-origin, we're definitely in an iframe
    return true;
  }
}

/**
 * Validate message origin against allowed origins
 */
function isOriginAllowed(origin: string, config: MessagingConfig): boolean {
  // In development, be more permissive
  if (config.enableLogging && origin.startsWith('http://localhost')) {
    return true;
  }
  
  return config.allowedOrigins.some(allowed => {
    // Exact match
    if (allowed === origin) return true;
    
    // Wildcard subdomain match (e.g., *.ifforesight.com)
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    
    return false;
  });
}

/**
 * Send a message to the parent window (Wix)
 */
export function sendToParent(type: MessageType, payload?: any): void {
  if (!isInIframe()) {
    console.warn('[iframeMessaging] Not in iframe, skipping message:', type);
    return;
  }

  const message: OrionMessage = {
    type,
    payload,
    timestamp: Date.now(),
  };

  const config = getDefaultConfig();
  
  if (config.enableLogging) {
    console.log('[iframeMessaging] Sending to parent:', message);
  }

  // Send to parent with wildcard origin (parent will validate)
  // In production, you might want to specify exact origin
  window.parent.postMessage(message, '*');
}

/**
 * Message handler type
 */
type MessageHandler = (payload: any, origin: string) => void | Promise<void>;

/**
 * Registry of message handlers
 */
const messageHandlers = new Map<MessageType, MessageHandler[]>();

/**
 * Register a handler for a specific message type
 */
export function onMessage(type: MessageType, handler: MessageHandler): () => void {
  if (!messageHandlers.has(type)) {
    messageHandlers.set(type, []);
  }
  
  messageHandlers.get(type)!.push(handler);
  
  // Return unsubscribe function
  return () => {
    const handlers = messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };
}

/**
 * Initialize iframe messaging system
 * Sets up the global message listener
 */
export function initializeIframeMessaging(customConfig?: Partial<MessagingConfig>): () => void {
  const config = { ...getDefaultConfig(), ...customConfig };
  
  const handleMessage = (event: MessageEvent) => {
    // Validate origin
    if (!isOriginAllowed(event.origin, config)) {
      if (config.enableLogging) {
        console.warn('[iframeMessaging] Rejected message from unauthorized origin:', event.origin);
      }
      return;
    }

    // Validate message structure
    const message = event.data as OrionMessage;
    if (!message || typeof message.type !== 'string') {
      return; // Not an ORION message
    }

    if (config.enableLogging) {
      console.log('[iframeMessaging] Received from parent:', message);
    }

    // Dispatch to registered handlers
    const handlers = messageHandlers.get(message.type);
    if (handlers && handlers.length > 0) {
      handlers.forEach(handler => {
        try {
          handler(message.payload, event.origin);
        } catch (error) {
          console.error('[iframeMessaging] Handler error:', error);
        }
      });
    } else if (config.enableLogging) {
      console.log('[iframeMessaging] No handlers registered for:', message.type);
    }
  };

  window.addEventListener('message', handleMessage);
  
  if (config.enableLogging) {
    console.log('[iframeMessaging] Initialized with config:', config);
  }

  // Send ready signal to parent
  if (isInIframe()) {
    sendToParent('ORION_READY');
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}

/**
 * Notify parent of iframe height change (for responsive embedding)
 * This is a stub for future implementation
 */
export function notifyHeightChange(height?: number): void {
  const actualHeight = height || document.documentElement.scrollHeight;
  sendToParent('ORION_RESIZE', { height: actualHeight });
}

/**
 * Notify parent of navigation within ORION
 * This is a stub for future implementation
 */
export function notifyNavigation(path: string): void {
  sendToParent('ORION_NAVIGATION', { path });
}

/**
 * Report error to parent window for monitoring
 * This is a stub for future implementation
 */
export function reportErrorToParent(error: Error | string, context?: any): void {
  const errorData = {
    message: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: Date.now(),
  };
  
  sendToParent('ORION_ERROR', errorData);
}
