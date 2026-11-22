'use client';

/**
 * Botão institucional "Voltar ao topo"
 */
export default function ScrollToTopButton() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar para cima"
      title="Voltar ao topo"
      className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#475872] hover:text-[#0869F5] transition-colors cursor-pointer"
    >
      <span className="tracking-[-0.01em]">
        Voltar ao topo
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-label="Voltar para cima"
        className="transition-transform duration-200 group-hover:-translate-y-0.5"
      >
        <path d="m18 15-6-6-6 6" />
        <path d="M12 9v12" />
      </svg>
    </button>
  );
}
