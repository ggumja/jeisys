import { Link } from "react-router";
import { Package, Coins, ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import {
  mockEquipment,
  mockProducts,
  mockPurchaseHistory,
} from "../lib/mockData";
import heroBackground from "@/assets/ad843824065901ed0a4fc63f6a56c44c7c4ad85d.png";
import { adService, Ad } from "../services/adService";

export function HomePage() {
  const user = storage.getUser();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [activeBanners, setActiveBanners] = useState<Ad[]>([]);
  const [activePopup, setActivePopup] = useState<Ad | null>(null);

  const recommendedProducts = mockProducts
    .filter((p) =>
      mockPurchaseHistory
        .map((ph) => ph.productId)
        .includes(p.id),
    )
    .slice(0, 4);

  // Fetch active ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const banners = await adService.getActiveAds('main_banner');
        console.log('Fetched Main Banners:', banners);
        setActiveBanners(banners);

        const popups = await adService.getActiveAds('popup');
        console.log('Fetched Popups:', popups);
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
    fetchAds();
  }, []);

  // Track banner impression
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

  const handleNextSlide = () => {
    if (isTransitioning || activeBanners.length <= 1) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handlePrevSlide = () => {
    if (isTransitioning || activeBanners.length <= 1) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
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

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
      {/* Banner Carousel */}
      {activeBanners.length > 0 && (
        <div className="mb-12 rounded-sm overflow-hidden">
          <div className="relative bg-neutral-300">
            <div className="relative overflow-hidden aspect-[2.8/1]">
              <div
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {activeBanners.map((ad, index) => (
                  <a
                    key={ad.id}
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleAdClick(ad)}
                    className="min-w-full h-full flex-shrink-0 relative"
                  >
                    <picture>
                      <source media="(max-width: 768px)" srcSet={ad.imageMobileUrl || ad.imagePcUrl || ''} />
                      <img
                        src={ad.imagePcUrl || ''}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                      />
                    </picture>
                  </a>
                ))}
              </div>
            </div>
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  disabled={isTransitioning}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-6 h-6 text-neutral-900" />
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={isTransitioning}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50"
                >
                  <ChevronRight className="w-6 h-6 text-neutral-900" />
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                  <ul className="flex items-center justify-center gap-2">
                    {activeBanners.map((ad, index) => (
                      <li key={ad.id}>
                        <button
                          onClick={() => goToSlide(index)}
                          disabled={isTransitioning}
                          className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                            }`}
                          aria-label={`배너 ${index + 1}로 이동`}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div
        className="bg-[#1e3a8a] rounded-sm p-8 lg:p-12 text-white mb-12 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${heroBackground}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="text-3xl lg:text-4xl tracking-tight mb-3 text-white drop-shadow-lg">
          안녕하세요, {user?.name}님
        </h1>
        <p className="text-base text-white drop-shadow-md mb-8">
          {user?.hospitalName}의 스트 클리닉 대시보드입니다
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1e3a8a] rounded-sm flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">
                  보유 장비
                </p>
                <p className="text-3xl font-light tracking-tight text-neutral-900">
                  {mockEquipment.length}대
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1e3a8a] rounded-sm flex items-center justify-center flex-shrink-0">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-1">
                  보유 포인트
                </p>
                <p className="text-3xl font-light tracking-tight text-neutral-900">
                  570,550 Point
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <Link
          to="/quick-order"
          className="group bg-[#1e3a8a] rounded-sm p-8 text-white hover:bg-[#1e40af] transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl tracking-tight mb-2">
                반복 구매 상품
              </h3>
              <p className="text-sm text-neutral-400">
                자주 구매하는 소모품을 빠르게 재주문
              </p>
            </div>
            <ArrowRight className="w-6 h-6 flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          to="/products"
          className="group bg-[#1e3a8a] rounded-sm p-8 text-white hover:bg-[#1e40af] transition-all active:scale-[0.98]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl tracking-tight mb-2">
                전체 상품 기
              </h3>
              <p className="text-sm text-neutral-400">
                카테고리별 소모품 및 장비 검색
              </p>
            </div>
            <ArrowRight className="w-6 h-6 flex-shrink-0 ml-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recommended Products */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl tracking-tight text-neutral-900">
            보유 기기 연관 제품
          </h2>
          <Link
            to="/products"
            className="text-sm text-neutral-900 hover:text-neutral-700 font-medium flex items-center gap-1 underline"
          >
            전체보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProducts.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group bg-white border border-neutral-200 overflow-hidden hover:border-neutral-900 transition-all"
            >
              <div className="aspect-[4/3] bg-neutral-100 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <p className="text-xs text-neutral-500 mb-2 tracking-wide uppercase">
                  {product.sku}
                </p>
                <h3 className="text-lg font-bold tracking-tight text-neutral-900 mb-3 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-lg tracking-tight text-neutral-900">
                  ₩{product.price.toLocaleString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Popup Banner */}
      {showPopup && activePopup && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-sm max-w-[500px] w-full relative flex flex-col" style={{ maxHeight: '90vh' }}>
            <button
              onClick={handlePopupClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all z-10 shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-hidden" style={{ maxHeight: 'calc(90vh - 88px)' }}>
              <a
                href={activePopup.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleAdClick(activePopup)}
              >
                <img
                  src={activePopup.imagePcUrl || ''}
                  alt={activePopup.title}
                  className="w-full h-full object-contain"
                />
              </a>
            </div>
            <div className="p-6 flex items-center justify-between border-t border-neutral-200 flex-shrink-0">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 mr-2 cursor-pointer"
                />
                <span className="text-sm text-neutral-700">다시 보지 않기</span>
              </label>
              <button
                onClick={handlePopupClose}
                className="bg-[#1e3a8a] text-white px-8 py-2.5 hover:bg-[#1e40af] transition-all text-sm font-medium"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}