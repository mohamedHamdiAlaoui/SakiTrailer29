import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ArrowRight, Shield, Globe, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Hero() {
  const { t } = useTranslation();
  const heroImage = '/service-logistics.jpg';
  const heroRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subheadingRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current,
        { scale: 1.2, clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' },
        { scale: 1, clipPath: 'polygon(0% 0, 100% 0, 100% 100%, 0% 100%)', duration: 1.4, ease: 'expo.out' }
      );

      if (headingRef.current) {
        const chars = headingRef.current.querySelectorAll('.char');
        gsap.fromTo(chars,
          { y: '100%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 1, delay: 0.4, stagger: 0.03, ease: 'back.out(1.7)' }
        );
      }

      gsap.fromTo(subheadingRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.8, ease: 'power3.out' }
      );

      gsap.fromTo(ctaRef.current,
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, delay: 1, ease: 'power4.out' }
      );

      gsap.fromTo('.benefit-item',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, delay: 1.2, stagger: 0.1, ease: 'power3.out' }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (imageRef.current) {
        const scrollY = window.scrollY;
        gsap.to(imageRef.current, { y: scrollY * 0.3, duration: 0.3, ease: 'none' });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const splitText = (text: string) => {
    return text.split('').map((char, i) => (
      <span key={i} className="char inline-block" style={{ display: char === ' ' ? 'inline' : 'inline-block' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };

  const benefits = [
    { icon: Globe, text: t('hero.delivery') },
    { icon: Shield, text: t('hero.securePurchase') },
    { icon: Clock, text: t('hero.available') },
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-black">
      {/* Background Image */}
      <div 
        ref={imageRef}
        className="absolute inset-0 w-full h-full"
        style={{ clipPath: 'polygon(0% 0, 100% 0, 100% 100%, 0% 100%)' }}
      >
        <img 
          src={heroImage}
          alt={t('hero.imageAlt')} 
          className="w-full h-full object-cover"
          fetchPriority="high"
          loading="eager"
          onError={(event) => {
            event.currentTarget.src = '/hero-showroom.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/90 via-brand-blue/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 min-h-screen flex items-start lg:items-center">
        <div className="max-w-3xl pt-36 sm:pt-40 lg:pt-20">
          {/* Heading */}
          <h1 
            ref={headingRef}
            className="mb-6 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white overflow-hidden"
          >
            <span className="block overflow-hidden whitespace-nowrap">
              {splitText(t('hero.title1'))}
            </span>
            <span className="block overflow-hidden text-brand-gold">
              {splitText(t('hero.title2'))}
            </span>
          </h1>

          {/* Subheading */}
          <p 
            ref={subheadingRef}
            className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl"
          >
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons - Always visible */}
          <div ref={ctaRef} className="flex flex-wrap gap-4 mb-16 lg:mb-20">
            <Link to="/stock/new">
              <Button 
                size="lg" 
                className="bg-brand-gold hover:bg-brand-gold-light text-brand-blue font-bold text-lg px-8 py-6"
              >
                {t('hero.viewStock')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="tel:+212666206141">
              <Button 
                size="lg" 
                className="border border-white bg-white/12 text-white hover:bg-white hover:text-brand-blue font-semibold text-lg px-8 py-6 backdrop-blur-sm transition-all"
              >
                {t('hero.contactUs')}
              </Button>
            </a>
          </div>

          {/* Benefits */}
          <div className="flex flex-wrap gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-item flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-brand-gold" />
                </div>
                <span className="text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-brand-blue/90 backdrop-blur-md border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="font-display text-3xl lg:text-4xl font-bold text-brand-gold">2,400+</p>
              <p className="text-white/70 text-sm">{t('hero.stats.vehicles')}</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl lg:text-4xl font-bold text-brand-gold">12</p>
              <p className="text-white/70 text-sm">{t('hero.stats.regions')}</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl lg:text-4xl font-bold text-brand-gold">5,000+</p>
              <p className="text-white/70 text-sm">{t('hero.stats.customers')}</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl lg:text-4xl font-bold text-brand-gold">15+</p>
              <p className="text-white/70 text-sm">{t('hero.stats.experience')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
