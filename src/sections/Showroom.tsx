import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Clock, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

export default function Showroom() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

      if (isDesktop) {
        gsap.to(imageRef.current, {
          y: 100,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });

        gsap.fromTo(
          cardRef.current,
          { y: 50 },
          {
            y: -50,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          }
        );
      }

      gsap.fromTo(
        cardRef.current,
        { x: 100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="relative min-h-[980px] overflow-hidden py-14 lg:h-[700px] lg:min-h-0 lg:py-0">
      <div ref={imageRef} className="absolute inset-0 -top-[10%] h-[120%] w-full">
        <img src="/showroom-aerial.jpg" alt={t('showroom.title')} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-brand-blue/40" />
      </div>

      <div className="relative z-10 flex h-full items-start lg:items-center">
        <div className="container mx-auto px-4">
          <div className="grid w-full gap-8 lg:grid-cols-2">
            <div className="text-white">
              <p className="mb-2 font-semibold text-brand-gold">{t('showroom.subtitle')}</p>
              <h2 className="mb-6 font-display text-4xl font-bold md:text-5xl lg:text-6xl">{t('showroom.title')}</h2>
              <p className="mb-8 max-w-lg text-lg text-white/80">{t('showroom.description')}</p>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="h-5 w-5 text-brand-gold" />
                  <span>{t('showroom.location')}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="h-5 w-5 text-brand-gold" />
                  <span>{t('showroom.hours')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <div ref={cardRef} className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-xl">
                <h3 className="mb-6 font-display text-2xl font-bold text-white">{t('showroom.planVisit')}</h3>

                <div className="mb-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-gold/20">
                      <MapPin className="h-5 w-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t('showroom.address')}</p>
                      <p className="text-sm text-white/70">{t('showroom.addressLine')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-gold/20">
                      <Clock className="h-5 w-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t('showroom.openingHours')}</p>
                      <p className="text-sm text-white/70">{t('showroom.hours')}</p>
                      <p className="text-sm text-white/70">{t('showroom.sundayClosed')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-gold/20">
                      <Phone className="h-5 w-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t('showroom.contact')}</p>
                      <p className="text-sm text-white/70">+212 666 206 141</p>
                      <p className="text-sm text-white/70">contact@sakitrailer29.com</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button size="lg" className="w-full bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold-light">
                    <Calendar className="mr-2 h-5 w-5" />
                    {t('showroom.schedule')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
