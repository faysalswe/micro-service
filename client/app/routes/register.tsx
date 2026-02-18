/**
 * Register Route
 * User registration page
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
 * Meta tags for register page
 */
export const meta: MetaFunction = () => [
  { title: 'Register - WebApp' },
  { name: 'description', content: 'Create a new account' },
];

/**
 * Loader function - Redirect if already authenticated
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Check if user is already authenticated (server-side check not implemented)
  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);
  return json({ theme, language });
}

/**
 * Action function - Handle registration form submission
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = {
    username: formData.get('username'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    role: formData.get('role') || 'USER',
  };

  // Validation
  if (!data.username || !data.password || !data.confirmPassword) {
    return json({ error: 'All fields are required' }, { status: 400 });
  }

  if (data.password !== data.confirmPassword) {
    return json({ error: 'Passwords do not match' }, { status: 400 });
  }

  // In a real implementation, you would call the auth service here
  return json({ success: true });
}

/**
 * Registration form validation schema
 */
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * Register page component
 */
export default function RegisterPage() {
  const { register, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const navigation = useNavigation();
  const actionData = useActionData<{ error?: string }>();

  const isSubmitting = navigation.state === 'submitting';

  // Form setup
  const form = useForm<RegisterFormValues>({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
      role: 'USER',
    },
    validate: zodResolver(registerSchema),
  });

  // Handle form submission
  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      await register(values);
      toast.success('Registration successful! You can now log in.');
      // Redirect to login page
      // Note: register function may automatically log in, depending on backend
    } catch (error: any) {
      const message = error?.message || 'Registration failed';
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
                Create Account
              </Title>
              <Text c="dimmed">
                Sign up to get started
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

            {/* Registration Form */}
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                <TextInput
                  label="Username"
                  placeholder="Choose a username"
                  required
                  {...form.getInputProps('username')}
                  error={form.errors['username']}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Create a password"
                  required
                  {...form.getInputProps('password')}
                  error={form.errors['password']}
                />

                <PasswordInput
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  required
                  {...form.getInputProps('confirmPassword')}
                  error={form.errors['confirmPassword']}
                />

                <TextInput
                  label="Role (optional)"
                  placeholder="USER, ADMIN, etc."
                  {...form.getInputProps('role')}
                  error={form.errors['role']}
                />

                <Button
                  type="submit"
                  loading={isSubmitting || authLoading}
                  fullWidth
                  size="md"
                >
                  Sign Up
                </Button>
              </Stack>
            </form>

            {/* Footer links */}
            <Group justify="center">
              <Text size="sm" c="dimmed">
                Already have an account?{' '}
                <Anchor href="/login" size="sm">
                  Sign In
                </Anchor>
              </Text>
            </Group>
          </Stack>
        </Card>
      </Container>
    </ProtectedRoute>
  );
}

/**
 * Error boundary for register page
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