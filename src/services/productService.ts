import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

export const productService = {
    async getProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        product_compatibility (
          equipment:equipments (
            code
          )
        ),
        product_pricing_tiers (
          min_quantity,
          unit_price
        )
      `);

        if (error) {
            console.error('Error fetching products:', error);
            throw error;
        }

        return data.map((item: any) => ({
            id: item.id,
            sku: item.sku,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            compatibleEquipment: item.product_compatibility.map((pc: any) => pc.equipment?.code).filter(Boolean),
            price: item.price,
            tierPricing: item.product_pricing_tiers.map((pt: any) => ({
                quantity: pt.min_quantity,
                unitPrice: pt.unit_price,
            })).sort((a: any, b: any) => a.quantity - b.quantity),
            imageUrl: item.image_url, // Note: DB uses image_url, type uses imageUrl. Check schema.
            description: item.description,
            stock: item.stock,
        }));
    },

    async getProductById(id: string): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        product_compatibility (
          equipment:equipments (
            code
          )
        ),
         product_pricing_tiers (
          min_quantity,
          unit_price
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            return null;
        }

        return {
            id: data.id,
            sku: data.sku,
            name: data.name,
            category: data.category,
            subcategory: data.subcategory,
            compatibleEquipment: data.product_compatibility.map((pc: any) => pc.equipment?.code).filter(Boolean),
            price: data.price,
            tierPricing: data.product_pricing_tiers.map((pt: any) => ({
                quantity: pt.min_quantity,
                unitPrice: pt.unit_price,
            })).sort((a: any, b: any) => a.quantity - b.quantity),
            imageUrl: data.image_url,
            description: data.description,
            stock: data.stock,
        };
    }
};
