import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { storage } from '../lib/storage';
import { User } from '../types';
import { authService } from '../services/authService';
import { BASE_PATH } from '../constants/paths';
import logoImage from '@/assets/4591d8760fc4bee033f8f40ab29f57f1554d66ce.png';
import { HelpCircle, FileText, GraduationCap, Monitor, Newspaper, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import bannerImage1 from "@/assets/64532cd4dc417352b5d7e0c9ba765b439636e04f.png";
import bannerImage2 from "@/assets/0b54070218d9e3fce2c717fa5151d3a1cd8da40e.png";
import bannerImage3 from "@/assets/7e526b8f5a164c84b13d3608733c8a229ef8f255.png";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const bannerSlides = [
    { id: 1, image: bannerImage1, alt: "DENSITY HIGH 배너" },
    { id: 2, image: bannerImage2, alt: "LINEARZ 배너" },
    { id: 3, image: bannerImage3, alt: "POTENZA 배너" },
  ];

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const { user, session } = await authService.signIn(email, password);

      if (user && session) {
        // Get rich user profile
        const profile = await authService.getCurrentUser();
        if (profile) {
          storage.setUser(profile);
          storage.setAuthToken(session.access_token);
          navigate(`${BASE_PATH}/`);
        }
      }
    } catch (error: any) {
      alert('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      console.error('Login failed:', error);
    }
  };

  const publicLinks = [
    { to: '/public/faq', icon: HelpCircle, label: 'FAQ', description: '자주 묻는 질문' },
    { to: '/public/manual', icon: FileText, label: '제품 메뉴얼', description: 'PDF 다운로드' },
    { to: '/public/news', icon: Newspaper, label: '제이시스 뉴스', description: '최신 소식' },
    { to: '/public/media', icon: Video, label: '제이시스 미디어', description: '영상 콘텐츠' },
  ];

  const handleSlideChange = (direction: 'prev' | 'next') => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : bannerSlides.length - 1));
      } else {
        setCurrentSlide((prev) => (prev < bannerSlides.length - 1 ? prev + 1 : 0));
      }
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl mb-8">
        {/* Banner Carousel */}
        <div className="rounded-sm overflow-hidden">
          <div className="relative bg-[#F3D9DA]">
            <div className="relative overflow-hidden aspect-[2.8/1]">
              <div
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {bannerSlides.map((slide) => (
                  <div key={slide.id} className="min-w-full h-full flex-shrink-0 relative">
                    <img
                      src={slide.image}
                      alt={slide.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => handleSlideChange('prev')}
              disabled={isTransitioning}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6 text-neutral-900" />
            </button>
            <button
              onClick={() => handleSlideChange('next')}
              disabled={isTransitioning}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6 text-neutral-900" />
            </button>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
              <ul className="flex items-center justify-center gap-2">
                {bannerSlides.map((slide, index) => (
                  <li key={slide.id}>
                    <button
                      onClick={() => setCurrentSlide(index)}
                      disabled={isTransitioning}
                      className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                        }`}
                      aria-label={`배너 ${index + 1}로 이동`}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <div className="bg-white border border-neutral-200 p-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <img src={logoImage} alt="Logo" className="h-8" />
              </div>
              <h1 className="text-2xl tracking-tight text-neutral-900 mb-2">제이시스 B2B 전용몰</h1>
              <p className="text-sm text-neutral-600">의료인 회원 전용 쇼핑몰입니다</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-xs tracking-wide text-neutral-700 mb-2 uppercase font-medium">
                    이메일
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 text-sm"
                    placeholder="example@hospital.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs tracking-wide text-neutral-700 mb-2 uppercase font-medium">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-neutral-900 border-neutral-300 focus:ring-neutral-900"
                  />
                  <span className="text-sm text-neutral-700">자동 로그인</span>
                </label>
                <a href="#" className="text-sm text-neutral-900 hover:text-neutral-700 underline">
                  ID/PW 찾기
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1e3a8a] text-white py-4 font-medium hover:bg-[#1e40af] transition-colors text-sm tracking-wide uppercase"
              >
                로그인
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                아직 회원이 아니신가요?{' '}
                <Link to="/signup" className="text-neutral-900 font-medium hover:text-neutral-700 underline">
                  회원가입
                </Link>
              </p>
            </div>
          </div>

          {/* Public Content Links */}
          <div className="bg-neutral-50 border border-neutral-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl tracking-tight text-neutral-900 mb-2">로그인 없이 둘러보기</h2>
              <p className="text-sm text-neutral-600">제이시스메디칼의 다양한 정보를 확인하세요</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {publicLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="block bg-white border border-neutral-200 p-4 hover:border-neutral-900 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-900 transition-colors">
                        <Icon className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-neutral-900 mb-1">{link.label}</h3>
                        <p className="text-xs text-neutral-600">{link.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}