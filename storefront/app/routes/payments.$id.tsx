/**
 * Payment Details Route
 * View a specific payment
 */

import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { data as json, useParams } from 'react-router';
import { Container, Title, Text, Card, Button, Group, Stack, Loader, Alert, Badge, Grid } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconClock, IconX, IconCurrencyDollar, IconArrowLeft } from '@tabler/icons-react';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { usePayment } from '~/hooks';

/**
 * Meta tags for payment details page
 */
export const meta: MetaFunction = () => [
  { title: 'Payment Details - WebApp' },
  { name: 'description', content: 'View payment details' },
];

/**
 * Loader function
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);
  const paymentId = params['id'];
  return json({ theme, language, paymentId });
}

/**
 * Payment details page component
 */
export default function PaymentDetailsPage() {
  const { id } = useParams();
  const { data: payment, isLoading, error } = usePayment(id || '');

  // Helper to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="green" leftSection={<IconCheck size={12} />} size="lg">Completed</Badge>;
      case 'processing':
        return <Badge color="blue" leftSection={<IconClock size={12} />} size="lg">Processing</Badge>;
      case 'pending':
        return <Badge color="yellow" leftSection={<IconClock size={12} />} size="lg">Pending</Badge>;
      case 'failed':
        return <Badge color="red" leftSection={<IconX size={12} />} size="lg">Failed</Badge>;
      case 'refunded':
        return <Badge color="orange" leftSection={<IconCurrencyDollar size={12} />} size="lg">Refunded</Badge>;
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
            <Text>Loading payment details...</Text>
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
            title="Error Loading Payment"
            color="red"
            variant="filled"
            className="mb-md"
          >
            Failed to load payment details. Please try again later.
            <br />
            <Text size="sm" mt="xs">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </Text>
          </Alert>
          <Button
            leftSection={<IconArrowLeft size={16} />}
            component="a"
            href="/payments"
            variant="light"
          >
            Back to Payments
          </Button>
        </Container>
      </ProtectedRoute>
    );
  }

  // Handle payment not found
  if (!payment) {
    return (
      <ProtectedRoute>
        <Container size="md" className="py-xl">
          <Alert
            icon={<IconAlertCircle size={20} />}
            title="Payment Not Found"
            color="orange"
            variant="filled"
            className="mb-md"
          >
            The requested payment could not be found.
          </Alert>
          <Button
            leftSection={<IconArrowLeft size={16} />}
            component="a"
            href="/payments"
            variant="light"
          >
            Back to Payments
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
                Payment Details
              </Title>
              <Text c="dimmed">
                Payment ID: {payment.id}
              </Text>
            </div>
            <Button
              leftSection={<IconArrowLeft size={16} />}
              component="a"
              href="/payments"
              variant="subtle"
            >
              Back to Payments
            </Button>
          </Group>

          {/* Payment Details Card */}
          <Card withBorder padding="xl" radius="md">
            <Stack gap="lg">
              {/* Status */}
              <div>
                <Text size="sm" c="dimmed" mb="xs">Status</Text>
                {getStatusBadge(payment.status)}
              </div>

              {/* Payment Information */}
              <Grid gutter="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Payment ID</Text>
                    <Text fw={500} className="font-mono">{payment.id}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">User ID</Text>
                    <Text fw={500} className="font-mono">{payment.userId}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Order ID</Text>
                    <Text fw={500} className="font-mono">{payment.orderId}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Amount</Text>
                    <Title order={3}>${payment.amount.toFixed(2)}</Title>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Payment Method</Text>
                    <Text fw={500} tt="capitalize">{payment.paymentMethod}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Transaction ID</Text>
                    <Text fw={500} className="font-mono">{payment.transactionId || 'N/A'}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Created</Text>
                    <Text fw={500}>{formatDate(payment.createdAt)}</Text>
                  </div>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <div>
                    <Text size="sm" c="dimmed" mb="xs">Last Updated</Text>
                    <Text fw={500}>{formatDate(payment.updatedAt)}</Text>
                  </div>
                </Grid.Col>
              </Grid>

              {/* Actions */}
              <Group mt="md">
                {payment.status === 'completed' && (
                  <Button variant="outline" color="orange">
                    Request Refund
                  </Button>
                )}
                <Button variant="subtle">
                  Download Receipt
                </Button>
              </Group>
            </Stack>
          </Card>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}