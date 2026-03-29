/**
 * Universal (isomorphic) logger
 * Works on both server and client, with different output formats.
 */

const LOG_PREFIX = '[API]';
const isDevelopment = import.meta.env.DEV;
const isServer = typeof window === 'undefined';

const styles = {
  request: 'color: blue; font-weight: bold',
  response: 'color: green; font-weight: bold',
  error: 'color: red; font-weight: bold',
  prefix: 'font-weight: bold',
};

interface LogContext {
  method: string;
  url: string;
  payload?: any;
  response?: any;
  status?: number;
  statusText?: string;
  duration: number;
  error?: Error;
}

export const logger = {
  logApiCall: (context: LogContext) => {
    if (!isDevelopment) {
      return;
    }

    const { method, url, payload, response, status, statusText, duration, error } = context;

    if (isServer) {
      // Server-side logging: one concise line
      const statusString = error ? `ERROR ${error.message}` : `${status} ${statusText}`;
      console.log(`${LOG_PREFIX} ${method} ${url} - ${statusString} (${duration}ms)`);
    } else {
      // Client-side logging: collapsible group
      const statusString = error ? 'ERROR' : status;
      const groupTitle = `%c${LOG_PREFIX}%c ${method} ${url} - ${statusString} (${duration}ms)`;
      const titleColor = error ? styles.error : styles.response;

      console.groupCollapsed(groupTitle, styles.prefix, titleColor);
      console.log('%cRequest', 'font-weight: bold', payload);
      if (error) {
        console.log('%cError', 'font-weight: bold', error);
      } else {
        console.log('%cResponse', 'font-weight: bold', response);
      }
      console.groupEnd();
    }
  },
};
