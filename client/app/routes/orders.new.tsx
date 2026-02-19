/**
 * New Order Route
 * Create a new order with dynamic inventory support
 */

import { useState, useEffect } from 'react';
import type { MetaFunction, LoaderFunctionArgs } from 'react-router';
import { data as json, useNavigate } from 'react-router';
import { 
  Container, 
  Title, 
  Text, 
  Card, 
  NumberInput, 
  Button, 
  Stack, 
  Group, 
  Select,
  Alert,
  Loader,
  Center
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconInfoCircle, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { ProtectedRoute } from '~/components/auth/protected-route';
import { useTranslation, useInventory } from '~/hooks';
import { useAuth } from '~/contexts/auth-context';
import { apiClient } from '~/services/api-client';

/**
 * Meta tags for new order page
 */
export const meta: MetaFunction = () => [
  { title: 'New Order - WebApp' },
  { name: 'description', content: 'Create a new order with dynamic inventory support' },
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dynamic products from Inventory Service
  const { data: products, isLoading: productsLoading, error: productsError } = useInventory();

  const form = useForm({
    initialValues: {
      productId: '',
      quantity: 1,
      amount: 0,
    },
    validate: {
      productId: (value) => (value ? null : 'Product ID is required'),
      quantity: (value) => (value >= 1 ? null : 'Quantity must be at least 1'),
      amount: (value) => (value > 0 ? null : 'Amount must be greater than 0'),
    },
  });

  // Set initial product when data loads
  useEffect(() => {
    if (products && products.length > 0 && !form.values.productId) {
      const firstProd = products[0];
      form.setValues({
        productId: firstProd.productID,
        amount: firstProd.price * form.values.quantity,
        quantity: form.values.quantity
      });
    }
  }, [products]);

  const handleProductChange = (value: string | null) => {
    if (!value || !products) return;
    
    const product = products.find(p => p.productID === value);
    if (product) {
      form.setFieldValue('productId', value);
      form.setFieldValue('amount', product.price * form.values.quantity);
    }
  };

  const handleQuantityChange = (value: number | string) => {
    const qty = typeof value === 'number' ? value : parseInt(value) || 1;
    form.setFieldValue('quantity', qty);
    
    if (!products) return;
    const product = products.find(p => p.productID === form.values.productId);
    if (product) {
      form.setFieldValue('amount', product.price * qty);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createOrder({
        userId: user.id,
        productId: values.productId,
        amount: values.amount,
        quantity: values.quantity,
      });

      if (response.success) {
        notifications.show({
          title: 'Order Created',
          message: 'Your order has been successfully created and processed.',
          color: 'green',
          icon: <IconCheck size={18} />,
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (productsLoading) {
    return (
      <Center className="h-96">
        <Stack align="center" gap="xs">
          <Loader size="lg" />
          <Text c="dimmed">Fetching latest product inventory...</Text>
        </Stack>
      </Center>
    );
  }

  if (productsError) {
    return (
      <Container size="sm" className="py-xl">
        <Alert icon={<IconAlertCircle size={16} />} title="Inventory Unreachable" color="red">
          Could not connect to the Inventory Service. Please ensure all microservices are running.
        </Alert>
      </Container>
    );
  }

  return (
    <ProtectedRoute>
      <Container size="sm" className="py-xl">
        <Stack gap="lg">
          <div>
            <Title order={1} className="text-3xl font-bold mb-xs">
              Create New Order
            </Title>
            <Text c="dimmed">
              Browse our dynamic catalog. All items and prices are fetched in real-time from the Go Inventory Service.
            </Text>
          </div>

          <Card withBorder shadow="sm" padding="xl" radius="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {error && (
                  <Alert variant="light" color="red" title="Order Processing Error" icon={<IconAlertCircle />}>
                    {error}
                  </Alert>
                )}

                <Select
                  label="Available Products"
                  description="Fetched from Inventory database"
                  placeholder="Choose a product"
                  data={products?.map(p => ({
                    value: p.productID,
                    label: `${p.name} ($${p.price}) - In Stock: ${p.quantity}`
                  }))}
                  {...form.getInputProps('productId')}
                  onChange={handleProductChange}
                  allowDeselect={false}
                />

                <Group grow>
                  <NumberInput
                    label="Quantity"
                    placeholder="Enter quantity"
                    min={1}
                    max={100}
                    {...form.getInputProps('quantity')}
                    onChange={handleQuantityChange}
                  />

                  <NumberInput
                    label="Total Amount ($)"
                    placeholder="Total price"
                    precision={2}
                    readOnly
                    variant="filled"
                    {...form.getInputProps('amount')}
                  />
                </Group>

                <Alert variant="light" color="blue" icon={<IconInfoCircle />}>
                  <Text size="sm">
                    This order will initiate a <strong>Polyglot Distributed Transaction (Saga)</strong>:
                    <ul className="mt-xs ml-md list-disc">
                      <li><strong>Inventory Service (Go)</strong>: Deducts {form.values.quantity} items from DB.</li>
                      <li><strong>Payment Service (Node.js)</strong>: Processes dynamic payment of ${form.values.amount}.</li>
                      <li><strong>Order Service (.NET)</strong>: Orchestrates the flow and persists status.</li>
                    </ul>
                  </Text>
                </Alert>

                <Button 
                  type="submit" 
                  size="lg" 
                  fullWidth 
                  loading={loading}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  Confirm & Place Order
                </Button>
                
                <Button 
                  variant="subtle" 
                  color="gray" 
                  fullWidth 
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Stack>
            </form>
          </Card>
        </Stack>
      </Container>
    </ProtectedRoute>
  );
}
