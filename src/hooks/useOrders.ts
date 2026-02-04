import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/orderService';

/**
 * Hook to fetch user's orders
 */
export const useOrders = () => {
    return useQuery({
        queryKey: ['orders'],
        queryFn: () => orderService.getOrders(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to fetch a single order by ID
 */
export const useOrder = (orderId: string) => {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: () => orderService.getOrderById(orderId),
        enabled: !!orderId,
    });
};

/**
 * Hook to create a new order
 */
export const useCreateOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: orderService.createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
};

/**
 * Hook to cancel an order
 */
export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderId: string) => orderService.cancelOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};
