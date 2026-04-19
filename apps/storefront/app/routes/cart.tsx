import { useEffect, useState } from 'react';
import { Container, Title, Text, Table, Button, Group, Stack, Box, Card, Loader, Alert } from '@mantine/core';
import { IconShoppingCart, IconTrash, IconCreditCard, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/auth-context';
import { useCart } from '~/hooks/useCart';
import { apiClient } from '~/services/api-client';

interface Product {
  productId: string;
  name: string;
  price: number;
}

export default function CartPage() {
  const { user } = useAuth();
  const { items, loading: cartLoading, clearCart, checkout, itemCount } = useCart(user?.id);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadProductDetails() {
      try {
        setLoadingProducts(true);
        const response = await apiClient.getInventory();
        if (response.success && response.data) {
          const productMap: Record<string, Product> = {};
          response.data.forEach(p => {
            productMap[p.productId] = p;
          });
          setProducts(productMap);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProductDetails();
  }, []);

  const handleCheckout = async () => {
    const result = await checkout();
    if (result && result.order_id) {
      navigate(`/orders/${result.order_id}`);
    }
  };

  const total = Object.entries(items).reduce((sum, [id, qty]) => {
    const product = products[id];
    return sum + (product ? product.price * qty : 0);
  }, 0);

  if (cartLoading || loadingProducts) {
    return (
      <Container size="lg" className="py-24">
        <Stack align="center">
          <Loader size="xl" />
          <Text>Loading your cart...</Text>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-xl">
      <Title order={1} mb="xl">Your Shopping Cart</Title>

      {itemCount === 0 ? (
        <Card withBorder padding="xl" radius="md" className="text-center py-24">
          <IconShoppingCart size={64} className="mx-auto text-gray-300 mb-md" />
          <Text size="xl" fw={500}>Your cart is empty</Text>
          <Text c="dimmed" mb="xl">Looks like you haven't added anything yet.</Text>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card withBorder radius="md">
              <Table verticalSpacing="md">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(items).map(([id, qty]) => {
                    const product = products[id];
                    return (
                      <tr key={id}>
                        <td>
                          <Text fw={500}>{product?.name || 'Unknown Product'}</Text>
                          <Text size="xs" c="dimmed">{id}</Text>
                        </td>
                        <td>${product?.price.toFixed(2) || '0.00'}</td>
                        <td>{qty}</td>
                        <td>${(product ? product.price * qty : 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              
              <Group justify="flex-end" mt="xl">
                <Button variant="subtle" color="red" leftSection={<IconTrash size={16} />} onClick={clearCart}>
                  Clear Cart
                </Button>
              </Group>
            </Card>
          </div>

          <div>
            <Card withBorder radius="md" padding="xl">
              <Title order={3} mb="lg">Order Summary</Title>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text>Subtotal ({itemCount} items)</Text>
                  <Text fw={500}>${total.toFixed(2)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text>Shipping</Text>
                  <Text c="green" fw={500}>Free</Text>
                </Group>
                <Box className="border-t pt-md mt-md">
                  <Group justify="space-between">
                    <Text size="lg" fw={700}>Total</Text>
                    <Text size="lg" fw={700} color="blue">${total.toFixed(2)}</Text>
                  </Group>
                </Box>
              </Stack>

              <Button 
                fullWidth 
                size="lg" 
                mt="xl" 
                leftSection={<IconCreditCard size={20} />}
                onClick={handleCheckout}
              >
                Checkout Now
              </Button>
            </Card>
          </div>
        </div>
      )}
    </Container>
  );
}
