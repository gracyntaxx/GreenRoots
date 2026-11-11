import React, { useEffect, useState } from "react";
import { WASTE_FALLBACK_IMAGES, getWasteImage, normalizeWasteKey } from "@/lib/wasteImages";

interface WasteImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wasteType?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Robust crop residue image component.
 * Displays the user's authentic placed local photography in /images/residues/${key}.jpg,
 * and gracefully falls back to curated high-resolution photography if needed.
 * Never leaves a blank or broken box.
 */
export function WasteImage({ wasteType, alt, className = "", ...rest }: WasteImageProps) {
  const key = normalizeWasteKey(wasteType);
  const localSrc = getWasteImage(key);
  const onlineSrc = WASTE_FALLBACK_IMAGES[key] || WASTE_FALLBACK_IMAGES.paddy_straw;

  const [src, setSrc] = useState<string>(localSrc);
  const [fallbackLevel, setFallbackLevel] = useState<number>(0);

  // Sync state if wasteType changes
  useEffect(() => {
    setSrc(getWasteImage(key));
    setFallbackLevel(0);
  }, [key]);

  return (
    <img
      src={src}
      alt={alt || wasteType || "Crop residue"}
      className={className}
      loading="lazy"
      onError={() => {
        if (fallbackLevel === 0) {
          // Local JPG failed -> try online curated photo
          setFallbackLevel(1);
          setSrc(onlineSrc);
        } else if (fallbackLevel === 1) {
          // Online photo failed -> try default local paddy_straw.jpg
          setFallbackLevel(2);
          setSrc("/images/residues/paddy_straw.jpg");
        }
      }}
      {...rest}
    />
  );
}

export default WasteImage;
