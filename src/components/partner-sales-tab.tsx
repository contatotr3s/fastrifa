'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  calculateOrderCommission,
  computePartnerStats,
  formatCommissionRuleLabel,
} from '@/lib/partner-finance';
import { getPartnerPayoutConfirmPath } from '@/lib/raffle-urls';
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Receipt,
  RefreshCw,
  Ticket,
  Wallet,
  XCircle,
} from 'lucide-react';
import type { Order, PartnerPayout, RafflePartner } from '@/types/database.types';

export interface PartnerPendingPayoutsBannerProps {
  payouts: PartnerPayout[];
  onRefresh?: () => Promise<void> | void;
}

export function PartnerPendingPayoutsBanner({
  payouts,
  onRefresh,
}: PartnerPendingPayoutsBannerProps) {
  const pendingPayouts = useMemo(
    () => payouts.filter((p) => p.status === 'pending_confirmation'),
    [payouts]
  );

  if (pendingPayouts.length === 0) return null;

  return (
    <div className="p-3.5 rounded-[20px] bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7]/70 to-[#FFF8EB] border border-[#F5D08A] space-y-2.5 animate-in fade-in duration-150">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#9A6700] block leading-tight">
              {pendingPayouts.length === 1
                ? 'Pagamento de Comissão Pendente de Confirmação'
                : `${pendingPayouts.length} Pagamentos de Comissão Aguardando Sua Confirmação`}
            </span>
            <p className="text-xs text-[#78350F] leading-snug mt-0.5">
              O organizador registrou um repasse para você. Confira e confirme o recebimento no link abaixo:
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={() => onRefresh()}
            title="Atualizar recibos"
            className="p-1.5 rounded-full bg-white/80 hover:bg-white border border-[#F5D08A] text-[#9A6700] cursor-pointer shrink-0 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {pendingPayouts.map((payout) => (
          <div
            key={payout.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/90 border border-[#FDE68A]"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold text-sm text-[#0D1729] tabular-nums">
                  R$ {Number(payout.amount || 0).toFixed(2)}
                </span>
                <span className="text-[10.5px] text-[#526480]">
                  • {formatDateTimePtBr(payout.created_at)}
                </span>
              </div>
              {payout.note && (
                <p className="text-[11px] text-[#475872] truncate mt-0.5">
                  Obs.: {payout.note}
                </p>
              )}
            </div>

            <Link
              href={getPartnerPayoutConfirmPath(payout.id)}
              target="_blank"
              rel="noreferrer"
              className="ora-btn-primary rounded-full px-3.5 py-1.5 text-[11px] font-bold inline-flex items-center gap-1.5 shrink-0"
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Confirmar Recebimento</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface PartnerSalesTabProps {
  partner: RafflePartner;
  orders: Order[];
  payouts: PartnerPayout[];
  loadingPayouts?: boolean;
  onRefresh?: () => Promise<void> | void;
}

function formatDateTimePtBr(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PartnerSalesTab({
  partner,
  orders,
  payouts,
  loadingPayouts = false,
  onRefresh,
}: PartnerSalesTabProps) {
  // Isolamento estrito: parceiro visualiza apenas os próprios pedidos e recibos
  const partnerOrders = useMemo(
    () =>
      orders
        .filter((o) => o.partner_id === partner.id)
        .sort((a, b) => {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tB - tA;
        }),
    [orders, partner.id]
  );

  const partnerPayouts = useMemo(
    () =>
      payouts
        .filter((p) => p.partner_id === partner.id)
        .sort((a, b) => {
          const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tB - tA;
        }),
    [payouts, partner.id]
  );

  const stats = useMemo(
    () => computePartnerStats(partner, partnerOrders, partnerPayouts),
    [partner, partnerOrders, partnerPayouts]
  );

  const isNegotiable = partner.commission_type === 'negotiable';
  const ruleLabel = formatCommissionRuleLabel(
    partner.commission_type,
    partner.commission_value
  );

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* 4 KPI Cards Compactos */}
      <div className="grid grid-cols-2 gap-2.5 tabular-nums">
        <div className="p-3 rounded-[18px] bg-[#ECFDF5] border border-[#A7F3D0] space-y-0.5">
          <div className="flex items-center justify-between gap-1 text-[#047857]">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Cotas Pagas
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          </div>
          <div className="font-display font-bold text-xl text-[#065F46] leading-tight">
            {stats.paidTicketsCount}
          </div>
          <span className="text-[10.5px] text-[#047857] block leading-tight">
            {stats.paidOrdersCount} pedido(s) • R$ {stats.paidRevenue.toFixed(2)}
          </span>
        </div>

        <div className="p-3 rounded-[18px] bg-[#FFFBEB] border border-[#FDE68A] space-y-0.5">
          <div className="flex items-center justify-between gap-1 text-[#B45309]">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Aguardando PIX
            </span>
            <Clock className="w-3.5 h-3.5 shrink-0" />
          </div>
          <div className="font-display font-bold text-xl text-[#92400E] leading-tight">
            {stats.pendingTicketsCount}
          </div>
          <span className="text-[10.5px] text-[#B45309] block leading-tight">
            {stats.pendingOrdersCount} reserva(s) • R$ {stats.pendingRevenue.toFixed(2)}
          </span>
        </div>

        <div className="p-3 rounded-[18px] bg-[var(--ora-surface-alt,#E8F7F0)] border border-[var(--ora-border-strong,#B9E7D2)] space-y-0.5">
          <div className="flex items-center justify-between gap-1 text-[var(--ora-blue,#00A868)]">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Comissão Confirmada
            </span>
            <Wallet className="w-3.5 h-3.5 shrink-0" />
          </div>
          <div className="font-display font-bold text-lg sm:text-xl text-[#0D1729] leading-tight">
            {isNegotiable ? 'A combinar' : `R$ ${stats.confirmedCommission.toFixed(2)}`}
          </div>
          <span className="text-[10.5px] text-[#475872] block leading-tight">
            {isNegotiable
              ? stats.settledAmount > 0
                ? `Acertado: R$ ${stats.settledAmount.toFixed(2)}`
                : 'Combinado com organizador'
              : `Regra: ${ruleLabel}`}
          </span>
        </div>

        <div className="p-3 rounded-[18px] bg-[#F5F9FF] border border-[#D9E5F7] space-y-0.5">
          <div className="flex items-center justify-between gap-1 text-[#475872]">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Comissão Pendente
            </span>
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          </div>
          <div className="font-display font-bold text-lg sm:text-xl text-[#0D1729] leading-tight">
            {isNegotiable ? 'A combinar' : `R$ ${stats.pendingCommission.toFixed(2)}`}
          </div>
          <span className="text-[10.5px] text-[#526480] block leading-tight">
            {isNegotiable
              ? stats.pendingConfirmationAmount > 0
                ? `R$ ${stats.pendingConfirmationAmount.toFixed(2)} p/ confirmar`
                : `${stats.pendingTicketsCount} cota(s) em aberto`
              : stats.balanceToSettle > 0
                ? `Saldo a acertar: R$ ${stats.balanceToSettle.toFixed(2)}`
                : stats.confirmedPayoutAmount > 0
                  ? `Recebido: R$ ${stats.confirmedPayoutAmount.toFixed(2)}`
                  : 'Em aberto no PIX'}
          </span>
        </div>
      </div>

      {/* Pagamentos / Confirmações (partner_payouts) */}
      <div className="p-3.5 rounded-[20px] bg-[#F5F9FF] border border-[#D9E5F7] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Receipt className="w-4 h-4 text-[var(--ora-blue,#00A868)] shrink-0" />
            <h3 className="font-display font-bold text-sm text-[#0D1729] truncate">
              Pagamentos / Confirmações ({partnerPayouts.length})
            </h3>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh()}
              className="ora-btn-secondary rounded-full px-2.5 py-1 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Atualizar</span>
            </button>
          )}
        </div>

        {stats.settledAmount > 0 && (
          <div className="flex flex-wrap gap-1.5 text-[10.5px] font-bold tabular-nums">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]">
              Confirmado por você: R$ {stats.confirmedPayoutAmount.toFixed(2)}
            </span>
            {stats.pendingConfirmationAmount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]">
                Aguardando confirmação: R$ {stats.pendingConfirmationAmount.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {loadingPayouts ? (
          <p className="text-xs text-[#526480] py-2 text-center">
            Carregando recibos de pagamento...
          </p>
        ) : partnerPayouts.length === 0 ? (
          <p className="text-xs text-[#526480] py-1">
            Nenhum repasse de comissão foi registrado pelo organizador até o momento.
          </p>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
            {partnerPayouts.map((payout) => {
              const isConfirmed = payout.status === 'confirmed';
              return (
                <div
                  key={payout.id}
                  className="p-2.5 rounded-xl bg-white border border-[#D9E5F7] flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-sm text-[#0D1729] tabular-nums">
                        R$ {Number(payout.amount || 0).toFixed(2)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isConfirmed
                            ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
                            : 'bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]'
                        }`}
                      >
                        {isConfirmed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Recebimento Confirmado</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Aguardando sua confirmação</span>
                          </>
                        )}
                      </span>
                    </div>
                    <span className="text-[10.5px] text-[#526480] block">
                      Informado em {formatDateTimePtBr(payout.created_at)}
                      {isConfirmed && payout.confirmed_at
                        ? ` • Confirmado em ${formatDateTimePtBr(payout.confirmed_at)}`
                        : ''}
                    </span>
                    {payout.note && (
                      <span className="text-[11px] text-[#475872] block">
                        Obs.: {payout.note}
                      </span>
                    )}
                  </div>

                  {!isConfirmed && (
                    <Link
                      href={getPartnerPayoutConfirmPath(payout.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="ora-btn-primary rounded-full px-3 py-1.5 text-[11px] font-bold inline-flex items-center gap-1 shrink-0"
                    >
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span>Confirmar</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lista Cronológica de Pedidos do Parceiro */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-[var(--ora-blue,#00A868)]" />
            <h3 className="font-display font-bold text-sm text-[#0D1729]">
              Minhas Vendas ({partnerOrders.length})
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-[#526480]">
            Baixa PIX feita pelo organizador
          </span>
        </div>

        {partnerOrders.length === 0 ? (
          <div className="p-4 rounded-[18px] bg-[#F5F9FF] border border-[#D9E5F7] text-center text-xs text-[#526480]">
            Nenhuma venda registrada no seu link ainda. Use a aba{' '}
            <strong>Vender Cotas</strong> para atender seu primeiro cliente!
          </div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
            {partnerOrders.map((order) => {
              const ticketList = Array.isArray(order.ticket_numbers)
                ? order.ticket_numbers
                : [];
              const orderRuleType = order.commission_type ?? partner.commission_type;
              const orderRuleVal = order.commission_value ?? partner.commission_value;
              const orderCommission =
                order.status === 'cancelled'
                  ? 0
                  : typeof order.commission_amount === 'number' &&
                      Number.isFinite(order.commission_amount)
                    ? order.commission_amount
                    : calculateOrderCommission({
                        totalAmount: order.total_amount,
                        ticketCount: ticketList.length,
                        commissionType: orderRuleType,
                        commissionValue: orderRuleVal,
                      });

              return (
                <div
                  key={order.id}
                  className="p-3 rounded-[16px] bg-white border border-[#D9E5F7] space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-display font-bold text-xs sm:text-sm text-[#0D1729] truncate">
                        {order.buyer_name}
                      </div>
                      <div className="text-[11px] text-[#526480] tabular-nums">
                        {order.buyer_phone} • {formatDateTimePtBr(order.created_at)}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0 ${
                        order.status === 'paid'
                          ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
                          : order.status === 'cancelled'
                            ? 'bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C]'
                            : 'bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]'
                      }`}
                    >
                      {order.status === 'paid' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PIX Pago</span>
                        </>
                      ) : order.status === 'cancelled' ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Cancelado</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Aguardando PIX</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 tabular-nums">
                    {ticketList.slice(0, 14).map((num) => (
                      <span
                        key={num}
                        className="px-2 py-0.5 rounded-md bg-[#F5F9FF] border border-[#D9E5F7] text-[#14213A] text-[10.5px] font-display font-bold"
                      >
                        #{num.toString().padStart(3, '0')}
                      </span>
                    ))}
                    {ticketList.length > 14 && (
                      <span className="px-2 py-0.5 rounded-md bg-[#F5F9FF] border border-[#D9E5F7] text-[#526480] text-[10.5px] font-bold">
                        +{ticketList.length - 14}
                      </span>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-[#E0E9F7] flex flex-wrap items-center justify-between gap-2 text-[11px] tabular-nums">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-[#0D1729]">
                        Total: R$ {Number(order.total_amount || 0).toFixed(2)}
                      </span>
                      {order.discount_percent && order.discount_percent > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#E8F7F0] text-[#065F46] text-[9.5px] font-bold">
                          -{order.discount_percent}% OFF
                        </span>
                      ) : null}
                    </div>

                    <span className="font-bold text-[var(--ora-blue,#00A868)]">
                      {order.status === 'cancelled'
                        ? 'Comissão: R$ 0.00'
                        : orderRuleType === 'negotiable'
                          ? 'Comissão: A combinar'
                          : `Comissão: R$ ${orderCommission.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
