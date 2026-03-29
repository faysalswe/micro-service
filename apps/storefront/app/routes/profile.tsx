/**
 * Profile Route
 * User profile management page
 */

import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { data as json } from 'react-router';
import { Container, Title, Text, Card, Stack, Button, Group, Avatar } from '@mantine/core';
import { useAuth } from '~/contexts/auth-context';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';

/**
 * Meta tags for profile page
 */
export const meta: MetaFunction = () => [
  { title: 'Profile - WebApp' },
  { name: 'description', content: 'Manage your account' },
];

/**
 * Loader function - Provide user data
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);
  // In a real app, you might fetch additional user data from the server
  return json({ theme, language });
}

/**
 * Profile page component
 */
export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Container size="sm" className="py-xl">
        <Card shadow="lg" padding="xl" radius="md" className="text-center">
          <Text>Loading profile...</Text>
        </Card>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container size="sm" className="py-xl">
        <Card shadow="lg" padding="xl" radius="md" className="text-center">
          <Title order={2} className="mb-md">
            Not Authenticated
          </Title>
          <Text c="dimmed" className="mb-lg">
            Please log in to view your profile.
          </Text>
          <Button component="a" href="/login">
            Go to Login
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <ProtectedRoute>
      <Container size="sm" className="py-xl">
        <Card shadow="lg" padding="xl" radius="md" className="bg-surface">
          <Stack gap="xl">
            {/* Header */}
            <div className="text-center">
              <Avatar
                size={80}
                radius={40}
                color="blue"
                className="mx-auto mb-md"
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
              <Title order={1} className="text-3xl font-bold mb-xs">
                {user.username}
              </Title>
              <Text c="dimmed">
                Manage your account settings
              </Text>
            </div>

            {/* User Info */}
            <Stack gap="md">
              <Card withBorder padding="md" radius="md">
                <Title order={3} className="mb-sm">Account Information</Title>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text fw={500}>Username</Text>
                    <Text>{user.username}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text fw={500}>Role</Text>
                    <Text>{user.role}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text fw={500}>User ID</Text>
                    <Text>{user.id}</Text>
                  </Group>
                </Stack>
              </Card>

              {/* Actions */}
              <Card withBorder padding="md" radius="md">
                <Title order={3} className="mb-sm">Actions</Title>
                <Stack gap="sm">
                  <Button variant="outline" fullWidth>
                    Change Password
                  </Button>
                  <Button variant="outline" fullWidth>
                    Edit Profile
                  </Button>
                  <Button color="red" variant="outline" fullWidth onClick={logout}>
                    Logout
                  </Button>
                </Stack>
              </Card>
            </Stack>
          </Stack>
        </Card>
      </Container>
    </ProtectedRoute>
  );
}

/**
 * Error boundary for profile page
 */
export function ErrorBoundary() {
  return (
    <Container size="sm" className="py-xl">
      <Card shadow="lg" padding="xl" radius="md" className="text-center">
        <Title order={2} className="mb-md">
          Oops!
        </Title>
        <Text c="dimmed" className="mb-lg">
          Something went wrong. Please try again later.
        </Text>
        <Button component="a" href="/">
          Go back home
        </Button>
      </Card>
    </Container>
  );
}