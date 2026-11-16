'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { createRaffle, generateSlug } from '@/lib/firebase/raffles';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { PixKeyType } from '@/types/database.types';

export default function NewRafflePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeImageUrl, setPrizeImageUrl] = useState('');
  const [totalTickets, setTotalTickets] = useState<number>(100);
  const [ticketPrice, setTicketPrice] = useState<number>(1.0);
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('cpf');
  const [pixKey, setPixKey] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');

  const presets = [50, 100, 200, 500, 1000];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError('Você precisa estar autenticado.');
      return;
    }

    if (!title || !pixKey || isNaN(ticketPrice) || isNaN(totalTickets)) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const slug = generateSlug(title);
      const newId = await createRaffle({
        user_id: user.uid,
        title,
        slug,
        description,
        prize_image_url: prizeImageUrl || null,
        ticket_price: ticketPrice,
        total_tickets: totalTickets,
        pix_key: pixKey,
        pix_key_type: pixKeyType,
        phone_whatsapp: phoneWhatsapp || '',
        status: 'active',
        winner_ticket: null,
        winner_name: null,
        draw_date: null,
      });

      router.push(`/admin/rifas/${newId}`);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Erro ao criar rifa.');
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
          aria-label="Voltar para o painel"
          className="ora-btn-secondary p-2.5 rounded-full inline-flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-[#14213A]" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em]">
            Criar Rifa Rápida
          </h1>
          <p className="text-sm text-[#475872]">
            Configure seu prêmio, valor da cota e chave PIX em 2 minutos para começar a divulgar no WhatsApp.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-sm font-medium rounded-[18px]"
        >
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="ora-card rounded-[28px] p-6 sm:p-9 space-y-8">
        {/* Prêmio */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0D1729] tracking-[-0.02em]">
            Informações do Prêmio
          </h2>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              htmlFor="title"
            >
              Título do Prêmio ou Campanha *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: iPhone 16 Pro Max 256GB Lacrado"
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
            />
          </div>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              htmlFor="description"
            >
              Descrição e Regras do Sorteio
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes do prêmio, data ou critério de sorteio (ex: Loteria Federal)."
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
            />
          </div>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              htmlFor="prizeImageUrl"
            >
              URL da Foto do Prêmio (opcional)
            </label>
            <input
              id="prizeImageUrl"
              type="url"
              value={prizeImageUrl}
              onChange={(e) => setPrizeImageUrl(e.target.value)}
              placeholder="https://exemplo.com/foto-do-premio.jpg"
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
            />
          </div>
        </div>

        {/* Cotas e Valores */}
        <div className="pt-6 border-t border-[#E0E9F7] space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0D1729] tracking-[-0.02em]">
            Cotas e Valor por Bilhete
          </h2>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-2"
              htmlFor="totalTickets"
            >
              Quantidade Total de Cotas *
            </label>
            <div className="inline-flex flex-wrap gap-1.5 p-1.5 bg-[#F8FBFF] border border-[#DBE7F6] rounded-full mb-3">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTotalTickets(preset)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer tabular-nums ${
                    totalTickets === preset
                      ? 'bg-[#0869F5] text-white shadow-[0_6px_14px_rgba(8,105,245,0.2)]'
                      : 'text-[#475872] hover:text-[#0D1729]'
                  }`}
                >
                  {preset} cotas
                </button>
              ))}
            </div>
            <input
              id="totalTickets"
              type="number"
              min={10}
              max={100000}
              required
              value={totalTickets}
              onChange={(e) => setTotalTickets(parseInt(e.target.value, 10) || 0)}
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] tabular-nums transition"
            />
          </div>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              htmlFor="ticketPrice"
            >
              Valor por Cota (R$) *
            </label>
            <input
              id="ticketPrice"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={ticketPrice}
              onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] tabular-nums transition"
            />
          </div>

          {/* Revenue preview box */}
          <div className="p-5 bg-[#F2F7FF] border border-[#CDE0FC] rounded-[20px] flex items-center justify-between tabular-nums">
            <span className="text-sm font-semibold text-[#14213A]">
              Arrecadação Potencial (100% vendido):
            </span>
            <span className="font-display font-bold text-xl text-[#0869F5]">
              R$ {potentialRevenue}
            </span>
          </div>
        </div>

        {/* Chave PIX e WhatsApp */}
        <div className="pt-6 border-t border-[#E0E9F7] space-y-4">
          <h2 className="font-display font-bold text-lg text-[#0D1729] tracking-[-0.02em]">
            Recebimento via PIX
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="pixKeyType"
              >
                Tipo de Chave
              </label>
              <select
                id="pixKeyType"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                className="w-full px-3.5 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5] text-[15px] transition"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="phone">Celular</option>
                <option value="email">E-mail</option>
                <option value="random">Aleatória</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
                htmlFor="pixKey"
              >
                Sua Chave PIX *
              </label>
              <input
                id="pixKey"
                type="text"
                required
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Chave para onde o participante enviará o PIX"
                className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-[13px] font-semibold text-[#14213A] mb-1.5"
              htmlFor="phoneWhatsapp"
            >
              WhatsApp para Receber Comprovantes (com DDD) *
            </label>
            <input
              id="phoneWhatsapp"
              type="tel"
              required
              value={phoneWhatsapp}
              onChange={(e) => setPhoneWhatsapp(e.target.value)}
              placeholder="Ex: 11999999999"
              className="w-full px-4 py-3.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5] focus:ring-2 focus:ring-[#0869F5]/15 text-[15px] transition"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="ora-btn-primary w-full py-4 px-5 font-bold rounded-[18px] text-[16px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Publicando Campanha...</span>
              </>
            ) : (
              <span>Publicar Rifa Agora</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
