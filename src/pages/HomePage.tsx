import { Link } from "react-router";
import { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { mockProducts, mockPurchaseHistory } from "../lib/mockData";
import { adService, Ad } from "../services/adService";
import { ProductImage } from "../components/ui/ProductImage";
import { postService, Post } from "../services/postService";
import { productService } from "../services/productService";
import { Product } from "../types";
import { Layout, Clock, ChevronLeft, ChevronRight, X, Package, Coins, ArrowRight, Zap } from "lucide-react";
import { productImages } from "../lib/productImages";
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from "react";
import bannerEducation from '../assets/banner_education.png';

export function HomePage() {
  const user = storage.getUser();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [activeBanners, setActiveBanners] = useState<Ad[]>([]);
  const [subBanners, setSubBanners] = useState<Ad[]>([]);
  const [activePopup, setActivePopup] = useState<Ad | null>(null);
  const [newsPosts, setNewsPosts] = useState<Post[]>([]);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });
  const [scrollProgress, setScrollProgress] = useState(0);

  // Fetch active ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const banners = await adService.getActiveAds('main_banner');
        setActiveBanners(banners);

        const subs = await adService.getActiveAds('sub_banner');
        setSubBanners(subs);

        const popups = await adService.getActiveAds('popup');
        if (popups.length > 0) {
          const hidePopup = localStorage.getItem(`hideHomePopup_${popups[0].id}`);
          if (!hidePopup) {
            setActivePopup(popups[0]);
            setShowPopup(true);
            adService.trackEvent(popups[0].id, 'impression');
          }
        }
      } catch (error) {
        console.error('Failed to fetch home ads:', error);
      }
    };

    const fetchNews = async () => {
      try {
        const posts = await postService.getPosts('news');
        setNewsPosts(posts.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch news posts:', error);
      }
    };

    const fetchMedia = async () => {
      try {
        const posts = await postService.getPosts("media");
        setMediaPosts(posts.filter(p => p.isVisible).slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch media posts:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const products = await productService.getProducts();
        const activeProducts = products.filter(p => p.isActive);

        if (activeProducts.length > 0) {
          setRecommendedProducts(activeProducts.slice(0, 24));
        } else {
          setRecommendedProducts(mockProducts.slice(0, 24));
        }
      } catch (error) {
        console.error('Failed to fetch real products:', error);
        setRecommendedProducts(mockProducts.slice(0, 6));
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchAds();
    fetchNews();
    fetchMedia();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeBanners.length > 0) {
      const currentAd = activeBanners[currentSlide];
      if (currentAd) {
        adService.trackEvent(currentAd.id, 'impression');
      }
    }
  }, [currentSlide, activeBanners]);

  useEffect(() => {
    if (activeBanners.length > 0) {
      const timer = setInterval(() => {
        handleNextSlide();
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [currentSlide, activeBanners.length]);

  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isTransitioning || activeBanners.length <= 1) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handlePrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isTransitioning || activeBanners.length <= 1) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleAdClick = (ad: Ad) => {
    adService.trackEvent(ad.id, 'click');
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    if (dontShowAgain && activePopup) {
      localStorage.setItem(`hideHomePopup_${activePopup.id}`, 'true');
    }
  };

  const onScroll = useCallback((emblaApi: any) => {
    const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
    setScrollProgress(progress * 100);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onScroll(emblaApi);
    emblaApi.on('scroll', () => onScroll(emblaApi));
    emblaApi.on('reInit', () => onScroll(emblaApi));
  }, [emblaApi, onScroll]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <div className="w-full bg-white">
      {/* 1. Main Banner - Full Background with Boxed Content */}
      <section
        className="relative border-b border-neutral-100"
        style={{
          backgroundColor: '#F0F3F7',
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
          height: '560px',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '1440px', margin: '0 auto', height: '100%', position: 'relative' }}>
          {activeBanners.length > 0 ? (
            <div className="relative w-full h-full group">
              <div className="h-full overflow-hidden">
                <div
                  className="flex h-full transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {activeBanners.map((banner) => (
                    <div key={banner.id} className="min-w-full h-full relative">
                      <Link
                        to={banner.linkUrl}
                        className="block w-full h-full group relative"
                        onClick={() => handleAdClick(banner)}
                      >
                        <ProductImage
                          src={banner.imagePcUrl || ''}
                          alt={banner.title}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.01]"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {activeBanners.length > 1 && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-between z-[100] px-4">
                  <button
                    type="button"
                    onClick={(e) => handlePrevSlide(e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="pointer-events-auto p-4 bg-white/40 hover:bg-white rounded-full transition-all text-neutral-900 shadow-2xl backdrop-blur-lg hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleNextSlide(e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="pointer-events-auto p-4 bg-white/40 hover:bg-white rounded-full transition-all text-neutral-900 shadow-2xl backdrop-blur-lg hover:scale-110 active:scale-95 cursor-pointer"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>
              )}

              {activeBanners.length > 1 && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-[100] flex gap-3">
                  {activeBanners.map((ad, index) => (
                    <button
                      key={ad.id}
                      type="button"
                      onClick={(e) => goToSlide(index, e)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${index === currentSlide ? "bg-neutral-900 w-10" : "bg-neutral-900/20 hover:bg-neutral-900/40"
                        }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full">
              <Link to="/products" className="block w-full h-full group overflow-hidden">
                <img
                  src="https://xbtnhnkwlioufpyeuyyg.supabase.co/storage/v1/object/public/marketing/hero_full_image.png"
                  alt="Main Banner"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
                />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 2. Product Section - 로그인한 사용자만 표시 */}
      {user && (
      <section className="w-full bg-white py-20 md:py-[160px] border-t border-neutral-50">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="text-center mb-[56px] relative">
            <h1
              className="text-[54px] text-[#515151] mb-[12px] tracking-tight"
              style={{
                fontFamily: "'Palatino', 'Palatino Linotype', 'Palatino LT STD', 'Book Antiqua', Georgia, serif",
                lineHeight: '48px',
                fontSize: '54px'
              }}
            >
              Product
            </h1>
            <h2 className="text-[24px] font-semibold mb-4" style={{ color: '#21358D' }}>
              최근구매상품
            </h2>
            <Link
              to="/products"
              className="absolute right-0 bottom-0 text-[18px] font-medium text-[#1E293B] border border-[#21358D]/30 px-[36px] py-[12px] rounded-full hover:bg-neutral-50 hover:border-[#21358D] shadow-sm transition-all font-sans"
            >
              전체보기
            </Link>
          </div>

          <div className="overflow-hidden mb-[40px] w-full" ref={emblaRef}>
            <div className="flex" style={{ marginLeft: '-20px' }}>
              {isLoadingProducts ? (
                [1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} style={{ flex: '0 0 223px', minWidth: '223px', paddingLeft: '20px' }} className="min-w-0 flex-shrink-0 flex flex-col animate-pulse">
                    <div className="aspect-[4/5] bg-neutral-100 mb-[16px]" />
                    <div className="h-3 bg-neutral-100 w-1/3 mb-[8px]" />
                    <div className="h-5 bg-neutral-100 w-full mb-[10px]" />
                    <div className="h-3 bg-neutral-100 w-1/2 mb-[10px]" />
                    <div className="h-5 bg-neutral-100 w-1/3" />
                  </div>
                ))
              ) : recommendedProducts.length > 0 ? (
                recommendedProducts.map((product) => (
                  <div key={product.id} style={{ flex: '0 0 223px', minWidth: '223px', paddingLeft: '20px' }} className="min-w-0 flex-shrink-0">
                    <Link
                      to={`/products/${product.id}`}
                      className="flex flex-col group font-sans h-full w-full"
                    >
                      <div className="w-full aspect-[4/4.8] bg-[#F8F9FA] overflow-hidden mb-[16px] flex items-center justify-center relative transition-all duration-500 group-hover:bg-white group-hover:shadow-[0_15px_40px_rgba(0,0,0,0.05)] group-hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-[#1E3A8A]">
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain p-4"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span
                          style={{
                            fontSize: '13px',
                            lineHeight: '18px',
                            color: '#94A3B8',
                            fontWeight: 500,
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '-0.025em'
                          }}
                          className="truncate"
                        >
                          {product.category || "JEISYS-PROD-001"}
                        </span>
                        <h3
                          style={{
                            fontSize: '18px',
                            lineHeight: '26px',
                            color: '#1E293B',
                            fontWeight: 400,
                            marginBottom: '24px',
                            minHeight: '56px'
                          }}
                          className="line-clamp-2 group-hover:text-[#21358D] transition-colors"
                        >
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-[0px]" style={{ marginBottom: '12px' }}>
                          <div className="flex items-center gap-[6px] text-[#64748B] overflow-hidden whitespace-nowrap">
                            <Clock className="w-[14px] h-[14px] opacity-70 flex-shrink-0" />
                            <span style={{ fontSize: '14px' }} className="truncate">2026-03-21</span>
                          </div>
                          <span style={{ color: '#64748B', margin: '0 8px', opacity: 0.5 }}>-</span>
                          <div style={{ color: '#64748B', fontSize: '14px' }} className="flex-shrink-0">
                            <span style={{ fontWeight: 500, color: '#1E293B' }}>8</span>회 구매
                          </div>
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#21358D' }}>
                          ₩{product.price.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="w-full py-20 text-center text-neutral-400">
                  표시할 상품이 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-[20px] pt-[40px]">
            <div className="flex-1 h-[48px] flex items-center">
              <div className="w-full h-[2px] bg-[#E2E8F0] relative overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-[#21358D] transition-all duration-300 ease-out"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-[12px]">
              <button
                onClick={scrollPrev}
                className="w-[56px] h-[56px] bg-white border border-[#21358D]/20 rounded-full flex items-center justify-center text-[#21358D] hover:bg-neutral-50 active:scale-95 shadow-lg shadow-black/5 transition-all"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-[28px] h-[28px]" />
              </button>
              <button
                onClick={scrollNext}
                className="w-[56px] h-[56px] bg-[#21358D] rounded-full flex items-center justify-center text-white hover:bg-[#1a2b75] active:scale-95 shadow-lg shadow-[#21358D]/20 transition-all"
                aria-label="Next products"
              >
                <ChevronRight className="w-[28px] h-[28px]" />
              </button>
            </div>
          </div>
        </div>
      </section>
      )}


      {/* 3. News Section - Boxed Content */}
      <section className="w-full bg-white py-20 md:py-[160px] border-t border-neutral-50 font-sans">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="text-center mb-[56px] relative">
            <h1
              className="text-[54px] text-[#515151] mb-[12px] tracking-tight"
              style={{
                fontFamily: "'Palatino', 'Palatino Linotype', 'Palatino LT STD', 'Book Antiqua', Georgia, serif",
                lineHeight: '48px',
                fontSize: '54px'
              }}
            >
              News
            </h1>
            <h2 className="text-[24px] font-semibold mb-4" style={{ color: '#21358D' }}>
              제이시스 뉴스
            </h2>
            <Link
              to="/communication/news"
              className="absolute right-0 bottom-0 text-[18px] font-medium text-[#1E293B] border border-[#21358D]/30 p-5 rounded-full hover:bg-neutral-50 hover:border-[#21358D] shadow-sm transition-all font-sans"
            >
              전체보기
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {newsPosts.length > 0 ? (
              newsPosts.map((post) => (
                <Link key={post.id} to={`/communication/news/${post.id}`} className="group flex flex-col">
                  <div className="aspect-video bg-neutral-100 overflow-hidden mb-6 relative">
                    {post.thumbnailUrl ? (
                      <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <Layout className="w-12 h-12 stroke-[1]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg text-neutral-900 mb-3 line-clamp-2 leading-relaxed group-hover:text-[#21358D] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium tracking-tight">
                      {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="flex flex-col animate-pulse">
                  <div className="aspect-video bg-neutral-100 mb-6" />
                  <div className="h-4 bg-neutral-100 w-3/4 mb-3" />
                  <div className="h-3 bg-neutral-100 w-1/4" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 3-2. Media Section */}
      <section className="w-full bg-[#F8F9FB] py-20 md:py-[160px] border-t border-neutral-100 font-sans">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="text-center mb-[56px] relative">
            <h1
              className="text-[54px] text-[#515151] mb-[12px] tracking-tight"
              style={{
                fontFamily: "'Palatino', 'Palatino Linotype', 'Palatino LT STD', 'Book Antiqua', Georgia, serif",
                lineHeight: '48px',
                fontSize: '54px'
              }}
            >
              Media
            </h1>
            <h2 className="text-[24px] font-semibold mt-3 mb-4" style={{ color: '#21358D' }}>
              제이시스 미디어
            </h2>
            <Link
              to="/communication/media"
              className="absolute right-0 bottom-0 text-[18px] font-medium text-[#1E293B] border border-[#21358D]/30 p-5 rounded-full hover:bg-neutral-50 hover:border-[#21358D] shadow-sm transition-all font-sans"
            >
              전체보기
            </Link>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
            {mediaPosts.length > 0 ? (
              mediaPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.imageUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col"
                >
                  <div className="w-full bg-neutral-100 overflow-hidden mb-4 relative rounded-lg" style={{ aspectRatio: '9/16' }}>
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.src.includes('maxresdefault')) {
                            img.src = img.src.replace('maxresdefault', 'hqdefault');
                          } else if (img.src.includes('hqdefault')) {
                            img.src = img.src.replace('hqdefault', 'mqdefault');
                          }
                        }}
                      />
                    ) : post.imageUrl ? (
                      <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <Layout className="w-12 h-12 stroke-[1]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg text-neutral-900 mb-1.5 line-clamp-2 leading-snug group-hover:text-[#21358D] transition-colors">
                      {post.title}
                    </h3>

                  </div>
                </a>
              ))
            ) : (
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="flex flex-col animate-pulse">
                  <div className="w-full bg-neutral-200 mb-4 rounded-lg" style={{ aspectRatio: '9/16' }} />
                  <div className="h-4 bg-neutral-200 w-3/4 mb-3" />
                  <div className="h-3 bg-neutral-200 w-1/4" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. Application Section */}
      <section className="w-full bg-white py-20 md:py-[120px] border-t border-neutral-50 overflow-hidden font-sans">
        <div className="max-w-[1440px] mx-auto px-4">
          <div className="text-center mb-[56px] relative">
            <h1
              className="text-[54px] text-[#515151] mb-[12px] tracking-tight"
              style={{
                fontFamily: "'Palatino', 'Palatino Linotype', 'Palatino LT STD', 'Book Antiqua', Georgia, serif",
                lineHeight: '48px',
                fontSize: '54px'
              }}
            >
              Application
            </h1>
            <h2 className="text-[24px] font-semibold mt-3 mb-4" style={{ color: '#21358D' }}>
              제이시스메디컬 장비 데모 신청
            </h2>
            <p className="text-[15px] text-neutral-400">
              원하시는 데모 장비의 브랜드 로고를 클릭하시면 데모 신청 페이지로 이동됩니다.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 md:gap-8 pt-8 overflow-hidden">
            {[
              { id: 1, name: '리니어펌', img: productImages.linearfirm },
              { id: 2, name: '셀레브이', img: productImages.ultracelQPlus },
              { id: 3, name: '엣지원', img: productImages.intragen },
              { id: 4, name: '덴서티', img: productImages.potenza },
              { id: 5, name: '포텐자', img: productImages.potenza },
              { id: 6, name: '리니어지', img: productImages.linearz },
              { id: 7, name: '트라이빔', img: productImages.ultracelII }
            ].map((brand) => (
              <div
                key={brand.id}
                className="flex flex-col items-center gap-6 flex-1 min-w-0"
              >
                <div className="w-full aspect-[1/1.2] flex items-center justify-center">
                  <img src={brand.img} alt={brand.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="w-full text-center border-t border-neutral-100 pt-4">
                  <span className="text-[15px] text-neutral-400 font-medium">
                    {brand.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-1. Sub Banner Row: 좌=광고관리 sub_banner / 우=교육신청 고정 */}
      <section className="w-full bg-white" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            alignItems: 'stretch',
          }}
        >
          {/* 좌: 광고관리에서 등록한 sub_banner */}
          {subBanners.length > 0 ? (
            <a
              href={subBanners[0].linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleAdClick(subBanners[0])}
              style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', lineHeight: 0 }}
            >
              <img
                src={subBanners[0].imagePcUrl || ''}
                alt={subBanners[0].title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </a>
          ) : (
            <div style={{ borderRadius: '8px', backgroundColor: '#f0f3f7', minHeight: '200px' }} />
          )}

          {/* 우: 교육신청 고정 배너 */}
          <a
            href="/communication/education"
            style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', lineHeight: 0 }}
          >
            <img
              src={bannerEducation}
              alt="제이시스메디칼 교육신청"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </a>
        </div>
      </section>



      {/* Popup */}
      {showPopup && activePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-sm max-w-[500px] w-full relative flex flex-col overflow-hidden shadow-2xl">
            <button onClick={handlePopupClose} className="absolute top-4 right-4 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-neutral-500 z-10">
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-hidden">
              <a href={activePopup.linkUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleAdClick(activePopup)}>
                <img src={activePopup.imagePcUrl || ''} alt={activePopup.title} className="w-full h-full object-contain" />
              </a>
            </div>
            <div className="p-6 flex items-center justify-between border-t border-neutral-100">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} className="w-4 h-4 mr-2" />
                <span className="text-sm text-neutral-700">다시 보지 않기</span>
              </label>
              <button onClick={handlePopupClose} className="bg-[#21358D] text-white px-8 py-2.5 hover:bg-[#1a2b75] transition-all text-sm font-medium">확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}