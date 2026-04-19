import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '~/services/api-client';
import { useToast } from './useToast';

export function useCart(userId?: string) {
  const [items, setItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchCart = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await apiClient.getCart(userId);
      if (response.success && response.data) {
        // Convert string quantities to numbers
        const cartItems: Record<string, number> = {};
        Object.entries(response.data.items).forEach(([id, qty]) => {
          cartItems[id] = parseInt(qty, 10);
        });
        setItems(cartItems);
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!userId) {
      showError('Please login to add items to cart');
      return;
    }
    try {
      setLoading(true);
      await apiClient.addToCart(userId, productId, quantity);
      await fetchCart();
      showSuccess('Item added to cart');
    } catch (err) {
      showError('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      await apiClient.clearCart(userId);
      setItems({});
      showSuccess('Cart cleared');
    } catch (err) {
      showError('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const checkout = async () => {
    if (!userId) return null;
    try {
      setLoading(true);
      const response = await apiClient.checkout(userId);
      if (response.success) {
        setItems({});
        showSuccess('Order placed successfully!');
        return response.data;
      }
    } catch (err: any) {
      showError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
    return null;
  };

  const itemCount = Object.values(items).reduce((sum, qty) => sum + qty, 0);

  return {
    items,
    itemCount,
    loading,
    addToCart,
    clearCart,
    checkout,
    refreshCart: fetchCart
  };
}
