import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService, Category } from '../services/categoryService';

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => categoryService.getCategories(),
    });
};

export const useSaveCategories = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (categories: Category[]) => categoryService.saveCategories(categories),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => categoryService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });
};
