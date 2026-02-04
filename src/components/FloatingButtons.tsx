import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import inquiryIcon from '@/assets/83d64029ffa71116dad37dd5326d8ff5db168803.png';

export function FloatingButtons() {
  const navigate = useNavigate();

  return (
    <div className="fixed right-6 bottom-24 md:bottom-8 z-40 flex flex-col gap-3">
      {/* 문의 버튼 */}
      <Button
        onClick={() => {
          // 카카오톡 채널로 연결
          window.open('http://pf.kakao.com/_TKXJn/chat', '_blank');
        }}
        className="group bg-[#FFE500] hover:bg-[#FFD700] text-black px-6 py-3 rounded-full shadow-lg h-auto"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.486 3 2 6.262 2 10.5c0 2.545 1.509 4.813 3.895 6.273-.227.906-.957 3.587-1.075 4.137-.137.638.23.63.472.458.178-.127 2.914-1.973 3.898-2.638C10.035 18.89 10.988 19 12 19c5.514 0 10-3.262 10-7.5S17.514 3 12 3zm2.448 9.402c-.15.15-.347.224-.545.224s-.395-.075-.545-.224L12 11.043l-1.358 1.359c-.15.15-.347.224-.545.224s-.395-.075-.545-.224c-.3-.3-.3-.788 0-1.088l1.358-1.359-1.358-1.359c-.3-.3-.3-.788 0-1.088.3-.3.788-.3 1.088 0L12 8.867l1.358-1.359c.3-.3.788-.3 1.088 0 .3.3.3.788 0 1.088l-1.358 1.359 1.358 1.359c.3.3.3.788 0 1.088z"/>
        </svg>
        <span className="font-bold text-sm ml-2">카카오톡 문의</span>
      </Button>

      {/* 데모신청 버튼 */}
      <Button
        onClick={() => {
          navigate('/communication/demo');
        }}
        className="group bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-6 py-3 rounded-full shadow-lg h-auto"
      >
        <span className="font-bold text-sm">데모신청</span>
      </Button>
    </div>
  );
}