'use client';

import React from 'react';
import {
  Sparkles,
  Printer,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  X,
  Smartphone,
} from 'lucide-react';
import type { Raffle } from '@/types/database.types';

interface HybridSalesWelcomeModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintModal: () => void;
}

export default function HybridSalesWelcomeModal({
  raffle,
  isOpen,
  onClose,
  onOpenPrintModal,
}: HybridSalesWelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0D1729]/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="ora-card rounded-[32px] max-w-xl w-full p-6 sm:p-9 space-y-6 relative border-2 border-[var(--ora-border-strong,#B9E7D2)] shadow-[0_24px_60px_rgba(0,168,104,0.18)] my-8">
        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar mensagem de boas-vindas"
          className="absolute right-5 top-5 p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F3FAF6] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho de Sucesso */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] text-xs font-bold border border-[var(--ora-border-strong,#B9E7D2)] shadow-xs">
            <Sparkles className="w-4 h-4" />
            <span>Sua Campanha Está Pronta e Publicada!</span>
          </div>

          <h2 className="font-display font-black text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.03em] leading-tight">
            Pronto para Vender Online e no Físico ao Mesmo Tempo!
          </h2>

          <p className="text-sm sm:text-[15px] text-[#475872] leading-relaxed max-w-lg mx-auto">
            Bolamos um jeito bacana e exclusivo para você potencializar suas vendas: você pode divulgar o link no WhatsApp e, se quiser, também <strong>imprimir uma cartela oficial de papel</strong> para vender no trabalho, família e comércio local.
          </p>
        </div>

        {/* Destaque da Solução Exclusiva */}
        <div className="p-4 sm:p-5 rounded-[24px] bg-gradient-to-br from-[#F3FAF6] to-white border border-[var(--ora-border,#D6EFE3)] space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2.5 text-[var(--ora-blue,#00A868)] font-display font-bold text-sm">
            <Smartphone className="w-5 h-5 flex-shrink-0" />
            <span>Checagem em Tempo Real via QR Code Inteligente</span>
          </div>

          <div className="space-y-2.5 text-xs sm:text-[13px] text-[#334661] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                1
              </span>
              <p>
                <strong>Imprima a Cartela Física A4:</strong> Ela já vem com seu prêmio, fotos, suas cotas e as instruções prontas para circular de mão em mão.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                2
              </span>
              <p>
                <strong>Zero risco de vender número repetido:</strong> A cartela tem um QR Code exclusivo do <em>Checador Físico</em>. Quem for comprar aponta a câmera, o sistema valida se a cota está livre na hora e calcula o PIX exato somado.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[var(--ora-surface-alt,#E8F7F0)] text-[var(--ora-blue,#00A868)] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                3
              </span>
              <p>
                <strong>Dinheiro 100% no seu PIX:</strong> O comprador paga direto na sua chave cadastrada e você confere tudo no seu painel.
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPrintModal();
            }}
            className="ora-btn-primary w-full py-4 px-6 rounded-[20px] font-bold text-[15px] sm:text-base flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition active:scale-[0.98]"
          >
            <Printer className="w-5 h-5" />
            <span>Ver Cartela e Imprimir Versão Física</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="ora-btn-secondary w-full py-3 px-5 rounded-[18px] font-bold text-sm text-[#475872] hover:text-[#0D1729] flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <span>Ir para Gerenciamento da Rifa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
