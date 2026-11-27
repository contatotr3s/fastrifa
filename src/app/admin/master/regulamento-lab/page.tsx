'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, MASTER_EMAIL } from '@/lib/firebase/auth-context';
import {
  SlidersHorizontal,
  FileText,
  Eye,
  Lock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  ArrowRight,
  ArrowLeft,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Scale,
  Info,
  RotateCcw,
  RefreshCw,
  Share2,
  Banknote,
  Package,
  MapPin,
  Handshake,
  ShieldAlert,
  QrCode,
  Loader2,
} from 'lucide-react';
import {
  TEMPLATE_VERSION,
  MAX_PHYSICAL_CARD_QUOTAS,
  DEFAULT_REGULATION_DRAFT,
  DEFAULT_DELIVERY_TEXTS,
  SOCIAL_CHANNEL_OPTIONS,
  SYSTEM_RESERVATION_LABEL,
  PROTECTED_SUMMARY_ITEMS,
  CURRENT_TERMS_EXCERPTS,
  PROPOSED_ADDENDUM_EXCERPTS,
  MONEY_PRIZE_LEGAL_NOTICE,
  LEGAL_AUDIT_ITEMS,
  validateRegulationDraft,
  analyzeApprovalFieldsGuardrails,
  generateRegulationClauses,
  formatRegulationPlainText,
  formatResultChannels,
  createCanonicalSnapshot,
  computeShortHash,
  computeSha256Hex,
  formatDrawDateDisplay,
  formatCurrencyBrl,
  type RegulationDraft,
  type PrizeType,
  type SocialChannelId,
  type ConditionType,
  type MethodType,
  type WinnerIdentificationType,
  type DeliveryModeType,
  type DeliveryCostsType,
} from './regulamento-engine';

type ViewTab = 'config' | 'regulation' | 'public';

interface SimulatedAcceptanceLog {
  version: string;
  hash: string;
  timestamp: string;
}

