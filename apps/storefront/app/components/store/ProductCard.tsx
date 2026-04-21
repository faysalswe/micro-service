import { Card, Image, Text, Badge, Button, Group, Stack } from '@mantine/core';
import { IconShoppingCart, IconPackage } from '@tabler/icons-react';
import { useCart } from '~/hooks/useCart';
import { useAuth } from '~/contexts/auth-context';

interface ProductCardProps {
  product: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { addToCart, loading } = useCart(user?.id);
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity < 10;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder className="flex flex-col h-full">
      <Card.Section>
        <div className="bg-gray-100 dark:bg-gray-800 h-48 flex items-center justify-center">
          <IconPackage size={64} className="text-gray-400" stroke={1.5} />
        </div>
      </Card.Section>

      <Stack justify="space-between" className="mt-md flex-1">
        <div>
          <Group justify="space-between" mb="xs">
            <Text fw={700} className="line-clamp-1">{product.name}</Text>
            <Badge 
              color={isOutOfStock ? 'red' : isLowStock ? 'yellow' : 'green'} 
              variant="light"
            >
              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
            </Badge>
          </Group>

          <Text size="sm" c="dimmed" mb="xs" className="font-mono">
            SKU: {product.productId}
          </Text>

          <Text size="xl" fw={700} color="blue">
            ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          
          <Text size="xs" c="dimmed" mt={4}>
            {product.quantity} items remaining
          </Text>
        </div>

        {user && (
          <Button 
            fullWidth 
            radius="md" 
            mt="md"
            variant={isOutOfStock ? 'light' : 'filled'}
            disabled={isOutOfStock}
            loading={loading}
            onClick={() => addToCart(product.productId, 1, product.price)}
            leftSection={<IconShoppingCart size={16} />}
          >
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </Button>
        )}
      </Stack>
    </Card>
  );
}
