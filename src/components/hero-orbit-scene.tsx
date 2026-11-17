'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import {
  Zap,
  QrCode,
  MessageCircle,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';

interface OrbitCardData {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Zap;
}

const CARDS: OrbitCardData[] = [
  {
    id: 'c1',
    title: 'Criação em 2 min',
    subtitle: 'Sem cadastro longo',
    icon: Zap,
  },
  {
    id: 'c2',
    title: 'Chave PIX Direta',
    subtitle: '100% no seu banco',
    icon: QrCode,
  },
  {
    id: 'c3',
    title: 'Link pro WhatsApp',
    subtitle: 'Divulgação em 1 clique',
    icon: MessageCircle,
  },
  {
    id: 'c4',
    title: 'Grade em Tempo Real',
    subtitle: 'Números livres e pagos',
    icon: LayoutGrid,
  },
  {
    id: 'c5',
    title: 'Sem Taxa no Saque',
    subtitle: 'Caiu no PIX já é seu',
    icon: ShieldCheck,
  },
];

export default function HeroOrbitScene() {
  const { theme } = useTheme();
  const [angle, setAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const angleRef = useRef(0);

  // Check viewport size
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Smooth continuous 60fps orbit loop
  useEffect(() => {
    function animate(currentTime: number) {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // Speed: ~0.35 rad/s (approx 18s per full rotation), slows to 0.08 rad/s when hovered
      const speed = isHovered ? 0.08 : 0.35;
      angleRef.current = (angleRef.current + speed * deltaTime) % (Math.PI * 2);
      setAngle(angleRef.current);

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered]);

  // Orbit ellipse geometry
  const radiusX = isMobile ? 150 : 215;
  const radiusY = isMobile ? 75 : 105;
  const tiltAngle = -0.21; // -12 degrees tilt

  return (
    <div
      className="relative w-full max-w-[720px] h-[440px] sm:h-[490px] mx-auto flex items-center justify-center my-6 sm:my-10 select-none overflow-visible"
      style={{ perspective: 1200 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="FastRifa em órbita tridimensional interativa"
    >
      {/* Ambient Radial Halo */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-full blur-2xl -z-10 ${
          theme === 'green'
            ? 'bg-[radial-gradient(circle,rgba(52,211,153,0.30)_0%,rgba(220,244,233,0.45)_45%,transparent_72%)]'
            : 'bg-[radial-gradient(circle,rgba(98,165,255,0.32)_0%,rgba(225,237,255,0.45)_45%,transparent_72%)]'
        }`}
      />

      {/* Orbit Ellipse 1 (Inner Dashed) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 left-1/2 rounded-[50%] border-[1.5px] border-dashed ${
          theme === 'green' ? 'border-[#B9E7D2]/80' : 'border-[#B9D3F8]/70'
        }`}
        style={{
          width: isMobile ? 320 : 450,
          height: isMobile ? 160 : 225,
          transform: `translate(-50%, -50%) rotate(${tiltAngle * (180 / Math.PI)}deg)`,
        }}
      />

      {/* Orbit Ellipse 2 (Outer Soft Ring) */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 left-1/2 rounded-[50%] border ${
          theme === 'green'
            ? 'border-[#B9E7D2]/50 shadow-[0_0_30px_rgba(0,168,104,0.08)]'
            : 'border-[#CDE0FC]/45 shadow-[0_0_30px_rgba(8,105,245,0.06)]'
        }`}
        style={{
          width: isMobile ? 360 : 510,
          height: isMobile ? 180 : 255,
          transform: `translate(-50%, -50%) rotate(${tiltAngle * (180 / Math.PI)}deg)`,
        }}
      />

      {/* Central Bioluminescent Orb with 3D Badge */}
      <div className="relative z-20 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          {/* Pulsing Backlight */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 rounded-full blur-2xl animate-pulse ${
              theme === 'green'
                ? 'bg-[radial-gradient(circle,rgba(52,211,153,0.45)_0%,rgba(0,168,104,0.22)_55%,transparent_75%)]'
                : 'bg-[radial-gradient(circle,rgba(98,165,255,0.45)_0%,rgba(8,105,245,0.22)_55%,transparent_75%)]'
            }`}
          />
          <img
            src="/badge-3d-centro.png"
            alt="FastRifa Oficial"
            className={`relative z-10 w-full h-full object-contain animate-float-slow ${
              theme === 'green'
                ? 'drop-shadow-[0_24px_48px_rgba(0,168,104,0.35)]'
                : 'drop-shadow-[0_24px_48px_rgba(8,105,245,0.35)]'
            }`}
          />
        </div>

        {/* Central Tagline (Ora Style) */}
        <div className="mt-2 text-center pointer-events-auto">
          <strong className="block text-[13px] sm:text-[14px] font-semibold text-[#0D1729] tracking-[-0.02em]">
            Esta é a <b className="text-[#0869F5] font-bold">FastRifa.</b>
          </strong>
          <span className="block text-[11px] sm:text-[12px] font-medium text-[#475872] mt-0.5">
            Sua rifa rápida, prática e no PIX.
          </span>
        </div>
      </div>

      {/* Orbiting 3D Cards */}
      {CARDS.map((card, index) => {
        const phi = angle + (index * 2 * Math.PI) / CARDS.length;

        // Base 3D elliptical position
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);

        const x0 = radiusX * cosPhi;
        const y0 = radiusY * sinPhi;
        const z = sinPhi; // Depth: [-1 (back), +1 (front)]

        // Rotate by orbital tilt
        const cosTilt = Math.cos(tiltAngle);
        const sinTilt = Math.sin(tiltAngle);
        const x = x0 * cosTilt - y0 * sinTilt;
        const y = x0 * sinTilt + y0 * cosTilt;

        // 3D rotations based on orbital position
        const rotX = -y0 * 0.08;
        const rotY = -x0 * 0.11;
        const rotZ = x0 * 0.022;

        // Scale: [0.78, 1.0]
        const depthNorm = (z + 1) / 2; // [0, 1]
        const scale = isMobile
          ? 0.72 + 0.18 * depthNorm
          : 0.78 + 0.22 * depthNorm;

        // Opacity: softer in back, crisp in front
        const opacity = z < 0 ? 0.78 + 0.22 * depthNorm : 1.0;

        // Depth layering: back cards behind orb (z-index 10), front cards in front (z-index 30)
        const zIndex = z < 0 ? 10 : 30;

        // Shadow parameters
        const shadowY = 7 + 11 * depthNorm;
        const shadowBlur = 14 + 18 * depthNorm;
        const shadowAlpha = 0.08 + 0.06 * depthNorm;

        const IconComponent = card.icon;

        const cardBoxShadow =
          theme === 'green'
            ? `rgba(16, 100, 60, ${shadowAlpha.toFixed(3)}) 0px ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px, rgb(185, 231, 210) 0px 3px 0px, white 0px 1px 0px inset`
            : `rgba(25, 77, 150, ${shadowAlpha.toFixed(3)}) 0px ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px, rgb(217, 232, 251) 0px 3px 0px, white 0px 1px 0px inset`;

        return (
          <div
            key={card.id}
            className="absolute top-1/2 left-1/2 cursor-pointer transition-[box-shadow,border-color] duration-200"
            style={{
              zIndex,
              opacity,
              transform: `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
              boxShadow: cardBoxShadow,
            }}
          >
            <div className="flex items-center gap-2.5 sm:gap-3 bg-white/95 backdrop-blur-md border border-[#E0E9F7] rounded-[20px] px-3.5 py-2 sm:px-4 sm:py-2.5 hover:border-[#97BAE7] transition-colors">
              <span className="w-8 h-8 rounded-[12px] bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center flex-shrink-0 border border-[#D0E2FC] shadow-sm">
                <IconComponent className="w-4 h-4 text-[#0869F5]" />
              </span>
              <div className="text-left select-none">
                <strong className="block font-display font-bold text-[12.5px] sm:text-[13.5px] text-[#0D1729] leading-tight whitespace-nowrap">
                  {card.title}
                </strong>
                <small className="block text-[10.5px] sm:text-[11px] text-[#475872] leading-tight mt-0.5 whitespace-nowrap">
                  {card.subtitle}
                </small>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
