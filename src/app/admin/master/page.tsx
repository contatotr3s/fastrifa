'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import {
  getAllRaffles,
  getAllCreators,
  deleteRaffle,
  deleteCreatorProfile,
  updateRaffleByMaster,
  updateProfileByMaster,
  getAuditLogs,
  cleanAllTestData,
} from '@/lib/firebase/raffles';
import { generateBrandInitials } from '@/lib/image-processor';
import { getRafflePublicPath } from '@/lib/raffle-urls';
import {
  MasterEditUserModal,
  MasterEditRaffleModal,
} from '@/components/master-modals';
import {
  ShieldCheck,
  Users,
  Sparkles,
  Ticket,
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
  Edit3,
  FileText,
  Search,
  Scale,
} from 'lucide-react';
import type { Raffle, Profile, AuditLog } from '@/types/database.types';

interface CreatorItem {
  email?: string;
  profile: Profile;
}

export default function AdminMasterPage() {
  const { user, profile, loading: authLoading, resetPassword } = useAuth();
  const router = useRouter();

  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'creators' | 'raffles' | 'audits'>('creators');
  const [auditSearch, setAuditSearch] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingRaffleId, setDeletingRaffleId] = useState<string | null>(null);

  // Modais de edição direta pelo Master
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<CreatorItem | null>(null);
  const [selectedRaffleToEdit, setSelectedRaffleToEdit] = useState<Raffle | null>(null);

  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = email === MASTER_EMAIL || profile?.role === 'master';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      Promise.all([getAllCreators(), getAllRaffles(), getAuditLogs()])
        .then(([creatorsData, rafflesData, auditsData]) => {
          setCreators(creatorsData);
          setRaffles(rafflesData);
          setAuditLogs(auditsData);
        })
        .catch((err) => console.error('Erro ao carregar dados do master:', err))
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  async function handleCleanTestData() {
    if (
      !confirm(
        'Deseja realmente limpar TODOS os dados de teste (contas criadas, rifas associadas ou órfãs, pedidos e logs de auditoria), mantendo apenas a conta master dancos3@gmail.com?'
      )
    ) {
      return;
    }

    setIsCleaning(true);
    setCleanFeedback(null);

    try {
      const result = await cleanAllTestData(user?.uid, MASTER_EMAIL);

      const [creatorsData, rafflesData, auditsData] = await Promise.all([
        getAllCreators(),
        getAllRaffles(),
        getAuditLogs(),
      ]);
      setCreators(
        creatorsData.filter(
          (c) => c.email === MASTER_EMAIL || c.profile.role === 'master' || c.profile.id === user?.uid
        )
      );
      setRaffles(rafflesData);
      setAuditLogs(auditsData);

      const summary = `Base limpa com sucesso! Removidos: ${result.deletedProfiles} conta(s), ${result.deletedRaffles} rifa(s), ${result.deletedOrders} pedido(s) e ${result.deletedAuditLogs} log(s). Somente a conta master dancos3@gmail.com foi mantida.`;
      setCleanFeedback(
        result.errors.length > 0 ? `${summary} Atenção: ${result.errors.join(' ')}` : summary
      );
    } catch (e) {
      console.error(e);
      setCleanFeedback('Ocorreu um erro ao limpar dados de teste.');
    } finally {
      setIsCleaning(false);
    }
  }

  async function handleDeleteUser(userId: string, userName: string) {
    if (
      !confirm(
        `Tem certeza que deseja excluir o usuário "${userName}"?\n\nEsta ação apagará o perfil e todas as rifas vinculadas. Ao acessar novamente, ele precisará fazer o cadastro e configuração da marca do zero.`
      )
    ) {
      return;
    }

    setDeletingUserId(userId);
    setCleanFeedback(null);
    try {
      const deletedRaffleIds = new Set(
        raffles.filter((r) => r.user_id === userId).map((r) => r.id)
      );
      await deleteCreatorProfile(userId);
      setCreators((prev) => prev.filter((c) => c.profile.id !== userId));
      setRaffles((prev) => prev.filter((r) => r.user_id !== userId));
      setAuditLogs((prev) =>
        prev.filter((l) => l.user_id !== userId && !deletedRaffleIds.has(l.raffle_id))
      );
      setCleanFeedback(`Usuário "${userName}" e suas rifas foram excluídos com sucesso. Ele agora pode criar a conta do zero.`);
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      alert('Ocorreu um erro ao excluir o usuário.');
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleDeleteRaffle(raffleId: string, raffleTitle: string) {
    if (
      !confirm(
        `Tem certeza que deseja excluir a rifa "${raffleTitle}" permanentemente?`
      )
    ) {
      return;
    }

    setDeletingRaffleId(raffleId);
    setCleanFeedback(null);
    try {
      await deleteRaffle(raffleId);
      setRaffles((prev) => prev.filter((r) => r.id !== raffleId));
      setAuditLogs((prev) => prev.filter((l) => l.raffle_id !== raffleId));
      setCleanFeedback(`Rifa "${raffleTitle}" excluída com sucesso.`);
    } catch (err) {
      console.error('Erro ao excluir rifa:', err);
      alert('Ocorreu um erro ao excluir a rifa.');
    } finally {
      setDeletingRaffleId(null);
    }
  }

  async function handleSaveUser(userId: string, updates: Partial<Profile>, updatedEmail?: string) {
    setCleanFeedback(null);
    await updateProfileByMaster(userId, updates, updatedEmail);
    setCreators((prev) =>
      prev.map((c) => {
        if (c.profile.id === userId) {
          return {
            email: updatedEmail || c.email,
            profile: { ...c.profile, ...updates },
          };
        }
        return c;
      })
    );
    setCleanFeedback(`Dados do usuário "${updates.brand_name || updates.full_name}" foram atualizados com sucesso.`);
  }

  async function handleSaveRaffle(raffleId: string, updates: Partial<Raffle>) {
    setCleanFeedback(null);
    await updateRaffleByMaster(raffleId, updates);
    setRaffles((prev) =>
      prev.map((r) => (r.id === raffleId ? { ...r, ...updates } : r))
    );
    setCleanFeedback(`Campanha "${updates.title || 'Rifa'}" atualizada com sucesso.`);
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
            <span>Painel Master</span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#0D1729] tracking-[-0.04em]">
            Administração do Sistema
          </h1>
          <p className="text-[#475872] text-[15px] mt-1">
            Clique em qualquer usuário ou campanha para editar dados, redefinir senhas, ajustar PIX ou gerenciar o status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/master/regulamento-lab"
            className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2 border-[#CDE0FC] text-[#0D1729] hover:border-[#00A868]"
            title="Laboratório de Regulamento (exclusivo Master, em desenvolvimento)"
          >
            <Scale className="w-4 h-4 text-[#00A868]" />
            <span>Lab Regulamento</span>
          </Link>

          <button
            type="button"
            disabled={isCleaning}
            onClick={handleCleanTestData}
            className="px-4 py-2.5 text-xs font-bold text-[#BE123C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] rounded-full transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Remove usuários e rifas de teste, mantendo apenas a conta master"
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
      <div className="flex items-center gap-2 sm:gap-3 border-b border-[#E0E9F7] pb-3 overflow-x-auto whitespace-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab('creators')}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer flex-shrink-0 ${
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
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer flex-shrink-0 ${
            activeTab === 'raffles'
              ? 'bg-[#0869F5] text-white shadow-sm'
              : 'text-[#475872] hover:text-[#0D1729] hover:bg-[#F2F7FF]'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Todas as Campanhas ({raffles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('audits');
            getAuditLogs().then(setAuditLogs).catch(() => {});
          }}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer flex-shrink-0 ${
            activeTab === 'audits'
              ? 'bg-[#0869F5] text-white shadow-sm'
              : 'text-[#475872] hover:text-[#0D1729] hover:bg-[#F2F7FF]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Logs de Auditoria ({auditLogs.length})</span>
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
                    <tr
                      key={p.id}
                      onClick={() => setSelectedUserToEdit(c)}
                      className="hover:bg-[#F2F7FF] transition cursor-pointer group"
                      title="Clique para editar dados, chave PIX e resetar senha deste usuário"
                    >
                      {/* Brand Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[14px] overflow-hidden bg-white border border-[#CDE0FC] shadow-sm flex items-center justify-center flex-shrink-0 group-hover:border-[#0869F5] transition">
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
                            <strong className="block font-display font-bold text-[#0D1729] text-[14px] leading-tight group-hover:text-[#0869F5] transition">
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
                                onClick={(e) => e.stopPropagation()}
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
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedUserToEdit(c)}
                            className="ora-btn-secondary px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:border-[#0869F5] hover:text-[#0869F5] transition"
                            title="Editar dados cadastrais, marca, PIX e redefinir senha"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#0869F5]" />
                            <span>Administrar</span>
                          </button>

                          {cleanPhone && (
                            <a
                              href={`https://wa.me/55${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ora-btn-secondary px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#0869F5]" />
                              <span>Suporte</span>
                            </a>
                          )}

                          {p.id !== user?.uid &&
                            p.role !== 'master' &&
                            c.email?.toLowerCase().trim() !== MASTER_EMAIL && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(p.id, brandName)}
                                disabled={deletingUserId === p.id}
                                className="px-3 py-1.5 rounded-full text-xs font-bold text-[#BE123C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Excluir Usuário e permitir novo teste do zero"
                              >
                                {deletingUserId === p.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                <span>Excluir</span>
                              </button>
                            )}
                        </div>
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
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRaffleToEdit(r)}
                    className="hover:bg-[#F2F7FF] transition cursor-pointer group"
                    title="Clique para editar dados da campanha, cota, status e chave PIX"
                  >
                    <td className="py-4 px-6">
                      <strong className="block font-display font-bold text-[#0D1729] text-sm group-hover:text-[#0869F5] transition">
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
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedRaffleToEdit(r)}
                          className="ora-btn-secondary px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:border-[#0869F5] hover:text-[#0869F5] transition"
                          title="Ajustar dados da rifa, valor da cota e status"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#0869F5]" />
                          <span>Editar</span>
                        </button>

                        <Link
                          href={getRafflePublicPath(r)}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F2F7FF] text-[#0869F5] text-xs font-bold hover:bg-[#E3EFFF] transition"
                        >
                          <span>Página</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDeleteRaffle(r.id, r.title)}
                          disabled={deletingRaffleId === r.id}
                          className="px-3 py-1.5 rounded-full text-xs font-bold text-[#BE123C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Excluir Rifa Permanentemente (Master)"
                        >
                          {deletingRaffleId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span>Excluir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Table (Demanda de Suporte & Auditoria) */}
      {activeTab === 'audits' && (
        <div className="ora-card rounded-[28px] overflow-hidden space-y-4">
          <div className="p-6 border-b border-[#E0E9F7] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-xl text-[#0D1729]">
                  Registro Auditável de Alterações
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[11px] font-bold">
                  Segurança Ativa
                </span>
              </div>
              <p className="text-xs text-[#526480] mt-0.5">
                Histórico imutável de alterações de preço, título, descrição e fotos com identificação do autor para suporte.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#526480]" />
              <input
                type="text"
                placeholder="Buscar por rifa, autor ou email..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F5F9FF] border border-[#D9E5F7] rounded-full text-xs font-medium text-[#0D1729] placeholder-[#526480] focus:outline-none focus:bg-white focus:border-[#0869F5]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-[#526480] text-sm">
                Nenhum registro de auditoria gerado até o momento.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F9FF] text-[#475872] text-[11px] font-bold uppercase tracking-wider border-b border-[#E0E9F7]">
                  <tr>
                    <th className="py-3.5 px-6">Data / Horário</th>
                    <th className="py-3.5 px-6">Rifa</th>
                    <th className="py-3.5 px-6">Usuário Responsável</th>
                    <th className="py-3.5 px-6">Resumo da Alteração</th>
                    <th className="py-3.5 px-6">Valores Anteriores vs Novos</th>
                    <th className="py-3.5 px-6 text-right">Ação Suporte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E9F7]">
                  {auditLogs
                    .filter((log) => {
                      if (!auditSearch.trim()) return true;
                      const term = auditSearch.toLowerCase();
                      return (
                        log.raffle_title?.toLowerCase().includes(term) ||
                        log.user_email?.toLowerCase().includes(term) ||
                        log.user_name?.toLowerCase().includes(term) ||
                        log.change_summary.toLowerCase().includes(term) ||
                        log.raffle_id.toLowerCase().includes(term)
                      );
                    })
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-[#F8FAFC] transition">
                        <td className="py-4 px-6 text-xs text-[#526480] whitespace-nowrap tabular-nums">
                          <div className="font-semibold text-[#0D1729]">
                            {new Date(log.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div>
                            {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <strong className="block text-xs font-bold text-[#0D1729]">
                            {log.raffle_title || 'Rifa'}
                          </strong>
                          <span className="text-[10px] text-[#526480] font-mono">
                            ID: {log.raffle_id}
                          </span>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {(log.user_name || log.user_email || 'U')[0].toUpperCase()}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-[#0D1729]">
                                {log.user_name}
                              </div>
                              <div className="text-[11px] text-[#526480]">
                                {log.user_email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 rounded-xl bg-[#FFF8EB] border border-[#F5D08A] text-[#92400E] text-xs font-semibold">
                            {log.change_summary}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-xs">
                          <div className="space-y-1 font-mono text-[11px] max-w-xs">
                            {Object.keys(log.new_values || {}).map((key) => {
                              const oldV = log.previous_values?.[key];
                              const newV = log.new_values?.[key];
                              return (
                                <div key={key} className="bg-[#F5F9FF] p-1.5 rounded border border-[#E0E9F7]">
                                  <span className="font-bold text-[#0869F5]">{key}: </span>
                                  <span className="text-[#DC2626] line-through">
                                    {typeof oldV === 'object' ? JSON.stringify(oldV) : String(oldV ?? 'vazio')}
                                  </span>
                                  <span className="text-[#475872]"> ➔ </span>
                                  <span className="text-[#059669] font-bold">
                                    {typeof newV === 'object' ? JSON.stringify(newV) : String(newV ?? 'vazio')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const formatted = JSON.stringify(log, null, 2);
                              navigator.clipboard.writeText(formatted);
                              alert('Log auditável copiado em formato JSON para chamado de suporte.');
                            }}
                            className="ora-btn-secondary px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:border-[#0869F5]"
                            title="Copiar relatório completo para chamado de suporte"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#0869F5]" />
                            <span>Copiar Log</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modais de Edição e Administração Master */}
      <MasterEditUserModal
        isOpen={!!selectedUserToEdit}
        onClose={() => setSelectedUserToEdit(null)}
        creatorItem={selectedUserToEdit}
        onSave={handleSaveUser}
        onResetPassword={resetPassword}
        onDeleteUser={handleDeleteUser}
      />

      <MasterEditRaffleModal
        isOpen={!!selectedRaffleToEdit}
        onClose={() => setSelectedRaffleToEdit(null)}
        raffle={selectedRaffleToEdit}
        onSave={handleSaveRaffle}
        onDeleteRaffle={handleDeleteRaffle}
      />
    </div>
  );
}
