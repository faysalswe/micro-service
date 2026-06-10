import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '~/services/api-client';
import { useToast } from '~/hooks/useToast';

interface CartContextValue {
  items: Record<string, number>;
  itemCount: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number, price?: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: () => Promise<{ message: string; order_id: string; status: string } | null>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ userId, children }: { userId?: string; children: ReactNode }) {
  const [items, setItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const fetchCart = useCallback(async () => {
    if (!userId) { setItems({}); return; }
    try {
      setLoading(true);
      const response = await apiClient.getCart(userId);
      if (response.success && response.data) {
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

  const addToCart = async (productId: string, quantity: number = 1, price: number = 0) => {
    if (!userId) { showError('Please login to add items to cart'); return; }
    try {
      setLoading(true);
      await apiClient.addToCart(userId, productId, quantity, price);
      await fetchCart();
      showSuccess('Item added to cart');
    } catch {
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
    } catch {
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
        return response.data ?? null;
      }
    } catch (err: any) {
      showError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
    return null;
  };

  const itemCount = Object.values(items).reduce((sum, qty) => sum + qty, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, loading, addToCart, clearCart, checkout, refreshCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used inside CartProvider');
  return ctx;
}
