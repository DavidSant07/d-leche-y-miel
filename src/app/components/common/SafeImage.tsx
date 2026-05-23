import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';

const FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyIgc3Ryb2tlPSIjQzE2MUU0IiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuNSIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement>;

export function SafeImage({
  src,
  alt = 'Imagen',
  style,
  className,
  ...rest
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-[#FDFBF7] ${className ?? ''}`}
        style={style}
      >
        <img
          src={FALLBACK_IMAGE}
          alt="Imagen no disponible"
          className="h-16 w-16 opacity-70"
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
}