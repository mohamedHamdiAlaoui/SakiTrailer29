import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Clock, TrendingDown, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

gsap.registerPlugin(ScrollTrigger);

export default function Services() {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeService, setActiveService] = useState('new');
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const services = [
    {
      id: 'new',
      title: t('services.newVehicles.title'),
      subtitle: t('services.newVehicles.subtitle'),
      description: t('services.newVehicles.description'),
      icon: Sparkles,
      image: '/lecitrailer/curtainsiders-semicurtainsiders.jpg',
      href: '/stock/new',
      features: t('services.newVehicles.features', { returnObjects: true }) as string[],
      cta: t('services.newVehicles.cta'),
      stats: { label: t('services.stats.newVehicles'), value: '+100' },
    },
    {
      id: 'used',
      title: t('services.usedVehicles.title'),
      subtitle: t('services.usedVehicles.subtitle'),
      description: t('services.usedVehicles.description'),
      icon: RotateCcw,
      image: '/lecitrailer/trailers.jpg',
      href: '/stock/used',
      features: t('services.usedVehicles.features', { returnObjects: true }) as string[],
      cta: t('services.usedVehicles.cta'),
      stats: { label: t('services.stats.usedVehicles'), value: '+50' },
    },
  ];

  const activeServiceData = services.find(s => s.id === activeService)!;

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo('.service-tab',
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    if (contentRef.current && imageRef.current) {
      gsap.fromTo(contentRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
      gsap.fromTo(imageRef.current,
        { scale: 1.1, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' }
      );
    }
  }, [activeService, prefersReducedMotion]);

  return (
    <section ref={sectionRef} id="services" className="py-20 bg-brand-blue grain-overlay">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 max-w-3xl">
          <p className="text-brand-gold font-semibold mb-2">{t('services.subtitle')}</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
            {t('services.title')}
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Side - Tabs */}
          <div className="lg:col-span-4 space-y-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                aria-pressed={activeService === service.id}
                className={`service-tab w-full rounded-2xl border p-6 text-left transition-all duration-500 group ${activeService === service.id
                  ? 'border-brand-gold bg-brand-gold text-brand-blue shadow-xl shadow-black/15'
                  : 'border-white/12 bg-white/5 text-white hover:border-white/30 hover:bg-white/10'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${activeService === service.id ? 'bg-brand-blue/20' : 'bg-brand-gold/20'
                    }`}>
                    <service.icon className={`w-6 h-6 ${activeService === service.id ? 'text-brand-blue' : 'text-brand-gold'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-bold mb-1">{service.title}</h3>
                    <p className={`text-sm ${activeService === service.id ? 'text-brand-blue/75' : 'text-white/68'}`}>
                      {service.subtitle}
                    </p>
                  </div>
                  <ArrowRight className={`w-5 h-5 transition-all ${activeService === service.id
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                    }`} />
                </div>

                {/* Stats Badge */}
                <div className={`mt-4 flex items-center gap-2 transition-all duration-300 ${activeService === service.id ? 'opacity-100' : 'opacity-75'
                  }`}>
                  <div className={`rounded-full px-3 py-1 text-sm font-semibold ${activeService === service.id ? 'bg-brand-blue/15 text-brand-blue' : 'bg-white/10 text-white/80'
                    }`}>
                    {service.stats.value} {service.stats.label}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right Side - Content */}
          <div className="lg:col-span-8">
            <div className="relative bg-white/5 rounded-2xl overflow-hidden">
              {/* Image */}
              <div ref={imageRef} className="relative h-64 lg:h-80">
                <Link to={activeServiceData.href} className="block h-full w-full">
                  <img
                    src={activeServiceData.image}
                    alt={activeServiceData.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  {/* Floating Badge */}
                  <div className="absolute top-6 right-6 px-4 py-2 bg-brand-gold rounded-full flex items-center gap-2">
                    <activeServiceData.icon className="w-5 h-5 text-brand-blue" />
                    <span className="font-semibold text-brand-blue">{activeServiceData.title}</span>
                  </div>
                </Link>
              </div>

              {/* Content */}
              <div ref={contentRef} className="p-6 lg:p-8">
                <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
                  {activeServiceData.subtitle}
                </h3>
                <p className="mb-6 leading-relaxed text-white/80">
                  {activeServiceData.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {activeServiceData.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-white/80">
                      <div className="w-5 h-5 rounded-full bg-brand-gold/20 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-brand-gold" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button asChild size="lg" className="bg-brand-gold hover:bg-brand-gold-light text-brand-blue font-bold group">
                  <Link to={activeServiceData.href}>
                    {activeServiceData.cta}
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white">{t('services.support')}</p>
              <p className="text-sm text-white">{t('services.supportDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-white">{t('services.bestPrices')}</p>
              <p className="text-sm text-white">{t('services.bestPricesDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
