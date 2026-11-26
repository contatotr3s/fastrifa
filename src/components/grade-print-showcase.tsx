'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Apresenta a prévia da Grade Ágil de Cotas como um print flutuante com bordas suavizadas,
 * parallax amortecido ao rolar a página e inclinação 3D sutil ao passar o mouse.
 */
export default function GradePrintShowcase() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const shineRef = useRef<HTMLDivElement | null>(null);

  // Estado para controlar suavemente o hover
  const [isHovered, setIsHovered] = useState(false);

  // Valores alvo vs atuais para interpolação suave (lerp) em 60fps
  const motionRef = useRef({
    targetScrollY: 0,
    currentScrollY: 0,
    targetRotateX: 0,
    currentRotateX: 0,
    targetRotateY: 0,
    currentRotateY: 0,
    targetScale: 1,
    currentScale: 1,
    shineX: 50,
    shineY: 50,
  });

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return;

    let rafId = 0;

    const updateScrollTarget = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      // Progresso centrado na viewport (-1 abaixo da tela, 0 no centro, +1 acima)
      const centerOffset = rect.top + rect.height / 2 - vh / 2;
      const normalized = Math.max(-1, Math.min(1, centerOffset / (vh * 0.75)));

      // Deslocamento parallax vertical sutil no scroll
      motionRef.current.targetScrollY = normalized * 18;
    };

    const animate = () => {
      const m = motionRef.current;
      const ease = 0.085;

      m.currentScrollY += (m.targetScrollY - m.currentScrollY) * ease;
      m.currentRotateX += (m.targetRotateX - m.currentRotateX) * ease;
      m.currentRotateY += (m.targetRotateY - m.currentRotateY) * ease;
      m.currentScale += (m.targetScale - m.currentScale) * ease;

      const frame = frameRef.current;
      if (frame) {
        frame.style.transform = `perspective(1100px) translate3d(0, ${m.currentScrollY.toFixed(2)}px, 0) rotateX(${m.currentRotateX.toFixed(2)}deg) rotateY(${m.currentRotateY.toFixed(2)}deg) scale(${m.currentScale.toFixed(4)})`;
      }

      rafId = window.requestAnimationFrame(animate);
    };

    updateScrollTarget();
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('resize', updateScrollTarget, { passive: true });
    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', updateScrollTarget);
      window.removeEventListener('resize', updateScrollTarget);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el || e.pointerType === 'touch') return;

    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    motionRef.current.targetRotateX = -ny * 6.5;
    motionRef.current.targetRotateY = nx * 6.5;
    motionRef.current.targetScale = 1.018;

    const shine = shineRef.current;
    if (shine) {
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      shine.style.background = `radial-gradient(circle 280px at ${px.toFixed(1)}% ${py.toFixed(1)}%, rgba(255, 255, 255, 0.32), transparent 72%)`;
    }
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
    motionRef.current.targetScale = 1.015;
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    motionRef.current.targetRotateX = 0;
    motionRef.current.targetRotateY = 0;
    motionRef.current.targetScale = 1;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className="relative flex items-center justify-center py-0 sm:py-1 lg:py-4 select-none"
    >
      {/* Brilho atmosférico difuso atrás do print para integrar perfeitamente ao estágio */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-4 rounded-[40px] blur-2xl transition-opacity duration-500 ${
          isHovered ? 'opacity-90' : 'opacity-65'
        } bg-[radial-gradient(circle_at_50%_50%,rgba(8,105,245,0.14),rgba(0,168,104,0.08),transparent_72%)]`}
      />

      {/* Moldura flutuante 3D que responde ao scroll e ao mouse */}
      <div
        ref={frameRef}
        className="relative z-10 w-full max-w-[560px] mx-auto will-change-transform rounded-[24px] lg:rounded-[26px] p-1 sm:p-1.5 lg:p-2 bg-white/60 backdrop-blur-md border border-white/90 shadow-[0_20px_50px_rgba(24,74,120,0.10),0_4px_18px_rgba(255,255,255,0.8)_inset] transition-shadow duration-300"
      >
        <div className="relative overflow-hidden rounded-[20px] lg:rounded-[22px]">
          <img
            src="/demo-grade-print.jpg"
            alt="Demonstração da Grade Ágil de Cotas Interativas FastRifa"
            draggable={false}
            className="w-full max-h-[156px] sm:max-h-[240px] lg:max-h-[min(420px,50vh)] object-contain block mx-auto ora-print-soft-mask"
          />

          {/* Reflexo luminoso suave ao passar o mouse */}
          <div
            ref={shineRef}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
