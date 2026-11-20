'use client';

import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F5F9FF] hover:bg-[#EDF5FF] border border-[#CDE0FC] hover:border-[#0869F5] text-xs font-bold text-[#0869F5] transition active:scale-95 cursor-pointer shadow-xs"
      title="Voltar ao topo da página"
    >
      <span>Voltar ao topo</span>
      <ArrowUp className="w-3.5 h-3.5 text-[#0869F5]" />
    </button>
  );
}
