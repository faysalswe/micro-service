import { useEffect, useState } from 'react';
import type { MetaFunction } from 'react-router';
import { Container, Title, Text, SimpleGrid, Loader, Alert, Stack, Box } from '@mantine/core';
import { IconAlertCircle, IconPackageOff } from '@tabler/icons-react';
import { apiClient } from '~/services/api-client';
import { ProductCard } from '~/components/store/ProductCard';

export const meta: MetaFunction = () => [
  { title: 'Browse Products - WebApp Store' },
  { name: 'description', content: 'Explore our wide range of products available in stock.' },
];

interface Product {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await apiClient.getInventory();
        if (response.success && response.data) {
          setProducts(response.data);
        } else {
          setError('Failed to load products. Please try again later.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <Container size="lg" className="py-24">
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text size="lg" c="dimmed">Loading amazing products for you...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" className="py-24">
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="md">
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" className="py-xl">
      <Stack gap="xl">
        <Box>
          <Title order={1} className="text-3xl font-bold mb-xs">
            Our Products
          </Title>
          <Text size="lg" c="dimmed">
            Discover our collection of high-quality items.
          </Text>
        </Box>

        {products.length === 0 ? (
          <Stack align="center" className="py-24" gap="md">
            <IconPackageOff size={64} className="text-gray-300" stroke={1.5} />
            <Text size="xl" fw={500} c="dimmed">No products found</Text>
            <Text c="dimmed">We couldn't find any products in our inventory right now.</Text>
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="lg">
            {products.map((product) => (
              <ProductCard key={product.productId} product={product} />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
