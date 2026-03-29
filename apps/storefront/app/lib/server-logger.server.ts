/**
 * Server-side Logger for API Calls
 * Logs server-side API requests made in loader()/action() functions
 */

/**
 * Server log entry interface
 */
export interface ServerLogEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  duration?: number;
  correlationId: string;
  source: 'server'; // Distinguish from client logs
  payload?: any;
  response?: any;
  error?: any;
}

/**
 * In-memory log store for server-side API calls
 */
class ServerLogStore {
  private static instance: ServerLogStore;
  private logs: ServerLogEntry[] = [];
  private maxLogs = 100;

  private constructor() {}

  public static getInstance(): ServerLogStore {
    if (!ServerLogStore.instance) {
      ServerLogStore.instance = new ServerLogStore();
    }
    return ServerLogStore.instance;
  }

  /**
   * Add log entry
   */
  addLog(entry: Omit<ServerLogEntry, 'id' | 'timestamp'>): string {
    const id = this.generateId();
    const logEntry: ServerLogEntry = {
      id,
      timestamp: Date.now(),
      ...entry,
    };

    this.logs.unshift(logEntry); // Add to beginning for reverse chronological order

    // Trim logs if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging for server-side (colored output)
    this.consoleLog(logEntry);

    return id;
  }

  /**
   * Update log entry
   */
  updateLog(id: string, updates: Partial<ServerLogEntry>): void {
    const index = this.logs.findIndex(log => log.id === id);
    if (index !== -1) {
      // Filter out undefined values
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      this.logs[index] = { ...this.logs[index], ...filteredUpdates } as ServerLogEntry;

      // Console logging for updates
      this.consoleLog(this.logs[index], true);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): ServerLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 's_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Console logging with colors (for server terminal)
   */
  private consoleLog(logEntry: ServerLogEntry, isUpdate: boolean = false): void {
    const { method, url, correlationId, status, statusText, duration } = logEntry;

    if (!isUpdate) {
      // Request log
      console.log(`%c→ [SERVER:${correlationId}] %c${method} %c${url}`,
        'color: #888', 'color: blue', 'color: inherit');

      if (logEntry.payload) {
        console.log('📤 Server Payload:', logEntry.payload);
      }
    } else if (status !== undefined) {
      // Response log
      const statusColor = status >= 200 && status < 300 ? 'color: green' : 'color: red';
      const durationText = duration ? ` (${duration}ms)` : '';

      console.log(`%c← [SERVER:${correlationId}] %c${status} ${statusText || ''}${durationText}`,
        'color: #888', statusColor);

      if (logEntry.response) {
        console.log('📥 Server Response:', logEntry.response);
      }
      if (logEntry.error) {
        console.log('❌ Server Error:', logEntry.error);
      }
    }
  }
}

/**
 * Server-side API client with logging
 */
export class ServerApiClient {
  private logStore = ServerLogStore.getInstance();

  /**
   * Make HTTP request with logging
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers: customHeaders,
      body,
      ...fetchOptions
    } = options;

    // Build headers
    const headers = new Headers(customHeaders);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');

    // Generate correlation ID
    const correlationId = this.generateCorrelationId();
    headers.set('X-Correlation-ID', correlationId);

    // Build full URL (use Vite proxy paths)
    const url = endpoint.startsWith('http') ? endpoint : endpoint;

    // Capture payload for logging
    let payload: any = undefined;
    if (body) {
      try {
        payload = JSON.parse(body as string);
      } catch {
        payload = body;
      }
    }

    const startTime = Date.now();
    const logId = this.logStore.addLog({
      method,
      url,
      correlationId,
      source: 'server',
      payload,
    });

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        body,
      });

      // Parse response
      const data = await this.parseResponse(response);
      const duration = Date.now() - startTime;

      // Update log with response
      this.logStore.updateLog(logId, {
        status: response.status,
        statusText: response.statusText,
        duration,
        response: data,
      });

      // Handle non-2xx status codes
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logStore.updateLog(logId, {
        status: (error as any)?.status || 0,
        statusText: error instanceof Error ? error.message : 'Unknown error',
        duration,
        error,
      });

      throw error;
    }
  }

  /**
   * Parse JSON response
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Fallback to text
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return 's_' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Singleton instance
 */
export const serverApiClient = new ServerApiClient();

/**
 * Get server logs for debugging
 */
export function getServerLogs(): ServerLogEntry[] {
  return ServerLogStore.getInstance().getLogs();
}

/**
 * Clear server logs
 */
export function clearServerLogs(): void {
  ServerLogStore.getInstance().clearLogs();
}