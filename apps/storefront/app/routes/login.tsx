/**
 * Login Route
 * User authentication page
 */

import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { data as json, useActionData, useNavigation } from 'react-router';
import { Container, Title, Text, Card, Stack, Group, Button, Anchor, TextInput, PasswordInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { useToast } from '~/hooks/useToast';
import { useAuth } from '~/contexts/auth-context';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';

/**
 * Meta tags for login page
 */
export const meta: MetaFunction = () => [
  { title: 'Login - WebApp' },
  { name: 'description', content: 'Sign in to your account' },
];

/**
 * Loader function - Redirect if already authenticated
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is already authenticated (server-side check not implemented)
  // Rely on client-side redirect via ProtectedRoute
  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);
  return json({ theme, language });
}

/**
 * Action function - Handle login form submission
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const credentials = {
    username: formData.get('username'),
    password: formData.get('password'),
  };

  // Validation
  if (!credentials.username || !credentials.password) {
    return json({ error: 'Username and password are required' }, { status: 400 });
  }

  // In a real implementation, you would call the auth service here
  // For now, we'll rely on client-side authentication
  return json({ success: true });
}

/**
 * Login form validation schema
 */
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Login page component
 */
export default function LoginPage() {
  const { login, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const navigation = useNavigation();
  const actionData = useActionData<{ error?: string }>();

  const isSubmitting = navigation.state === 'submitting';

  // Form setup
  const form = useForm<LoginFormValues>({
    initialValues: {
      username: '',
      password: '',
    },
    validate: zodResolver(loginSchema),
  });

  // Handle form submission
  const handleSubmit = async (values: LoginFormValues) => {
    try {
      await login(values);
      toast.success('Login successful! Redirecting...');
      // Redirect will be handled by auth context
    } catch (error: any) {
      const message = error?.message || 'Login failed';
      toast.error(message);
    }
  };

  return (
    <ProtectedRoute requireAuth={false} redirectTo="/">
      <Container size="sm" className="py-xl">
        <Card shadow="lg" padding="xl" radius="md" className="bg-surface">
          <Stack gap="xl">
            {/* Header */}
            <div className="text-center">
              <Title order={1} className="text-3xl font-bold mb-xs">
                Sign In
              </Title>
              <Text c="dimmed">
                Enter your credentials to access your account
              </Text>
            </div>

            {/* Error from action */}
            {actionData?.error && (
              <div className="p-md bg-red-50 border border-red-200 rounded-md">
                <Text c="red" size="sm">
                  {actionData.error}
                </Text>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Username"
                  placeholder="Enter your username"
                  required
                  {...form.getInputProps('username')}
                  error={form.errors['username']}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Enter your password"
                  required
                  {...form.getInputProps('password')}
                  error={form.errors['password']}
                />

                <Button
                  type="submit"
                  loading={isSubmitting || authLoading}
                  fullWidth
                  size="md"
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            {/* Footer links */}
            <Group justify="space-between">
              <Anchor href="/register" size="sm">
                Create an account
              </Anchor>
              <Anchor href="/forgot-password" size="sm">
                Forgot password?
              </Anchor>
            </Group>
          </Stack>
        </Card>
      </Container>
    </ProtectedRoute>
  );
}

/**
 * Error boundary for login page
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