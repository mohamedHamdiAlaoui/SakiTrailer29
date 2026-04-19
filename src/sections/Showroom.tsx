import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Clock, Phone } from 'lucide-react';
import VisitRequestDialog from '@/components/VisitRequestDialog';
import ShowroomMap from '@/components/ShowroomMap';
import { SHOWROOM_LOCATIONS } from '@/lib/site';

gsap.registerPlugin(ScrollTrigger);

export default function Showroom() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const showroomLocations = SHOWROOM_LOCATIONS.map((location) => ({
    ...location,
    name: t(location.nameKey),
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`,
  }));
  const locationSummary = showroomLocations.map((location) => location.name).join(' | ');
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${showroomLocations[0].latitude},${showroomLocations[0].longitude}`
  )}&destination=${encodeURIComponent(`${showroomLocations[1].latitude},${showroomLocations[1].longitude}`)}`;

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
    <section ref={sectionRef} id="about" className="relative overflow-hidden py-14 lg:py-20">
      <div ref={imageRef} className="absolute inset-0 -top-[10%] h-[120%] w-full">
        <img src="/showroom-aerial.jpg" alt={t('showroom.title')} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-brand-blue/40" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid w-full items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,540px)] lg:gap-12">
            <div className="max-w-2xl text-white">
              <p className="mb-2 font-semibold text-brand-gold">{t('showroom.subtitle')}</p>
              <h2 className="mb-6 font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">{t('showroom.title')}</h2>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-white/80">{t('showroom.description')}</p>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="h-5 w-5 text-brand-gold" />
                  <span>{locationSummary}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="h-5 w-5 text-brand-gold" />
                  <span>{t('showroom.hours')}</span>
                </div>
              </div>
            </div>

            <div className="flex w-full justify-end">
              <div ref={cardRef} className="w-full max-w-xl rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl sm:p-8">
                <h3 className="mb-6 font-display text-2xl font-bold text-white">{t('showroom.planVisit')}</h3>

                <div className="mb-8 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-gold/20">
                      <MapPin className="h-5 w-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{t('showroom.address')}</p>
                      <div className="space-y-2">
                        {showroomLocations.map((location, index) => (
                          <div key={location.id}>
                            <p className="text-sm text-white/70">{t('showroom.locationLabel', { index: index + 1 })}: {location.name}</p>
                            <a
                              href={location.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex text-sm font-medium text-brand-gold transition hover:text-brand-gold-light"
                            >
                              {t('showroom.openInMaps')}
                            </a>
                          </div>
                        ))}
                      </div>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-medium text-brand-gold transition hover:text-brand-gold-light"
                      >
                        {t('showroom.openBothLocations')}
                      </a>
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
                      <p className="text-sm text-white/70">+212 666-341519</p>
                      <p className="text-sm text-white/70">contact@sakitrailer29.com</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 shadow-lg">
                  <ShowroomMap
                    locations={showroomLocations.map((location) => ({
                      id: location.id,
                      name: location.name,
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }))}
                  />
                </div>

                <div className="space-y-3">
                  <VisitRequestDialog />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
