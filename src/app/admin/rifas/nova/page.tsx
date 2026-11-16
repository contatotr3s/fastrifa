'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createRaffle } from '@/app/admin/actions';
import { ArrowLeft, Ticket, Loader2 } from 'lucide-react';

export default function NewRafflePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalTickets, setTotalTickets] = useState<number>(100);
  const [ticketPrice, setTicketPrice] = useState<number>(1.00);

  const presets = [50, 100, 200, 500, 1000];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createRaffle(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const potentialRevenue = (totalTickets * (ticketPrice || 0)).toFixed(2);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Criar Nova Rifa
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure o prêmio, a quantidade de cotas e sua chave PIX para receber os pagamentos.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Prêmio */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            1. Dados do Prêmio
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="title">
              Título do Prêmio / Campanha *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Ex: iPhone 16 Pro Max 256GB Lacrado"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="description">
              Descrição e Regras
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Descreva o prêmio, data de sorteio ou critérios (ex: Sorteio pela Loteria Federal)."
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="prizeImageUrl">
              URL da Imagem do Prêmio (opcional)
            </label>
            <input
              id="prizeImageUrl"
              name="prizeImageUrl"
              type="url"
              placeholder="https://exemplo.com/foto-do-premio.jpg"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Cotas e Valores */}
        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
            2. Cotas e Precificação
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Quantidade Total de Cotas *
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTotalTickets(preset)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    totalTickets === preset
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {preset} cotas
                </button>
              ))}
            </div>
            <input
              id="totalTickets"
              name="totalTickets"
              type="number"
              min={10}
              max={100000}
              required
              value={totalTickets}
              onChange={(e) => setTotalTickets(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="ticketPrice">
              Valor por Cota (R$) *
            </label>
            <input
              id="ticketPrice"
              name="ticketPrice"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={ticketPrice}
              onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Revenue preview box */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">Arrecadação Potencial (100% vendido):</span>
            <span className="text-base font-black text-emerald-400">R$ {potentialRevenue}</span>
          </div>
        </div>

        {/* Chave PIX e WhatsApp */}
        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
            3. Dados de Recebimento (PIX)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="pixKeyType">
                Tipo de Chave
              </label>
              <select
                id="pixKeyType"
                name="pixKeyType"
                className="w-full px-3 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="phone">Celular</option>
                <option value="email">E-mail</option>
                <option value="random">Aleatória</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="pixKey">
                Sua Chave PIX *
              </label>
              <input
                id="pixKey"
                name="pixKey"
                type="text"
                required
                placeholder="Insira a chave para onde o comprador pagará"
                className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="phoneWhatsapp">
              WhatsApp para Comprovantes (com DDD) *
            </label>
            <input
              id="phoneWhatsapp"
              name="phoneWhatsapp"
              type="tel"
              required
              placeholder="Ex: 11999999999"
              className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando Rifa...
              </>
            ) : (
              'Publicar Rifa Agora'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
