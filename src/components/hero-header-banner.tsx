'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Componente isolado do Hero Header estilo Ora com elemento em pill ao lado do texto.
 * Pode ser colado diretamente em qualquer página ou projeto com Tailwind CSS.
 */
export default function HeroHeaderBanner() {
  return (
    <section className="pt-6 pb-16 sm:pt-12 sm:pb-24 px-4 sm:px-8 relative overflow-hidden bg-white text-[#0D1729]">
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Coluna da Esquerda: Textos + Elemento em Pill + Botões */}
          <div className="lg:col-span-7 text-left space-y-6">
            
            {/* Tag Superior (Eyebrow) */}
            <div className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-[#0869F5]">
              Sua campanha abre ou fecha portas
            </div>

            {/* Título Principal com o elemento em Pill ao lado do texto */}
            <h1 className="font-bold text-[clamp(2.4rem,4.4vw,4.1rem)] leading-[1.08] tracking-[-0.04em] text-[#0D1729]">
              Não perca{' '}
              <span className="inline-flex items-center justify-center align-middle mx-1 sm:mx-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#EDF5FF] border border-[#CDE0FC] shadow-[0_2px_10px_rgba(8,105,245,0.08)]">
                <img
                  src="/icone-isolado.png"
                  alt="Fast Rifa"
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
              </span>{' '}
              <span className="text-[#0869F5]">o cliente</span>
              <br />
              por não conseguir
              <br />
              vender rápido.
            </h1>

            {/* Parágrafo explicativo */}
            <p className="text-[17px] sm:text-[19px] text-[#475872] leading-[1.6] max-w-[50ch]">
              Pra você criar em 2 minutos, divulgar no zap e receber direto na sua conta. Sem taxa no saque, sem intermediário e sem complicação.
            </p>

            {/* Botão de Ação (CTA) + Microtexto */}
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/cadastro"
                  className="rounded-full px-8 py-4 text-[16px] sm:text-[17px] font-bold text-white bg-[#0869F5] hover:bg-[#0656cc] inline-flex items-center justify-center gap-2.5 shadow-lg shadow-[#0869F5]/25 hover:shadow-[#0869F5]/40 transition"
                >
                  <span>Comece grátis</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#campanha-ao-vivo"
                  className="rounded-full px-6 py-4 text-[15px] sm:text-[16px] font-semibold text-[#0D1729] bg-white border border-[#D9E5F7] hover:border-[#B9D3F8] hover:bg-[#F8FBFF] inline-flex items-center justify-center gap-2 transition"
                >
                  <span>Ver Demonstração</span>
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-[#526480] pt-1">
                <span className="w-2 h-2 rounded-full bg-[#0869F5]" />
                <span>Crie grátis para praticar e testar como quiser. Sem cartão.</span>
              </div>
            </div>
          </div>

          {/* Coluna da Direita (Ilustração / Espaço visual) */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="w-full max-w-[420px] aspect-square rounded-[36px] bg-gradient-to-br from-[#EBF3FF] via-[#F4F9FF] to-[#E5F0FF] border border-[#D9E5F7] flex items-center justify-center p-8 shadow-xl">
              <img
                src="/logo-fastrifa.png"
                alt="Fast Rifa"
                className="w-full max-w-[280px] object-contain drop-shadow-md"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
