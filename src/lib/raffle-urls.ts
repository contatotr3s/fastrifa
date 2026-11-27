import type { Raffle } from '@/types/database.types';

export const RESERVED_ROOT_SLUGS = new Set([
  'admin',
  'api',
  'login',
  'cadastro',
  'r',
  'parceiro',
  'criador',
  'auth',
  'dashboard',
  'master',
  'static',
  'assets',
  '_next',
  'favicon',
  'icon',
  'robots',
  'sitemap',
]);

// Alfabeto de 32 caracteres sem 0/O/1/I/L para evitar confusão visual
export const SAFE_CODE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Sanitiza a palavra-chave do prêmio para conter SOMENTE letras [a-z],
 * sem acentos, espaços ou números, limitada a 12 caracteres.
 */
export function sanitizePrizeKeyword(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '')
    .slice(0, 12);
}

/**
 * Sugere automaticamente uma palavra-chave alfabética (até 12 letras) a partir do título do prêmio.
 */
export function suggestPrizeKeyword(title: string): string {
  const words = (title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z]+/)
    .filter(Boolean);

  const primary = words.find((w) => w.length >= 3) || words[0] || '';
  return primary.slice(0, 12);
}

/**
 * Gera o prefixo de URL da marca do criador (sem colidir com rotas reservadas do sistema).
 */
export function sanitizeBrandSlug(brandName?: string | null): string {
  const cleaned = (brandName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 24);

  if (!cleaned || RESERVED_ROOT_SLUGS.has(cleaned)) {
    return 'marca';
  }
  return cleaned;
}

/**
 * Gera código curto único de 4 caracteres alfanuméricos sem ambiguidade.
 */
export function generateShortCode(length = 4): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * SAFE_CODE_ALPHABET.length);
    code += SAFE_CODE_ALPHABET[idx];
  }
  return code;
}

/**
 * Retorna o caminho público amigável da rifa:
 * - Novo padrão: /{brand_slug}/{prize_keyword}/{short_code}
 * - Legado: /r/{slug}
 */
export function getRafflePublicPath(
  raffle: Pick<Raffle, 'slug' | 'brand_slug' | 'brand_name' | 'prize_keyword' | 'short_code'>
): string {
  if (raffle.prize_keyword && raffle.short_code) {
    const brandSlug = sanitizeBrandSlug(raffle.brand_slug || raffle.brand_name);
    const keyword = sanitizePrizeKeyword(raffle.prize_keyword) || 'premio';
    const code = raffle.short_code.toLowerCase();
    return `/${brandSlug}/${keyword}/${code}`;
  }
  return `/r/${raffle.slug}`;
}

/**
 * Retorna o caminho do Checador Físico / PIX da rifa.
 */
export function getRafflePixPath(
  raffle: Pick<Raffle, 'slug' | 'brand_slug' | 'brand_name' | 'prize_keyword' | 'short_code'>
): string {
  return `${getRafflePublicPath(raffle)}/pix`;
}

/**
 * Retorna o caminho do Painel de Gerenciamento da rifa:
 * - Novo padrão amigável: /admin/rifas/{prize_keyword}-{short_code}
 * - Legado: /admin/rifas/{id}
 */
export function getRaffleAdminPath(
  raffle: Pick<Raffle, 'id' | 'slug' | 'prize_keyword' | 'short_code'>
): string {
  if (raffle.prize_keyword && raffle.short_code && raffle.slug) {
    return `/admin/rifas/${raffle.slug}`;
  }
  return `/admin/rifas/${raffle.id}`;
}

/**
 * Retorna a origem pública usada em links compartilháveis e QR Codes
 * (nunca codifica localhost/127.0.0.1).
 */
export function getShareOrigin(): string {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return window.location.origin;
  }
  return 'https://fastrifa.vercel.app';
}

/**
 * Retorna a origem atual do navegador (mantém localhost em desenvolvimento
 * para permitir testar convites/checkouts localmente, e usa o domínio real em produção).
 */
export function getRuntimeOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://fastrifa.vercel.app';
}

/**
 * Retorna o caminho de gestão de parceiros da rifa no painel admin.
 */
export function getRafflePartnersAdminPath(
  raffle: Pick<Raffle, 'id' | 'slug' | 'prize_keyword' | 'short_code'>
): string {
  return `${getRaffleAdminPath(raffle)}/parceiros`;
}

/**
 * Retorna o caminho público do convite único de 24h do parceiro.
 */
export function getPartnerInvitePath(token: string): string {
  return `/parceiro/convite/${token}`;
}

/**
 * Retorna o caminho exclusivo de checkout do parceiro.
 */
export function getPartnerCheckoutPath(token: string): string {
  return `/parceiro/${token}`;
}

/**
 * Retorna o caminho para o parceiro confirmar o recebimento de comissão.
 */
export function getPartnerPayoutConfirmPath(payoutToken: string): string {
  return `/parceiro/confirmar-pagamento/${payoutToken}`;
}

/**
 * Retorna o caminho de checkout direto do organizador autenticado.
 */
export function getOrganizerDirectCheckoutPath(
  raffle: Pick<Raffle, 'slug' | 'brand_slug' | 'brand_name' | 'prize_keyword' | 'short_code'>
): string {
  return `${getRafflePixPath(raffle)}?canal=organizador`;
}

/**
 * Retorna a URL pública completa da rifa (nunca codifica localhost para QR Codes/WhatsApp).
 */
export function getRafflePublicUrl(
  raffle: Pick<Raffle, 'slug' | 'brand_slug' | 'brand_name' | 'prize_keyword' | 'short_code'>,
  originOverride?: string
): string {
  const origin = originOverride || getShareOrigin();
  return `${origin}${getRafflePublicPath(raffle)}`;
}
