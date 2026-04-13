import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

export interface ProductInput {
  sku: string;
  sap_sku?: string;
  manufacturer?: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  stock: number;
  description?: string;
  image_url?: string | null;
  is_active?: boolean;
  is_visible?: boolean;
  is_package?: boolean;
  selectable_count?: number;
  item_input_type?: 'select' | 'input';
  sales_unit?: number;
  base_product_id?: string | null;
  stock_multiplier?: number;
  credit_available?: boolean;
  points_available?: boolean;
  subscription_discount?: number;
  min_order_quantity?: number;
  max_order_quantity?: number;
  quantity_input_type?: 'button' | 'list';
  is_promotion?: boolean;
  buy_quantity?: number;
  get_quantity?: number;
  promotion_item_ids?: string[];
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
        ),
        product_bonus_items:product_bonus_items!parent_product_id (
          *,
          product:products!bonus_product_id (*)
        ),
        product_quantity_options (*)
      `)
      .order('display_no', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data.map((item: any) => this.mapProduct(item));
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
        ),
        product_bonus_items:product_bonus_items!parent_product_id (
          *,
          product:products!bonus_product_id (*)
        ),
        product_quantity_options (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return this.mapProduct(data);
  },

  async createProduct(productData: ProductInput): Promise<any> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        sku: productData.sku,
        sap_sku: productData.sap_sku,
        manufacturer: productData.manufacturer,
        name: productData.name,
        category: productData.category,
        subcategory: productData.subcategory,
        price: productData.price,
        stock: productData.stock,
        description: productData.description,
        image_url: productData.image_url,
        is_active: productData.is_active ?? true,
        is_visible: productData.is_visible ?? true,
        is_package: productData.is_package ?? false,
        is_promotion: productData.is_promotion ?? false,
        buy_quantity: productData.buy_quantity ?? 0,
        get_quantity: productData.get_quantity ?? 0,
        selectable_count: productData.selectable_count ?? 1,
        item_input_type: productData.item_input_type ?? 'select',
        credit_available: productData.credit_available ?? true,
        points_available: productData.points_available ?? true,
        subscription_discount: productData.subscription_discount,
        min_order_quantity: productData.min_order_quantity ?? 1,
        max_order_quantity: productData.max_order_quantity,
        quantity_input_type: productData.quantity_input_type ?? 'button',
        base_product_id: productData.base_product_id || null,
        stock_multiplier: productData.stock_multiplier || 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return this.mapProduct(data);
  },

  async updateProduct(id: string, productData: Partial<ProductInput>): Promise<any> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...(productData.sku && { sku: productData.sku }),
        ...(productData.sap_sku !== undefined && { sap_sku: productData.sap_sku }),
        ...(productData.manufacturer !== undefined && { manufacturer: productData.manufacturer }),
        ...(productData.name && { name: productData.name }),
        ...(productData.category && { category: productData.category }),
        ...(productData.subcategory !== undefined && { subcategory: productData.subcategory }),
        ...(productData.price !== undefined && { price: productData.price }),
        ...(productData.stock !== undefined && { stock: productData.stock }),
        ...(productData.description !== undefined && { description: productData.description }),
        ...(productData.image_url !== undefined && { image_url: productData.image_url }),
        ...(productData.is_active !== undefined && { is_active: productData.is_active }),
        ...(productData.is_visible !== undefined && { is_visible: productData.is_visible }),
        ...(productData.is_package !== undefined && { is_package: productData.is_package }),
        ...(productData.is_promotion !== undefined && { is_promotion: productData.is_promotion }),
        ...(productData.buy_quantity !== undefined && { buy_quantity: productData.buy_quantity }),
        ...(productData.get_quantity !== undefined && { get_quantity: productData.get_quantity }),
        ...(productData.selectable_count !== undefined && { selectable_count: productData.selectable_count }),
        ...(productData.item_input_type !== undefined && { item_input_type: productData.item_input_type }),
        ...(productData.credit_available !== undefined && { credit_available: productData.credit_available }),
        ...(productData.points_available !== undefined && { points_available: productData.points_available }),
        ...(productData.subscription_discount !== undefined && { subscription_discount: productData.subscription_discount }),
        ...(productData.min_order_quantity !== undefined && { min_order_quantity: productData.min_order_quantity }),
        ...(productData.max_order_quantity !== undefined && { max_order_quantity: productData.max_order_quantity }),
        ...(productData.quantity_input_type !== undefined && { quantity_input_type: productData.quantity_input_type }),
        ...(productData.sales_unit !== undefined && { sales_unit: productData.sales_unit }),
        ...(productData.base_product_id !== undefined && { base_product_id: productData.base_product_id }),
        ...(productData.stock_multiplier !== undefined && { stock_multiplier: productData.stock_multiplier }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return this.mapProduct(data);
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

  async getPackageItems(packageId: string, optionId?: string): Promise<any[]> {
    let query = supabase
      .from('package_items')
      .select(`
        *,
        product:products!product_id (*)
      `)
      .eq('package_id', packageId);

    if (optionId) {
      query = query.eq('option_id', optionId);
    }

    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching package items:', error);
      throw error;
    }

    return data.map(item => ({
      id: item.id,
      packageId: item.package_id,
      productId: item.product_id,
      priceOverride: item.price_override,
      maxQuantity: item.max_quantity,
      optionId: item.option_id,
      product: item.product ? this.mapProduct(item.product) : undefined
    }));
  },

  mapProduct(item: any): Product {
    return {
      id: item.id,
      displayNo: item.display_no,
      sku: item.sku,
      sapSku: item.sap_sku,
      manufacturer: item.manufacturer,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      compatibleEquipment: item.product_compatibility?.map((pc: any) => pc.equipment?.code).filter(Boolean) || [],
      price: item.price,
      tierPricing: item.product_pricing_tiers?.map((pt: any) => ({
        quantity: pt.min_quantity,
        unitPrice: pt.unit_price,
      })).sort((a: any, b: any) => a.quantity - b.quantity) || [],
      imageUrl: item.image_url,
      additionalImages: item.product_images?.map((pi: any) => pi.image_url) || [],
      description: item.description,
      stock: item.stock,
      isPackage: item.is_package,
      isPromotion: item.is_promotion,
      buyQuantity: item.buy_quantity,
      getQuantity: item.get_quantity,
      selectableCount: item.selectable_count,
      salesUnit: item.sales_unit || 1,
      baseProductId: item.base_product_id,
      stockMultiplier: item.stock_multiplier || 1,
      itemInputType: item.item_input_type,
      creditAvailable: item.credit_available,
      pointsAvailable: item.points_available,
      isVisible: item.is_visible,
      isActive: item.is_active,
      subscriptionDiscount: item.subscription_discount,
      minOrderQuantity: item.min_order_quantity || 1,
      maxOrderQuantity: item.max_order_quantity || undefined,
      quantityInputType: item.quantity_input_type || 'button',
      discountRate: item.discount_rate || 0,
      bonusItems: item.product_bonus_items?.map((bi: any) => ({
        id: bi.id,
        productId: bi.bonus_product_id,
        quantity: bi.quantity,
        priceOverride: bi.price_override,
        optionId: bi.option_id,
        calculationMethod: bi.calculation_method || 'fixed',
        percentage: bi.percentage || 0,
        product: bi.product ? this.mapProduct(bi.product) : undefined
      })) || [],
      options: item.product_quantity_options?.map((opt: any) => ({
        id: opt.id,
        productId: opt.product_id,
        name: opt.name,
        quantity: opt.quantity,
        discountRate: opt.discount_rate,
        price: opt.price,
        displayOrder: opt.display_order
      })).sort((a: any, b: any) => a.displayOrder - b.displayOrder) || [],
    };
  },

  async addPackageItems(packageId: string, items: { productId: string; priceOverride?: number; maxQuantity?: number; optionId?: string | null }[]): Promise<void> {
    // Delete existing
    await supabase.from('package_items').delete().eq('package_id', packageId);

    if (items.length === 0) return;

    const { error } = await supabase
      .from('package_items')
      .insert(
        items.map((item, index) => ({
          package_id: packageId,
          product_id: item.productId,
          price_override: item.priceOverride,
          max_quantity: item.maxQuantity || 0,
          option_id: item.optionId || null,
          display_order: index,
        }))
      );

    if (error) {
      console.error('Error adding package items:', error);
      throw error;
    }
  },

  async addOptions(productId: string, options: any[]): Promise<any[]> {
    await supabase.from('product_quantity_options').delete().eq('product_id', productId);

    if (options.length === 0) return [];

    const { data, error } = await supabase
      .from('product_quantity_options')
      .insert(
        options.map((opt, index) => ({
          product_id: productId,
          name: opt.name,
          quantity: opt.quantity,
          discount_rate: opt.discountRate,
          price: opt.price || 0,
          display_order: index,
        }))
      )
      .select();

    if (error) {
      console.error('Error adding product options:', error);
      throw error;
    }
    
    return data.sort((a: any, b: any) => a.display_order - b.display_order);
  },

  async addBonusItems(productId: string, items: { bonusProductId: string; quantity: number; priceOverride?: number; optionId?: string | null; calculationMethod?: string; percentage?: number }[]): Promise<void> {
    // Delete existing
    await supabase.from('product_bonus_items').delete().eq('parent_product_id', productId);

    if (items.length === 0) return;

    const { error } = await supabase.from('product_bonus_items').insert(
      items.map((item) => ({
        parent_product_id: productId,
        bonus_product_id: item.bonusProductId,
        quantity: item.quantity,
        price_override: item.priceOverride,
        option_id: item.optionId || null,
        calculation_method: item.calculationMethod || 'fixed',
        percentage: item.percentage || 0,
      }))
    );

    if (error) {
      console.error('Error adding bonus items:', error);
      throw error;
    }
  },

  async searchProducts(term: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
      .eq('is_package', false)
      .eq('is_promotion', false)
      .limit(20);

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return data.map((item: any) => this.mapProduct(item));
  },

  async getPromotionItems(promotionId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('product_promotion_items')
      .select(`
        product:products!product_id (*)
      `)
      .eq('parent_product_id', promotionId);

    if (error) {
      console.error('Error fetching promotion items:', error);
      throw error;
    }

    return data.map((item: any) => this.mapProduct(item.product));
  },

  async createPromotionProduct(productData: ProductInput): Promise<any> {
    const { promotion_item_ids, ...baseData } = productData;
    
    // 1. Create the promotion product
    const created = await this.createProduct({
      ...baseData,
      is_promotion: true
    });

    // 2. Add promotion items
    if (promotion_item_ids && promotion_item_ids.length > 0) {
      const { error } = await supabase
        .from('product_promotion_items')
        .insert(
          promotion_item_ids.map(productId => ({
            parent_product_id: created.id,
            product_id: productId
          }))
        );

      if (error) {
        console.error('Error adding promotion items:', error);
        throw error;
      }
    }

    return created;
  },

  async updatePromotionProduct(id: string, productData: Partial<ProductInput>): Promise<any> {
    const { promotion_item_ids, ...baseData } = productData;

    // 1. Update basic product info
    const updated = await this.updateProduct(id, baseData);

    // 2. Update promotion items
    if (promotion_item_ids) {
      // Delete existing
      await supabase.from('product_promotion_items').delete().eq('parent_product_id', id);

      // Add new
      if (promotion_item_ids.length > 0) {
        const { error } = await supabase
          .from('product_promotion_items')
          .insert(
            promotion_item_ids.map(productId => ({
              parent_product_id: id,
              product_id: productId
            }))
          );

        if (error) {
          console.error('Error updating promotion items:', error);
          throw error;
        }
      }
    }

    return updated;
  }
};
