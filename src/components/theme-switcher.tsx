'use client';

import { useTheme, type SystemTheme } from '@/lib/theme-context';
import { Palette, Check } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'full';
}

export default function ThemeSwitcher({ variant = 'compact' }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  if (variant === 'full') {
    return (
      <div className="ora-card rounded-[26px] p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center border border-[#D0E2FC] shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#0D1729] tracking-[-0.02em]">
                Identidade Visual do Sistema
              </h3>
              <p className="text-xs text-[#526480]">
                Alterne a cor principal aplicada a todas as páginas públicas e administrativas.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-[#F2F7FF] text-[#475872] border border-[#E0E9F7]">
            {theme === 'blue' ? 'Azul Cobalto Ativo' : 'Verde Esmeralda Ativo'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opção Azul */}
          <button
            type="button"
            onClick={() => setTheme('blue')}
            className={`p-4 rounded-[20px] border text-left transition flex items-center justify-between cursor-pointer ${
              theme === 'blue'
                ? 'bg-[#F2F7FF] border-[#0869F5] ring-2 ring-[#0869F5]/20 shadow-sm'
                : 'bg-white border-[#E0E9F7] hover:border-[#B9D3F8]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#62A5FF] via-[#0869F5] to-[#052498] shadow-[0_4px_12px_rgba(8,105,245,0.35)] flex-shrink-0" />
              <div>
                <strong className="block text-sm font-bold text-[#0D1729]">
                  Azul Cobalto (Oratry Padrão)
                </strong>
                <small className="block text-xs text-[#526480] mt-0.5">
                  Tom tecnológico, luminoso e clássico
                </small>
              </div>
            </div>
            {theme === 'blue' && (
              <span className="w-6 h-6 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {/* Opção Verde */}
          <button
            type="button"
            onClick={() => setTheme('green')}
            className={`p-4 rounded-[20px] border text-left transition flex items-center justify-between cursor-pointer ${
              theme === 'green'
                ? 'bg-[#F1FAF5] border-[#00A868] ring-2 ring-[#00A868]/20 shadow-sm'
                : 'bg-white border-[#E0E9F7] hover:border-[#BCECD4]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#34D399] via-[#00A868] to-[#064E3B] shadow-[0_4px_12px_rgba(0,168,104,0.35)] flex-shrink-0" />
              <div>
                <strong className="block text-sm font-bold text-[#0D1729]">
                  Verde Esmeralda Suave
                </strong>
                <small className="block text-xs text-[#526480] mt-0.5">
                  Tom botânico, próspero e acolhedor
                </small>
              </div>
            </div>
            {theme === 'green' && (
              <span className="w-6 h-6 rounded-full bg-[#00A868] text-white flex items-center justify-center text-xs">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Compact Pill Switcher (for Header)
  return (
    <div
      role="group"
      aria-label="Alternar tema de cores"
      className="inline-flex items-center p-1 bg-[#F5F9FF] border border-[#D9E5F7] rounded-full shadow-inner select-none"
    >
      <button
        type="button"
        onClick={() => setTheme('blue')}
        title="Tema Azul Cobalto"
        aria-label="Ativar tema Azul Cobalto"
        aria-pressed={theme === 'blue'}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
          theme === 'blue'
            ? 'bg-white text-[#0869F5] shadow-[0_2px_8px_rgba(8,105,245,0.18)] border border-[#CDE0FC]'
            : 'text-[#526480] hover:text-[#0D1729]'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#62A5FF] to-[#0869F5] shadow-sm" />
        <span className="hidden sm:inline">Azul</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('green')}
        title="Tema Verde Esmeralda"
        aria-label="Ativar tema Verde Esmeralda"
        aria-pressed={theme === 'green'}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
          theme === 'green'
            ? 'bg-white text-[#00A868] shadow-[0_2px_8px_rgba(0,168,104,0.18)] border border-[#BCECD4]'
            : 'text-[#526480] hover:text-[#0D1729]'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#34D399] to-[#00A868] shadow-sm" />
        <span className="hidden sm:inline">Verde</span>
      </button>
    </div>
  );
}
