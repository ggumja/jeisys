import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService, ProductInput, PricingTierInput } from '../services/productService';

/**
 * Hook to fetch all products
 */
export const useProducts = () => {
    return useQuery({
        queryKey: ['products'],
        queryFn: () => productService.getProducts(),
    });
};

/**
 * Hook to fetch a single product by ID
 */
export const useProduct = (id: string) => {
    return useQuery({
        queryKey: ['product', id],
        queryFn: () => productService.getProductById(id),
        enabled: !!id,
    });
};

/**
 * Hook to create a new product
 */
export const useCreateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (productData: ProductInput) => productService.createProduct(productData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

/**
 * Hook to update a product
 */
export const useUpdateProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) =>
            productService.updateProduct(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
        },
    });
};

/**
 * Hook to delete a product
 */
export const useDeleteProduct = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => productService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

/**
 * Hook to add pricing tiers to a product
 */
export const useAddPricingTiers = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, tiers }: { productId: string; tiers: PricingTierInput[] }) =>
            productService.addPricingTiers(productId, tiers),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

/**
 * Hook to fetch products by category
 */
export const useProductsByCategory = (category: string) => {
    const { data: products = [], ...rest } = useProducts();

    const filteredProducts = category
        ? products.filter(p => p.category === category)
        : products;

    return {
        data: filteredProducts,
        ...rest,
    };
};
