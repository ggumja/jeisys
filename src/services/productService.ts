import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

export interface ProductInput {
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  stock: number;
  description?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface PricingTierInput {
  min_quantity: number;
  unit_price: number;
}

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
        ),
        product_images (
          image_url
        )
      `)
      .order('display_no', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      displayNo: item.display_no,
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
      imageUrl: item.image_url,
      additionalImages: item.product_images.map((pi: any) => pi.image_url),
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
        ),
        product_images (
          image_url
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
      additionalImages: data.product_images.map((pi: any) => pi.image_url),
      description: data.description,
      stock: data.stock,
    };
  },

  async createProduct(productData: ProductInput): Promise<any> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        sku: productData.sku,
        name: productData.name,
        category: productData.category,
        subcategory: productData.subcategory,
        price: productData.price,
        stock: productData.stock,
        description: productData.description,
        image_url: productData.image_url,
        is_active: productData.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return data;
  },

  async updateProduct(id: string, productData: Partial<ProductInput>): Promise<any> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...(productData.sku && { sku: productData.sku }),
        ...(productData.name && { name: productData.name }),
        ...(productData.category && { category: productData.category }),
        ...(productData.subcategory !== undefined && { subcategory: productData.subcategory }),
        ...(productData.price !== undefined && { price: productData.price }),
        ...(productData.stock !== undefined && { stock: productData.stock }),
        ...(productData.description !== undefined && { description: productData.description }),
        ...(productData.image_url !== undefined && { image_url: productData.image_url }),
        ...(productData.is_active !== undefined && { is_active: productData.is_active }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async addPricingTiers(productId: string, tiers: PricingTierInput[]): Promise<void> {
    // First, delete existing tiers
    await supabase
      .from('product_pricing_tiers')
      .delete()
      .eq('product_id', productId);

    // Then insert new tiers
    if (tiers.length > 0) {
      const { error } = await supabase
        .from('product_pricing_tiers')
        .insert(
          tiers.map(tier => ({
            product_id: productId,
            min_quantity: tier.min_quantity,
            unit_price: tier.unit_price,
          }))
        );

      if (error) {
        console.error('Error adding pricing tiers:', error);
        throw error;
      }
    }
  },

  async uploadProductImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async addProductImages(productId: string, imageUrls: string[]): Promise<void> {
    if (imageUrls.length === 0) return;

    const { error } = await supabase
      .from('product_images')
      .insert(
        imageUrls.map((url, index) => ({
          product_id: productId,
          image_url: url,
          display_order: index,
        }))
      );

    if (error) {
      console.error('Error adding product images:', error);
      throw error;
    }
  },

  async deleteProductImages(productId: string): Promise<void> {
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', productId);

    if (error) {
      console.error('Error deleting product images:', error);
      throw error;
    }
  },
};
