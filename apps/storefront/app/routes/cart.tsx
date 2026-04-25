/**
 * Cart Page Component
 * Displays the user's shopping cart and allows checkout.
 */

import { useEffect, useState } from 'react';
import { Container, Title, Text, Table, Button, Group, Stack, Box, Card, Loader, Alert } from '@mantine/core';
import { IconShoppingCart, IconTrash, IconCreditCard, IconAlertCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/auth-context';
import { useCart } from '~/hooks/useCart';
import { apiClient, ApiError } from '~/services/api-client'; // Ensure ApiError is imported

interface Product {
  productId: string;
  name: string;
  price: number;
}

export default function CartPage() {
  const { user, isLoading: authLoading } = useAuth(); // Use authLoading for initial auth state
  const { items, loading: cartLoading, clearCart, checkout, itemCount } = useCart(user?.id);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [pointsToSpend, setPointsToSpend] = useState(0); // State for points the user wants to spend
  const [checkoutError, setCheckoutError] = useState<string | null>(null); // State for checkout errors
  const navigate = useNavigate();

  // Fetch product details for display
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

  // Calculate totals
  const subtotal = Object.entries(items).reduce((sum, [id, qty]) => {
    const product = products[id];
    // Ensure product and qty are valid before calculation
    const quantity = parseInt(qty, 10); // Ensure qty is a number
    if (product && !isNaN(quantity) && quantity > 0) {
      return sum + (product.price * quantity);
    }
    return sum;
  }, 0);

  // Assume 100 points = $1 discount
  const pointsToDollarsRate = 0.01; 
  const maxPointsToSpend = user?.loyaltyPoints || 0; // User's available points
  // Ensure points to spend is not more than available points and not negative
  const pointsToSpendValue = Math.max(0, Math.min(pointsToSpend, maxPointsToSpend)); 
  const discountAmount = pointsToSpendValue * pointsToDollarsRate;
  const total = Math.max(0, subtotal - discountAmount); // Ensure total doesn't go below zero

  // Handle checkout
  const handleCheckout = async () => {
    if (!user) {
      setCheckoutError('User not logged in. Please log in to checkout.');
      return; 
    }
    if (itemCount === 0) {
      setCheckoutError('Your cart is empty. Please add items to checkout.');
      return;
    }

    setCheckoutError(null); // Clear previous errors

    try {
      // Pass points to spend to the checkout API call
      const result = await apiClient.checkout(user.id, pointsToSpendValue); 
      if (result.success && result.data?.order_id) {
        navigate(`/orders/${result.data.order_id}`);
      } else {
        setCheckoutError(result.message || 'Checkout failed. Please try again.');
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setCheckoutError(err instanceof ApiError ? err.message : 'An unexpected error occurred during checkout.');
    }
  };

  // Show loader if cart, products, or auth state is loading
  if (cartLoading || loadingProducts || authLoading) {
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
                    // Ensure qty is treated as a number for calculations
                    const quantity = parseInt(qty, 10); 
                    // Calculate item subtotal safely
                    const itemSubtotal = product && !isNaN(quantity) && quantity > 0 ? product.price * quantity : 0;
                    return (
                      <tr key={id}>
                        <td>
                          <Text fw={500}>{product?.name || 'Unknown Product'}</Text>
                          <Text size="xs" c="dimmed">{id}</Text>
                        </td>
                        <td>${product?.price.toFixed(2) || '0.00'}</td>
                        <td>{qty}</td>
                        <td>${itemSubtotal.toFixed(2)}</td>
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
                  <Text fw={500}>${subtotal.toFixed(2)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text>Shipping</Text>
                  <Text c="green" fw={500}>Free</Text>
                </Group>

                {/* Available Loyalty Points Display */}
                {user?.loyaltyPoints !== undefined && user.loyaltyPoints > 0 && (
                  <Group justify="space-between">
                    <Text fw={500}>Available Loyalty Points</Text>
                    <Text fw={500}>{user.loyaltyPoints}</Text>
                  </Group>
                )}

                {/* Points to Spend Input and Discount Calculation */}
                {user?.loyaltyPoints !== undefined && user.loyaltyPoints > 0 && (
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text fw={500}>Points to Spend</Text>
                      <input
                        type="number"
                        min="0"
                        max={maxPointsToSpend} // Max points user can spend
                        value={pointsToSpend}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          // Update state, ensure it's a valid number and within limits
                          setPointsToSpend(isNaN(value) ? 0 : Math.min(value, maxPointsToSpend));
                        }}
                        className="w-24 text-right p-1 border rounded"
                        aria-label="Points to spend"
                      />
                    </Group>
                    <Text size="xs" c="dimmed">
                      100 points = $1 discount (Max: ${maxPointsToSpend * pointsToDollarsRate.toFixed(2)})
                    </Text>
                    {discountAmount > 0 && (
                      <Group justify="space-between">
                        <Text c="blue">Discount</Text>
                        <Text c="blue" fw={500}>-${discountAmount.toFixed(2)}</Text>
                      </Group>
                    )}
                  </Stack>
                )}

                <Box className="border-t pt-md mt-md">
                  <Group justify="space-between">
                    <Text size="lg" fw={700}>Total</Text>
                    <Text size="lg" fw={700} color="blue">${total.toFixed(2)}</Text>
                  </Group>
                </Box>
              </Stack>

              {checkoutError && (
                <Alert title="Checkout Error" color="red" variant="light" mt="md" icon={<IconAlertCircle size={18} />}>
                  {checkoutError}
                </Alert>
              )}

              <Button 
                fullWidth 
                size="lg" 
                mt="xl" 
                leftSection={<IconCreditCard size={20} />}
                onClick={handleCheckout}
                // Disable checkout if loading, user not logged in, cart is empty, or total is zero unless items exist
                disabled={cartLoading || !user || (itemCount === 0 && total === 0)} 
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