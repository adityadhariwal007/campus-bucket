"use client";
import { useState } from "react";
import { photoUrl, type Photo as PhotoData } from "@/lib/media";
export function Photo({
  photo,
  className = "",
  eager = false,
}: {
  photo: PhotoData;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const optimized = photo.src.startsWith("https://images.unsplash.com/");
  const sizes = "(max-width: 767px) 92vw, (max-width: 1279px) 65vw, 900px";
  return (
    <div
      className={`photo-frame ${className}`}
      style={{ aspectRatio: `${photo.width}/${photo.height}` }}
    >
      {photo.src && !failed ? (
        <picture>
          {photo.src === "/campus.webp" && <source type="image/webp" srcSet="/campus-480.webp 480w, /campus-960.webp 960w, /campus.webp 1600w" sizes={sizes} />}
          {optimized && (
            <source
              type="image/avif"
              srcSet={[480, 960, 1600]
                .map((w) => `${photoUrl(photo, w, "avif")} ${w}w`)
                .join(", ")}
              sizes={sizes}
            />
          )}
          {optimized && (
            <source
              type="image/webp"
              srcSet={[480, 960, 1600]
                .map((w) => `${photoUrl(photo, w)} ${w}w`)
                .join(", ")}
              sizes={sizes}
            />
          )}
          <img
            src={photoUrl(photo, 1200)}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : "auto"}
            decoding="async"
            style={{ objectPosition: photo.focal }}
            onError={() => setFailed(true)}
          />
        </picture>
      ) : (
        <div
          className="photo-placeholder"
          role="img"
          aria-label={`Photo placeholder: ${photo.alt}`}
        >
          <span>PHOTO TO COME</span>
          <p>{photo.alt}</p>

        </div>
      )}
    </div>
  );
}
