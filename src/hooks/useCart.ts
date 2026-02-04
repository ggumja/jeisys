import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartService } from '../services/cartService';

/**
 * Hook to fetch cart items
 */
export const useCart = () => {
    return useQuery({
        queryKey: ['cart'],
        queryFn: () => cartService.getCart(),
        staleTime: 1 * 60 * 1000, // 1 minute
    });
};

/**
 * Hook to add item to cart
 */
export const useAddToCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { productId: string; quantity: number; isSubscription?: boolean }) =>
            cartService.addToCart(data.productId, data.quantity, data.isSubscription),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
};

/**
 * Hook to update cart item quantity
 */
export const useUpdateCartItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { productId: string; quantity: number }) =>
            cartService.updateQuantity(data.productId, data.quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
};

/**
 * Hook to remove item from cart
 */
export const useRemoveFromCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (productId: string) => cartService.removeItem(productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
};

/**
 * Hook to clear cart
 */
export const useClearCart = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => cartService.clearCart(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
};
