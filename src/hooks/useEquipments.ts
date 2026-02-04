import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services/equipmentService';
import { authService } from '../services/authService';

/**
 * Hook to fetch all equipment models
 */
export const useEquipments = () => {
    return useQuery({
        queryKey: ['equipments'],
        queryFn: () => equipmentService.getEquipmentModels(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Hook to fetch user's equipments
 */
export const useUserEquipments = () => {
    return useQuery({
        queryKey: ['user-equipments'],
        queryFn: async () => {
            const user = await authService.getCurrentUser();
            if (!user) return [];
            return equipmentService.getUserEquipment();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to register equipment to user
 */
export const useRegisterEquipment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            equipmentId: string;
            serialNumber: string;
            installDate: string;
        }) => equipmentService.registerEquipment(
            data.equipmentId,
            data.serialNumber,
            data.installDate
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-equipments'] });
        },
    });
};
