"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ImageIcon, X } from "lucide-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { TeamImage } from "@/lib/team-images"

interface TeamPhotoCarouselProps {
  photos: TeamImage[]
  teamName: string
}

interface DotsProps {
  count: number
  selectedIndex: number
  onSelect: (index: number) => void
  variant?: "light" | "dark"
}

function CarouselDots({ count, selectedIndex, onSelect, variant = "light" }: DotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`${index + 1}枚目の写真を表示`}
          aria-current={index === selectedIndex}
          className={cn(
            "h-2 rounded-full transition-all",
            index === selectedIndex ? "w-5" : "w-2",
            variant === "light"
              ? index === selectedIndex
                ? "bg-blue-600"
                : "bg-slate-300 hover:bg-slate-400"
              : index === selectedIndex
                ? "bg-white"
                : "bg-white/40 hover:bg-white/70"
          )}
        />
      ))}
    </div>
  )
}

/** 選択中のスライド位置を購読する */
function useSelectedIndex(api: CarouselApi): number {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!api) return

    const sync = () => setSelectedIndex(api.selectedScrollSnap())
    sync()
    api.on("select", sync)

    return () => {
      api.off("select", sync)
    }
  }, [api])

  return selectedIndex
}

export function TeamPhotoCarousel({ photos, teamName }: TeamPhotoCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [lightboxApi, setLightboxApi] = useState<CarouselApi>()
  // 拡大表示の開始位置。null のときは閉じている
  const [lightboxStartIndex, setLightboxStartIndex] = useState<number | null>(null)

  const selectedIndex = useSelectedIndex(api)
  const lightboxSelectedIndex = useSelectedIndex(lightboxApi)

  const closeLightbox = useCallback(() => {
    // 拡大表示で移動した位置を元のカルーセルにも反映する
    if (lightboxApi) {
      api?.scrollTo(lightboxApi.selectedScrollSnap(), true)
    }
    setLightboxStartIndex(null)
  }, [api, lightboxApi])

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
          {photos.map((photo, index) => (
            <CarouselItem key={photo.id}>
              <button
                type="button"
                onClick={() => setLightboxStartIndex(index)}
                aria-label={`${index + 1}枚目の写真を拡大表示`}
                className="relative flex h-[min(60vh,420px)] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-slate-100 md:h-[min(65vh,560px)]"
              >
                {/* 余白がグレーの帯にならないよう、同じ写真をぼかして背景に敷く */}
                <Image
                  src={photo.url}
                  alt=""
                  aria-hidden
                  width={photo.width ?? 640}
                  height={photo.height ?? 360}
                  className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
                />
                {/* 縦長の写真が切れないよう、枠内に全体を収める */}
                <Image
                  src={photo.url}
                  alt={`${teamName}のチーム写真`}
                  width={photo.width ?? 640}
                  height={photo.height ?? 360}
                  className="relative max-h-full w-auto max-w-full object-contain"
                />
              </button>
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
        <div className="mt-3">
          <CarouselDots
            count={photos.length}
            selectedIndex={selectedIndex}
            onSelect={(index) => api?.scrollTo(index)}
          />
        </div>
      )}

      <Dialog
        open={lightboxStartIndex !== null}
        onOpenChange={(open) => {
          if (!open) closeLightbox()
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[100vw] border-none bg-transparent p-0 shadow-none sm:max-w-5xl"
        >
          <DialogTitle className="sr-only">{teamName}のチーム写真</DialogTitle>

          <button
            type="button"
            onClick={closeLightbox}
            aria-label="閉じる"
            className="absolute -top-2 right-2 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>

          {lightboxStartIndex !== null && (
            <Carousel
              setApi={setLightboxApi}
              opts={{ startIndex: lightboxStartIndex }}
              className="w-full"
            >
              <CarouselContent>
                {photos.map((photo) => (
                  <CarouselItem key={photo.id}>
                    <div className="flex h-[80vh] w-full items-center justify-center">
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
                  <CarouselPrevious className="hidden md:inline-flex" />
                  <CarouselNext className="hidden md:inline-flex" />
                </>
              )}
            </Carousel>
          )}

          {photos.length > 1 && (
            <div className="pb-2">
              <CarouselDots
                count={photos.length}
                selectedIndex={lightboxSelectedIndex}
                onSelect={(index) => lightboxApi?.scrollTo(index)}
                variant="dark"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
