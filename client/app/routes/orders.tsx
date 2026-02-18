/**
 * Orders Route
 * List user orders
 */

import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { data as json } from 'react-router';
import { Container, Title, Text, Card, Button, Group, Stack, Table, Loader, Alert, Badge } from '@mantine/core';
import { IconPlus, IconAlertCircle, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { useAuth } from '~/contexts/auth-context';
import { useOrders } from '~/hooks';

/**
 * Meta tags for orders page
 */
export const meta: MetaFunction = () => [
  { title: 'Orders - WebApp' },
  { name: 'description', content: 'View and manage your orders' },
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
 * Orders page component
 */
export default function OrdersPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: orders = [], isLoading, error } = useOrders(userId);

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="green" leftSection={<IconCheck size={12} />}>Completed</Badge>;
      case 'processing':
        return <Badge color="blue" leftSection={<IconClock size={12} />}>Processing</Badge>;
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClock size={12} />}>Pending</Badge>;
      case 'cancelled':
        return <Badge color="red" leftSection={<IconX size={12} />}>Cancelled</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle loading state
  if (isLoading) {
    return (
      <ProtectedRoute>
        <Container size="lg" className="py-xl">
          <div className="flex-center min-h-96 flex-col gap-md">
            <Loader size="xl" />
            <Text>Loading your orders...</Text>
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
            title="Error Loading Orders"
            color="red"
            variant="filled"
            className="mb-md"
          >
            Failed to load orders. Please try again later.
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
          <Group justify="space-between" align="center">
            <div>
              <Title order={1} className="text-3xl font-bold mb-xs">
                Orders
              </Title>
              <Text c="dimmed">
                View and manage your orders ({orders.length} total)
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={18} />}
              component="a"
              href="/orders/new"
            >
              Create New Order
            </Button>
          </Group>

          {/* Orders Table */}
          <Card withBorder padding="lg" radius="md">
            {orders.length > 0 ? (
              <Table.ScrollContainer minWidth={600}>
                <Table verticalSpacing="md" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Order ID</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Product</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {orders.map((order) => (
                      <Table.Tr key={order.id}>
                        <Table.Td>
                          <Text fw={500} className="font-mono">
                            {order.id}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(order.createdAt)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">Product {order.productId}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500}>${order.amount.toFixed(2)}</Text>
                        </Table.Td>
                        <Table.Td>
                          {getStatusBadge(order.status)}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="subtle"
                              component="a"
                              href={`/orders/${order.id}`}
                            >
                              View
                            </Button>
                            {order.status === 'pending' && (
                              <Button size="xs" variant="outline" color="red">
                                Cancel
                              </Button>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            ) : (
              <div className="text-center py-10">
                <Text size="lg" c="dimmed" className="mb-md">
                  You haven't placed any orders yet.
                </Text>
                <Button
                  leftSection={<IconPlus size={18} />}
                  component="a"
                  href="/orders/new"
                  variant="light"
                >
                  Create Your First Order
                </Button>
              </div>
            )}
          </Card>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}