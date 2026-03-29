/**
 * Request Logger for Remix Dev Terminal
 * Logs incoming requests to the Remix server (loaders/actions)
 */

/**
 * Log incoming request to Remix server
 */
export function logRequest(request: Request): void {
  // Only log in development
  if (process.env['NODE_ENV'] !== 'development') {
    return;
  }

  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;
  const search = url.search;
  const fullUrl = pathname + search;

  // Color coding for methods
  const methodColors: Record<string, string> = {
    GET: '\x1b[34m',    // Blue
    POST: '\x1b[32m',   // Green
    PUT: '\x1b[33m',    // Yellow
    DELETE: '\x1b[31m', // Red
    PATCH: '\x1b[35m',  // Magenta
  };

  const methodColor = methodColors[method] || '\x1b[36m'; // Cyan for other methods
  const resetColor = '\x1b[0m';

  console.log(`${methodColor}${method}${resetColor} ${fullUrl}`);

  // Log query parameters if any
  if (search) {
    const params = Object.fromEntries(url.searchParams.entries());
    if (Object.keys(params).length > 0) {
      console.log('  Query:', params);
    }
  }

  // Try to log request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    // Note: Request body can only be read once
    // In practice, loaders/actions should clone the request if they need to read body
    // We'll log that body was present but not attempt to read it here
    console.log('  Body: [present - see action for details]');
  }
}

/**
 * Log loader/action execution
 */
export function logLoaderAction(type: 'loader' | 'action', request: Request, data?: any): void {
  // Only log in development
  if (process.env['NODE_ENV'] !== 'development') {
    return;
  }

  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  console.log(`\x1b[90m[${type.toUpperCase()}] ${method} ${pathname}\x1b[0m`);

  if (data !== undefined) {
    // Log data if it's not too large
    try {
      const jsonStr = JSON.stringify(data);
      if (jsonStr.length < 1000) {
        console.log('  Data:', data);
      } else {
        console.log('  Data: [too large to log]');
      }
    } catch {
      console.log('  Data: [unable to serialize]');
    }
  }
}

/**
 * Log server-side API call (using ServerApiClient)
 */
export function logServerApiCall(
  method: string,
  url: string,
  payload?: any,
  status?: number,
  duration?: number,
  error?: Error
): void {
  // Only log in development
  if (process.env['NODE_ENV'] !== 'development') {
    return;
  }

  const methodColors: Record<string, string> = {
    GET: '\x1b[34m',
    POST: '\x1b[32m',
    PUT: '\x1b[33m',
    DELETE: '\x1b[31m',
    PATCH: '\x1b[35m',
  };

  const methodColor = methodColors[method] || '\x1b[36m';
  const resetColor = '\x1b[0m';

  if (status === undefined) {
    // Request
    console.log(`\x1b[90m[API →]${resetColor} ${methodColor}${method}${resetColor} ${url}`);
    if (payload) {
      console.log('  Payload:', payload);
    }
  } else {
    // Response
    const statusColor = status >= 200 && status < 300 ? '\x1b[32m' : '\x1b[31m';
    const durationText = duration ? ` (${duration}ms)` : '';
    console.log(`\x1b[90m[API ←]${resetColor} ${statusColor}${status}${resetColor}${durationText}`);
    if (error) {
      console.log('  Error:', error.message);
    }
  }
}