import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Review {
  id: number;
  name: string;
  location: string;
  date: string;
  rating: number;
  text: string;
  avatar: string;
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="group rounded-xl bg-white p-6 transition-all duration-300 card-shadow hover:card-shadow-hover">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue/20 font-bold text-brand-blue">
            {review.avatar}
          </div>
          <div>
            <h4 className="font-semibold text-black">{review.name}</h4>
            <p className="text-sm text-gray-500">{review.location} - {review.date}</p>
          </div>
        </div>
        <Quote className="h-8 w-8 text-brand-gold/30" />
      </div>

      <div className="mb-3 flex gap-1">
        {[...Array(5)].map((_, index) => (
          <Star key={index} className={`h-4 w-4 ${index < review.rating ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'}`} />
        ))}
      </div>

      <p className="text-sm leading-relaxed text-gray-600">{review.text}</p>
    </div>
  );
}

export default function Testimonials() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const column1Ref = useRef<HTMLDivElement>(null);
  const column2Ref = useRef<HTMLDivElement>(null);
  const column3Ref = useRef<HTMLDivElement>(null);
  const reviews = t('testimonials.items', { returnObjects: true }) as Review[];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.testimonial-header',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      const setupInfiniteScroll = (ref: RefObject<HTMLDivElement | null>, direction: 'up' | 'down', speed: number) => {
        if (!ref.current) return;

        const column = ref.current;
        const cards = column.querySelectorAll('.review-card-wrapper');
        const totalHeight = Array.from(cards).reduce((height, card) => height + (card as HTMLElement).offsetHeight + 16, 0) / 2;

        gsap.to(column, {
          y: direction === 'up' ? -totalHeight : totalHeight,
          duration: speed,
          ease: 'none',
          repeat: -1,
          modifiers: {
            y: gsap.utils.unitize((value) => {
              const numericValue = parseFloat(value);
              return direction === 'up' ? (numericValue % totalHeight) - (numericValue < 0 ? 0 : totalHeight) : numericValue % totalHeight;
            }),
          },
        });
      };

      setupInfiniteScroll(column1Ref, 'up', 40);
      setupInfiniteScroll(column2Ref, 'down', 35);
      setupInfiniteScroll(column3Ref, 'up', 45);
    }, sectionRef);

    return () => ctx.revert();
  }, [reviews]);

  const column1 = [...reviews.slice(0, 2), ...reviews.slice(0, 2)];
  const column2 = [...reviews.slice(2, 4), ...reviews.slice(2, 4)];
  const column3 = [...reviews.slice(4, 6), ...reviews.slice(4, 6)];

  return (
    <section ref={sectionRef} className="overflow-hidden bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="testimonial-header mb-12 text-center">
          <p className="mb-2 font-semibold text-brand-blue">{t('testimonials.subtitle')}</p>
          <h2 className="mb-4 font-display text-4xl font-bold text-black md:text-5xl">{t('testimonials.title')}</h2>
          <p className="mx-auto max-w-2xl text-gray-600">{t('testimonials.description')}</p>
        </div>

        <div className="relative h-[600px] overflow-hidden">
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-32 bg-gradient-to-b from-gray-50 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32 bg-gradient-to-t from-gray-50 to-transparent" />

          <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-3">
            <div ref={column1Ref} className="hidden space-y-4 md:block">
              {column1.map((review, index) => (
                <div key={`c1-${index}`} className="review-card-wrapper">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>

            <div ref={column2Ref} className="space-y-4">
              {column2.map((review, index) => (
                <div key={`c2-${index}`} className="review-card-wrapper">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>

            <div ref={column3Ref} className="hidden space-y-4 md:block">
              {column3.map((review, index) => (
                <div key={`c3-${index}`} className="review-card-wrapper">
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
