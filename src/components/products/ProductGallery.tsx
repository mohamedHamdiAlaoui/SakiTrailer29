import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, ZoomIn, ZoomOut } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const galleryImages = useMemo(() => (images.length > 0 ? images : ['/hero-showroom.jpg']), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMagnifierEnabled, setIsMagnifierEnabled] = useState(false);
  const [isMagnifierVisible, setIsMagnifierVisible] = useState(false);
  const [magnifierPoint, setMagnifierPoint] = useState({ x: 0, y: 0 });
  const [imageFrame, setImageFrame] = useState({ width: 0, height: 0 });
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const lensSize = 180;
  const zoomLevel = 2.5;

  const activeImage = galleryImages[activeIndex];
  const totalImages = galleryImages.length;
  const setActiveImage = useCallback((nextIndex: number) => {
    setActiveIndex(nextIndex);
    setIsMagnifierVisible(false);
  }, []);

  const goToPrev = useCallback(() => {
    setActiveImage((activeIndex - 1 + totalImages) % totalImages);
  }, [activeIndex, setActiveImage, totalImages]);

  const goToNext = useCallback(() => {
    setActiveImage((activeIndex + 1) % totalImages);
  }, [activeIndex, setActiveImage, totalImages]);

  // Keyboard navigation — only active when gallery is in view or fullscreen is open
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape' && isPreviewOpen) setIsPreviewOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goToPrev, goToNext, isPreviewOpen]);

  const updateMagnifierPosition = (clientX: number, clientY: number) => {
    const frame = imageFrameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const nextX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const nextY = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    setImageFrame({ width: rect.width, height: rect.height });
    setMagnifierPoint({ x: nextX, y: nextY });
    setIsMagnifierVisible(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMagnifierEnabled) return;
    updateMagnifierPosition(event.clientX, event.clientY);
  };

  const handlePointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isMagnifierEnabled) return;
    updateMagnifierPosition(event.clientX, event.clientY);
  };

  const handlePointerLeave = () => {
    setIsMagnifierVisible(false);
  };

  const handleMagnifierToggle = () => {
    setIsMagnifierEnabled((current) => {
      const next = !current;
      if (!next) setIsMagnifierVisible(false);
      return next;
    });
  };

  const shouldShowMagnifier = isMagnifierEnabled && isMagnifierVisible && imageFrame.width > 0 && imageFrame.height > 0;

  return (
    <>
      <div className="space-y-4">
        {/* Main image with arrow navigation */}
        <div
          ref={imageFrameRef}
          className={`group relative overflow-hidden rounded-3xl border bg-white shadow-sm ${isMagnifierEnabled ? 'cursor-none' : ''}`}
          onPointerEnter={handlePointerEnter}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {/* Main clickable image */}
          <button
            type="button"
            onClick={() => {
              if (!isMagnifierEnabled) setIsPreviewOpen(true);
            }}
            className={`block w-full ${isMagnifierEnabled ? 'cursor-none' : 'cursor-zoom-in'}`}
            aria-label={isMagnifierEnabled ? `Magnifier active for ${title}` : `Open larger preview of ${title}`}
          >
            <img
              src={activeImage}
              alt={`${title} — image ${activeIndex + 1} of ${totalImages}`}
              className="h-[420px] w-full object-cover transition-opacity duration-200"
            />
          </button>

          {/* Left arrow */}
          {totalImages > 1 && (
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/65 hover:scale-110 focus:outline-none focus:opacity-100"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {/* Right arrow */}
          {totalImages > 1 && (
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/65 hover:scale-110 focus:outline-none focus:opacity-100"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {/* Image counter */}
          {totalImages > 1 && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {activeIndex + 1} / {totalImages}
            </div>
          )}

          {/* Magnifier lens */}
          {shouldShowMagnifier ? (
            <div
              className="pointer-events-none absolute overflow-hidden rounded-full border-4 border-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.35)]"
              style={{
                width: `${lensSize}px`,
                height: `${lensSize}px`,
                left: `${magnifierPoint.x - lensSize / 2}px`,
                top: `${magnifierPoint.y - lensSize / 2}px`,
              }}
            >
              <img
                src={activeImage}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 max-w-none object-cover"
                style={{
                  width: `${imageFrame.width}px`,
                  height: `${imageFrame.height}px`,
                  transform: `translate(${lensSize / 2 - magnifierPoint.x * zoomLevel}px, ${lensSize / 2 - magnifierPoint.y * zoomLevel}px) scale(${zoomLevel})`,
                  transformOrigin: '0 0',
                }}
              />
            </div>
          ) : null}

          {/* Top-right toolbar */}
          <div className="absolute right-4 top-4 flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="bg-white/90 hover:bg-white"
              onClick={handleMagnifierToggle}
              aria-pressed={isMagnifierEnabled}
              aria-label={isMagnifierEnabled ? `Disable magnifier for ${title}` : `Enable magnifier for ${title}`}
            >
              {isMagnifierEnabled ? <ZoomOut className="size-4" /> : <ZoomIn className="size-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="bg-white/90 hover:bg-white"
              onClick={() => setIsPreviewOpen(true)}
              aria-label={`Open full preview of ${title}`}
            >
              <Expand className="size-4" />
            </Button>
          </div>

          {isMagnifierEnabled ? (
            <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-white">
              Move the cursor over the image to inspect details
            </div>
          ) : null}
        </div>

        {/* Thumbnail strip */}
        {totalImages > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: 'thin' }}>
            {galleryImages.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                  activeIndex === index ? 'border-brand-blue ring-2 ring-brand-blue/30' : 'border-transparent hover:border-slate-300'
                }`}
                aria-label={`View image ${index + 1}`}
                aria-current={activeIndex === index}
              >
                <img src={image} alt={`${title} thumbnail ${index + 1}`} className="h-24 w-32 object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen dialog with arrows */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="h-[98vh] max-h-[98vh] max-w-[99vw] border-none bg-black/95 p-1 shadow-2xl sm:h-[96vh] sm:max-w-[98vw] sm:p-2">
          <div className="relative flex h-full items-center justify-center">
            <img
              src={activeImage}
              alt={title}
              className="mx-auto h-full max-h-[92vh] w-full rounded-2xl object-contain sm:max-h-[92vh]"
              loading="lazy"
            />

            {/* Fullscreen left arrow */}
            {totalImages > 1 && (
              <button
                type="button"
                onClick={goToPrev}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110 focus:outline-none"
              >
                <ChevronLeft className="size-8" />
              </button>
            )}

            {/* Fullscreen right arrow */}
            {totalImages > 1 && (
              <button
                type="button"
                onClick={goToNext}
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110 focus:outline-none"
              >
                <ChevronRight className="size-8" />
              </button>
            )}

            {/* Fullscreen counter */}
            {totalImages > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                {activeIndex + 1} / {totalImages}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
