import { supabase } from '../lib/supabaseClient';

export type AdPlacement = 'main_banner' | 'email_banner' | 'popup' | 'side_banner';

export interface Ad {
    id: string;
    title: string;
    placement: AdPlacement;
    imagePcUrl: string | null;
    imageMobileUrl: string | null;
    linkUrl: string;
    startDate: string | null;
    endDate: string | null;
    isActive: boolean;
    displayOrder: number;
    createdAt: string;
}

export interface AdStats {
    adId: string;
    statDate: string;
    impressions: number;
    clicks: number;
    ctr: number;
}

export const adService = {
    // 광고 목록 조회 (어드민용 - 필터링 가능)
    async getAds(placement?: AdPlacement): Promise<Ad[]> {
        let query = supabase
            .from('ads')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (placement) {
            query = query.eq('placement', placement);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(this.mapAd);
    },

    // 현재 노출 가능한 광고 조회 (프론트엔드용)
    async getActiveAds(placement: AdPlacement): Promise<Ad[]> {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('ads')
            .select('*')
            .eq('placement', placement)
            .eq('is_active', true)
            .lte('start_date', now)
            .or(`end_date.is.null,end_date.gte.${now}`)
            .order('display_order', { ascending: true });

        if (error) throw error;
        return (data || []).map(this.mapAd);
    },

    async createAd(ad: Partial<Ad>): Promise<Ad> {
        const { data, error } = await supabase
            .from('ads')
            .insert({
                title: ad.title,
                placement: ad.placement,
                image_pc_url: ad.imagePcUrl,
                image_mobile_url: ad.imageMobileUrl,
                link_url: ad.linkUrl,
                start_date: ad.startDate,
                end_date: ad.endDate,
                is_active: ad.isActive ?? true,
                display_order: ad.displayOrder ?? 0,
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapAd(data);
    },

    async updateAd(id: string, ad: Partial<Ad>): Promise<Ad> {
        const { data, error } = await supabase
            .from('ads')
            .update({
                title: ad.title,
                placement: ad.placement,
                image_pc_url: ad.imagePcUrl,
                image_mobile_url: ad.imageMobileUrl,
                link_url: ad.linkUrl,
                start_date: ad.startDate,
                end_date: ad.endDate,
                is_active: ad.isActive,
                display_order: ad.displayOrder,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return this.mapAd(data);
    },

    async deleteAd(id: string): Promise<void> {
        const { error } = await supabase
            .from('ads')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // 이벤트 추적 (노출/클릭)
    async trackEvent(adId: string, type: 'impression' | 'click'): Promise<void> {
        const { error } = await supabase.rpc('track_ad_event', {
            target_ad_id: adId,
            event_type: type,
        });
        if (error) console.error(`Failed to track ${type}:`, error);
    },

    // 통계 리포트 조회
    async getStats(startDate: string, endDate: string, adId?: string): Promise<AdStats[]> {
        let query = supabase
            .from('ad_stats')
            .select('*, ads(title, placement, is_active)')
            .gte('stat_date', startDate)
            .lte('stat_date', endDate)
            .order('stat_date', { ascending: true });

        if (adId) {
            query = query.eq('ad_id', adId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((item: any) => ({
            adId: item.ad_id,
            statDate: item.stat_date,
            impressions: item.impressions,
            clicks: item.clicks,
            ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
            adTitle: item.ads?.title,
            adPlacement: item.ads?.placement,
            isActive: item.ads?.is_active ?? false,
        }));
    },

    // 이미지 업로드
    async uploadAdImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('ads')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading ad image:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('ads')
            .getPublicUrl(filePath);

        return publicUrl;
    },

    mapAd(item: any): Ad {
        return {
            id: item.id,
            title: item.title,
            placement: item.placement as AdPlacement,
            imagePcUrl: item.image_pc_url,
            imageMobileUrl: item.image_mobile_url,
            linkUrl: item.link_url,
            startDate: item.start_date,
            endDate: item.end_date,
            isActive: item.is_active,
            displayOrder: item.display_order,
            createdAt: item.created_at,
        };
    }
};
