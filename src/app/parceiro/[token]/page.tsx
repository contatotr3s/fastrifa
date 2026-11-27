'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getRafflePartnerByToken } from '@/lib/firebase/partners';
import PhysicalCartelaPixView from '@/components/physical-cartela-pix-view';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import type { RafflePartner } from '@/types/database.types';

export default function PartnerCheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [partner, setPartner] = useState<RafflePartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPartner = useCallback(async () => {
    try {
      const found = await getRafflePartnerByToken(token);
      if (!found) {
        setPartner(null);
        setError('Acesso de parceiro não encontrado.');
        return;
      }
      setPartner(found);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados do parceiro:', err);
      setError('Não foi possível validar seu link de parceiro.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    loadPartner();
  }, [loadPartner]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] ora-hero-stage flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[var(--ora-blue,#00A868)] animate-spin" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="min-h-[100dvh] ora-hero-stage text-[#0D1729] flex items-center justify-center p-4">
        <div className="ora-card rounded-[28px] p-7 sm:p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="font-display font-bold text-2xl text-[#0D1729]">
            Link de parceiro inválido
          </h1>
          <p className="text-sm text-[#475872] leading-relaxed">
            {error ||
              'Não encontramos nenhum cadastro de parceiro para este endereço. Solicite ao organizador o envio do seu link correto.'}
          </p>
          <Link
            href="/"
            className="ora-btn-primary rounded-full px-6 py-3 text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir para o Início</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PhysicalCartelaPixView
      raffleId={partner.raffle_id}
      checkoutMode="partner"
      partner={partner}
      onPartnerRefresh={loadPartner}
    />
  );
}
