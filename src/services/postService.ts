import { supabase } from '../lib/supabaseClient';

export type PostType = 'notice' | 'faq' | 'news' | 'media' | 'manual';

export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: string | null;
  viewCount: number;
  isVisible: boolean;
  imageUrl: string | null;
  createdAt: string;
  category?: string;
  platform?: string;
}

export interface PostInput {
  type: PostType;
  title: string;
  content?: string;
  isVisible?: boolean;
  image_url?: string;
  category?: string;
  platform?: string;
}

export const postService = {
  async getPosts(type?: PostType): Promise<Post[]> {
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }

    return data.map((item: any) => ({
      id: item.id,
      type: item.type as PostType,
      title: item.title,
      content: item.content,
      viewCount: item.view_count,
      isVisible: item.is_visible,
      imageUrl: item.image_url,
      createdAt: item.created_at,
      platform: item.platform,
      category: item.category,
    }));
  },

  async getPostById(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching post:', error);
      return null;
    }

    return {
      id: data.id,
      type: data.type as PostType,
      title: data.title,
      content: data.content,
      viewCount: data.view_count,
      isVisible: data.is_visible,
      imageUrl: data.image_url,
      createdAt: data.created_at,
      platform: data.platform,
      category: data.category,
    };
  },

  async createPost(input: Partial<Post>): Promise<any> {
    const insertData: any = {
      type: input.type,
      title: input.title,
      content: input.content,
      is_visible: input.isVisible ?? true,
      image_url: input.imageUrl,
      category: input.category,
      platform: input.platform,
    };

    const { data, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    return data ? data[0] : null;
  },

  async updatePost(id: string, input: Partial<Post>): Promise<any> {
    // Only include fields that exist in the database to avoid 400 errors
    const updateData: any = {};
    if (input.type) updateData.type = input.type;
    if (input.title) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.isVisible !== undefined) updateData.is_visible = input.isVisible;
    if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl;

    // category and platform might not exist yet if schema update wasn't run
    if (input.category !== undefined) updateData.category = input.category;
    if (input.platform !== undefined) updateData.platform = input.platform;

    console.log('Final Update Data:', updateData);

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating post:', error);
      throw error;
    }

    return data ? data[0] : null;
  },

  async deletePost(id: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  async incrementViewCount(id: string): Promise<void> {
    const { error } = await supabase.rpc('increment_post_view_count', { post_id: id });
    if (error) {
      // Fallback to manual update if RPC doesn't exist
      const { data: post } = await supabase.from('posts').select('view_count').eq('id', id).single();
      if (post) {
        await supabase.from('posts').update({ view_count: (post.view_count || 0) + 1 }).eq('id', id);
      }
    }
  }
};

export interface FaqCategory {
  id: string;
  label: string;
  displayOrder: number;
}

export const faqCategoryService = {
  async getCategories(): Promise<FaqCategory[]> {
    const { data, error } = await supabase
      .from('faq_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQ categories:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      label: item.label,
      displayOrder: item.display_order,
    }));
  },

  async createCategory(id: string, label: string): Promise<FaqCategory | null> {
    // Get max order
    const { data: maxOrderData } = await supabase
      .from('faq_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrderData?.display_order || 0) + 1;

    const { data, error } = await supabase
      .from('faq_categories')
      .insert({
        id,
        label,
        display_order: nextOrder
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating FAQ category:', error);
      throw error;
    }

    return {
      id: data.id,
      label: data.label,
      displayOrder: data.display_order
    };
  },

  async updateCategory(id: string, updates: Partial<FaqCategory>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;

    const { error } = await supabase
      .from('faq_categories')
      .update(dbUpdates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('faq_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
