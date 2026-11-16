import Link from 'next/link';
import { Ticket, ArrowRight, Zap, ShieldCheck, Sparkles, Smartphone, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-white">
            <span className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
              <Ticket className="w-5 h-5" />
            </span>
            FAST<span className="text-emerald-400">RIFA</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl transition shadow-md shadow-emerald-500/10"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-16 sm:py-24 text-center">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            A plataforma mais rápida de rifas do Brasil
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Crie e venda suas rifas online{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              em minutos
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Sem burocracia ou taxas sobre suas vendas. Defina seu prêmio, receba pagamentos diretamente no seu PIX e gerencie participantes pelo celular.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/cadastro"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-2xl transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <span>Criar Minha Rifa Agora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-base rounded-2xl transition"
            >
              Acessar Painel
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 sm:mt-24 text-left">
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">PIX Direto na Sua Conta</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              O comprador paga diretamente para a sua chave PIX. Zero intermediários e zero taxas sobre a sua arrecadação.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Seleção Híbrida & Rápida</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Seus clientes podem escolher números favoritos na grade ou clicar em botões rápidos (+5, +10, +50 cotas) para gerar bilhetes aleatórios em 2 cliques.
            </p>
          </div>

          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">Painel & Comprovantes</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Confirme participantes pelo WhatsApp com um clique, libere cotas não pagas e informe o bilhete premiado de forma transparente.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        FASTRIFA &copy; 2026 — Plataforma rápida, aberta e moderna de rifas.
      </footer>
    </div>
  );
}
