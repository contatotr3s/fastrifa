'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Filter,
  Loader2,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { computeOrganizerFinancialSummary } from '@/lib/partner-finance';
import { getRaffleAdminPath, getRafflePartnersAdminPath } from '@/lib/raffle-urls';
import type {
  Order,
  PartnerPayout,
  Raffle,
  RafflePartner,
} from '@/types/database.types';

interface AdminFinancialDashboardProps {
  raffles: Raffle[];
  orders: Order[];
  partners: RafflePartner[];
  payouts: PartnerPayout[];
  loading?: boolean;
}

function formatCurrencyBrl(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `R$ ${safe.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminFinancialDashboard({
  raffles,
  orders,
  partners,
  payouts,
  loading = false,
}: AdminFinancialDashboardProps) {
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>('all');

  const effectiveFilterId = useMemo(() => {
    if (selectedRaffleId === 'all') return 'all';
    return raffles.some((r) => r.id === selectedRaffleId) ? selectedRaffleId : 'all';
  }, [raffles, selectedRaffleId]);

  const summary = useMemo(
    () =>
      computeOrganizerFinancialSummary(
        raffles,
        orders,
        partners,
        payouts,
        effectiveFilterId
      ),
    [raffles, orders, partners, payouts, effectiveFilterId]
  );

  const perRaffleSummaries = useMemo(() => {
    const targetRaffles =
      effectiveFilterId === 'all'
        ? raffles
        : raffles.filter((r) => r.id === effectiveFilterId);

    return targetRaffles.map((raffle) => ({
      raffle,
      summary: computeOrganizerFinancialSummary(
        [raffle],
        orders,
        partners,
        payouts,
        raffle.id
      ),
    }));
  }, [raffles, orders, partners, payouts, effectiveFilterId]);

  const totalChannelRevenue = summary.directRevenue + summary.partnerRevenue;
  const directSharePercent =
    totalChannelRevenue > 0
      ? Math.round((summary.directRevenue / totalChannelRevenue) * 100)
      : 0;
  const partnerSharePercent =
    totalChannelRevenue > 0 ? Math.max(0, 100 - directSharePercent) : 0;

  const isInitialLoading = loading && orders.length === 0;

  return (
    <section
      aria-label="Dashboard Financeiro e Rede de Vendas"
      className="ora-card rounded-[26px] sm:rounded-[30px] p-5 sm:p-7 space-y-5"
    >
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ora-glass-pill rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#0869F5] inline-flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Financeiro & Rede de Vendas</span>
            </span>
            {summary.activePartnersCount > 0 && (
              <span className="ora-glass-pill rounded-full px-3 py-1 text-[11px] font-bold text-[#00A868] inline-flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {summary.activePartnersCount}{' '}
                  {summary.activePartnersCount === 1
                    ? 'parceiro ativo'
                    : 'parceiros ativos'}
                </span>
              </span>
            )}
          </div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em]">
            Dashboard Financeiro & Rede de Vendas
          </h2>
          <p className="text-xs sm:text-sm text-[#475872] leading-relaxed">
            Receita confirmada no PIX em tempo real, divisão entre vendas diretas e parceiros, comissões e lucro líquido estimado.
          </p>
        </div>

        {/* Campaign Filter */}
        <div className="flex items-center gap-2.5 self-start lg:self-center w-full sm:w-auto">
          <label
            htmlFor="admin-finance-raffle-filter"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#526480] shrink-0"
          >
            <Filter className="w-3.5 h-3.5 text-[#0869F5]" />
            <span className="hidden sm:inline">Campanha:</span>
          </label>
          <select
            id="admin-finance-raffle-filter"
            value={effectiveFilterId}
            onChange={(e) => setSelectedRaffleId(e.target.value)}
            disabled={raffles.length === 0}
            className="w-full sm:w-auto sm:min-w-[230px] max-w-full px-4 py-2.5 rounded-full bg-[#F5F9FF] border border-[#D9E5F7] text-xs sm:text-sm font-bold text-[#0D1729] focus:outline-none focus:border-[#0869F5] transition cursor-pointer disabled:opacity-60"
          >
            <option value="all">Todas as campanhas ({raffles.length})</option>
            {raffles.map((raffle) => (
              <option key={raffle.id} value={raffle.id}>
                {raffle.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#526480]">
            <Loader2 className="w-4 h-4 text-[#0869F5] animate-spin" />
            <span>Consolidando pedidos, parceiros e acertos...</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="rounded-[22px] bg-[#F5F9FF] border border-[#E0E9F7] p-4 sm:p-5 h-[132px] animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 4 Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 tabular-nums">
            {/* KPI 1: Faturamento Confirmado (PIX Pago) */}
            <div className="rounded-[22px] bg-white border border-[#E0E9F7] p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475872]">
                  Faturamento Confirmado (PIX Pago)
                </span>
                <span className="w-8 h-8 rounded-full bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>

              <div>
                <div className="font-display font-bold text-2xl sm:text-[26px] text-[#0D1729] leading-tight">
                  {formatCurrencyBrl(summary.confirmedRevenue)}
                </div>
                <p className="text-xs font-semibold text-[#00A868] mt-1">
                  {summary.confirmedTickets.toLocaleString('pt-BR')} cotas pagas
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#EFF4FB] text-[11px] text-[#526480] font-medium">
                Aguardando PIX:{' '}
                <strong className="text-[#9A6700] font-bold">
                  {formatCurrencyBrl(summary.pendingRevenue)}
                </strong>{' '}
                ({summary.pendingTickets.toLocaleString('pt-BR')} cotas)
              </div>
            </div>

            {/* KPI 2: Vendas Diretas vs. Parceiros */}
            <div className="rounded-[22px] bg-white border border-[#E0E9F7] p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475872]">
                  Vendas Diretas vs. Parceiros
                </span>
                <span className="w-8 h-8 rounded-full bg-[#F2F7FF] border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </span>
              </div>

              <div className="space-y-2">
                {/* Visual Comparison Bar */}
                <div
                  className="h-2.5 w-full rounded-full bg-[#EFF4FB] overflow-hidden flex"
                  aria-label={`Diretas ${directSharePercent}% vs Parceiros ${partnerSharePercent}%`}
                >
                  {totalChannelRevenue > 0 ? (
                    <>
                      <div
                        className="h-full bg-[#0869F5] transition-all duration-300"
                        style={{ width: `${directSharePercent}%` }}
                      />
                      <div
                        className="h-full bg-[#00A868] transition-all duration-300"
                        style={{ width: `${partnerSharePercent}%` }}
                      />
                    </>
                  ) : null}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[#475872] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#0869F5] shrink-0" />
                      <span>Diretas / Pública</span>
                    </span>
                    <strong className="text-[#0D1729] font-bold">
                      {formatCurrencyBrl(summary.directRevenue)}{' '}
                      <span className="text-[#526480] font-medium">
                        ({summary.directTickets})
                      </span>
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[#475872] font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#00A868] shrink-0" />
                      <span>Parceiros</span>
                    </span>
                    <strong className="text-[#0D1729] font-bold">
                      {formatCurrencyBrl(summary.partnerRevenue)}{' '}
                      <span className="text-[#526480] font-medium">
                        ({summary.partnerTickets})
                      </span>
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#EFF4FB] text-[11px] text-[#526480] font-medium flex items-center justify-between gap-2">
                <span>Participação</span>
                <span className="font-bold text-[#0D1729]">
                  {totalChannelRevenue > 0
                    ? `${directSharePercent}% diretas • ${partnerSharePercent}% parceiros`
                    : 'Sem vendas pagas ainda'}
                </span>
              </div>
            </div>

            {/* KPI 3: Comissões & Acertos */}
            <div className="rounded-[22px] bg-white border border-[#E0E9F7] p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475872]">
                  Comissões & Acertos
                </span>
                <span className="w-8 h-8 rounded-full bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700] flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </span>
              </div>

              <div>
                <div className="font-display font-bold text-2xl sm:text-[26px] text-[#0D1729] leading-tight">
                  {formatCurrencyBrl(summary.totalDeductedCommissions)}
                </div>
                <p className="text-[11px] text-[#526480] font-medium mt-1">
                  {formatCurrencyBrl(summary.confirmedCommissions)} regras fixas/% +{' '}
                  {formatCurrencyBrl(summary.negotiableSettledPayouts)} acertado &ldquo;A combinar&rdquo;
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#EFF4FB] space-y-0.5 text-[11px] text-[#526480] font-medium">
                <div>
                  Pendentes:{' '}
                  <strong className="text-[#9A6700] font-bold">
                    {formatCurrencyBrl(summary.pendingCommissions)}
                  </strong>
                </div>
                <div>
                  Confirmado p/ parceiros:{' '}
                  <strong className="text-[#00A868] font-bold">
                    {formatCurrencyBrl(summary.confirmedPayouts)}
                  </strong>
                </div>
              </div>
            </div>

            {/* KPI 4: Lucro Líquido Estimado */}
            <div className="rounded-[22px] bg-gradient-to-br from-[#F5F9FF] to-[#FFFFFF] border border-[#CDE0FC] p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0755DE]">
                  Lucro Líquido Estimado
                </span>
                <span className="w-8 h-8 rounded-full bg-[#0869F5]/10 border border-[#B9D3F8] text-[#0869F5] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>

              <div>
                <div className="font-display font-bold text-2xl sm:text-[26px] text-[#0869F5] leading-tight">
                  {formatCurrencyBrl(summary.estimatedNetProfit)}
                </div>
                <p className="text-[11px] text-[#526480] font-medium mt-1">
                  Receita PIX paga menos comissões e acertos
                </p>
              </div>

              {summary.hasUnsettledNegotiableSales ? (
                <div className="pt-2 border-t border-[#F5D08A] text-[11px] text-[#9A6700] font-semibold flex items-start gap-1.5 leading-snug">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D97706]" />
                  <span>
                    Há vendas de parceiros &apos;A combinar&apos; ainda sem acerto lançado
                  </span>
                </div>
              ) : (
                <div className="pt-2.5 border-t border-[#E0E9F7] text-[11px] text-[#526480] font-medium flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#00A868] shrink-0" />
                  <span>Baseado em {summary.paidOrdersCount} pedido(s) confirmado(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Per-Campaign Compact Summary */}
          {perRaffleSummaries.length > 0 && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-sm sm:text-base text-[#0D1729] tracking-[-0.02em]">
                  Resumo por Campanha
                </h3>
                <span className="text-[11px] font-semibold text-[#526480]">
                  {perRaffleSummaries.length}{' '}
                  {perRaffleSummaries.length === 1 ? 'campanha' : 'campanhas'}
                </span>
              </div>

              {/* Desktop / Tablet Table */}
              <div className="hidden md:block overflow-x-auto rounded-[20px] border border-[#E0E9F7] bg-[#F8FBFF]">
                <table className="w-full text-left border-collapse tabular-nums">
                  <thead>
                    <tr className="border-b border-[#E0E9F7] text-[11px] font-bold uppercase tracking-wider text-[#526480]">
                      <th className="py-3 px-4">Campanha</th>
                      <th className="py-3 px-4">Cotas Pagas</th>
                      <th className="py-3 px-4">Faturamento PIX</th>
                      <th className="py-3 px-4">Comissões / Acertos</th>
                      <th className="py-3 px-4">Lucro Líquido</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E9F7] bg-white text-xs sm:text-[13px]">
                    {perRaffleSummaries.map(({ raffle, summary: rSummary }) => (
                      <tr key={raffle.id} className="hover:bg-[#F5F9FF]/70 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#0D1729] truncate max-w-[240px]">
                            {raffle.title}
                          </div>
                          {rSummary.hasUnsettledNegotiableSales && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9A6700] mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                              <span>Parceiro &apos;A combinar&apos; sem acerto</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#475872]">
                          <strong className="text-[#0D1729]">
                            {rSummary.confirmedTickets}
                          </strong>{' '}
                          / {raffle.total_tickets}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#0D1729]">
                          {formatCurrencyBrl(rSummary.confirmedRevenue)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#475872]">
                          {formatCurrencyBrl(rSummary.totalDeductedCommissions)}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#0869F5]">
                          {formatCurrencyBrl(rSummary.estimatedNetProfit)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={getRaffleAdminPath(raffle)}
                              className="ora-btn-secondary rounded-full px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <Settings className="w-3 h-3" />
                              <span>Gerenciar</span>
                            </Link>
                            <Link
                              href={getRafflePartnersAdminPath(raffle)}
                              className="ora-btn-secondary rounded-full px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1 text-[#0869F5]"
                            >
                              <Users className="w-3 h-3 text-[#0869F5]" />
                              <span>Parceiros</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Compact Cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden tabular-nums">
                {perRaffleSummaries.map(({ raffle, summary: rSummary }) => (
                  <div
                    key={raffle.id}
                    className="rounded-[20px] border border-[#E0E9F7] bg-[#F8FBFF] p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-sm text-[#0D1729] truncate">
                          {raffle.title}
                        </h4>
                        <p className="text-[11px] text-[#526480] font-medium mt-0.5">
                          <strong className="text-[#0D1729]">
                            {rSummary.confirmedTickets}
                          </strong>{' '}
                          / {raffle.total_tickets} cotas pagas
                        </p>
                      </div>
                      <span className="font-display font-bold text-sm text-[#0869F5] shrink-0">
                        {formatCurrencyBrl(rSummary.estimatedNetProfit)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white rounded-[14px] border border-[#E0E9F7] p-2.5">
                      <div>
                        <span className="text-[#526480] block">Faturamento PIX</span>
                        <strong className="text-[#0D1729] font-bold">
                          {formatCurrencyBrl(rSummary.confirmedRevenue)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#526480] block">Comissões / Acertos</span>
                        <strong className="text-[#0D1729] font-bold">
                          {formatCurrencyBrl(rSummary.totalDeductedCommissions)}
                        </strong>
                      </div>
                    </div>

                    {rSummary.hasUnsettledNegotiableSales && (
                      <div className="text-[11px] text-[#9A6700] font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                        <span>Há vendas &apos;A combinar&apos; sem acerto lançado</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Link
                        href={getRaffleAdminPath(raffle)}
                        className="ora-btn-secondary flex-1 rounded-full px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Gerenciar</span>
                      </Link>
                      <Link
                        href={getRafflePartnersAdminPath(raffle)}
                        className="ora-btn-secondary flex-1 rounded-full px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 text-[#0869F5]"
                      >
                        <Users className="w-3.5 h-3.5 text-[#0869F5]" />
                        <span>Parceiros</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
