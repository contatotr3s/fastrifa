'use client';

import React, { useEffect, useRef } from 'react';

export default function HeroOrbitScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>('.fr-orbit-item'));
    const numberEl = numberRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const tiltRad = (-12.032113697747288 * Math.PI) / 180;
    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);

    const settings = {
      orbitSpeed: 0.00022,
      lotteryInterval: 6000,
      lotteryFrames: 25,
      numberSpeed: 58,
    };

    let angle = -2.15;
    let lastTime = 0;
    let drawing = false;

    let animationFrameId: number;

    function renderOrbit(timestamp: number) {
      if (!root || !root.isConnected) return;

      if (!lastTime) lastTime = timestamp;
      const dt = Math.min(timestamp - lastTime, 60);
      lastTime = timestamp;

      if (!reduceMotion.matches) {
        angle += dt * settings.orbitSpeed;
      }

      const w = root.clientWidth;
      const isMobile = w < 640;
      // Órbita ampliada e grandiosa que se expande sob a camada do texto da esquerda
      const radiusX = isMobile ? Math.min(w * 0.40, 190) : Math.min(w * 0.46, 360);
      const radiusY = isMobile ? 105 : 165;

      items.forEach((item, index) => {
        const a = angle + index * ((Math.PI * 2) / items.length);

        const ex = Math.cos(a) * radiusX;
        const ey = Math.sin(a) * radiusY;

        const x = ex * cosT - ey * sinT;
        const y = ex * sinT + ey * cosT;

        const depth = Math.sin(a);
        const norm = (depth + 1) / 2;

        // Escala ampliada com elementos imersivos e de destaque
        const scale = (isMobile ? 0.82 : 0.92) + norm * (isMobile ? 0.22 : 0.26);
        const opacity = 0.78 + norm * 0.22;

        item.style.zIndex = depth >= 0 ? '30' : '10';
        item.style.opacity = opacity.toFixed(3);

        const isCard = item.classList.contains('fr-orbit-card');

        if (isCard) {
          const rotX = (-depth * 8.2).toFixed(2);
          const rotY = (-(ex / radiusX) * 21).toFixed(2);
          const rotZ = ((ex / radiusX) * 4.2).toFixed(2);

          item.style.transform =
            `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0px) ` +
            `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scale.toFixed(3)})`;

          const shadowAlpha = (0.075 + norm * 0.065).toFixed(3);
          const shadowY = (8 + norm * 12).toFixed(1);
          const shadowBlur = (16 + norm * 20).toFixed(1);
          item.style.boxShadow =
            `rgba(25, 77, 150, ${shadowAlpha}) 0px ${shadowY}px ${shadowBlur}px, ` +
            `rgb(217, 232, 251) 0px 3px 0px, white 0px 1px 0px inset`;
        } else {
          item.style.transform =
            `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0px) scale(${scale.toFixed(3)})`;
        }
      });

      if (!reduceMotion.matches) {
        animationFrameId = requestAnimationFrame(renderOrbit);
      }
    }

    function animateNumber() {
      if (drawing || reduceMotion.matches || !numberEl) return;
      drawing = true;
      let frames = 0;

      const timer = setInterval(() => {
        if (!root || !root.isConnected) {
          clearInterval(timer);
          drawing = false;
          return;
        }
        const value = Math.floor(Math.random() * 1000000);
        if (numberEl) {
          numberEl.textContent = String(value).padStart(6, '0');
        }
        frames++;

        if (frames >= settings.lotteryFrames) {
          clearInterval(timer);
          drawing = false;
        }
      }, settings.numberSpeed);
    }

    animationFrameId = requestAnimationFrame(renderOrbit);

    let intervalId: NodeJS.Timeout | null = null;
    if (!reduceMotion.matches) {
      animateNumber();
      intervalId = setInterval(() => {
        if (root && root.isConnected) animateNumber();
      }, settings.lotteryInterval);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      id="fastRifaOrbit"
      className="fr-orbit-root relative w-full max-w-[920px] sm:max-w-[1040px] lg:max-w-[1140px] h-[520px] sm:h-[580px] lg:h-[620px] mx-auto flex items-center justify-center select-none overflow-visible pointer-events-none"
      aria-label="FastRifa em órbita tridimensional interativa"
    >
      {/* Brilho radial de fundo ampliado */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute w-[480px] h-[480px] sm:w-[680px] sm:h-[680px] rounded-full blur-3xl -z-10 bg-[radial-gradient(circle,rgba(98,165,255,0.38)_0%,rgba(225,237,255,0.55)_45%,transparent_72%)]"
      />

      {/* Anéis da órbita inclinados com diâmetro generoso */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 rounded-[50%] border-[1.5px] border-dashed border-[#B9D3F8]/75"
        style={{
          width: 710,
          height: 345,
          transform: 'translate(-50%, -50%) rotate(-12.032113697747288deg)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 rounded-[50%] border border-[#CDE0FC]/50 shadow-[0_0_35px_rgba(8,105,245,0.07)]"
        style={{
          width: 795,
          height: 390,
          transform: 'translate(-50%, -50%) rotate(-12.032113697747288deg)',
        }}
      />

      {/* Partículas luminosas */}
      <span className="fr-star fr-star-1" aria-hidden="true">✦</span>
      <span className="fr-star fr-star-2" aria-hidden="true">✧</span>
      <span className="fr-star fr-star-3" aria-hidden="true">✦</span>

      {/* CENTRO: Bilhete 3D em formato real de bilhete */}
      <div className="relative z-20 flex items-center justify-center pointer-events-none">
        <div className="relative w-[295px] h-[148px] sm:w-[350px] sm:h-[170px] flex items-center justify-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-full blur-2xl animate-pulse bg-[radial-gradient(circle,rgba(98,165,255,0.45)_0%,rgba(8,105,245,0.22)_55%,transparent_75%)]"
          />

          <div className="fr-ticket-holder">
            <div className="fr-speed" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>

            {/* Camada de espessura 3D atrás do bilhete */}
            <div className="fr-ticket-depth" aria-hidden="true" />

            {/* Face principal do bilhete com recortes laterais */}
            <div className="fr-ticket">
              <div className="fr-shine" />

              {/* Canhoto esquerdo do bilhete */}
              <div className="fr-ticket-stub">
                <span className="fr-stub-brand">FASTRIFA</span>
              </div>

              {/* Corpo principal com número sorteado */}
              <div className="fr-ticket-main">
                <div className="fr-ticket-inner">
                  <span className="fr-ticket-label">Número sorteado:</span>
                  <span className="fr-number" ref={numberRef}>073842</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Card: Criação em 2 min */}
      <div className="fr-orbit-item fr-orbit-card absolute top-1/2 left-1/2 pointer-events-none select-none">
        <div className="flex items-center gap-3 sm:gap-3.5 bg-white/95 backdrop-blur-md border border-[#E0E9F7] rounded-[22px] px-4 py-2.5 sm:px-4.5 sm:py-3 transition-colors">
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center flex-shrink-0 border border-[#D0E2FC] shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-zap w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#0869F5]"
              aria-hidden="true"
            >
              <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
            </svg>
          </span>
          <div className="text-left select-none">
            <strong className="block font-display font-bold text-[13.5px] sm:text-[14.5px] text-[#0D1729] leading-tight whitespace-nowrap">
              Criação em 2 min
            </strong>
            <small className="block text-[11px] sm:text-[12px] text-[#475872] leading-tight mt-0.5 whitespace-nowrap">
              Sem cadastro longo
            </small>
          </div>
        </div>
      </div>

      {/* 2. Ícone: Ferradura dourada (Atualizado com formato real e 3D) */}
      <div className="fr-orbit-item fr-object" aria-label="Ferradura dourada">
        <svg viewBox="0 0 120 125">
          <defs>
            <linearGradient id="fr-horse-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff9cf" />
              <stop offset=".25" stopColor="#f8db70" />
              <stop offset=".55" stopColor="#d99c22" />
              <stop offset=".75" stopColor="#ffe68a" />
              <stop offset="1" stopColor="#97580d" />
            </linearGradient>
          </defs>
          {/* Espessura 3D */}
          <path
            d="M35 20 C16 40, 16 78, 36 96 C50 108, 70 108, 84 96 C104 78, 104 40, 85 20"
            transform="translate(4 6)"
            fill="none"
            stroke="#875013"
            strokeWidth="23"
            strokeLinecap="butt"
          />
          {/* Corpo dourado em formato real de ferradura */}
          <path
            d="M35 20 C16 40, 16 78, 36 96 C50 108, 70 108, 84 96 C104 78, 104 40, 85 20"
            fill="none"
            stroke="url(#fr-horse-gold)"
            strokeWidth="22"
            strokeLinecap="butt"
          />
          {/* Pontas/calcanhares da ferradura */}
          <rect
            x="24"
            y="13"
            width="22"
            height="10"
            rx="3"
            transform="rotate(-35 35 18)"
            fill="url(#fr-horse-gold)"
            stroke="#ffeda4"
            strokeWidth="1"
          />
          <rect
            x="74"
            y="13"
            width="22"
            height="10"
            rx="3"
            transform="rotate(35 85 18)"
            fill="url(#fr-horse-gold)"
            stroke="#ffeda4"
            strokeWidth="1"
          />
          {/* Reflexo metálico */}
          <path
            d="M35 22 C18 42, 18 76, 37 94 C50 105, 70 105, 83 94 C102 76, 102 42, 85 22"
            transform="translate(-4 -2)"
            fill="none"
            stroke="#fff5c0"
            strokeWidth="2.8"
            opacity=".85"
          />
          {/* Furos dos cravos */}
          <g fill="#785019" stroke="#ffeda4" strokeWidth="1.6">
            <circle cx="31" cy="34" r="3.4" />
            <circle cx="24" cy="55" r="3.4" />
            <circle cx="29" cy="77" r="3.4" />
            <circle cx="43" cy="95" r="3.4" />
            <circle cx="77" cy="95" r="3.4" />
            <circle cx="91" cy="77" r="3.4" />
            <circle cx="96" cy="55" r="3.4" />
            <circle cx="89" cy="34" r="3.4" />
          </g>
        </svg>
      </div>

      {/* 3. Card: Chave PIX Direta */}
      <div className="fr-orbit-item fr-orbit-card absolute top-1/2 left-1/2 pointer-events-none select-none">
        <div className="flex items-center gap-3 sm:gap-3.5 bg-white/95 backdrop-blur-md border border-[#E0E9F7] rounded-[22px] px-4 py-2.5 sm:px-4.5 sm:py-3 transition-colors">
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center flex-shrink-0 border border-[#D0E2FC] shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-qr-code w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#0869F5]"
              aria-hidden="true"
            >
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
              <path d="M12 16v.01" />
              <path d="M16 12h1" />
              <path d="M21 12v.01" />
              <path d="M12 21v-1" />
            </svg>
          </span>
          <div className="text-left select-none">
            <strong className="block font-display font-bold text-[13.5px] sm:text-[14.5px] text-[#0D1729] leading-tight whitespace-nowrap">
              Chave PIX Direta
            </strong>
            <small className="block text-[11px] sm:text-[12px] text-[#475872] leading-tight mt-0.5 whitespace-nowrap">
              100% no seu banco
            </small>
          </div>
        </div>
      </div>

      {/* 4. Ícone: Trevo de quatro folhas (Atualizado com novo cabo e proporção) */}
      <div className="fr-orbit-item fr-object" aria-label="Trevo de quatro folhas">
        <svg viewBox="0 0 120 144">
          <defs>
            <radialGradient id="fr-leaf-gradient" cx=".32" cy=".25" r=".85">
              <stop offset="0" stopColor="#bbff91" />
              <stop offset=".35" stopColor="#72e546" />
              <stop offset=".7" stopColor="#41bd2c" />
              <stop offset="1" stopColor="#168326" />
            </radialGradient>
            <path
              id="fr-heart"
              d="M0 0 C-11 -11 -35 -13 -34 -34 C-33 -51 -12 -54 0 -37 C12 -54 33 -51 34 -34 C35 -13 11 -11 0 0 Z"
            />
          </defs>
          <path d="M60 61Q87 98 66 138" stroke="#167a27" strokeWidth="11" strokeLinecap="round" fill="none" />
          <path d="M58 60Q84 96 64 135" stroke="#65ce3c" strokeWidth="7.5" strokeLinecap="round" fill="none" />
          <g transform="translate(60 59)">
            <g transform="translate(1 4)" fill="#146b25">
              <use href="#fr-heart" />
              <use href="#fr-heart" transform="rotate(90)" />
              <use href="#fr-heart" transform="rotate(180)" />
              <use href="#fr-heart" transform="rotate(270)" />
            </g>
            <g fill="url(#fr-leaf-gradient)" stroke="#339d2a" strokeWidth="1.3">
              <use href="#fr-heart" />
              <use href="#fr-heart" transform="rotate(90)" />
              <use href="#fr-heart" transform="rotate(180)" />
              <use href="#fr-heart" transform="rotate(270)" />
            </g>
            <g stroke="#e7ffd2" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7">
              <path d="M-18 -27Q-11 -42 -3 -32" />
              <path d="M27 -18Q42 -10 30 -3" />
              <path d="M18 27Q10 38 3 30" />
              <path d="M-28 18Q-40 10 -30 3" />
            </g>
            <circle r="5" fill="#52c83a" />
          </g>
        </svg>
      </div>

      {/* 5. Card: Link pro WhatsApp */}
      <div className="fr-orbit-item fr-orbit-card absolute top-1/2 left-1/2 pointer-events-none select-none">
        <div className="flex items-center gap-3 sm:gap-3.5 bg-white/95 backdrop-blur-md border border-[#E0E9F7] rounded-[22px] px-4 py-2.5 sm:px-4.5 sm:py-3 transition-colors">
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center flex-shrink-0 border border-[#D0E2FC] shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-message-circle w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#0869F5]"
              aria-hidden="true"
            >
              <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
            </svg>
          </span>
          <div className="text-left select-none">
            <strong className="block font-display font-bold text-[13.5px] sm:text-[14.5px] text-[#0D1729] leading-tight whitespace-nowrap">
              Link pro WhatsApp
            </strong>
            <small className="block text-[11px] sm:text-[12px] text-[#475872] leading-tight mt-0.5 whitespace-nowrap">
              Divulgação em 1 clique
            </small>
          </div>
        </div>
      </div>

      {/* 6. Ícone: Raio dourado */}
      <div className="fr-orbit-item fr-object" aria-label="Raio dourado">
        <svg viewBox="0 0 120 120">
          <defs>
            <linearGradient id="fr-lightning-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff7c5" />
              <stop offset=".45" stopColor="#ffdb3b" />
              <stop offset="1" stopColor="#d77c06" />
            </linearGradient>
          </defs>
          <path d="M70 5L22 65H56L38 114L104 46H68L83 5Z" fill="#956019" transform="translate(5 5)" />
          <path d="M70 5L22 65H56L38 114L104 46H68L83 5Z" fill="url(#fr-lightning-gold)" stroke="#fff0a5" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M70 14L37 57H63" stroke="#fff9dc" strokeWidth="5" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* 7. Card: Grade em Tempo Real */}
      <div className="fr-orbit-item fr-orbit-card absolute top-1/2 left-1/2 pointer-events-none select-none">
        <div className="flex items-center gap-3 sm:gap-3.5 bg-white/95 backdrop-blur-md border border-[#E0E9F7] rounded-[22px] px-4 py-2.5 sm:px-4.5 sm:py-3 transition-colors">
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center flex-shrink-0 border border-[#D0E2FC] shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-layout-grid w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#0869F5]"
              aria-hidden="true"
            >
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
          </span>
          <div className="text-left select-none">
            <strong className="block font-display font-bold text-[13.5px] sm:text-[14.5px] text-[#0D1729] leading-tight whitespace-nowrap">
              Grade em Tempo Real
            </strong>
            <small className="block text-[11px] sm:text-[12px] text-[#475872] leading-tight mt-0.5 whitespace-nowrap">
              Números livres e pagos
            </small>
          </div>
        </div>
      </div>

      {/* 8. Ícone: Moeda dourada */}
      <div className="fr-orbit-item fr-object" aria-label="Moeda dourada">
        <svg viewBox="0 0 120 120">
          <defs>
            <linearGradient id="fr-coin-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff6bd" />
              <stop offset=".5" stopColor="#ffd046" />
              <stop offset="1" stopColor="#b16f12" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="43" fill="#89530f" />
          <circle cx="58" cy="57" r="43" fill="url(#fr-coin-gold)" stroke="#fff1a1" strokeWidth="3" />
          <circle cx="58" cy="57" r="33" fill="none" stroke="#ae7219" strokeWidth="4" />
          <text x="58" y="75" textAnchor="middle" fontSize="52" fontWeight="900" fill="#a36b16">$</text>
          <path d="M34 34Q55 19 76 33" stroke="#fff9d3" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* 9. Card: Sem Taxa no Saque */}
      <div className="fr-orbit-item fr-orbit-card absolute top-1/2 left-1/2 pointer-events-none select-none">
        <div className="flex items-center gap-3 sm:gap-3.5 bg-white/95 backdrop-blur-md border border-[#E0E9F7] rounded-[22px] px-4 py-2.5 sm:px-4.5 sm:py-3 transition-colors">
          <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center flex-shrink-0 border border-[#D0E2FC] shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-shield-check w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#0869F5]"
              aria-hidden="true"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div className="text-left select-none">
            <strong className="block font-display font-bold text-[13.5px] sm:text-[14.5px] text-[#0D1729] leading-tight whitespace-nowrap">
              Sem Taxa no Saque
            </strong>
            <small className="block text-[11px] sm:text-[12px] text-[#475872] leading-tight mt-0.5 whitespace-nowrap">
              Caiu no PIX já é seu
            </small>
          </div>
        </div>
      </div>

      {/* 10. Ícone: Maço de dinheiro */}
      <div className="fr-orbit-item fr-object fr-money" aria-label="Maço de dinheiro">
        <svg viewBox="0 0 140 120">
          <defs>
            <linearGradient id="fr-money-green" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#baff83" />
              <stop offset=".5" stopColor="#5cdb36" />
              <stop offset="1" stopColor="#218e20" />
            </linearGradient>
          </defs>
          <g transform="rotate(-13 70 60)">
            <rect x="14" y="42" width="110" height="45" rx="10" fill="#227b1d" />
            <rect x="11" y="35" width="110" height="45" rx="10" fill="#34a526" />
            <rect x="8" y="28" width="110" height="45" rx="10" fill="#49c632" />
            <rect x="5" y="21" width="110" height="45" rx="10" fill="url(#fr-money-green)" stroke="#d1ffa9" strokeWidth="2" />
            <rect x="21" y="29" width="77" height="29" rx="7" stroke="#319c28" strokeWidth="3" fill="none" />
            <circle cx="61" cy="43" r="13" fill="#42ac2b" />
            <circle cx="61" cy="43" r="6" fill="#8ff268" />
            <rect x="51" y="17" width="27" height="55" rx="7" fill="#eac49c" />
            <path d="M56 21V67" stroke="#fff4e2" strokeWidth="3" opacity=".7" />
          </g>
        </svg>
      </div>

      <style>{`
        .fr-orbit-root .fr-object {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 86px;
          height: 86px;
          pointer-events: none;
          will-change: transform, opacity;
          filter: drop-shadow(0 10px 14px rgba(8, 52, 118, 0.22));
        }

        .fr-orbit-root .fr-object.fr-money {
          width: 102px;
          height: 86px;
        }

        .fr-orbit-root .fr-object svg {
          display: block;
          width: 100%;
          height: 100%;
          overflow: visible;
          animation: fr-icon-float 3.5s ease-in-out infinite;
        }

        .fr-orbit-root .fr-orbit-card {
          border-radius: 22px;
          will-change: transform, opacity;
        }

        .fr-orbit-root .fr-ticket-holder {
          position: relative;
          width: 100%;
          height: 100%;
          animation: fr-ticket-float 4s ease-in-out infinite;
          filter: drop-shadow(0 20px 30px rgba(8, 52, 118, 0.26));
        }

        .fr-orbit-root .fr-ticket-depth {
          position: absolute;
          inset: 0;
          transform: translate(8px, 10px);
          border-radius: 16px;
          background: linear-gradient(145deg, #b88632 0%, #815821 100%);
          -webkit-mask-image:
            radial-gradient(circle at 0 50%, transparent 12px, #000 12.5px),
            radial-gradient(circle at 100% 50%, transparent 12px, #000 12.5px);
          -webkit-mask-composite: source-in;
          mask-image:
            radial-gradient(circle at 0 50%, transparent 12px, #000 12.5px),
            radial-gradient(circle at 100% 50%, transparent 12px, #000 12.5px);
          mask-composite: intersect;
        }

        .fr-orbit-root .fr-ticket {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 16px;
          display: flex;
          overflow: hidden;
          background: linear-gradient(
            145deg,
            #fff9dd 0%,
            #f7e2a3 45%,
            #d6a747 78%,
            #ab7525 100%
          );
          box-shadow:
            inset 0 2px 7px rgba(255, 255, 255, 0.9),
            inset 0 0 0 2px #fff0ac;
          -webkit-mask-image:
            radial-gradient(circle at 0 50%, transparent 12px, #000 12.5px),
            radial-gradient(circle at 100% 50%, transparent 12px, #000 12.5px);
          -webkit-mask-composite: source-in;
          mask-image:
            radial-gradient(circle at 0 50%, transparent 12px, #000 12.5px),
            radial-gradient(circle at 100% 50%, transparent 12px, #000 12.5px);
          mask-composite: intersect;
        }

        .fr-orbit-root .fr-ticket-stub {
          position: relative;
          width: 54px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 2px dashed rgba(135, 88, 28, 0.55);
          background: rgba(255, 248, 214, 0.25);
        }

        .fr-orbit-root .fr-stub-brand {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.22em;
          color: #7a5018;
          opacity: 0.88;
        }

        .fr-orbit-root .fr-ticket-main {
          position: relative;
          flex: 1;
          padding: 13px 18px 13px 14px;
          display: flex;
        }

        .fr-orbit-root .fr-ticket-inner {
          position: relative;
          width: 100%;
          border: 1.5px dashed #b28543;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 12px;
        }

        .fr-orbit-root .fr-ticket-label {
          position: relative;
          z-index: 2;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #724b16;
          text-shadow: 0 1px 0 rgba(255, 250, 220, 0.8);
        }

        .fr-orbit-root .fr-number {
          position: relative;
          z-index: 2;
          color: #165b3b;
          font-size: clamp(28px, 5vw, 38px);
          font-weight: 950;
          letter-spacing: 1.8px;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          line-height: 1;
          text-shadow: 0 1px 0 #fff6c8;
        }

        .fr-orbit-root .fr-shine {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(
            110deg,
            transparent 20%,
            rgba(255, 255, 255, 0.7) 45%,
            transparent 60%
          );
          background-size: 260% 100%;
          animation: fr-shine-move 5s ease-in-out infinite;
        }

        .fr-orbit-root .fr-speed {
          position: absolute;
          left: -115px;
          top: 14px;
          width: 165px;
          height: 120px;
          transform: rotate(-8deg);
          z-index: -1;
        }

        .fr-orbit-root .fr-speed i {
          position: absolute;
          right: 0;
          display: block;
          height: 5px;
          border-radius: 50px;
          background: linear-gradient(90deg, transparent, #ffc34a, #ffea94, transparent);
          filter: drop-shadow(0 0 5px #ffc642);
          animation: fr-speed-motion 1s ease-in-out infinite;
        }

        .fr-orbit-root .fr-speed i:nth-child(1) { top: 12px; width: 120px; }
        .fr-orbit-root .fr-speed i:nth-child(2) { top: 34px; width: 155px; animation-delay: -0.2s; }
        .fr-orbit-root .fr-speed i:nth-child(3) { top: 58px; width: 95px; animation-delay: -0.4s; }
        .fr-orbit-root .fr-speed i:nth-child(4) { top: 82px; width: 140px; animation-delay: -0.6s; }
        .fr-orbit-root .fr-speed i:nth-child(5) { top: 104px; width: 90px; animation-delay: -0.8s; }

        .fr-orbit-root .fr-star {
          position: absolute;
          z-index: 25;
          color: #f8bf35;
          pointer-events: none;
          font-size: 22px;
          animation: fr-sparkle 2.4s ease-in-out infinite;
        }

        .fr-orbit-root .fr-star-1 { top: 18%; left: 36%; }
        .fr-orbit-root .fr-star-2 { top: 30%; right: 14%; animation-delay: -0.8s; }
        .fr-orbit-root .fr-star-3 { bottom: 18%; left: 20%; animation-delay: -1.5s; }

        @keyframes fr-ticket-float {
          0%, 100% {
            transform: perspective(1000px) translateY(0) rotate(-6deg) rotateX(6deg) rotateY(-10deg);
          }
          50% {
            transform: perspective(1000px) translateY(-10px) rotate(-2deg) rotateX(-3deg) rotateY(7deg);
          }
        }

        @keyframes fr-icon-float {
          0%, 100% { transform: rotate(-8deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.06); }
        }

        @keyframes fr-shine-move {
          0%, 30% { background-position: 130% 0; }
          70%, 100% { background-position: -140% 0; }
        }

        @keyframes fr-speed-motion {
          0% { opacity: 0; transform: translateX(25px) scaleX(0.7); }
          45% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-45px) scaleX(1.2); }
        }

        @keyframes fr-sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.2) rotate(75deg); }
        }

        @media (max-width: 640px) {
          .fr-orbit-root .fr-object {
            width: 64px;
            height: 64px;
          }
          .fr-orbit-root .fr-object.fr-money {
            width: 76px;
            height: 64px;
          }
          .fr-orbit-root .fr-speed {
            left: -70px;
            transform: rotate(-8deg) scale(0.75);
          }
          .fr-orbit-root .fr-ticket-stub {
            width: 44px;
          }
          .fr-orbit-root .fr-ticket-label {
            font-size: 10px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fr-orbit-root *,
          .fr-orbit-root *::before,
          .fr-orbit-root *::after {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
