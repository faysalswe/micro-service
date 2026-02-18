/**
 * New Order Route
 * Create a new order
 */

import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { data as json } from 'react-router';
import { Container, Title, Text, Card } from '@mantine/core';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';

/**
 * Meta tags for new order page
 */
export const meta: MetaFunction = () => [
  { title: 'New Order - WebApp' },
  { name: 'description', content: 'Create a new order' },
];

/**
 * Loader function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);
  return json({ theme, language });
}

/**
 * New order page component
 */
export default function NewOrderPage() {
  return (
    <ProtectedRoute>
      <Container size="md" className="py-xl">
        <Card withBorder shadow="sm" padding="xl" radius="md">
          <div className="text-center">
            <Title order={1} className="text-3xl font-bold mb-xs">
              Create New Order
            </Title>
            <Text c="dimmed" className="mb-lg">
              This page is under construction.
            </Text>
          </div>
        </Card>
      </Container>
    </ProtectedRoute>
  );
}