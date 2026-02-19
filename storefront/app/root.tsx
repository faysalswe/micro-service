/**
 * Root Layout
 * Top-level component that wraps all routes
 */

import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data as json } from 'react-router';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router';
import { ColorSchemeScript } from '@mantine/core';
import { ThemeProvider, I18nProvider } from '~/components/providers';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { logRequest } from '~/utils/request-logger.server';
import { loadTranslations } from '~/i18n/config';
import type { Theme } from '~/types';
import type { SupportedLanguage } from '~/i18n/config';

import mantineCoreStyles from '@mantine/core/styles.css?url';
import mantineNotificationsStyles from '@mantine/notifications/styles.css?url';
import globalStyles from '~/styles/globals.css?url';

import { QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from '~/contexts/auth-context';
import { queryClient } from '~/lib/react-query';
import { Navigation } from '~/components/layout/navigation';
import { useState } from 'react';

/**
 * Meta tags for the app
 */
export const meta: MetaFunction = () => [
  { charset: 'utf-8' },
  { title: 'WebApp - Modern Web Application' },
  { name: 'viewport', content: 'width=device-width,initial-scale=1' },
  { name: 'description', content: 'A modern web application built with Remix, Mantine, and Tailwind' },
];

/**
 * Links for stylesheets and fonts
 */
export const links: LinksFunction = () => [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'stylesheet', href: mantineCoreStyles },
  { rel: 'stylesheet', href: mantineNotificationsStyles },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

/**
 * Loader data type
 */
interface RootLoaderData {
  theme: Theme;
  language: SupportedLanguage;
  translations: Record<string, unknown>;
  env: {
    NODE_ENV: string;
    API_URL?: string;
  };
}

/**
 * Root loader - Runs on every request
 * @param {LoaderFunctionArgs} args - Loader arguments
 * @returns {Promise<Response>} JSON response with initial data
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Log incoming request in development
  logRequest(request);

  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);

  // Load translations for SSR
  const translations = await loadTranslations(language);

  return json<RootLoaderData>({
    theme,
    language,
    translations,
    env: {
      NODE_ENV: process.env['NODE_ENV'] ?? 'development',
      API_URL: process.env['API_URL'],
    },
  });
}

/**
 * Root component
 */
export default function App() {
  const { theme, language, translations, env } = useLoaderData<typeof loader>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <html lang={language} data-theme={theme} style={{ colorScheme: theme }}>
      <head>
        <Meta />
        <Links />
        <ColorSchemeScript defaultColorScheme={theme} />
      </head>
      <body>
        <ThemeProvider initialTheme={theme}>
          <I18nProvider initialLanguage={language} initialResources={translations}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <Notifications />
                <Navigation opened={mobileMenuOpen} toggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
                <Outlet />
                <ScrollRestoration />
                <Scripts />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `window.ENV = ${JSON.stringify(env)}`,
                  }}
                />
              </AuthProvider>
            </QueryClientProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

/**
 * Global error boundary
 */
export function ErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <title>Oops! - WebApp</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex-center min-h-screen flex-col gap-md p-md">
          <h1 className="text-3xl font-bold">Oops!</h1>
          <p className="text-lg text-secondary">Something went wrong. Please try again later.</p>
          <a href="/" className="text-primary hover:underline">
            Go back home
          </a>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
