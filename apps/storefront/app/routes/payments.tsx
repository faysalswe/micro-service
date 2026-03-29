/**
 * Payments Route
 * List user payments
 */

import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { data as json } from 'react-router';
import { Container, Title, Text, Card, Group, Stack, Table, Loader, Alert, Badge, Button } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconClock, IconX, IconCurrencyDollar } from '@tabler/icons-react';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { useAuth } from '~/contexts/auth-context';
import { usePayments } from '~/hooks';

/**
 * Meta tags for payments page
 */
export const meta: MetaFunction = () => [
  { title: 'Payments - WebApp' },
  { name: 'description', content: 'View and manage your payments' },
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
 * Payments page component
 */
export default function PaymentsPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: payments = [], isLoading, error } = usePayments({ userId });

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="green" leftSection={<IconCheck size={12} />}>Completed</Badge>;
      case 'processing':
        return <Badge color="blue" leftSection={<IconClock size={12} />}>Processing</Badge>;
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClock size={12} />}>Pending</Badge>;
      case 'failed':
        return <Badge color="red" leftSection={<IconX size={12} />}>Failed</Badge>;
      case 'refunded':
        return <Badge color="orange" leftSection={<IconCurrencyDollar size={12} />}>Refunded</Badge>;
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
            <Text>Loading your payments...</Text>
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
            title="Error Loading Payments"
            color="red"
            variant="filled"
            className="mb-md"
          >
            Failed to load payments. Please try again later.
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
                Payments
              </Title>
              <Text c="dimmed">
                View and manage your payments ({payments.length} total)
              </Text>
            </div>
          </Group>

          {/* Payments Table */}
          <Card withBorder padding="lg" radius="md">
            {payments.length > 0 ? (
              <Table.ScrollContainer minWidth={600}>
                <Table verticalSpacing="md" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Payment ID</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Order ID</Table.Th>
                      <Table.Th>Amount</Table.Th>
                      <Table.Th>Method</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {payments.map((payment) => (
                      <Table.Tr key={payment.id}>
                        <Table.Td>
                          <Text fw={500} className="font-mono">
                            {payment.id}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(payment.createdAt)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" className="font-mono">
                            {payment.orderId}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500}>${payment.amount.toFixed(2)}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" tt="capitalize">
                            {payment.paymentMethod}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {getStatusBadge(payment.status)}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              variant="subtle"
                              component="a"
                              href={`/payments/${payment.id}`}
                            >
                              View
                            </Button>
                            {payment.status === 'completed' && (
                              <Button size="xs" variant="outline" color="orange">
                                Refund
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
                  No payments found.
                </Text>
                <Text size="sm" c="dimmed">
                  Payments will appear here once you complete an order.
                </Text>
              </div>
            )}
          </Card>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}