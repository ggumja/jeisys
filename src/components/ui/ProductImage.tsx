import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ProductImage({ src, alt, className = "w-full h-full object-cover", containerClassName = "" }: ProductImageProps) {
  const [error, setError] = useState(false);

  const showFallback = !src || error;

  if (showFallback) {
    return (
      <div className={`flex flex-col items-center justify-center bg-neutral-50 border border-neutral-100 text-neutral-400 ${containerClassName} w-full h-full`}>
        <Package className="w-8 h-8 mb-2 opacity-20" />
        <span className="text-[10px] font-medium uppercase tracking-tighter opacity-40">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}
