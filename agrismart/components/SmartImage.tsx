'use client'

/**
 * Image with a branded, non-broken fallback (spec §51).
 *
 * Renders next/image with a fixed aspect container; if the asset ever fails
 * to load we swap to a clean AgriSmart panel ("Image unavailable") instead of
 * a broken-image glyph. Fallback is a safety net only — every catalogue item
 * ships with a real, verified photograph.
 */
import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function SmartImage({
  src, alt, className, imgClassName, ratio = 'aspect-[4/3]', sizes = '(max-width: 768px) 100vw, 33vw', priority,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  ratio?: string
  sizes?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)

  return (
    <div className={cn('relative overflow-hidden bg-line/40', ratio, className)}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-surface" role="img" aria-label={`${alt} — image unavailable`}>
          <div className="text-center">
            <span className="mx-auto grid h-9 w-9 place-items-center rounded-2xl bg-leaf-gradient text-base opacity-70" aria-hidden>🌾</span>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-faint">AgriSmart</p>
            <p className="text-[10px] text-faint">Image unavailable</p>
          </div>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn('object-cover', imgClassName)}
        />
      )}
    </div>
  )
}