export default function MasterRegulamentoLabPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const email = user?.email?.toLowerCase().trim() || '';
  const isMaster = Boolean(user && (email === MASTER_EMAIL || profile?.role === 'master'));

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isMaster) {
      router.replace('/admin');
    }
  }, [authLoading, user, isMaster, router]);

  const [activeTab, setActiveTab] = useState<ViewTab>('config');
  const [draft, setDraft] = useState<RegulationDraft>(DEFAULT_REGULATION_DRAFT);
  const [showInheritedLab, setShowInheritedLab] = useState<boolean>(false);
  const [copiedReg, setCopiedReg] = useState<boolean>(false);
  const [showTermsCompareModal, setShowTermsCompareModal] = useState<boolean>(false);
  const [showLegalAuditModal, setShowLegalAuditModal] = useState<boolean>(false);
  const [showPublicRegModal, setShowPublicRegModal] = useState<boolean>(false);

  // Simulação de aprovação e corrida de versão
  const [versionMinor, setVersionMinor] = useState<number>(0);
  const [deliveryApproved, setDeliveryApproved] = useState<boolean>(false);
  const [refundApproved, setRefundApproved] = useState<boolean>(false);
  const [buyerAccepted, setBuyerAccepted] = useState<boolean>(false);
  const [versionChangedAlert, setVersionChangedAlert] = useState<boolean>(false);
  const [acceptanceLogs, setAcceptanceLogs] = useState<SimulatedAcceptanceLog[]>([]);
  const [sha256Hash, setSha256Hash] = useState<string>('');

  const versionLabel = `v1.${versionMinor}`;
  const canonicalSnapshot = useMemo(() => createCanonicalSnapshot(draft), [draft]);
  const shortHash = useMemo(() => computeShortHash(canonicalSnapshot), [canonicalSnapshot]);
  const fullHashDisplay = sha256Hash ? sha256Hash.slice(0, 16) : shortHash;
  const docCode = `FR-${fullHashDisplay.slice(0, 6).toUpperCase()}`;

  useEffect(() => {
    let active = true;
    computeSha256Hex(canonicalSnapshot)
      .then((hex) => {
        if (active) setSha256Hash(hex);
      })
      .catch(() => {
        if (active) setSha256Hash(shortHash);
      });
    return () => {
      active = false;
    };
  }, [canonicalSnapshot, shortHash]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowTermsCompareModal(false);
        setShowLegalAuditModal(false);
        setShowPublicRegModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const validationIssues = useMemo(() => validateRegulationDraft(draft), [draft]);
  const guardrailWarnings = useMemo(
    () => analyzeApprovalFieldsGuardrails(draft.deliveryDetails, draft.refundProcedure),
    [draft.deliveryDetails, draft.refundProcedure]
  );
  const deliveryGuardrails = guardrailWarnings.filter((w) => w.targetField === 'deliveryDetails');
  const refundGuardrails = guardrailWarnings.filter((w) => w.targetField === 'refundProcedure');
  const hasBlockingGuardrail = guardrailWarnings.some((w) => w.severity === 'blocking');

  const clauses = useMemo(
    () =>
      generateRegulationClauses(draft, {
        deliveryApproved,
        refundApproved,
      }),
    [draft, deliveryApproved, refundApproved]
  );

  const plainTextRegulation = useMemo(
    () => formatRegulationPlainText(draft, clauses),
    [draft, clauses]
  );

  function updateField<K extends keyof RegulationDraft>(key: K, value: RegulationDraft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'quantity' && typeof value === 'number' && value > MAX_PHYSICAL_CARD_QUOTAS) {
        next.usesPhysicalCard = false;
      }
      return next;
    });
    if (key === 'deliveryDetails' || key === 'deliveryMode') setDeliveryApproved(false);
    if (key === 'refundProcedure') setRefundApproved(false);
  }

  function handlePrizeTypeChange(nextPrizeType: PrizeType) {
    setDeliveryApproved(false);
    setDraft((prev) => {
      if (prev.prizeType === nextPrizeType) return prev;
      const isDefaultText = (Object.values(DEFAULT_DELIVERY_TEXTS) as string[]).includes(
        prev.deliveryDetails.trim()
      );
      if (nextPrizeType === 'money_pix') {
        const isDefaultPhysicalPrize = prev.prizes.trim() === DEFAULT_REGULATION_DRAFT.prizes;
        const isDefaultName = prev.name.trim() === DEFAULT_REGULATION_DRAFT.name;
        return {
          ...prev,
          prizeType: 'money_pix',
          name: isDefaultName ? 'PIX Premiado R$ 5.000,00 — Edição Rápida' : prev.name,
          prizes: isDefaultPhysicalPrize
            ? `Prêmio em dinheiro via PIX no valor líquido de ${formatCurrencyBrl(prev.moneyPrizeAmountReais)}`
            : prev.prizes,
          deliveryMode: 'pix_dinheiro',
          deliveryCosts: 'organizador',
          deliveryDetails: isDefaultText ? DEFAULT_DELIVERY_TEXTS.pix_dinheiro : prev.deliveryDetails,
        };
      }
      const wasDefaultMoneyName = prev.name.trim() === 'PIX Premiado R$ 5.000,00 — Edição Rápida';
      const wasDefaultMoneyPrize = prev.prizes.startsWith('Prêmio em dinheiro via PIX');
      return {
        ...prev,
        prizeType: 'physical',
        name: wasDefaultMoneyName ? DEFAULT_REGULATION_DRAFT.name : prev.name,
        prizes: wasDefaultMoneyPrize ? DEFAULT_REGULATION_DRAFT.prizes : prev.prizes,
        deliveryMode: prev.deliveryMode === 'pix_dinheiro' ? 'envio' : prev.deliveryMode,
        deliveryDetails: isDefaultText ? DEFAULT_DELIVERY_TEXTS.envio : prev.deliveryDetails,
      };
    });
  }

  function handleDeliveryModeSelect(nextMode: DeliveryModeType) {
    setDeliveryApproved(false);
    setDraft((prev) => {
      if (prev.prizeType === 'money_pix' && nextMode !== 'pix_dinheiro') {
        return prev;
      }
      const isDefaultText = (Object.values(DEFAULT_DELIVERY_TEXTS) as string[]).includes(
        prev.deliveryDetails.trim()
      );
      const nextPrizeType: PrizeType = nextMode === 'pix_dinheiro' ? 'money_pix' : prev.prizeType;
      const isDefaultPhysicalPrize =
        nextPrizeType === 'money_pix' && prev.prizes.trim() === DEFAULT_REGULATION_DRAFT.prizes;
      return {
        ...prev,
        prizeType: nextPrizeType,
        prizes: isDefaultPhysicalPrize
          ? `Prêmio em dinheiro via PIX no valor líquido de ${formatCurrencyBrl(prev.moneyPrizeAmountReais)}`
          : prev.prizes,
        deliveryMode: nextMode,
        deliveryDetails: isDefaultText ? DEFAULT_DELIVERY_TEXTS[nextMode] : prev.deliveryDetails,
        deliveryCosts: nextMode === 'pix_dinheiro' ? 'organizador' : prev.deliveryCosts,
      };
    });
  }

  function toggleSocialChannel(channelId: SocialChannelId) {
    setDraft((prev) => {
      const exists = prev.socialChannels.includes(channelId);
      const next = exists
        ? prev.socialChannels.filter((c) => c !== channelId)
        : [...prev.socialChannels, channelId];
      return { ...prev, socialChannels: next };
    });
  }

  function updateSocialHandle(channelId: SocialChannelId, val: string) {
    setDraft((prev) => ({
      ...prev,
      socialHandles: { ...prev.socialHandles, [channelId]: val },
    }));
  }

  async function handleCopyRegulation() {
    try {
      await navigator.clipboard.writeText(plainTextRegulation);
      setCopiedReg(true);
      setTimeout(() => setCopiedReg(false), 2200);
    } catch {
      setCopiedReg(false);
    }
  }

  function handleSimulateRuleChange() {
    setVersionMinor((v) => v + 1);
    setBuyerAccepted(false);
    setVersionChangedAlert(true);
  }

  function handleSimulateConfirmReservation() {
    if (!buyerAccepted) return;
    const nowFormatted = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date());
    setAcceptanceLogs((prev) => [
      {
        version: versionLabel,
        hash: fullHashDisplay,
        timestamp: nowFormatted,
      },
      ...prev,
    ]);
    setVersionChangedAlert(false);
  }

  function handleResetLab() {
    setDraft(DEFAULT_REGULATION_DRAFT);
    setVersionMinor(0);
    setDeliveryApproved(false);
    setRefundApproved(false);
    setBuyerAccepted(false);
    setVersionChangedAlert(false);
    setAcceptanceLogs([]);
  }

  const tabs: {
    id: ViewTab;
    label: string;
    mobileLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'config', label: '1. Configurar', mobileLabel: '1. Configurar', icon: SlidersHorizontal },
    { id: 'regulation', label: '2. Regulamento', mobileLabel: '2. Regulamento', icon: FileText },
    { id: 'public', label: '3. Página Pública', mobileLabel: '3. Pública', icon: Eye },
  ];

  const conditionSummaryLabel =
    draft.condition === 'fixed'
      ? 'Data fixa (definida no cadastro)'
      : draft.condition === 'all'
        ? 'Venda de 100% das cotas'
        : `Meta mínima de ${draft.goalPercent}%`;

  const methodSummaryLabel =
    draft.method === 'loteria_federal'
      ? 'Loteria Federal'
      : draft.method === 'live_draw'
        ? 'Transmissão ao Vivo'
        : draft.methodCustom || 'Método personalizado';

  const deliveryModeLabel =
    draft.deliveryMode === 'pix_dinheiro'
      ? 'PIX direto (prêmio em dinheiro)'
      : draft.deliveryMode === 'envio'
        ? 'Envio segurado com rastreio'
        : draft.deliveryMode === 'retirada'
          ? 'Retirada presencial'
          : 'Entrega a combinar';

  const inputBaseClass =
    'w-full px-3.5 py-2.5 rounded-[14px] bg-[#F8FBFF] border border-[#D9E5F7] text-sm text-[#0D1729] placeholder-[#8A9BB3] focus:outline-none focus:bg-white focus:border-[#0869F5] transition';

  const labelBaseClass = 'block text-xs font-bold text-[#14213A] mb-1.5';

  if (authLoading || !user) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00A868] animate-spin" />
      </div>
    );
  }

  if (!isMaster) {
    return (
      <div className="ora-card rounded-[28px] p-10 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="font-display font-bold text-xl text-[#0D1729]">
          Acesso Restrito ao Master
        </h2>
        <p className="text-sm text-[#475872]">
          Este laboratório interno de regulamento é exclusivo da sessão administrativa Master.
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

  return (
    <div className="text-[#0D1729] space-y-6">
      {/* Barra Superior Integrada do Lab Master (oculta na impressão) */}
      <div className="ora-card rounded-[22px] p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/master"
            className="ora-btn-secondary rounded-full px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
            title="Voltar ao Painel Master"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Painel Master</span>
          </Link>
          <span className="ora-glass-pill rounded-full px-3 py-1 text-[11px] font-bold text-[#00A868] hidden md:inline-flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" />
            <span>Lab Regulamento · Exclusivo Master</span>
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Vistas do FastRegulamento"
          className="ora-glass-pill rounded-full p-1 inline-flex items-center gap-0.5 sm:gap-1 order-3 sm:order-2 w-full sm:w-auto justify-between sm:justify-center max-w-full"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 sm:flex-initial min-w-0 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[13px] font-bold inline-flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'ora-btn-primary text-white shadow-sm'
                    : 'text-[#475872] hover:text-[#0D1729] hover:bg-[#F2F7FF]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 order-2 sm:order-3">
          <button
            type="button"
            onClick={() => setShowLegalAuditModal(true)}
            className="ora-btn-secondary rounded-full px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
            <span className="sm:hidden">Auditoria</span>
            <span className="hidden sm:inline">Auditoria Jurídica</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTermsCompareModal(true)}
            className="ora-btn-secondary rounded-full px-2.5 sm:px-3.5 py-2 text-[11px] sm:text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Scale className="w-3.5 h-3.5 text-[#0869F5]" />
            <span className="sm:hidden">Termos</span>
            <span className="hidden sm:inline">Termos Atuais vs Aditivo</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Banner informativo do lab */}
        <div className="mb-6 p-3.5 sm:p-4 rounded-[20px] bg-[#F5F9FF] border border-[#CDE0FC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-start sm:items-center gap-2.5 text-xs text-[#1D3B66]">
            <Info className="w-4 h-4 text-[#0869F5] shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Etapa final do cadastro (Laboratório):</strong> data, método de apuração e validade de reserva vêm automaticamente do cadastro e da regra raiz do sistema. Aqui o organizador define apenas divulgação, entrega e restituição.
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetLab}
            className="ora-btn-secondary rounded-full px-3.5 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar exemplo</span>
          </button>
        </div>

        {/* ============================================================
            VISTA 1: CONFIGURAR REGRAS
            ============================================================ */}
        {activeTab === 'config' && (
          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-7">
            <div className="w-full lg:flex-1 min-w-0 space-y-5">
              {/* Cabeçalho + Modalidade */}
              <section className="ora-card rounded-[26px] p-5 sm:p-7 space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0869F5] block mb-1">
                    Etapa Final do Cadastramento · FastRegulamento
                  </span>
                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.04em]">
                    Regulamento da Campanha
                  </h1>
                  <p className="text-sm text-[#475872] mt-1">
                    Os dados principais da rifa e as travas do sistema já foram aplicados. Defina apenas divulgação, entrega e cancelamento.
                  </p>
                </div>

                {/* Modalidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => updateField('campaignMode', 'independent')}
                    className={`p-3.5 rounded-[18px] border text-left transition cursor-pointer ${
                      draft.campaignMode === 'independent'
                        ? 'bg-[#EDF5FF] border-[#0869F5] shadow-[0_8px_20px_rgba(8,105,245,0.10)]'
                        : 'bg-white border-[#D9E5F7] hover:border-[#B9D3F8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-display font-bold text-sm text-[#0D1729]">
                        Campanha Independente
                      </strong>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          draft.campaignMode === 'independent'
                            ? 'border-[#0869F5] bg-[#0869F5]'
                            : 'border-[#CBD5E1]'
                        }`}
                      >
                        {draft.campaignMode === 'independent' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-[#526480] mt-1 leading-snug">
                      Puxa sua marca e dados do perfil, sem exigir certificado filantrópico.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateField('campaignMode', 'authorized')}
                    className={`p-3.5 rounded-[18px] border text-left transition cursor-pointer ${
                      draft.campaignMode === 'authorized'
                        ? 'bg-[#EDF5FF] border-[#0869F5] shadow-[0_8px_20px_rgba(8,105,245,0.10)]'
                        : 'bg-white border-[#D9E5F7] hover:border-[#B9D3F8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-display font-bold text-sm text-[#0D1729]">
                        Entidade / Autorização Formal
                      </strong>
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          draft.campaignMode === 'authorized'
                            ? 'border-[#0869F5] bg-[#0869F5]'
                            : 'border-[#CBD5E1]'
                        }`}
                      >
                        {draft.campaignMode === 'authorized' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-[#526480] mt-1 leading-snug">
                      Inclui CNPJ, entidade, beneficiário e número de certificado/plano no documento.
                    </p>
                  </button>
                </div>

                {/* Tipo de Prêmio (Físico vs Dinheiro PIX) + Cartela Física Impressa */}
                <div className="pt-4 border-t border-[#E0E9F7] grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <span className={labelBaseClass}>Tipo de Premiação da Campanha</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePrizeTypeChange('physical')}
                        aria-pressed={draft.prizeType === 'physical'}
                        className={`px-3 py-2.5 rounded-[16px] border text-left transition cursor-pointer flex items-center gap-2 ${
                          draft.prizeType === 'physical'
                            ? 'bg-[#EDF5FF] border-[#0869F5] text-[#0D1729] shadow-xs'
                            : 'bg-[#F8FBFF] border-[#D9E5F7] text-[#475872] hover:border-[#B9D3F8]'
                        }`}
                      >
                        <Package
                          className={`w-4 h-4 shrink-0 ${
                            draft.prizeType === 'physical' ? 'text-[#0869F5]' : 'text-[#526480]'
                          }`}
                        />
                        <span className="text-xs font-bold leading-tight">Prêmio Físico</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrizeTypeChange('money_pix')}
                        aria-pressed={draft.prizeType === 'money_pix'}
                        className={`px-3 py-2.5 rounded-[16px] border text-left transition cursor-pointer flex items-center gap-2 ${
                          draft.prizeType === 'money_pix'
                            ? 'bg-[#E8F7F0] border-[#00A868] text-[#0D1729] shadow-xs'
                            : 'bg-[#F8FBFF] border-[#D9E5F7] text-[#475872] hover:border-[#00A868]'
                        }`}
                      >
                        <Banknote
                          className={`w-4 h-4 shrink-0 ${
                            draft.prizeType === 'money_pix' ? 'text-[#00A868]' : 'text-[#526480]'
                          }`}
                        />
                        <span className="text-xs font-bold leading-tight">Dinheiro (PIX)</span>
                      </button>
                    </div>

                    {draft.prizeType === 'money_pix' && (
                      <div>
                        <label htmlFor="reg-money-amount" className="block text-[11px] font-bold text-[#14213A] mb-1">
                          Valor líquido do prêmio em dinheiro (R$)
                        </label>
                        <input
                          id="reg-money-amount"
                          type="number"
                          min={1}
                          step="0.01"
                          value={draft.moneyPrizeAmountReais}
                          onChange={(e) => {
                            const nextVal = Number(e.target.value) || 0;
                            setDraft((prev) => ({
                              ...prev,
                              moneyPrizeAmountReais: nextVal,
                              prizes: prev.prizes.startsWith('Prêmio em dinheiro via PIX')
                                ? `Prêmio em dinheiro via PIX no valor líquido de ${formatCurrencyBrl(nextVal)}`
                                : prev.prizes,
                            }));
                          }}
                          className={inputBaseClass}
                        />
                      </div>
                    )}
                  </div>

                  {/* Cartela Física Impressa (A4 PDF · até 200 cotas) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={labelBaseClass + ' mb-0'}>Cartela Física Impressa (A4 PDF)</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F9FF] text-[#0869F5] border border-[#CDE0FC]">
                        Até {MAX_PHYSICAL_CARD_QUOTAS} cotas
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={draft.quantity > MAX_PHYSICAL_CARD_QUOTAS}
                      onClick={() => updateField('usesPhysicalCard', !draft.usesPhysicalCard)}
                      aria-pressed={draft.usesPhysicalCard}
                      className={`w-full p-3 rounded-[16px] border text-left transition flex items-start gap-3 ${
                        draft.quantity > MAX_PHYSICAL_CARD_QUOTAS
                          ? 'bg-[#F8FAFC] border-[#E2E8F0] opacity-60 cursor-not-allowed'
                          : draft.usesPhysicalCard
                            ? 'bg-[#E8F7F0] border-[#00A868] cursor-pointer'
                            : 'bg-[#F8FBFF] border-[#D9E5F7] hover:border-[#B9D3F8] cursor-pointer'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          draft.usesPhysicalCard && draft.quantity <= MAX_PHYSICAL_CARD_QUOTAS
                            ? 'bg-[#00A868] text-white'
                            : 'bg-white text-[#526480] border border-[#D9E5F7]'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-xs font-bold text-[#0D1729]">
                            {draft.quantity > MAX_PHYSICAL_CARD_QUOTAS
                              ? 'Indisponível acima de 200 cotas'
                              : draft.usesPhysicalCard
                                ? 'Cartela Física A4 Ativa (Cláusula 11ª)'
                                : 'Ativar Cartela Física Impressa'}
                          </strong>
                          <span
                            className={`text-[10px] font-bold uppercase ${
                              draft.usesPhysicalCard && draft.quantity <= MAX_PHYSICAL_CARD_QUOTAS
                                ? 'text-[#065F46]'
                                : 'text-[#526480]'
                            }`}
                          >
                            {draft.usesPhysicalCard && draft.quantity <= MAX_PHYSICAL_CARD_QUOTAS ? 'Ativa' : 'Opcional'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#526480] mt-0.5 leading-snug">
                          {draft.quantity > MAX_PHYSICAL_CARD_QUOTAS
                            ? `Campanha com ${draft.quantity} cotas opera exclusivamente no formato digital.`
                            : 'Inclui Cláusula 11ª no regulamento e rodapé com hash e QR Code (/pix) na folha A4.'}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {draft.prizeType === 'money_pix' && (
                  <div
                    id="money-prize-legal-warning"
                    className="p-3.5 rounded-[18px] bg-[#FFFBEB] border border-[#F5D08A] flex items-start gap-2.5 text-xs text-[#92400E]"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block text-[#78350F]">{MONEY_PRIZE_LEGAL_NOTICE.title}</strong>
                      <p className="leading-relaxed text-[11.5px]">{MONEY_PRIZE_LEGAL_NOTICE.summary}</p>
                    </div>
                  </div>
                )}
              </section>

              {/* Bloco 1: Resumo Sincronizado do Cadastro + Regras Raiz (Sem duplicar decisão) */}
              <section className="ora-card rounded-[26px] p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#00A868] shrink-0" />
                    <h2 className="font-display font-bold text-base sm:text-lg text-[#0D1729]">
                      Dados Herdados do Cadastro e Regras Raiz do Sistema
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8F7F0] text-[#00A868] border border-[#B9E7D2]">
                    Sincronizado automaticamente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                      Campanha e Organizador (Cadastro)
                    </span>
                    <strong className="text-[#0D1729] block leading-snug">
                      {draft.name}
                    </strong>
                    <span className="text-[#475872] block">
                      {draft.brandOrEntity} • {draft.quantity} cotas de {formatCurrencyBrl(draft.priceReais)} • {draft.contactWhatsapp}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                      Data de Apuração & Condição (Cadastro)
                    </span>
                    <strong className="text-[#0D1729] block leading-snug">
                      {formatDrawDateDisplay(draft.drawDate, draft.timezone)}
                    </strong>
                    <span className="text-[#475872] block">
                      {conditionSummaryLabel} — estipulado no preenchimento inicial da rifa.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                      Método de Apuração & Critérios (Cadastro)
                    </span>
                    <strong className="text-[#0D1729] block leading-snug">
                      {methodSummaryLabel}
                    </strong>
                    <span className="text-[#475872] line-clamp-2">{draft.criteria}</span>
                  </div>

                  <div className="p-3.5 rounded-[18px] bg-[#F3FAF6] border border-[#B9E7D2] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#065F46] flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Validade de Reserva & PIX (Regra Raiz)</span>
                    </span>
                    <strong className="text-[#0D1729] block leading-snug">
                      {SYSTEM_RESERVATION_LABEL}
                    </strong>
                    <span className="text-[#047857] block">
                      PIX direto para {draft.pixHolder} • Conferência obrigatória via WhatsApp.
                    </span>
                  </div>
                </div>

                {/* Acordeão discreto apenas para simular edição dos dados anteriores durante o teste */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowInheritedLab((s) => !s)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0869F5] hover:underline cursor-pointer"
                  >
                    {showInheritedLab ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>
                      {showInheritedLab
                        ? 'Ocultar simulador de dados do cadastro'
                        : 'Simular alteração nos dados herdados (apenas neste laboratório)'}
                    </span>
                  </button>

                  {showInheritedLab && (
                    <div className="mt-3 pt-4 border-t border-[#E0E9F7] grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label htmlFor="reg-name" className={labelBaseClass}>
                          Título da Campanha (virá do cadastro)
                        </label>
                        <input
                          id="reg-name"
                          type="text"
                          value={draft.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          className={inputBaseClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-entity" className={labelBaseClass}>
                          Marca / Entidade
                        </label>
                        <input
                          id="reg-entity"
                          type="text"
                          value={draft.brandOrEntity}
                          onChange={(e) => updateField('brandOrEntity', e.target.value)}
                          className={inputBaseClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-drawdate" className={labelBaseClass}>
                          Data de Apuração (cadastro)
                        </label>
                        <input
                          id="reg-drawdate"
                          type="datetime-local"
                          value={draft.drawDate}
                          onChange={(e) => updateField('drawDate', e.target.value)}
                          className={inputBaseClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-quantity" className={labelBaseClass}>
                          Quantidade de cotas (testa limite 200 da Cartela Física)
                        </label>
                        <input
                          id="reg-quantity"
                          type="number"
                          min={10}
                          max={100000}
                          value={draft.quantity}
                          onChange={(e) => updateField('quantity', Number(e.target.value) || 0)}
                          className={inputBaseClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="reg-condition" className={labelBaseClass}>
                          Condição (cadastro)
                        </label>
                        <select
                          id="reg-condition"
                          value={draft.condition}
                          onChange={(e) => updateField('condition', e.target.value as ConditionType)}
                          className={inputBaseClass}
                        >
                          <option value="fixed">Data fixa</option>
                          <option value="all">Venda total (100%)</option>
                          <option value="goal">Meta mínima (%)</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="reg-method" className={labelBaseClass}>
                          Método de Sorteio (cadastro)
                        </label>
                        <select
                          id="reg-method"
                          value={draft.method}
                          onChange={(e) => updateField('method', e.target.value as MethodType)}
                          className={inputBaseClass}
                        >
                          <option value="loteria_federal">Loteria Federal</option>
                          <option value="live_draw">Transmissão ao Vivo Gravada</option>
                          <option value="custom">Outro Método Auditável</option>
                        </select>
                      </div>
                      {draft.campaignMode === 'authorized' && (
                        <>
                          <div>
                            <label htmlFor="reg-beneficiary" className={labelBaseClass}>
                              Beneficiário
                            </label>
                            <input
                              id="reg-beneficiary"
                              type="text"
                              value={draft.beneficiary}
                              onChange={(e) => updateField('beneficiary', e.target.value)}
                              className={inputBaseClass}
                            />
                          </div>
                          <div>
                            <label htmlFor="reg-cert" className={labelBaseClass}>
                              Certificado / Autorização
                            </label>
                            <input
                              id="reg-cert"
                              type="text"
                              value={draft.certificate}
                              onChange={(e) => updateField('certificate', e.target.value)}
                              className={inputBaseClass}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Bloco Principal Configurável: Divulgação, Entrega e Cancelamento */}
              <section className="ora-card rounded-[26px] p-5 sm:p-7 space-y-6">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-[14px] bg-[#EDF5FF] border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center shrink-0 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#0D1729]">
                      Divulgação, Entrega e Cancelamento
                    </h2>
                    <p className="text-xs text-[#526480]">
                      Personalize onde o resultado será divulgado, como o prêmio será entregue e a política de restituição.
                    </p>
                  </div>
                </div>

                {/* Canal Oficial de Divulgação */}
                <div className="space-y-3 pt-1">
                  <div>
                    <span className={labelBaseClass}>Canal Oficial de Divulgação</span>
                    <p className="text-[11px] text-[#526480]">
                      A página oficial da rifa já é obrigatória. Selecione uma ou mais redes sociais abaixo se também for divulgar por lá.
                    </p>
                  </div>

                  {/* Pill fixa obrigatória: Página oficial da rifa */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#EDF5FF] border border-[#0869F5] text-xs font-bold text-[#0869F5]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Página oficial da rifa (fixo)</span>
                    </span>

                    {SOCIAL_CHANNEL_OPTIONS.map((ch) => {
                      const isSelected = draft.socialChannels.includes(ch.id);
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => toggleSocialChannel(ch.id)}
                          aria-pressed={isSelected}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#00A868] border-[#00A868] text-white shadow-xs'
                              : 'bg-[#F8FBFF] border-[#D9E5F7] text-[#14213A] hover:border-[#00A868]'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          <span>+ {ch.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Inputs dos perfis/links para as redes selecionadas */}
                  {SOCIAL_CHANNEL_OPTIONS.some(
                    (opt) => opt.hasHandle && draft.socialChannels.includes(opt.id)
                  ) && (
                    <div className="p-3.5 rounded-[16px] bg-[#F8FBFF] border border-[#E0E9F7] grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SOCIAL_CHANNEL_OPTIONS.filter(
                        (opt) => opt.hasHandle && draft.socialChannels.includes(opt.id)
                      ).map((opt) => (
                        <div key={opt.id}>
                          <label htmlFor={`social-${opt.id}`} className="block text-[11px] font-bold text-[#14213A] mb-1">
                            {opt.label} (usuário ou link opcional)
                          </label>
                          <input
                            id={`social-${opt.id}`}
                            type="text"
                            placeholder={opt.placeholder}
                            value={draft.socialHandles[opt.id] || ''}
                            onChange={(e) => updateSocialHandle(opt.id, e.target.value)}
                            className={inputBaseClass}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Identificação do Ganhador (LGPD) */}
                <div>
                  <label htmlFor="reg-winner-id" className={labelBaseClass}>
                    Identificação do Ganhador na Divulgação (LGPD)
                  </label>
                  <select
                    id="reg-winner-id"
                    value={draft.winnerIdentification}
                    onChange={(e) =>
                      updateField('winnerIdentification', e.target.value as WinnerIdentificationType)
                    }
                    className={inputBaseClass}
                  >
                    <option value="partial">Número da cota + nome abreviado (privacidade)</option>
                    <option value="number">Apenas número da cota contemplada</option>
                    <option value="authorized">Identificação conforme plano e base legal</option>
                  </select>
                </div>

                {/* Modalidade de Entrega (incluindo PIX se o prêmio for dinheiro) */}
                <div className="space-y-2.5 pt-2 border-t border-[#E0E9F7]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={labelBaseClass + ' mb-0'}>Modalidade de Entrega do Prêmio</span>
                    {draft.prizeType === 'money_pix' && (
                      <span className="text-[11px] font-bold text-[#065F46]">
                        Prêmio em dinheiro utiliza exclusivamente transferência PIX
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {(
                      [
                        {
                          id: 'pix_dinheiro',
                          label: 'PIX (Dinheiro)',
                          desc: 'Transferência direta se for dinheiro',
                          icon: Banknote,
                        },
                        {
                          id: 'envio',
                          label: 'Envio / Correios',
                          desc: 'Frete com código de rastreio',
                          icon: Package,
                        },
                        {
                          id: 'retirada',
                          label: 'Retirada Local',
                          desc: 'Entrega presencial agendada',
                          icon: MapPin,
                        },
                        {
                          id: 'combinar',
                          label: 'A Combinar',
                          desc: 'Envio ou retirada com o ganhador',
                          icon: Handshake,
                        },
                      ] as {
                        id: DeliveryModeType;
                        label: string;
                        desc: string;
                        icon: React.ComponentType<{ className?: string }>;
                      }[]
                    ).map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = draft.deliveryMode === opt.id;
                      const isDisabledForMoney =
                        draft.prizeType === 'money_pix' && opt.id !== 'pix_dinheiro';
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isDisabledForMoney}
                          onClick={() => handleDeliveryModeSelect(opt.id)}
                          className={`p-3 rounded-[18px] border text-left transition flex flex-col gap-1.5 ${
                            isDisabledForMoney
                              ? 'bg-[#F8FAFC] border-[#E2E8F0] opacity-50 cursor-not-allowed'
                              : isSelected
                                ? 'bg-[#E8F7F0] border-2 border-[#00A868] shadow-[0_8px_18px_rgba(0,168,104,0.12)] cursor-pointer'
                                : 'bg-[#F8FBFF] border-[#D9E5F7] hover:border-[#00A868] hover:bg-white cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                isSelected ? 'bg-[#00A868] text-white' : 'bg-white text-[#0869F5] border border-[#D9E5F7]'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </span>
                            {isSelected && <Check className="w-4 h-4 text-[#00A868] stroke-[3]" />}
                          </div>
                          <strong className="font-display font-bold text-xs text-[#0D1729]">
                            {opt.label}
                          </strong>
                          <span className="text-[11px] text-[#526480] leading-snug">
                            {isDisabledForMoney ? 'Disponível apenas para prêmio físico' : opt.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prazo + Custos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-delivery-days" className={labelBaseClass}>
                      Prazo Máximo de Entrega (dias úteis/corridos)
                    </label>
                    <input
                      id="reg-delivery-days"
                      type="number"
                      min={1}
                      value={draft.deliveryDays}
                      onChange={(e) => updateField('deliveryDays', Number(e.target.value) || 0)}
                      className={inputBaseClass}
                    />
                  </div>

                  {draft.deliveryMode !== 'pix_dinheiro' ? (
                    <div>
                      <label htmlFor="reg-delivery-costs" className={labelBaseClass}>
                        Custos de Frete e Transferência
                      </label>
                      <select
                        id="reg-delivery-costs"
                        value={draft.deliveryCosts}
                        onChange={(e) => updateField('deliveryCosts', e.target.value as DeliveryCostsType)}
                        className={inputBaseClass}
                      >
                        <option value="organizador">Por conta do Organizador (grátis ao ganhador)</option>
                        <option value="ganhador">Por conta do ganhador (informado previamente)</option>
                        <option value="combinar">Conforme localidade e instrução detalhada</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <span className={labelBaseClass}>Custos de Transferência</span>
                      <div className="px-3.5 py-2.5 rounded-[14px] bg-[#E8F7F0] border border-[#B9E7D2] text-xs font-bold text-[#065F46]">
                        PIX direto sem taxas ou descontos para o ganhador
                      </div>
                    </div>
                  )}
                </div>

                {/* Instruções e Local de Entrega (Passa por aprovação) */}
                <div className="space-y-2 pt-2 border-t border-[#E0E9F7]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="reg-delivery-details" className="text-xs font-bold text-[#14213A]">
                      Instruções e Local de Entrega
                    </label>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFFBEB] text-[#92400E] border border-[#F5D08A]">
                      <Clock className="w-3 h-3" />
                      <span>Passa por aprovação</span>
                    </span>
                  </div>
                  <textarea
                    id="reg-delivery-details"
                    rows={2}
                    value={draft.deliveryDetails}
                    onChange={(e) => updateField('deliveryDetails', e.target.value)}
                    className={inputBaseClass}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateField('deliveryDetails', DEFAULT_DELIVERY_TEXTS[draft.deliveryMode])}
                      className="text-[11px] font-bold text-[#0869F5] hover:underline cursor-pointer"
                    >
                      Restaurar texto sugerido
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'deliveryDetails',
                          'O ganhador é obrigado a gravar vídeo senão a FastRifa garante outra entrega.'
                        )
                      }
                      className="text-[11px] font-bold text-[#BE123C] hover:underline cursor-pointer"
                    >
                      Testar trava de aprovação
                    </button>
                  </div>
                  {deliveryGuardrails.map((w) => (
                    <div
                      key={w.id}
                      className={`p-3 rounded-[14px] border flex items-start gap-2 text-xs ${
                        w.severity === 'blocking'
                          ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block">{w.title}</strong>
                        <span>{w.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Procedimento de Cancelamento e Restituição Direta (Passa por aprovação) */}
                <div className="space-y-2 pt-2 border-t border-[#E0E9F7]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="reg-refund" className="text-xs font-bold text-[#14213A]">
                      Procedimento de Cancelamento e Restituição Direta
                    </label>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFFBEB] text-[#92400E] border border-[#F5D08A]">
                      <Clock className="w-3 h-3" />
                      <span>Passa por aprovação</span>
                    </span>
                  </div>
                  <textarea
                    id="reg-refund"
                    rows={2}
                    value={draft.refundProcedure}
                    onChange={(e) => updateField('refundProcedure', e.target.value)}
                    className={inputBaseClass}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateField('refundProcedure', DEFAULT_REGULATION_DRAFT.refundProcedure)
                      }
                      className="text-[11px] font-bold text-[#0869F5] hover:underline cursor-pointer"
                    >
                      Restaurar texto sugerido
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'refundProcedure',
                          'Sem reembolso em nenhuma hipótese, o valor pago não devolvemos.'
                        )
                      }
                      className="text-[11px] font-bold text-[#BE123C] hover:underline cursor-pointer"
                    >
                      Testar trava (&ldquo;sem reembolso&rdquo;)
                    </button>
                  </div>
                  {refundGuardrails.map((w) => (
                    <div
                      key={w.id}
                      className={`p-3 rounded-[14px] border flex items-start gap-2 text-xs ${
                        w.severity === 'blocking'
                          ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block">{w.title}</strong>
                        <span>{w.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Cláusulas Fixas Protegidas */}
              <section className="ora-card-soft rounded-[26px] p-5 sm:p-6 space-y-3 border border-[#CDE0FC]">
                <div className="flex items-center gap-2 text-[#0D1729]">
                  <Lock className="w-4 h-4 text-[#0869F5] shrink-0" />
                  <h2 className="font-display font-bold text-base">
                    Cláusulas Fixas Protegidas pelo Sistema FastRifa
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROTECTED_SUMMARY_ITEMS.map((item) => (
                    <div
                      key={item.title}
                      className="p-3.5 rounded-[18px] bg-white border border-[#E0E9F7] space-y-1"
                    >
                      <strong className="text-xs font-bold text-[#0D1729] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00A868] shrink-0" />
                        <span>{item.title}</span>
                      </strong>
                      <p className="text-[11.5px] text-[#526480] leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Coluna Direita Sticky: Status, Aprovações e Resumo */}
            <aside className="w-full lg:w-[360px] xl:w-[390px] lg:shrink-0 lg:sticky lg:top-24 space-y-4">
              <div className="ora-card rounded-[26px] p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E0E9F7]">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#526480] block">
                      Integridade do Documento
                    </span>
                    <strong className="font-display font-bold text-lg text-[#0D1729]">
                      Versão {versionLabel}
                    </strong>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#F5F9FF] border border-[#CDE0FC] text-[11px] font-mono font-bold text-[#0869F5]">
                    {docCode}
                  </span>
                </div>

                {validationIssues.length === 0 && !hasBlockingGuardrail ? (
                  <div className="p-3 rounded-[16px] bg-[#E8F7F0] border border-[#B9E7D2] text-[#065F46] text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00A868] shrink-0" />
                    <span>Estrutura válida. Entrega e Cancelamento seguem para aprovação.</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-[16px] bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-xs space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {validationIssues.length + guardrailWarnings.filter((w) => w.severity === 'blocking').length}{' '}
                        pendência(s) bloqueante(s)
                      </span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {validationIssues.slice(0, 4).map((issue, idx) => (
                        <li key={idx}>
                          <strong>{issue.label}:</strong> {issue.message}
                        </li>
                      ))}
                      {hasBlockingGuardrail && (
                        <li>Ajuste os termos sinalizados nos campos de Entrega ou Restituição.</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-2 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#526480]">
                    Resumo que irá para a página pública
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#526480]">Prêmio:</span>
                    <span className="font-semibold text-[#0D1729] text-right">
                      {draft.prizeType === 'money_pix'
                        ? `Dinheiro via PIX (${formatCurrencyBrl(draft.moneyPrizeAmountReais)})`
                        : 'Bem Físico'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#526480]">Cartela Física:</span>
                    <span className="font-semibold text-[#0D1729] text-right">
                      {draft.usesPhysicalCard && draft.quantity <= MAX_PHYSICAL_CARD_QUOTAS
                        ? 'Ativa · Cláusula 11ª'
                        : 'Apenas Digital'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#526480]">Divulgação:</span>
                    <span className="font-semibold text-[#0D1729] text-right max-w-[200px]">
                      {formatResultChannels(draft)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#526480]">Entrega:</span>
                    <span className="font-semibold text-[#0D1729] text-right">
                      {deliveryModeLabel} · {draft.deliveryDays} dia(s)
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#526480]">Reserva:</span>
                    <span className="font-semibold text-[#0D1729] text-right">Regra raiz (30 min)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('regulation')}
                  className="ora-btn-primary w-full rounded-full px-5 py-3.5 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Visualizar Papel Timbrado</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ============================================================
            VISTA 2: PAPEL TIMBRADO OFICIAL FASTRIFA
            ============================================================ */}
        {activeTab === 'regulation' && (
          <div className="max-w-[880px] mx-auto space-y-5">
            {/* Barra de ações (oculta na impressão) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 print:hidden">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para Configurar</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyRegulation}
                  className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedReg ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00A868]" />
                      <span className="text-[#00A868]">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Texto Completo</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLegalAuditModal(true)}
                  className="ora-btn-secondary rounded-full px-4 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Auditoria Jurídica</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('public')}
                className="ora-btn-primary rounded-full px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ver Experiência do Participante</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Folha Papel Timbrado FastRifa (fluxo contínuo sem blocos/caixas nas cláusulas) */}
            <article
              id="letterhead-document"
              className="bg-white border border-[#D9E5F7] rounded-[20px] shadow-[0_24px_60px_rgba(13,23,41,0.10)] overflow-hidden print:shadow-none print:border-0 print:rounded-none"
            >
              {/* Tarja Superior Timbrada */}
              <div className="h-2 w-full bg-gradient-to-r from-[#00A868] via-[#0869F5] to-[#00A868]" />

              {/* Cabeçalho do Papel Timbrado */}
              <header className="px-6 sm:px-12 pt-7 pb-5 border-b-2 border-[#E0E9F7] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-b from-[#F8FBFF] to-white">
                <div className="space-y-1">
                  <img
                    src="/logo-fastrifa.png"
                    alt="FastRifa"
                    className="h-8 sm:h-10 w-auto object-contain"
                  />
                  <p className="text-[11px] font-semibold text-[#526480] tracking-wide uppercase">
                    Sistema FastRifa · Documento Eletrônico de Regulamento
                  </p>
                </div>

                <div className="text-left sm:text-right text-[11px] text-[#475872] space-y-0.5 font-mono">
                  <div className="font-bold text-[#0D1729]">REGISTRO Nº {docCode}</div>
                  <div>
                    Versão {versionLabel} · Modelo v{TEMPLATE_VERSION}
                  </div>
                  <div>Hash SHA-256: #{fullHashDisplay.slice(0, 12)}</div>
                </div>
              </header>

              {/* Título Central do Documento */}
              <div className="px-6 sm:px-12 pt-8 pb-4 text-center space-y-1.5">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#0869F5] block">
                  Regulamento Oficial de Campanha
                </span>
                <h2 className="font-display font-bold text-lg sm:text-[22px] text-[#0D1729] tracking-[-0.02em] uppercase">
                  {draft.name.trim() || 'Campanha FastRifa'}
                </h2>
                <p className="text-xs text-[#526480]">
                  Responsável: <strong className="text-[#0D1729]">{draft.brandOrEntity}</strong>
                  {draft.campaignMode === 'authorized' && draft.certificate
                    ? ` · Certificado: ${draft.certificate}`
                    : ' · Modalidade Independente'}
                  {draft.prizeType === 'money_pix' ? ' · Premiação em Dinheiro (PIX)' : ''}
                  {draft.usesPhysicalCard && draft.quantity <= MAX_PHYSICAL_CARD_QUOTAS
                    ? ' · Compatível com Cartela Física A4'
                    : ''}
                </p>
              </div>

              {/* Corpo Contínuo em Prosa Jurídica (sem cards/caixas por cláusula) */}
              <div className="px-6 sm:px-12 py-5 space-y-5 text-[13px] sm:text-[14px] leading-[1.78] text-[#1E293B] select-text">
                {clauses.map((clause) => (
                  <section key={clause.id} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-[13.5px] sm:text-[14.5px] text-[#0D1729] uppercase tracking-[-0.01em]">
                        Cláusula {clause.number}ª — {clause.title}
                      </h3>
                      {clause.locked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0869F5]">
                          <Lock className="w-3 h-3" />
                          <span>Protegida</span>
                        </span>
                      )}
                      {clause.blocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#BE123C]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Bloqueada por Guardrail</span>
                        </span>
                      )}
                      {clause.requiresApproval && !clause.blocked && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                            clause.approved ? 'text-[#00A868]' : 'text-[#B45309]'
                          }`}
                        >
                          <span>{clause.approved ? 'Aprovada' : 'Em aprovação'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-justify sm:text-left">{clause.body}</p>
                  </section>
                ))}
              </div>

              {/* Rodapé Formal do Papel Timbrado */}
              <footer className="px-6 sm:px-12 py-6 mt-4 bg-[#F8FBFF] border-t border-[#E0E9F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#526480]">
                <div className="space-y-0.5">
                  <strong className="text-[#0D1729] block">
                    Documento gerado pelo sistema FastRifa
                  </strong>
                  <span>
                    Prévia em rascunho até validação dos campos sujeitos a aprovação e publicação oficial da campanha.
                  </span>
                </div>
                <div className="font-mono text-[10.5px] text-[#475872] sm:text-right shrink-0">
                  {docCode} · {versionLabel} · #{fullHashDisplay.slice(0, 8)}
                </div>
              </footer>
            </article>
          </div>
        )}

        {/* ============================================================
            VISTA 3: PÁGINA PÚBLICA + ACEITE VERSIONADO (SIMULAÇÃO)
            ============================================================ */}
        {activeTab === 'public' && (
          <div className="max-w-[960px] mx-auto space-y-6">
            <div className="ora-card-soft rounded-[22px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-[#334661]">
                <strong className="text-[#0D1729] block">Controles do Simulador Público</strong>
                <span>Teste a aprovação dos campos de Entrega/Cancelamento e a proteção de versão no checkout.</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryApproved((v) => !v)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                    deliveryApproved
                      ? 'bg-[#E8F7F0] border-[#00A868] text-[#065F46]'
                      : 'bg-[#FFFBEB] border-[#F5D08A] text-[#92400E]'
                  }`}
                >
                  {deliveryApproved ? 'Entrega: Aprovada' : 'Aprovar Entrega'}
                </button>
                <button
                  type="button"
                  onClick={() => setRefundApproved((v) => !v)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                    refundApproved
                      ? 'bg-[#E8F7F0] border-[#00A868] text-[#065F46]'
                      : 'bg-[#FFFBEB] border-[#F5D08A] text-[#92400E]'
                  }`}
                >
                  {refundApproved ? 'Restituição: Aprovada' : 'Aprovar Restituição'}
                </button>
                <button
                  type="button"
                  onClick={handleSimulateRuleChange}
                  className="ora-btn-secondary rounded-full px-3.5 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#0869F5]" />
                  <span>Simular mudança ({versionLabel} → v1.{versionMinor + 1})</span>
                </button>
              </div>
            </div>

            <div className="ora-card rounded-[28px] p-5 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E0E9F7]">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A868] block">
                    Campanha Organizada por {draft.brandOrEntity}
                  </span>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.03em]">
                    {draft.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475872]">{draft.prizes}</p>
                </div>
                <div className="px-4 py-2.5 rounded-[18px] bg-[#F5F9FF] border border-[#CDE0FC] text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                    Valor por Cota
                  </span>
                  <strong className="font-display font-bold text-xl text-[#0869F5] tabular-nums">
                    {formatCurrencyBrl(draft.priceReais)}
                  </strong>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-base text-[#0D1729]">
                    Resumo do Regulamento Oficial ({versionLabel})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPublicRegModal(true)}
                    className="ora-btn-secondary rounded-full px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#0869F5]" />
                    <span>Ver regulamento completo</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                      Apuração
                    </span>
                    <strong className="text-[#0D1729] block leading-snug">
                      {formatDrawDateDisplay(draft.drawDate, draft.timezone)}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                      Divulgação Oficial
                    </span>
                    <strong className="text-[#0D1729] block leading-snug">
                      {formatResultChannels(draft)}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                      Reserva (Regra Raiz)
                    </span>
                    <strong className="text-[#0D1729] block leading-snug">
                      30 minutos · PIX direto ao organizador
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#526480] block">
                      Entrega
                    </span>
                    <strong className="text-[#0D1729] block leading-snug">
                      {deliveryModeLabel} (até {draft.deliveryDays} dia(s))
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-[22px] bg-[#F5F9FF] border border-[#CDE0FC] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-base text-[#0D1729]">
                    Simulação do Aceite no Checkout
                  </h3>
                  <span className="text-[11px] font-mono text-[#526480]">
                    Versão ativa: {versionLabel} · #{fullHashDisplay.slice(0, 8)}
                  </span>
                </div>

                {versionChangedAlert && (
                  <div className="p-3 rounded-[14px] bg-[#FFFBEB] border border-[#F5D08A] text-[#92400E] text-xs font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      O regulamento foi atualizado para a versão <strong>{versionLabel}</strong>. Por segurança, leia e marque novamente antes de confirmar.
                    </span>
                  </div>
                )}

                <label className="flex items-start gap-3 p-3.5 rounded-[16px] bg-white border border-[#D9E5F7] cursor-pointer select-none">
                  <input
                    id="public-reg-accept-checkbox"
                    type="checkbox"
                    checked={buyerAccepted}
                    onChange={(e) => setBuyerAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-[#0869F5] cursor-pointer shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-[#14213A] leading-snug">
                    <strong>Li e concordo com o regulamento desta campanha</strong> ({versionLabel}) e estou ciente das regras de apuração, prazo de reserva e pagamento direto ao organizador.
                  </span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={!buyerAccepted}
                    onClick={handleSimulateConfirmReservation}
                    className="ora-btn-primary rounded-full px-6 py-3 text-xs sm:text-sm font-bold inline-flex items-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Reserva (Simulação)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPublicRegModal(true)}
                    className="text-xs font-bold text-[#0869F5] hover:underline cursor-pointer"
                  >
                    Ler papel timbrado ({versionLabel})
                  </button>
                </div>

                {acceptanceLogs.length > 0 && (
                  <div className="pt-3 border-t border-[#D9E5F7] space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#065F46] block">
                      Registros simulados de aceite versionado (imutáveis)
                    </span>
                    <div className="space-y-1.5">
                      {acceptanceLogs.map((log, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-[12px] bg-[#E8F7F0] border border-[#B9E7D2] text-[11px] text-[#065F46] flex flex-wrap items-center justify-between gap-2"
                        >
                          <span>
                            ✅ Aceito <strong>{log.version}</strong> · Hash{' '}
                            <code className="font-mono">#{log.hash}</code>
                          </span>
                          <span className="text-[#047857] tabular-nums">{log.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prévia de Integração: Cartela Física Impressa (A4 PDF + /pix) */}
            {draft.usesPhysicalCard && draft.quantity <= MAX_PHYSICAL_CARD_QUOTAS && (
              <div
                id="physical-card-integration-preview"
                className="ora-card rounded-[28px] p-5 sm:p-8 space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0869F5] block mb-1">
                      Integração Planejada · Cartela Física A4 + Checador /pix
                    </span>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-[#0D1729]">
                      Como a Cartela Impressa se conecta ao Regulamento Oficial
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[11px] font-bold text-[#065F46]">
                    Cláusula 11ª Ativa ({draft.quantity} cotas)
                  </span>
                </div>

                {/* Mockup fiel do Rodapé Legal da Folha A4 (PDF) */}
                <div className="p-4 sm:p-5 rounded-[18px] border-2 border-dashed border-[#B9D3F8] bg-[#F8FBFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 text-xs text-[#1E293B]">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="font-display font-bold text-[#0D1729] uppercase text-[11px] tracking-wider">
                        Rodapé Legal da Cartela Física A4 (PDF)
                      </strong>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#D9E5F7] text-[#0869F5]">
                        {docCode} · {versionLabel} · #{fullHashDisplay.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475872] leading-relaxed">
                      <strong>Apuração:</strong> {formatDrawDateDisplay(draft.drawDate, draft.timezone)} ·{' '}
                      <strong>Entrega:</strong> {deliveryModeLabel} (até {draft.deliveryDays} dia(s)) ·{' '}
                      <strong>Reserva PIX:</strong> 30 min.
                    </p>
                    <p className="text-[11px] font-semibold text-[#0D1729]">
                      A participação implica ciência integral do Regulamento Oficial vigente. Confirme a disponibilidade pelo QR Code (/pix) antes de pagar.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] bg-white border border-[#D9E5F7] shrink-0 self-start sm:self-center">
                    <div className="w-12 h-12 rounded-xl bg-[#0D1729] text-white flex items-center justify-center">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="text-[10.5px] leading-tight">
                      <strong className="block text-[#0D1729]">QR Code /pix</strong>
                      <span className="text-[#526480]">
                        Checa cota +<br />
                        abre regulamento
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checklist de Integração Real */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <strong className="text-[#0D1729] block">1. Rodapé na Folha A4 PDF</strong>
                    <p className="text-[11px] text-[#526480] leading-relaxed">
                      O gerador <code className="text-[#0869F5]">PhysicalCardModal</code> imprime o resumo + versão/hash e QR Code no rodapé da cartela.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <strong className="text-[#0D1729] block">2. Aceite no Checador /pix</strong>
                    <p className="text-[11px] text-[#526480] leading-relaxed">
                      Na etapa de reserva do <code className="text-[#0869F5]">PhysicalCartelaPixView</code>, exige o mesmo checkbox versionado antes do PIX.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <strong className="text-[#0D1729] block">3. Origem Auditável</strong>
                    <p className="text-[11px] text-[#526480] leading-relaxed">
                      Reservas presenciais registradas no painel carregam canal <code className="text-[#0869F5]">physical_card</code> sem simular aceite digital falso.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Papel Timbrado Completo na Visão Pública */}
      {showPublicRegModal && (
        <div className="fixed inset-0 z-50 bg-[#0D1729]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-[#D9E5F7] rounded-[24px] sm:rounded-[28px] max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#00A868] via-[#0869F5] to-[#00A868]" />
            <div className="px-5 sm:px-7 py-4 border-b border-[#E0E9F7] flex items-start justify-between gap-4 bg-[#F8FBFF]">
              <div className="space-y-1">
                <img src="/logo-fastrifa.png" alt="FastRifa" className="h-7 w-auto object-contain" />
                <h3 className="font-display font-bold text-base sm:text-lg text-[#0D1729]">
                  Regulamento Oficial — {draft.name}
                </h3>
                <p className="text-[11px] text-[#526480] font-mono">
                  {docCode} · {versionLabel} · #{fullHashDisplay.slice(0, 10)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPublicRegModal(false)}
                aria-label="Fechar regulamento"
                className="p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4 text-xs sm:text-[13px] leading-relaxed text-[#1E293B]">
              {clauses.map((clause) => (
                <section key={clause.id} className="space-y-0.5">
                  <strong className="font-display font-bold text-[#0D1729] uppercase block">
                    Cláusula {clause.number}ª — {clause.title}
                  </strong>
                  <p>{clause.body}</p>
                </section>
              ))}
            </div>

            <div className="px-5 sm:px-7 py-4 border-t border-[#E0E9F7] flex items-center justify-between gap-3 bg-[#F8FBFF]">
              <button
                type="button"
                onClick={() => window.print()}
                className="ora-btn-secondary rounded-full px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPublicRegModal(false)}
                className="ora-btn-primary rounded-full px-5 py-2 text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Comparativo Termos Atuais vs Aditivo Proposto */}
      {showTermsCompareModal && (
        <div className="fixed inset-0 z-50 bg-[#0D1729]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="ora-card rounded-[26px] sm:rounded-[30px] max-w-4xl w-full max-h-[90vh] flex flex-col p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E0E9F7]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0869F5] block">
                  Revisão Jurídica · Termos vigentes preservados
                </span>
                <h3 className="font-display font-bold text-lg sm:text-2xl text-[#0D1729]">
                  Comparativo: Termos Atuais vs Aditivo FastRegulamento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsCompareModal(false)}
                aria-label="Fechar comparativo"
                className="p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="px-3 py-1.5 rounded-full bg-[#F5F9FF] border border-[#CDE0FC] text-xs font-bold text-[#0D1729] inline-block">
                  Termos Atuais da Plataforma (Mantidos)
                </div>
                {CURRENT_TERMS_EXCERPTS.map((item) => (
                  <div key={item.heading} className="p-3.5 rounded-[18px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-1">
                    <strong className="block text-xs font-bold text-[#0D1729]">{item.heading}</strong>
                    <p className="text-xs text-[#475872] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="px-3 py-1.5 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-xs font-bold text-[#065F46] inline-block">
                  Proposta de Aditivo & Ajustes (TERMOS.md)
                </div>
                {PROPOSED_ADDENDUM_EXCERPTS.map((item) => (
                  <div key={item.heading} className="p-3.5 rounded-[18px] bg-[#F3FAF6] border border-[#B9E7D2] space-y-1">
                    <strong className="block text-xs font-bold text-[#0D1729]">{item.heading}</strong>
                    <p className="text-xs text-[#334661] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E0E9F7] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowTermsCompareModal(false)}
                className="ora-btn-primary rounded-full px-6 py-2.5 text-xs font-bold cursor-pointer"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Auditoria Jurídica Interna */}
      {showLegalAuditModal && (
        <div className="fixed inset-0 z-50 bg-[#0D1729]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div
            id="legal-audit-modal"
            className="ora-card rounded-[26px] sm:rounded-[30px] max-w-4xl w-full max-h-[90vh] flex flex-col p-5 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E0E9F7]">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] block">
                  Auditoria Jurídica Interna · Análise Preventiva do Sistema
                </span>
                <h3 className="font-display font-bold text-lg sm:text-2xl text-[#0D1729]">
                  Relatório de Blindagem Jurídica do FastRegulamento
                </h3>
                <p className="text-[11.5px] text-[#526480]">
                  Auditoria técnica assistida por IA (Lei 5.768/71, Decreto 70.951/72, CDC, LGPD e Marco Civil). Não substitui revisão final por advogado antes do lançamento comercial em escala.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLegalAuditModal(false)}
                aria-label="Fechar auditoria jurídica"
                className="p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 py-3 border-b border-[#E0E9F7] text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-full bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239]">
                1 Ponto Crítico (Prêmio em Dinheiro)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FFFBEB] border border-[#F5D08A] text-[#92400E]">
                2 Pontos para Integração (Termos + Cartela A4)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#065F46]">
                3 Pilares Blindados no Motor
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {LEGAL_AUDIT_ITEMS.map((item) => {
                const badgeStyle =
                  item.severity === 'critico'
                    ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                    : item.severity === 'atencao'
                      ? 'bg-[#FFFBEB] border-[#F5D08A] text-[#92400E]'
                      : 'bg-[#E8F7F0] border-[#B9E7D2] text-[#065F46]';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-[20px] bg-[#F8FBFF] border border-[#E0E9F7] space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong className="font-display font-bold text-sm text-[#0D1729] block">
                          {item.pillar}
                        </strong>
                        <span className="text-[11px] text-[#526480]">{item.legalBasis}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full border text-[10.5px] font-bold ${badgeStyle}`}>
                        {item.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11.5px] leading-relaxed">
                      <div className="p-2.5 rounded-[14px] bg-white border border-[#E0E9F7]">
                        <strong className="block text-[#0D1729] mb-0.5">Achado Jurídico</strong>
                        <span className="text-[#475872]">{item.finding}</span>
                      </div>
                      <div className="p-2.5 rounded-[14px] bg-white border border-[#E0E9F7]">
                        <strong className="block text-[#065F46] mb-0.5">Blindado no Regulamento</strong>
                        <span className="text-[#334661]">{item.mitigationInEngine}</span>
                      </div>
                      <div className="p-2.5 rounded-[14px] bg-white border border-[#E0E9F7]">
                        <strong className="block text-[#0869F5] mb-0.5">Ação na Integração Real</strong>
                        <span className="text-[#334661]">{item.actionForProduction}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#E0E9F7] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowLegalAuditModal(false)}
                className="ora-btn-primary rounded-full px-6 py-2.5 text-xs font-bold cursor-pointer"
              >
                Fechar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
