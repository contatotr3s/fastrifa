import Link from 'next/link';

export default function TestEnvBanner() {
  return (
    <aside
      aria-label="Aviso de ambiente de testes"
      className="w-full bg-[#0D1729] text-white py-2 px-4 text-xs border-b border-[#1A2942] relative z-[60] select-none"
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-center gap-2 sm:gap-3 text-center flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0869F5]/25 text-[#70ACFF] text-[11px] font-bold tracking-wide uppercase border border-[#0869F5]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#62A5FF] animate-pulse" />
          Protótipo em construção
        </span>
        <span className="text-[#A2BCDE] text-[12px] font-normal">
          Conteúdo demonstrativo e ambiente de testes · Cotas e pagamentos PIX simulados
        </span>
        <span className="hidden md:inline-block text-[#3A5070]">|</span>
        <Link
          href="/login"
          className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-[#62A5FF] hover:text-white underline underline-offset-2 transition"
        >
          <span>Acesso de teste (admin@fastrifa.com / 123456)</span>
        </Link>
      </div>
    </aside>
  );
}
