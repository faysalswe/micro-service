/**
 * Dashboard Route
 * User dashboard with overview of orders and payments
 */

import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { data as json } from 'react-router';
import { Container, Title, Text, Card, Grid, Group, Stack, Button, Loader, Alert } from '@mantine/core';
import { IconShoppingBag, IconCreditCard, IconUser, IconChartBar, IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '~/contexts/auth-context';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { useOrders, usePayments } from '~/hooks';

/**
 * Meta tags for dashboard page
 */
export const meta: MetaFunction = () => [
  { title: 'Dashboard - WebApp' },
  { name: 'description', content: 'Your personal dashboard' },
];

/**
 * Loader function - Provide initial data
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);
  return json({ theme, language });
}

/**
 * Dashboard page component
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.id;

  // Fetch real data from APIs
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useOrders(userId);
  const { data: payments = [], isLoading: paymentsLoading, error: paymentsError } = usePayments({ userId });

  const isLoading = ordersLoading || paymentsLoading;
  const error = ordersError || paymentsError;

  // Calculate stats from real data
  const totalOrders = orders.length;
  const totalPayments = payments.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const completedPayments = payments.filter(p => p.status === 'completed').length;
  const successRateOrders = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const successRatePayments = totalPayments > 0 ? Math.round((completedPayments / totalPayments) * 100) : 0;
  const overallSuccessRate = Math.round((successRateOrders + successRatePayments) / 2) || 0;

  // Account age from token iat (issued at timestamp)
  const accountAgeDays = user?.iat ? Math.floor((Date.now() / 1000 - user.iat) / (60 * 60 * 24)) : 0;

  const stats = [
    { label: 'Total Orders', value: totalOrders.toString(), icon: IconShoppingBag, color: 'blue' },
    { label: 'Total Payments', value: totalPayments.toString(), icon: IconCreditCard, color: 'green' },
    { label: 'Success Rate', value: `${overallSuccessRate}%`, icon: IconChartBar, color: 'yellow' },
    { label: 'Account Age', value: accountAgeDays > 0 ? `${accountAgeDays} days` : 'New', icon: IconUser, color: 'violet' },
  ];

  // Get recent orders (last 3)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(order => ({
      id: order.id,
      date: new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      amount: `$${order.amount.toFixed(2)}`,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      rawStatus: order.status,
    }));

  // Get recent payments (last 3)
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(payment => ({
      id: payment.id,
      date: new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      amount: `$${payment.amount.toFixed(2)}`,
      status: payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
      rawStatus: payment.status,
    }));

  // Handle loading state
  if (isLoading) {
    return (
      <ProtectedRoute>
        <Container size="lg" className="py-xl">
          <div className="flex-center min-h-96 flex-col gap-md">
            <Loader size="xl" />
            <Text>Loading your dashboard data...</Text>
          </div>
        </Container>
      </ProtectedRoute>
    );
  }

  // Handle error state
  if (error) {
    return (
      <ProtectedRoute>
        <Container size="lg" className="py-xl">
          <Alert
            icon={<IconAlertCircle size={20} />}
            title="Error Loading Data"
            color="red"
            variant="filled"
            className="mb-md"
          >
            Failed to load dashboard data. Please try again later.
            <br />
            <Text size="sm" mt="xs">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </Text>
          </Alert>
          <Button onClick={() => window.location.reload()} variant="light">
            Retry
          </Button>
        </Container>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Container size="lg" className="py-xl">
        <Stack gap="xl">
          {/* Header */}
          <div>
            <Title order={1} className="text-3xl font-bold mb-xs">
              Welcome back, {user?.username}!
            </Title>
            <Text c="dimmed">
              Here's what's happening with your account today.
            </Text>
          </div>

          {/* Stats Grid */}
          <Grid gutter="md">
            {stats.map((stat) => (
              <Grid.Col key={stat.label} span={{ base: 12, sm: 6, md: 3 }}>
                <Card withBorder padding="lg" radius="md">
                  <Group justify="space-between">
                    <div>
                      <Text size="sm" c="dimmed">
                        {stat.label}
                      </Text>
                      <Title order={3} className="mt-xs">
                        {stat.value}
                      </Title>
                    </div>
                    <stat.icon size={32} color={`var(--mantine-color-${stat.color}-6)`} />
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>

          {/* Recent Orders & Payments */}
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" className="mb-md">
                  <Title order={3}>Recent Orders</Title>
                  <Button variant="subtle" size="sm" component="a" href="/orders">
                    View All
                  </Button>
                </Group>
                <Stack gap="sm">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <Card key={order.id} withBorder padding="md" radius="sm">
                        <Group justify="space-between">
                          <div>
                            <Text fw={500}>{order.id}</Text>
                            <Text size="sm" c="dimmed">{order.date}</Text>
                          </div>
                          <div className="text-right">
                            <Text fw={500}>{order.amount}</Text>
                            <Text size="sm" c={order.rawStatus === 'completed' ? 'green' : 'yellow'}>
                              {order.status}
                            </Text>
                          </div>
                        </Group>
                      </Card>
                    ))
                  ) : (
                    <Text c="dimmed" size="sm" className="text-center py-4">
                      No orders yet
                    </Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" className="mb-md">
                  <Title order={3}>Recent Payments</Title>
                  <Button variant="subtle" size="sm" component="a" href="/payments">
                    View All
                  </Button>
                </Group>
                <Stack gap="sm">
                  {recentPayments.length > 0 ? (
                    recentPayments.map((payment) => (
                      <Card key={payment.id} withBorder padding="md" radius="sm">
                        <Group justify="space-between">
                          <div>
                            <Text fw={500}>{payment.id}</Text>
                            <Text size="sm" c="dimmed">{payment.date}</Text>
                          </div>
                          <div className="text-right">
                            <Text fw={500}>{payment.amount}</Text>
                            <Text size="sm" c={payment.rawStatus === 'completed' ? 'green' : 'yellow'}>
                              {payment.status}
                            </Text>
                          </div>
                        </Group>
                      </Card>
                    ))
                  ) : (
                    <Text c="dimmed" size="sm" className="text-center py-4">
                      No payments yet
                    </Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>

          {/* Quick Actions */}
          <Card withBorder padding="lg" radius="md">
            <Title order={3} className="mb-md">Quick Actions</Title>
            <Group>
              <Button component="a" href="/orders/new" variant="filled">
                Create New Order
              </Button>
              <Button component="a" href="/payments" variant="outline">
                View Payments
              </Button>
              <Button component="a" href="/profile" variant="subtle">
                Edit Profile
              </Button>
            </Group>
          </Card>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}

/**
 * Error boundary for dashboard page
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