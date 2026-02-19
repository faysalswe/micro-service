/**
 * Order Details Route
 * View a specific order
 */

import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { data as json, useParams } from 'react-router';
import { Container, Title, Text, Card, Button, Group, Stack, Loader, Alert, Badge, Grid } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconClock, IconX, IconArrowLeft } from '@tabler/icons-react';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { useOrder } from '~/hooks';

/**
 * Meta tags for order details page
 */
export const meta: MetaFunction = () => [
  { title: 'Order Details - WebApp' },
  { name: 'description', content: 'View order details' },
];

/**
 * Loader function
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);
  const orderId = params['id'];
  return json({ theme, language, orderId });
}

/**
 * Order details page component
 */
export default function OrderDetailsPage() {
  const { id } = useParams();
  const { data: order, isLoading, error } = useOrder(id || '');

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="green" leftSection={<IconCheck size={12} />} size="lg">Completed</Badge>;
      case 'processing':
        return <Badge color="blue" leftSection={<IconClock size={12} />} size="lg">Processing</Badge>;
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClock size={12} />} size="lg">Pending</Badge>;
      case 'cancelled':
        return <Badge color="red" leftSection={<IconX size={12} />} size="lg">Cancelled</Badge>;
      default:
        return <Badge color="gray" size="lg">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle loading state
  if (isLoading) {
    return (
      <ProtectedRoute>
        <Container size="md" className="py-xl">
          <div className="flex-center min-h-96 flex-col gap-md">
            <Loader size="xl" />
            <Text>Loading order details...</Text>
          </div>
        </Container>
      </ProtectedRoute>
    );
  }

  // Handle error state
  if (error) {
    return (
      <ProtectedRoute>
        <Container size="md" className="py-xl">
          <Alert
            icon={<IconAlertCircle size={20} />}
            title="Error Loading Order"
            color="red"
            variant="filled"
            className="mb-md"
          >
            Failed to load order details. Please try again later.
            <br />
            <Text size="sm" mt="xs">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </Text>
          </Alert>
          <Button
            leftSection={<IconArrowLeft size={16} />}
            component="a"
            href="/orders"
            variant="light"
          >
            Back to Orders
          </Button>
        </Container>
      </ProtectedRoute>
    );
  }

  // Handle order not found
  if (!order) {
    return (
      <ProtectedRoute>
        <Container size="md" className="py-xl">
          <Alert
            icon={<IconAlertCircle size={20} />}
            title="Order Not Found"
            color="orange"
            variant="filled"
            className="mb-md"
          >
            The requested order could not be found.
          </Alert>
          <Button
            leftSection={<IconArrowLeft size={16} />}
            component="a"
            href="/orders"
            variant="light"
          >
            Back to Orders
          </Button>
        </Container>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Container size="md" className="py-xl">
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between" align="center">
            <div>
              <Title order={1} className="text-3xl font-bold mb-xs">
                Order Details
              </Title>
              <Text c="dimmed">
                Order ID: {order.id}
              </Text>
            </div>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              component="a"
              href="/orders"
              variant="subtle"
            >
              Back to Orders
            </Button>
          </Group>

          {/* Order Details Card */}
          <Card withBorder padding="xl" radius="md">
            <Stack gap="lg">
              {/* Status */}
              <div>
                <Text size="sm" c="dimmed" mb="xs">Status</Text>
                {getStatusBadge(order.status)}
              </div>

              {/* Order Information */}
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Order ID</Text>
                    <Text fw={500} className="font-mono">{order.id}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">User ID</Text>
                    <Text fw={500} className="font-mono">{order.userId}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Product ID</Text>
                    <Text fw={500} className="font-mono">{order.productId}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Amount</Text>
                    <Title order={3}>${order.amount.toFixed(2)}</Title>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Created</Text>
                    <Text fw={500}>{formatDate(order.createdAt)}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Last Updated</Text>
                    <Text fw={500}>{formatDate(order.updatedAt)}</Text>
                  </div>
                </Grid.Col>
              </Grid>

              {/* Actions */}
              <Group mt="md">
                {order.status === 'pending' && (
                  <>
                    <Button variant="filled" color="red">
                      Cancel Order
                    </Button>
                    <Button variant="outline">
                      Contact Support
                    </Button>
                  </>
                )}
                {order.status === 'completed' && (
                  <Button variant="outline">
                    Request Refund
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}