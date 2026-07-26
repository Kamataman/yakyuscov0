"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ImageIcon } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import type { TeamImage } from "@/lib/team-images"

interface TeamPhotoCarouselProps {
  photos: TeamImage[]
  teamName: string
}

export function TeamPhotoCarousel({ photos, teamName }: TeamPhotoCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!api) return

    const syncSelectedIndex = () => setSelectedIndex(api.selectedScrollSnap())
    syncSelectedIndex()
    api.on("select", syncSelectedIndex)

    return () => {
      api.off("select", syncSelectedIndex)
    }
  }, [api])

  if (photos.length === 0) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
          <ImageIcon className="h-10 w-10 text-slate-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {photos.map((photo) => (
            <CarouselItem key={photo.id}>
              {/* 縦長の写真が切れないよう、高さを固定した枠内に全体を収める */}
              <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100 md:h-96">
                <Image
                  src={photo.url}
                  alt={`${teamName}のチーム写真`}
                  width={photo.width ?? 640}
                  height={photo.height ?? 360}
                  className="max-h-full w-auto max-w-full object-contain"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {photos.length > 1 && (
          <>
            {/* モバイルはフリック操作のため、矢印はPCでのみ表示する */}
            <CarouselPrevious className="hidden md:inline-flex" />
            <CarouselNext className="hidden md:inline-flex" />
          </>
        )}
      </Carousel>

      {/* 複数枚あることが一目で分かるようにドットを表示する */}
      {photos.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={`${index + 1}枚目の写真を表示`}
              aria-current={index === selectedIndex}
              className={cn(
                "h-2 rounded-full transition-all",
                index === selectedIndex
                  ? "w-5 bg-blue-600"
                  : "w-2 bg-slate-300 hover:bg-slate-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
