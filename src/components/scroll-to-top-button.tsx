'use client';

/**
 * Botão institucional "Voltar ao topo" estilizado com base na identidade visual FastRifa
 * e no ícone circular de retorno ao topo (barra horizontal + seta ascendente).
 */
export default function ScrollToTopButton() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo da página"
      title="Voltar ao topo"
      className="group inline-flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 rounded-full bg-white hover:bg-[#F5F9FF] border border-[#E0E9F7] hover:border-[#B9D3F8] text-xs font-bold text-[#0D1729] transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer shadow-[0_6px_18px_rgba(32,75,134,0.06)] hover:shadow-[0_10px_24px_rgba(8,105,245,0.12)]"
    >
      <span className="tracking-[-0.01em] text-[#475872] group-hover:text-[#0869F5] transition-colors">
        Voltar ao topo
      </span>
      <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(0,168,104,0.22)] transition-transform duration-300 group-hover:scale-105">
        <svg
          viewBox="0 0 128 128"
          className="w-7 h-7 rounded-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="fastrifaTopBtnGrad"
              x1="0%"
              y1="50%"
              x2="100%"
              y2="50%"
            >
              <stop offset="0%" stopColor="#00DE8E" />
              <stop offset="55%" stopColor="#05A6BA" />
              <stop offset="100%" stopColor="#0869F5" />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r="64" fill="url(#fastrifaTopBtnGrad)" />
          {/* Barra horizontal superior (teto) */}
          <rect x="26" y="26" width="76" height="9" rx="4.5" fill="#FFFFFF" />
          {/* Seta para cima com animação sutil via CSS group-hover */}
          <g className="transition-transform duration-300 group-hover:-translate-y-1 origin-center">
            <path
              d="M64 43 L44 63 L50.5 69.5 L59.5 60.5 L59.5 102 L68.5 102 L68.5 60.5 L77.5 69.5 L84 63 Z"
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </span>
    </button>
  );
}
