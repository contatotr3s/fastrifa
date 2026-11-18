'use client';

import { useTheme } from '@/lib/theme-context';
import { Palette, Check, Globe } from 'lucide-react';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'full';
}

export default function ThemeSwitcher({ variant = 'compact' }: ThemeSwitcherProps) {
  const { theme, globalTheme, isMaster, setTheme } = useTheme();

  // Para o Master, o estado a ser refletido e selecionado é o globalTheme
  const currentSelected = isMaster ? globalTheme : theme;

  if (variant === 'full') {
    return (
      <div className="ora-card rounded-[26px] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center border border-[#D0E2FC] shadow-sm flex-shrink-0">
              {isMaster ? <Globe className="w-5 h-5" /> : <Palette className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#0D1729] tracking-[-0.02em]">
                {isMaster ? 'Identidade Visual Global do Sistema' : 'Cor da Sua Marca'}
              </h3>
              <p className="text-xs text-[#526480]">
                {isMaster
                  ? 'Define a cor oficial para o site principal (Home, Login, Cadastro) e para novas contas que acabaram de acessar.'
                  : 'Define a cor aplicada exclusivamente do seu painel em diante e nas suas campanhas de rifa.'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-[#F2F7FF] text-[#475872] border border-[#E0E9F7] self-start sm:self-center">
            {isMaster
              ? currentSelected === 'blue'
                ? 'Azul Global Ativo'
                : 'Verde Global Ativo'
              : currentSelected === 'blue'
              ? 'Azul no Seu Painel'
              : 'Verde no Seu Painel'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opção Azul */}
          <button
            type="button"
            onClick={() => setTheme('blue')}
            className={`p-4 rounded-[20px] border text-left transition flex items-center justify-between cursor-pointer ${
              currentSelected === 'blue'
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
            {currentSelected === 'blue' && (
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
              currentSelected === 'green'
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
            {currentSelected === 'green' && (
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
        title={isMaster ? 'Definir Azul Cobalto como padrão global do sistema' : 'Ativar Azul Cobalto no seu painel'}
        aria-label="Ativar tema Azul Cobalto"
        aria-pressed={currentSelected === 'blue'}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
          currentSelected === 'blue'
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
        title={isMaster ? 'Definir Verde Esmeralda como padrão global do sistema' : 'Ativar Verde Esmeralda no seu painel'}
        aria-label="Ativar tema Verde Esmeralda"
        aria-pressed={currentSelected === 'green'}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
          currentSelected === 'green'
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
