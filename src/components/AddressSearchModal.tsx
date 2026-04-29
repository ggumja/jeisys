import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AddressSearchModalProps {
  onSelect: (data: { zipCode: string; address: string }) => void;
  onClose: () => void;
}

export function AddressSearchModal({ onSelect, onClose }: AddressSearchModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const win = window as any;
    if (!win.daum?.Postcode) {
      alert('주소 검색 서비스를 불러오지 못했습니다. 페이지를 새로고침 해주세요.');
      onClose();
      return;
    }

    const postcode = new win.daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddress = data.roadAddress || data.jibunAddress;
        if (data.addressType === 'R') {
          let extra = '';
          if (data.bname && /[동|로|가]$/.test(data.bname)) extra += data.bname;
          if (data.buildingName) extra += (extra ? ', ' : '') + data.buildingName;
          if (extra) fullAddress += ` (${extra})`;
        }
        onSelect({ zipCode: data.zonecode, address: fullAddress });
        onClose();
      },
      onresize: (size: any) => {
        if (containerRef.current) {
          containerRef.current.style.height = size.height + 'px';
        }
      },
      width: '100%',
      height: '100%',
    });

    if (containerRef.current) {
      postcode.embed(containerRef.current, { autoClose: false });
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white shadow-2xl"
        style={{ width: '100%', maxWidth: '500px', margin: '0 16px', borderRadius: '4px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <span className="text-sm font-bold text-neutral-900">주소 검색</span>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* 다음 우편번호 embed 영역 */}
        <div ref={containerRef} style={{ height: '450px', width: '100%' }} />
      </div>
    </div>
  );
}
