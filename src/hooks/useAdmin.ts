import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';

export const useAdminUsers = () => {
    return useQuery({
        queryKey: ['admin', 'users'],
        queryFn: () => adminService.getUsers(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useUpdateUserStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, status }: { userId: string, status: 'APPROVED' | 'REJECTED' }) =>
            adminService.updateUserStatus(userId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
        },
    });
};

export const useUserEquipments = (userId: string) => {
    return useQuery({
        queryKey: ['admin', 'users', userId, 'equipments'],
        queryFn: () => adminService.getUserEquipments(userId),
        enabled: !!userId,
    });
};
