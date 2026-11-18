'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import { getAllRaffles, getAllCreators } from '@/lib/firebase/raffles';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { generateBrandInitials } from '@/lib/image-processor';
import {
  ShieldCheck,
  Users,
  Sparkles,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Tag,
  Store,
  Phone,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import type { Raffle, Profile } from '@/types/database.types';

interface CreatorItem {
  email?: string;
  profile: Profile;
}

export default function AdminMasterPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'creators' | 'raffles'>('creators');
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null);

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      Promise.all([getAllCreators(), getAllRaffles()])
        .then(([creatorsData, rafflesData]) => {
          setCreators(creatorsData);
          setRaffles(rafflesData);
        })
        .catch((err) => console.error('Erro ao carregar dados do master:', err))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  async function handleCleanTestData() {
    if (
      !confirm(
        'Deseja realmente limpar todos os perfis e dados de teste, mantendo apenas a conta master dancos3@gmail.com?'
      )
    ) {
      return;
    }

    setIsCleaning(true);
    setCleanFeedback(null);

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fastrifa_auth_accounts');
      }

      try {
        const snap = await getDocs(collection(db, 'profiles'));
        for (const d of snap.docs) {
          const data = d.data();
          const pEmail = (data.email || '').toLowerCase().trim();
          if (pEmail !== MASTER_EMAIL && d.id !== user?.uid) {
            await deleteDoc(doc(db, 'profiles', d.id));
          }
        }
      } catch (err) {
        console.warn('Erro ao deletar perfis remotos:', err);
      }

      const [creatorsData, rafflesData] = await Promise.all([getAllCreators(), getAllRaffles()]);
      setCreators(creatorsData.filter((c) => c.email === MASTER_EMAIL || c.profile.role === 'master'));
      setRaffles(rafflesData);
      setCleanFeedback('Base limpa com sucesso! Somente a conta master dancos3@gmail.com foi mantida.');
    } catch (e) {
      console.error(e);
      setCleanFeedback('Ocorreu um erro ao limpar dados de teste.');
    } finally {
      setIsCleaning(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
      </div>
    );
  }

  // Se não for master, bloqueia o acesso
  if (!isMaster) {
    return (
      <div className="ora-card rounded-[28px] p-10 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-xl text-[#0D1729]">
          Acesso Restrito
        </h2>
        <p className="text-sm text-[#475872]">
          Esta área é de acesso exclusivo para a administração geral da plataforma FastRifa.
        </p>
        <Link
          href="/admin"
          className="ora-btn-primary rounded-full px-5 py-2.5 inline-flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Meu Painel</span>
        </Link>
      </div>
    );
  }

  // Estatísticas Globais
  const totalCreators = creators.length;
  const totalRaffles = raffles.length;
  const activeRaffles = raffles.filter((r) => r.status === 'active').length;
  const totalTicketsVolume = raffles.reduce((acc, r) => acc + (r.total_tickets || 0), 0);
  const totalPotentialGtv = raffles.reduce(
    (acc, r) => acc + (r.total_tickets * (r.ticket_price || 0)),
    0
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Painel Master • Owner do FastRifa</span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#0D1729] tracking-[-0.04em]">
            Monitoramento de Criadores
          </h1>
          <p className="text-[#475872] text-[15px] mt-1">
            Acompanhe em tempo real quem está criando rifas, as marcas ativas e o volume transacionado na plataforma.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isCleaning}
            onClick={handleCleanTestData}
            className="px-4 py-2.5 text-xs font-bold text-[#BE123C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] rounded-full transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Remove usuários e rifas de teste, mantendo apenas a conta do owner"
          >
            {isCleaning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Limpar Dados de Teste</span>
          </button>

          <Link
            href="/admin"
            className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Painel</span>
          </Link>
        </div>
      </div>

      {cleanFeedback && (
        <div className="p-4 rounded-[18px] bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{cleanFeedback}</span>
        </div>
      )}

      {/* Global Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
        <div className="ora-card rounded-[24px] p-5">
          <div className="flex items-center justify-between text-[#475872] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Criadores Registrados</span>
            <span className="w-8 h-8 rounded-full bg-[#F2F7FF] text-[#0869F5] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-[#0D1729]">{totalCreators}</div>
          <span className="text-[11px] text-[#526480] mt-1 block">Organizações e marcas</span>
        </div>

        <div className="ora-card rounded-[24px] p-5">
          <div className="flex items-center justify-between text-[#475872] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Rifas na Rede</span>
            <span className="w-8 h-8 rounded-full bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-[#0869F5]">{totalRaffles}</div>
          <span className="text-[11px] text-[#526480] mt-1 block">{activeRaffles} campanhas ativas</span>
        </div>

        <div className="ora-card rounded-[24px] p-5">
          <div className="flex items-center justify-between text-[#475872] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Cotas em Circulação</span>
            <span className="w-8 h-8 rounded-full bg-[#F5F9FF] text-[#0869F5] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-[#0D1729]">{totalTicketsVolume.toLocaleString('pt-BR')}</div>
          <span className="text-[11px] text-[#526480] mt-1 block">Números cadastrados</span>
        </div>

        <div className="ora-card rounded-[24px] p-5">
          <div className="flex items-center justify-between text-[#475872] text-xs font-bold uppercase tracking-wider mb-2">
            <span>Volume Potencial (GTV)</span>
            <span className="w-8 h-8 rounded-full bg-[#EBF7F0] text-[#00A868] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="font-display font-bold text-3xl text-[#00A868]">
            R$ {totalPotentialGtv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-[#526480] mt-1 block">Soma das campanhas</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-[#E0E9F7] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('creators')}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'creators'
              ? 'bg-[#0869F5] text-white shadow-sm'
              : 'text-[#475872] hover:text-[#0D1729] hover:bg-[#F2F7FF]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Criadores & Marcas ({creators.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('raffles')}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'raffles'
              ? 'bg-[#0869F5] text-white shadow-sm'
              : 'text-[#475872] hover:text-[#0D1729] hover:bg-[#F2F7FF]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Todas as Campanhas ({raffles.length})</span>
        </button>
      </div>

      {/* Creators Table */}
      {activeTab === 'creators' && (
        <div className="ora-card rounded-[28px] overflow-hidden">
          <div className="p-6 border-b border-[#E0E9F7] flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-[#0D1729]">
                Criadores de Rifa Registrados
              </h2>
              <p className="text-xs text-[#526480] mt-0.5">
                Organizações que utilizam o FastRifa como plataforma de vendas.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-[#F5F9FF] border border-[#D9E5F7] text-[#475872] rounded-full">
              {creators.length} cadastrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F9FF] text-[#475872] text-[11px] font-bold uppercase tracking-wider border-b border-[#E0E9F7]">
                <tr>
                  <th className="py-3.5 px-6">Marca & Logo</th>
                  <th className="py-3.5 px-6">Responsável</th>
                  <th className="py-3.5 px-6">Contato / WhatsApp</th>
                  <th className="py-3.5 px-6">Chave PIX</th>
                  <th className="py-3.5 px-6">Campanhas</th>
                  <th className="py-3.5 px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E9F7]">
                {creators.map((c) => {
                  const p = c.profile;
                  const creatorRaffles = raffles.filter((r) => r.user_id === p.id);
                  const brandName = p.brand_name || p.full_name;
                  const initials = p.brand_initials || generateBrandInitials(brandName);
                  const cleanPhone = (p.phone_whatsapp || '').replace(/\D/g, '');

                  return (
                    <tr key={p.id} className="hover:bg-[#F8FBFF] transition">
                      {/* Brand Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[14px] overflow-hidden bg-white border border-[#CDE0FC] shadow-sm flex items-center justify-center flex-shrink-0">
                            {p.brand_logo_url ? (
                              <img
                                src={p.brand_logo_url}
                                alt={brandName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] to-[#0869F5] text-white font-display font-bold text-xs">
                                {initials}
                              </div>
                            )}
                          </div>
                          <div>
                            <strong className="block font-display font-bold text-[#0D1729] text-[14px] leading-tight">
                              {brandName}
                            </strong>
                            <span className="text-[11px] text-[#526480] flex items-center gap-1 mt-0.5">
                              {p.role === 'master' ? (
                                <span className="text-[#9A6700] font-bold">Administrador Mestre</span>
                              ) : (
                                <span>Criador Ativo</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Full Name & Email */}
                      <td className="py-4 px-6">
                        <span className="block font-semibold text-[#0D1729]">{p.full_name}</span>
                        <span className="block text-xs text-[#526480]">{c.email || 'Conta Local'}</span>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-4 px-6">
                        {p.phone_whatsapp ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#0D1729] tabular-nums font-medium">
                              {p.phone_whatsapp}
                            </span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/55${cleanPhone}?text=Ol%C3%A1!%20Aqui%20%C3%A9%20do%20suporte%20FastRifa.`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-full text-[#0869F5] hover:bg-[#EDF5FF] transition"
                                title="Chamar no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#8A9BB3]">Não informado</span>
                        )}
                      </td>

                      {/* PIX Key */}
                      <td className="py-4 px-6 text-xs text-[#475872] tabular-nums">
                        {p.pix_key || <span className="text-[#8A9BB3]">Configura na rifa</span>}
                      </td>

                      {/* Raffles Count */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-[#EDF5FF] text-[#0869F5] font-bold text-xs tabular-nums">
                          {creatorRaffles.length} rifas
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        {cleanPhone ? (
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ora-btn-secondary px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#0869F5]" />
                            <span>Suporte</span>
                          </a>
                        ) : (
                          <span className="text-xs text-[#8A9BB3]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raffles Table */}
      {activeTab === 'raffles' && (
        <div className="ora-card rounded-[28px] overflow-hidden">
          <div className="p-6 border-b border-[#E0E9F7] flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-xl text-[#0D1729]">
                Todas as Campanhas Ativas na Rede
              </h2>
              <p className="text-xs text-[#526480] mt-0.5">
                Auditoria de todas as rifas em andamento ou finalizadas pelos criadores.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-[#F5F9FF] border border-[#D9E5F7] text-[#475872] rounded-full">
              {raffles.length} rifas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F9FF] text-[#475872] text-[11px] font-bold uppercase tracking-wider border-b border-[#E0E9F7]">
                <tr>
                  <th className="py-3.5 px-6">Campanha</th>
                  <th className="py-3.5 px-6">Organizador / Marca</th>
                  <th className="py-3.5 px-6">Cotas & Preço</th>
                  <th className="py-3.5 px-6">Potencial Total</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Página Pública</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E9F7]">
                {raffles.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FBFF] transition">
                    <td className="py-4 px-6">
                      <strong className="block font-display font-bold text-[#0D1729] text-sm">
                        {r.title}
                      </strong>
                      <span className="text-xs text-[#526480]">slug: {r.slug}</span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F9FF] border border-[#D9E5F7] text-xs font-semibold text-[#0D1729]">
                        <Store className="w-3.5 h-3.5 text-[#0869F5]" />
                        <span>{r.brand_name || 'Organizador Oficial'}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-xs text-[#475872] tabular-nums">
                      <strong>{r.total_tickets} cotas</strong> • R$ {Number(r.ticket_price).toFixed(2)}
                    </td>

                    <td className="py-4 px-6 font-display font-bold text-sm text-[#0869F5] tabular-nums">
                      R$ {(r.total_tickets * r.ticket_price).toFixed(2)}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'active'
                            ? 'bg-[#EBF7F0] text-[#00A868] border border-[#BCECD4]'
                            : r.status === 'completed'
                            ? 'bg-[#FFF8EB] text-[#9A6700] border border-[#F5D08A]'
                            : 'bg-[#F5F9FF] text-[#475872]'
                        }`}
                      >
                        {r.status === 'active' ? 'Ativa' : r.status === 'completed' ? 'Finalizada' : 'Pausada'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/r/${r.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F2F7FF] text-[#0869F5] text-xs font-bold hover:bg-[#E3EFFF] transition"
                      >
                        <span>Abrir Rifa</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
