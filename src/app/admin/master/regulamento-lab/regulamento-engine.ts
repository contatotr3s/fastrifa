export type CampaignMode = 'independent' | 'authorized';
export type PrizeType = 'physical' | 'money_pix';
export type ConditionType = 'fixed' | 'all' | 'goal';
export type MethodType = 'loteria_federal' | 'live_draw' | 'custom';
export type ProofType = 'whatsapp' | 'platform' | 'integration';
export type WinnerIdentificationType = 'number' | 'partial' | 'authorized';
export type DeliveryModeType = 'pix_dinheiro' | 'envio' | 'retirada' | 'combinar';
export type DeliveryCostsType = 'organizador' | 'ganhador' | 'combinar';
export type TimezoneType = 'America/Bahia' | 'America/Sao_Paulo';
export type SocialChannelId = 'instagram' | 'whatsapp_status' | 'facebook' | 'x_twitter' | 'website';

export const MAX_PHYSICAL_CARD_QUOTAS = 200;

export const SOCIAL_CHANNEL_OPTIONS: Array<{
  id: SocialChannelId;
  label: string;
  hasHandle: boolean;
  placeholder: string;
}> = [
  { id: 'instagram', label: 'Instagram', hasHandle: true, placeholder: '@seuperfil' },
  { id: 'whatsapp_status', label: 'Status WhatsApp', hasHandle: false, placeholder: '' },
  { id: 'facebook', label: 'Facebook', hasHandle: true, placeholder: 'fb.com/suapagina' },
  { id: 'x_twitter', label: 'X (antigo Twitter)', hasHandle: true, placeholder: '@seuperfil' },
  { id: 'website', label: 'Site próprio', hasHandle: true, placeholder: 'https://seusite.com.br' },
];

export const SYSTEM_RESERVATION_LABEL = '30 minutos (regra raiz de reserva rápida do sistema)';

export const DEFAULT_DELIVERY_TEXTS: Record<DeliveryModeType, string> = {
  pix_dinheiro:
    'Transferência bancária via PIX no valor líquido anunciado, exclusivamente para chave PIX de mesma titularidade (CPF) do participante contemplado, mediante conferência de identidade e do comprovante da cota paga pelo WhatsApp oficial.',
  envio:
    'Envio segurado via transportadora/Correios com código de rastreio para todo o Brasil ou entrega presencial mediante agendamento prévio.',
  retirada:
    'Retirada presencial realizada diretamente pelo contemplado mediante agendamento prévio de dia e horário com o Organizador e apresentação de documento oficial.',
  combinar:
    'Modalidade definida em comum acordo entre Organizador e contemplado (envio com rastreio ou entrega presencial), registrada no WhatsApp oficial.',
};

export interface RegulationDraft {
  campaignMode: CampaignMode;
  prizeType: PrizeType;
  moneyPrizeAmountReais: number;
  usesPhysicalCard: boolean;
  name: string;
  brandOrEntity: string;
  documentId: string;
  purpose: string;
  beneficiary: string;
  certificate: string;
  prizes: string;
  quantity: number;
  priceReais: number;
  contactWhatsapp: string;
  pixHolder: string;
  // Dados herdados do cadastro da rifa
  drawDate: string;
  timezone: TimezoneType;
  condition: ConditionType;
  goalPercent: number;
  deadline: string;
  unmetProcedure: string;
  method: MethodType;
  methodCustom: string;
  criteria: string;
  // Configuráveis pelo organizador nesta etapa
  socialChannels: SocialChannelId[];
  socialHandles: Partial<Record<SocialChannelId, string>>;
  winnerIdentification: WinnerIdentificationType;
  deliveryMode: DeliveryModeType;
  deliveryDetails: string;
  deliveryDays: number;
  deliveryCosts: DeliveryCostsType;
  refundProcedure: string;
}

export interface ValidationIssue {
  field: keyof RegulationDraft | 'general';
  label: string;
  message: string;
}

export interface GuardrailWarning {
  id: string;
  targetField: 'deliveryDetails' | 'refundProcedure';
  severity: 'blocking' | 'warning';
  title: string;
  detail: string;
}

export interface RegulationClause {
  id: string;
  number: number;
  title: string;
  body: string;
  locked: boolean;
  requiresApproval?: boolean;
  approved?: boolean;
  blocked?: boolean;
  summaryTag: string;
}

export const TEMPLATE_VERSION = '1.0.0';

export const DEFAULT_REGULATION_DRAFT: RegulationDraft = {
  campaignMode: 'independent',
  prizeType: 'physical',
  moneyPrizeAmountReais: 5000,
  usesPhysicalCard: true,
  name: 'iPhone 16 Pro Max 256GB — Edição Especial',
  brandOrEntity: 'Rifinha Oficial',
  documentId: '12.345.678/0001-90',
  purpose: 'Ação promocional independente organizada pela marca para seus participantes',
  beneficiary: 'Entidade Beneficente Exemplo',
  certificate: 'SPA/MF nº 00.0000/2026',
  prizes: '1º Prêmio: iPhone 16 Pro Max 256GB Lacrado com nota fiscal em nome do ganhador',
  quantity: 200,
  priceReais: 15,
  contactWhatsapp: '(71) 99999-0000',
  pixHolder: 'Rifinha Oficial LTDA',
  drawDate: '2026-12-15T19:00',
  timezone: 'America/Bahia',
  condition: 'fixed',
  goalPercent: 80,
  deadline: '2026-12-22T20:00',
  unmetProcedure:
    'Caso a meta não seja atingida até a data-limite, os participantes poderão optar pela restituição integral via PIX em até 5 dias úteis pelo WhatsApp oficial.',
  method: 'loteria_federal',
  methodCustom: '',
  criteria:
    'Será contemplada a cota correspondente aos 3 últimos dígitos do 1º prêmio da Loteria Federal. Caso o número não tenha sido atribuído/pago, aplica-se a mesma regra ao 2º prêmio sucessivamente até o 5º prêmio.',
  socialChannels: ['instagram', 'whatsapp_status'],
  socialHandles: {
    instagram: '@rifinhaoficial',
  },
  winnerIdentification: 'partial',
  deliveryMode: 'envio',
  deliveryDetails: DEFAULT_DELIVERY_TEXTS.envio,
  deliveryDays: 7,
  deliveryCosts: 'organizador',
  refundProcedure:
    'Em caso de cancelamento ou impossibilidade comprovada de realização, os valores pagos serão restituídos integralmente pelo Organizador diretamente na conta PIX do participante em até 5 dias úteis após solicitação no WhatsApp oficial.',
};

export interface LegalAuditItem {
  id: string;
  pillar: string;
  legalBasis: string;
  severity: 'critico' | 'atencao' | 'protegido';
  statusLabel: string;
  finding: string;
  mitigationInEngine: string;
  actionForProduction: string;
}

export const MONEY_PRIZE_LEGAL_NOTICE = {
  title: 'Aviso Jurídico Preventivo — Premiação em Dinheiro (Lei nº 5.768/1971 e Decreto nº 70.951/1972)',
  summary:
    'No ordenamento jurídico brasileiro, promoções comerciais e ações filantrópicas regulares submetem-se à Lei nº 5.768/1971 e ao Decreto nº 70.951/1972 (art. 1º, § 3º), que restringem a conversão ou entrega de prêmios em dinheiro fora das modalidades de loteria oficial ou títulos de capitalização autorizados. A verificação do enquadramento jurídico e eventuais autorizações é de responsabilidade exclusiva do Organizador. Este regulamento aplica automaticamente trava antifraude de transferência via PIX apenas para chave do mesmo CPF do ganhador.',
};

export const LEGAL_AUDIT_ITEMS: LegalAuditItem[] = [
  {
    id: 'money-prize-law',
    pillar: 'Premiação em Dinheiro via PIX',
    legalBasis: 'Lei nº 5.768/1971 · Decreto nº 70.951/1972 (art. 1º, § 3º)',
    severity: 'critico',
    statusLabel: 'Risco Regulatório Alto',
    finding:
      'A entrega de prêmios diretamente em pecúnia (dinheiro) sofre vedação legal em promoções comerciais/filantrópicas comuns sem autorização estatal específica.',
    mitigationInEngine:
      'Exibição de alerta preventivo ao Organizador, declaração exclusiva de responsabilidade legal e tributária na Cláusula 2ª e 9ª, e trava antifraude exigindo PIX para chave do mesmo CPF do ganhador com comprovante bancário como quitação na Cláusula 7ª.',
    actionForProduction:
      'Exigir aceite específico de ciência regulatória ao selecionar "Prêmio em Dinheiro (PIX)" no cadastro da campanha.',
  },
  {
    id: 'cdc-limitation',
    pillar: 'Delimitação vs "Isenção Total"',
    legalBasis: 'CDC (Lei nº 8.078/1990, arts. 25 e 51, I)',
    severity: 'atencao',
    statusLabel: 'Ajuste nos Termos Atuais',
    finding:
      'Cláusulas absolutas de "Isenção Total" são juridicamente vulneráveis e podem ser declaradas nulas caso tentem afastar responsabilidade por falha própria do software.',
    mitigationInEngine:
      'A Cláusula 9ª adota "Delimitação e Isenção de Responsabilidade", isolando a FastRifa de arrecadação, prêmio e entrega sem afastar responsabilidade legal por eventuais falhas técnicas do sistema.',
    actionForProduction:
      'Atualizar a Cláusula 4 ("Isenção Total") e a Cláusula 1 ("art. 299 CP") em terms-modals.tsx na etapa de integração real.',
  },
  {
    id: 'late-payment-cdc',
    pillar: 'Pagamento Tardio Pós-Expiração (30 min)',
    legalBasis: 'CDC (arts. 6º, III, e 35) · Boa-fé objetiva',
    severity: 'protegido',
    statusLabel: 'Blindado no Motor',
    finding:
      'Como a reserva expira automaticamente em 30 minutos pela regra raiz, pode ocorrer de um comprador pagar o PIX após o número já ter voltado à grade e sido reservado por outro.',
    mitigationInEngine:
      'A Cláusula 4ª determina explicitamente que, nesses casos, o Organizador deve oferecer cota equivalente disponível mediante escolha expressa do comprador ou restituir 100% via PIX.',
    actionForProduction:
      'Preservar o registro do pedido expirado no Firestore para conciliação rápida e comprovante de estorno no painel.',
  },
  {
    id: 'immutability-lgpd',
    pillar: 'Imutabilidade Pós-1ª Venda e Prova Digital',
    legalBasis: 'Marco Civil (Lei nº 12.965/2014, art. 19) · LGPD (art. 7º, II e VI)',
    severity: 'protegido',
    statusLabel: 'Blindado no Motor',
    finding:
      'Alterar prêmio, valor ou método de sorteio após vendas confirmadas viola a confiança legítima do consumidor; o aceite precisa provar qual versão exata foi aceita.',
    mitigationInEngine:
      'A Cláusula 8ª veda mudanças unilaterais após o primeiro pagamento e a Cláusula 10ª vincula cada aceite a versão, carimbo de hora do servidor e hash SHA-256 sob base legal da LGPD.',
    actionForProduction:
      'Gravar snapshot canônico na subcoleção regulation_versions e o registro do aceite no momento do createOrder.',
  },
  {
    id: 'guardrails-approval',
    pillar: 'Guardrails e Aprovação de Campos Livres',
    legalBasis: 'CDC (art. 51) · LGPD (art. 7º, I)',
    severity: 'protegido',
    statusLabel: 'Blindado no Motor',
    finding:
      'Textos livres de organizadores frequentemente tentam inserir "sem reembolso", "vídeo obrigatório para receber" ou transferir garantias para a FastRifa.',
    mitigationInEngine:
      'Scanner em tempo real bloqueia termos abusivos/HTML e exige aprovação prévia para instruções personalizadas de Entrega (Cláusula 7ª) e Cancelamento (Cláusula 8ª).',
    actionForProduction:
      'Textos padrão sugeridos aprovam automaticamente; edições customizadas entram na fila rápida do painel Master.',
  },
  {
    id: 'physical-card-sync',
    pillar: 'Cartela Física Impressa (A4) e Checador /pix',
    legalBasis: 'CDC (art. 30 e 31) · Dever de informação prévia',
    severity: 'atencao',
    statusLabel: 'Integração Planejada',
    finding:
      'Participantes presenciais via folha A4 poderiam alegar desconhecimento do regulamento completo ou reservar cota já paga online simultaneamente.',
    mitigationInEngine:
      'A Cláusula 11ª vincula a Cartela A4 ao mesmo regulamento oficial via QR Code e estabelece critério objetivo de desempate/restituição caso haja conflito com anotação manual.',
    actionForProduction:
      'Imprimir tarja compacta do regulamento + hash + QR Code no rodapé do PDF (PhysicalCardModal) e exigir checkbox versionado na etapa reserve de /pix (PhysicalCartelaPixView).',
  },
];

export const PROTECTED_SUMMARY_ITEMS = [
  {
    title: 'Delimitação e Isenção da FastRifa',
    description:
      'A FastRifa disponibiliza exclusivamente a tecnologia do sistema. Não recebe valores, não faz custódia de PIX, não atua como organizadora, garantidora ou avalista.',
  },
  {
    title: 'Reserva e liquidação real (Regra raiz)',
    description:
      'O prazo de expiração da reserva e o fluxo de conferência seguem a regra raiz do sistema. O comprovante isolado não confirma participação sem conferência bancária.',
  },
  {
    title: 'Privacidade e Imagem (LGPD)',
    description:
      'Fotos ou vídeos de entrega dependem de autorização específica do contemplado. A recusa não impede a entrega do prêmio.',
  },
  {
    title: 'Aprovação e vedação a renúncia de direitos',
    description:
      'Os campos de entrega e cancelamento passam por aprovação antes de publicação e não podem transferir responsabilidade à FastRifa nem retirar direitos do participante.',
  },
];

export const CURRENT_TERMS_EXCERPTS = [
  {
    heading: 'Natureza da Plataforma (Termo atual)',
    text: 'O FastRifa é um sistema desenvolvido para fornecer infraestrutura tecnológica de exibição, controle de cotas e bilhetes digitais, sem custódia ou intermediação financeira.',
  },
  {
    heading: 'Posse e Idoneidade (Termo atual)',
    text: 'Declara sob as penas do art. 299 do CP que o bem é de sua real propriedade, livre de ônus, e pronto para entrega.',
  },
  {
    heading: 'Isenção Total (Termo atual)',
    text: 'O FastRifa não é organizador, garantidor, intermediário, patrocinador ou avalista. O Organizador responde direta e exclusivamente.',
  },
  {
    heading: 'Chave PIX e Comprovantes (Termo atual)',
    text: 'Chave PIX de titularidade do Organizador, responsável por conferir extratos antes de validar cotas.',
  },
];

export const PROPOSED_ADDENDUM_EXCERPTS = [
  {
    heading: 'Cláusula 7 — Regulamento específico (Aditivo)',
    text: 'O sistema FastRifa disponibiliza recursos para configurar o regulamento específico; o Organizador responde pela veracidade, autorizações aplicáveis e cumprimento do plano divulgado.',
  },
  {
    heading: 'Ajuste jurídico: Posse / Disponibilidade',
    text: 'Recomenda declarar titularidade ou disponibilidade legítima comprovada (inclusive doação válida), evitando presumir incidência automática do art. 299 do CP.',
  },
  {
    heading: 'Ajuste jurídico: Delimitação de responsabilidades',
    text: 'Renomeia "Isenção Total" para "Delimitação de responsabilidades": a entidade responde por arrecadação, apuração e entrega, sem afastar responsabilidade legal da plataforma por falhas próprias.',
  },
  {
    heading: 'Cláusulas protegidas & aprovação',
    text: 'Cláusulas institucionais não podem ser editadas. Instruções de entrega e procedimento de restituição passam por validação automática e aprovação administrativa.',
  },
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function toIsoWithTimezone(dateLocal: string, timezone: TimezoneType): string | null {
  if (!dateLocal || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateLocal)) return null;
  const trimmed = dateLocal.slice(0, 16);
  const offset = timezone === 'America/Bahia' || timezone === 'America/Sao_Paulo' ? '-03:00' : '-03:00';
  return `${trimmed}:00${offset}`;
}

export function formatDrawDateDisplay(dateLocal: string, timezone: TimezoneType): string {
  const iso = toIsoWithTimezone(dateLocal, timezone);
  if (!iso) return 'Data definida no cadastro da rifa';
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return 'Data inválida';

  const formatted = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: timezone,
  }).format(new Date(parsed));

  const tzLabel = timezone === 'America/Bahia' ? 'horário da Bahia' : 'horário de Brasília';
  return `${formatted} (${tzLabel})`;
}

export function formatCurrencyBrl(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safe);
}

export function escapePlainText(input: string): string {
  return input.replace(/[<>]/g, (ch) => (ch === '<' ? '‹' : '›'));
}

export function stripTrailingPeriod(input: string): string {
  return input.trim().replace(/\.+$/, '');
}

export function formatResultChannels(draft: RegulationDraft): string {
  const parts: string[] = ['Página oficial da rifa'];
  for (const opt of SOCIAL_CHANNEL_OPTIONS) {
    if (draft.socialChannels.includes(opt.id)) {
      const handle = draft.socialHandles[opt.id]?.trim();
      parts.push(handle ? `${opt.label} (${escapePlainText(handle)})` : opt.label);
    }
  }
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

function scanFieldGuardrails(
  text: string,
  targetField: 'deliveryDetails' | 'refundProcedure'
): GuardrailWarning[] {
  const clean = text.trim();
  if (!clean) return [];
  const warnings: GuardrailWarning[] = [];

  if (/<[^>]+>/.test(clean)) {
    warnings.push({
      id: `${targetField}-no-html`,
      targetField,
      severity: 'blocking',
      title: 'Código HTML detectado',
      detail: 'Aceita apenas texto simples. Tags HTML serão bloqueadas na aprovação.',
    });
  }

  if (
    /fastrifa\s+(garante|devolve|responde|se\s+responsabiliza|avalista|organiza)|responsabilidade\s+da\s+fastrifa/i.test(
      clean
    )
  ) {
    warnings.push({
      id: `${targetField}-no-platform`,
      targetField,
      severity: 'blocking',
      title: 'Conflito com a delimitação da FastRifa',
      detail:
        'Não é permitido atribuir à FastRifa obrigação de entrega, garantia ou restituição de valores recebidos pelo Organizador.',
    });
  }

  if (
    /sem\s+reembolso|n[aã]o\s+(devolv|estorn)|sem\s+devolu[cç][aã]o|ren[uú]ncia\s+de\s+direito/i.test(
      clean
    )
  ) {
    warnings.push({
      id: `${targetField}-no-waiver`,
      targetField,
      severity: 'blocking',
      title: 'Renúncia indevida de direitos',
      detail:
        'Não é permitido excluir hipóteses legais de restituição ou exigir renúncia de direitos do consumidor.',
    });
  }

  if (/adiar\s+indefinidamente|sem\s+data\s+definida|quando\s+quiser|prazo\s+indeterminado/i.test(clean)) {
    warnings.push({
      id: `${targetField}-indefinite`,
      targetField,
      severity: 'warning',
      title: 'Risco de prazo indeterminado',
      detail: 'Defina prazos objetivos para não contrariar o regulamento.',
    });
  }

  if (/(imagem|foto|v[ií]deo)\s+obrigat[oó]ri|obrigad[oa]\s+a\s+(gravar|enviar\s+foto|tirar\s+foto)/i.test(clean)) {
    warnings.push({
      id: `${targetField}-lgpd`,
      targetField,
      severity: 'warning',
      title: 'Uso compulsório de imagem (LGPD)',
      detail: 'Não condicione a entrega do prêmio ao envio obrigatório de fotos ou vídeos.',
    });
  }

  return warnings;
}

export function analyzeApprovalFieldsGuardrails(
  deliveryDetails: string,
  refundProcedure: string
): GuardrailWarning[] {
  return [
    ...scanFieldGuardrails(deliveryDetails, 'deliveryDetails'),
    ...scanFieldGuardrails(refundProcedure, 'refundProcedure'),
  ];
}

export function validateRegulationDraft(
  draft: RegulationDraft,
  now: Date = new Date()
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!draft.name.trim()) {
    issues.push({ field: 'name', label: 'Nome da campanha', message: 'Informe o título da campanha.' });
  }
  if (!draft.brandOrEntity.trim()) {
    issues.push({
      field: 'brandOrEntity',
      label: draft.campaignMode === 'authorized' ? 'Entidade responsável' : 'Marca / Organizador',
      message: 'Informe quem responde pela campanha.',
    });
  }
  if (!draft.prizes.trim()) {
    issues.push({ field: 'prizes', label: 'Premiação', message: 'Descreva o prêmio ofertado.' });
  }
  if (draft.prizeType === 'money_pix') {
    if (!Number.isFinite(draft.moneyPrizeAmountReais) || draft.moneyPrizeAmountReais <= 0) {
      issues.push({
        field: 'moneyPrizeAmountReais',
        label: 'Valor do prêmio em dinheiro',
        message: 'Informe o valor líquido positivo do prêmio em PIX.',
      });
    }
    if (draft.deliveryMode !== 'pix_dinheiro') {
      issues.push({
        field: 'deliveryMode',
        label: 'Modalidade de entrega',
        message: 'Prêmios em dinheiro exigem entrega via PIX (Dinheiro).',
      });
    }
  }
  if (draft.usesPhysicalCard && draft.quantity > MAX_PHYSICAL_CARD_QUOTAS) {
    issues.push({
      field: 'usesPhysicalCard',
      label: 'Cartela Física Impressa',
      message: `A cartela física A4 suporta no máximo ${MAX_PHYSICAL_CARD_QUOTAS} cotas.`,
    });
  }
  if (!Number.isInteger(draft.quantity) || draft.quantity < 1) {
    issues.push({ field: 'quantity', label: 'Cotas', message: 'Quantidade deve ser maior que zero.' });
  }
  if (!Number.isFinite(draft.priceReais) || draft.priceReais <= 0) {
    issues.push({ field: 'priceReais', label: 'Valor da cota', message: 'Informe um valor positivo.' });
  }
  if (!draft.contactWhatsapp.trim()) {
    issues.push({
      field: 'contactWhatsapp',
      label: 'WhatsApp oficial',
      message: 'Informe o contato de suporte aos participantes.',
    });
  }

  if (draft.campaignMode === 'authorized') {
    if (!draft.documentId.trim()) {
      issues.push({ field: 'documentId', label: 'CNPJ da entidade', message: 'CNPJ obrigatório para entidade autorizada.' });
    }
    if (!draft.beneficiary.trim()) {
      issues.push({ field: 'beneficiary', label: 'Beneficiário', message: 'Informe o beneficiário da operação.' });
    }
    if (!draft.certificate.trim()) {
      issues.push({
        field: 'certificate',
        label: 'Certificado / Autorização',
        message: 'Informe o número do certificado ou autorização vigente.',
      });
    }
  }

  const drawIso = toIsoWithTimezone(draft.drawDate, draft.timezone);
  const drawMs = drawIso ? Date.parse(drawIso) : NaN;
  if (!Number.isFinite(drawMs) || drawMs <= now.getTime()) {
    issues.push({
      field: 'drawDate',
      label: 'Data de apuração (cadastro)',
      message: 'Data de apuração precisa estar no futuro.',
    });
  }

  if (draft.condition !== 'fixed') {
    const deadlineIso = toIsoWithTimezone(draft.deadline, draft.timezone);
    const deadlineMs = deadlineIso ? Date.parse(deadlineIso) : NaN;
    if (!Number.isFinite(deadlineMs) || (Number.isFinite(drawMs) && deadlineMs < drawMs)) {
      issues.push({
        field: 'deadline',
        label: 'Data-limite (cadastro)',
        message: 'Data-limite deve ser igual ou posterior à apuração prevista.',
      });
    }
    if (!draft.unmetProcedure.trim()) {
      issues.push({
        field: 'unmetProcedure',
        label: 'Se a meta não for atingida',
        message: 'Procedimento objetivo obrigatório para campanha condicional.',
      });
    }
  }

  if (!Number.isInteger(draft.deliveryDays) || draft.deliveryDays < 1) {
    issues.push({
      field: 'deliveryDays',
      label: 'Prazo de entrega',
      message: 'Prazo de entrega deve ser de pelo menos 1 dia.',
    });
  }

  if (!draft.deliveryDetails.trim()) {
    issues.push({
      field: 'deliveryDetails',
      label: 'Instruções e local de entrega',
      message: 'Detalhe como ocorrerá a entrega da premiação.',
    });
  }

  if (!draft.refundProcedure.trim()) {
    issues.push({
      field: 'refundProcedure',
      label: 'Cancelamento e restituição',
      message: 'Informe o procedimento e canal de restituição em caso de cancelamento.',
    });
  }

  return issues;
}

export function generateRegulationClauses(
  draft: RegulationDraft,
  options: { deliveryApproved?: boolean; refundApproved?: boolean } = {}
): RegulationClause[] {
  const { deliveryApproved = false, refundApproved = false } = options;

  const isAuthorized = draft.campaignMode === 'authorized';
  const isMoneyPrize = draft.prizeType === 'money_pix';
  const docLabel = draft.documentId.trim() ? ` (${isAuthorized ? 'CNPJ' : 'Doc.'} ${draft.documentId.trim()})` : '';
  const certSegment = isAuthorized
    ? ` Beneficiário: ${stripTrailingPeriod(draft.beneficiary) || '[Beneficiário]'}. Autorização/Certificado: ${stripTrailingPeriod(draft.certificate) || '[Certificado]'}.`
    : ' Campanha configurada na modalidade independente, sob exclusiva responsabilidade civil, fiscal e operacional do Organizador.';

  const unmetText = stripTrailingPeriod(draft.unmetProcedure) || '[Definir procedimento]';
  const conditionText =
    draft.condition === 'fixed'
      ? 'A apuração ocorrerá na data definida no cadastro da campanha.'
      : `A realização está condicionada ${
          draft.condition === 'all'
            ? 'à distribuição e quitação de 100% das cotas disponíveis'
            : `ao atingimento da meta mínima de ${draft.goalPercent}% das cotas pagas`
        }, com data-limite em ${formatDrawDateDisplay(draft.deadline, draft.timezone)}. Caso a condição não seja atingida: ${unmetText}.`;

  const methodDescription =
    draft.method === 'loteria_federal'
      ? 'Extração oficial da Loteria Federal da Caixa Econômica Federal'
      : draft.method === 'live_draw'
        ? 'Sorteio público em transmissão ao vivo gravada e acessível a todos os participantes'
        : stripTrailingPeriod(draft.methodCustom) || '[Método especificado no cadastro]';

  const winnerIdText =
    draft.winnerIdentification === 'number'
      ? 'exclusivamente o número da cota contemplada'
      : draft.winnerIdentification === 'partial'
        ? 'o número da cota contemplada e o nome abreviado do participante para preservação de privacidade'
        : 'a identificação prevista pelo organizador, respeitada a base legal aplicável (LGPD)';

  const deliveryModeLabel =
    isMoneyPrize || draft.deliveryMode === 'pix_dinheiro'
      ? 'Transferência via PIX (prêmio em dinheiro)'
      : draft.deliveryMode === 'retirada'
        ? 'Retirada presencial'
        : draft.deliveryMode === 'envio'
          ? 'Envio segurado com rastreio / entrega direta'
          : 'Entrega ou retirada a combinar com o contemplado';

  const deliveryCostsLabel =
    isMoneyPrize || draft.deliveryMode === 'pix_dinheiro'
      ? 'Transferência via PIX realizada sem ônus ou descontos ao contemplado.'
      : draft.deliveryCosts === 'organizador'
        ? 'Integralmente custeados pelo Organizador (frete e despesas de entrega sem ônus ao ganhador).'
        : draft.deliveryCosts === 'ganhador'
          ? 'Sob responsabilidade do contemplado, conforme informado previamente neste regulamento.'
          : 'Custos ajustados previamente conforme localidade e modalidade descrita.';

  const guardrails = analyzeApprovalFieldsGuardrails(draft.deliveryDetails, draft.refundProcedure);
  const deliveryBlocked = guardrails.some(
    (w) => w.targetField === 'deliveryDetails' && w.severity === 'blocking'
  );
  const refundBlocked = guardrails.some(
    (w) => w.targetField === 'refundProcedure' && w.severity === 'blocking'
  );

  const cleanPurpose =
    stripTrailingPeriod(draft.purpose) || 'ação promocional conforme descrito na página oficial';
  const cleanPrizes = stripTrailingPeriod(draft.prizes) || '[Premiação]';
  const cleanCriteria = stripTrailingPeriod(draft.criteria) || '[Definir critérios]';
  const cleanDeliveryDetails =
    stripTrailingPeriod(escapePlainText(draft.deliveryDetails)) || '[Detalhar instruções]';
  const cleanRefundProcedure =
    stripTrailingPeriod(escapePlainText(draft.refundProcedure)) || '[Definir procedimento]';

  const clause2Summary = isMoneyPrize
    ? `Prêmio em Dinheiro · ${formatCurrencyBrl(draft.moneyPrizeAmountReais)}`
    : `${draft.quantity} cotas × ${formatCurrencyBrl(draft.priceReais)}`;

  const clause2Body = isMoneyPrize
    ? `São disponibilizadas ${draft.quantity.toLocaleString('pt-BR')} cotas digitais, no valor unitário de ${formatCurrencyBrl(draft.priceReais)}. Premiação ofertada em dinheiro: ${formatCurrencyBrl(draft.moneyPrizeAmountReais)} (${cleanPrizes}). O Organizador declara plena disponibilidade financeira do montante anunciado em conta própria, livre de bloqueios, assumindo exclusiva responsabilidade por eventuais obrigações legais, autorizações regulatórias e encargos fiscais ou tributários incidentes, sem descontos indevidos ao contemplado.`
    : `São disponibilizadas ${draft.quantity.toLocaleString('pt-BR')} cotas digitais, no valor unitário de ${formatCurrencyBrl(draft.priceReais)}. Premiação ofertada: ${cleanPrizes}. O Organizador declara legítima titularidade ou disponibilidade comprovada do prêmio, livre de ônus e pronto para entrega.`;

  const clause7Body =
    isMoneyPrize || draft.deliveryMode === 'pix_dinheiro'
      ? `O Organizador compromete-se a efetuar a transferência via PIX do valor líquido de ${formatCurrencyBrl(draft.moneyPrizeAmountReais)} em até ${draft.deliveryDays} dia${draft.deliveryDays > 1 ? 's' : ''} após a validação do resultado, exclusivamente para chave PIX de mesma titularidade (CPF) do contemplado legítimo, mediante conferência documental e do comprovante de pagamento da cota. Modalidade: ${deliveryModeLabel}. Instruções de recebimento: ${cleanDeliveryDetails}. O comprovante bancário oficial da transferência PIX constitui prova plena de quitação e entrega. Custos: ${deliveryCostsLabel}`
      : `O Organizador compromete-se a entregar a premiação ao contemplado legítimo em até ${draft.deliveryDays} dia${draft.deliveryDays > 1 ? 's' : ''} após a validação do resultado. Modalidade: ${deliveryModeLabel}. Instruções e local: ${cleanDeliveryDetails}. Custos: ${deliveryCostsLabel}`;

  const clauses: RegulationClause[] = [
    {
      id: 'identificacao',
      number: 1,
      title: 'Identificação e Finalidade',
      summaryTag: 'Cadastro da campanha',
      locked: false,
      body: `${draft.brandOrEntity.trim() || '[Organizador]'}${docLabel} é o responsável pela campanha "${draft.name.trim() || '[Campanha]'}", destinada a: ${cleanPurpose}.${certSegment} Contato oficial de atendimento: ${draft.contactWhatsapp.trim() || '[WhatsApp]'}.`,
    },
    {
      id: 'participacao',
      number: 2,
      title: 'Participação e Premiação',
      summaryTag: clause2Summary,
      locked: false,
      body: clause2Body,
    },
    {
      id: 'reserva-pix',
      number: 3,
      title: 'Reserva e Pagamento via PIX Direto',
      summaryTag: 'Regra raiz do sistema',
      locked: true,
      body: `A reserva não paga expira automaticamente conforme a regra raiz do sistema (${SYSTEM_RESERVATION_LABEL}), liberando os números de volta à grade pública para garantir segurança operacional e evitar bloqueio indevido de bilhetes. O pagamento ocorre exclusivamente via PIX direto para a chave de titularidade de ${draft.pixHolder.trim() || draft.brandOrEntity.trim()}, com envio de comprovante pelo WhatsApp oficial ${draft.contactWhatsapp.trim()}. O comprovante isolado não confirma participação sem conferência efetiva do crédito bancário pelo Organizador.`,
    },
    {
      id: 'confirmacao',
      number: 4,
      title: 'Confirmação e Elegibilidade',
      summaryTag: 'Cláusula protegida',
      locked: true,
      body: 'Somente cotas com pagamento efetivamente conferido e validado pelo Organizador participam da apuração. Caso o participante realize pagamento após o vencimento da reserva de 30 minutos e o número já tenha sido liberado ou adquirido por terceiro, o Organizador deverá, mediante opção expressa do participante, atribuir cota equivalente disponível ou restituir 100% do valor pago diretamente via PIX, preservado o histórico técnico da operação.',
    },
    {
      id: 'apuracao',
      number: 5,
      title: 'Apuração e Critérios de Sorteio',
      summaryTag: 'Definido no cadastro',
      locked: false,
      body: `Data prevista de apuração definida no cadastro da rifa: ${formatDrawDateDisplay(draft.drawDate, draft.timezone)}. ${conditionText} Método de apuração previamente selecionado: ${methodDescription}. Critérios completos e desempate: ${cleanCriteria}. É expressamente vedada qualquer manipulação de resultados ou favorecimento de participantes.`,
    },
    {
      id: 'privacidade',
      number: 6,
      title: 'Divulgação Oficial, Privacidade e Uso de Imagem',
      summaryTag: 'Canais oficiais + LGPD',
      locked: false,
      body: `A divulgação oficial do resultado ocorrerá nos seguintes canais: ${formatResultChannels(draft)}. Será exibido ${winnerIdText}. Eventual captação ou divulgação de fotografias e vídeos de entrega depende de autorização específica do contemplado (LGPD); a recusa do ganhador não impede nem atrasa a entrega do prêmio.`,
    },
    {
      id: 'entrega',
      number: 7,
      title: 'Entrega da Premiação',
      summaryTag: deliveryBlocked
        ? 'Bloqueado por Guardrail'
        : deliveryApproved
          ? 'Aprovado'
          : 'Passa por aprovação',
      locked: false,
      requiresApproval: true,
      approved: deliveryApproved && !deliveryBlocked,
      blocked: deliveryBlocked,
      body: clause7Body,
    },
    {
      id: 'restituicao',
      number: 8,
      title: 'Alterações, Cancelamento e Restituição',
      summaryTag: refundBlocked
        ? 'Bloqueado por Guardrail'
        : refundApproved
          ? 'Aprovado'
          : 'Passa por aprovação',
      locked: false,
      requiresApproval: true,
      approved: refundApproved && !refundBlocked,
      blocked: refundBlocked,
      body: `Após a confirmação do primeiro pagamento, ficam vedadas alterações unilaterais em premiação, valor da cota, quantidade de bilhetes ou método de apuração. Eventual ajuste operacional excepcional exige justificativa formal auditável e preservação integral dos direitos dos participantes já pagos, inclusive opção de restituição integral. Procedimento de cancelamento e restituição direta pelo Organizador: ${cleanRefundProcedure}.`,
    },
    {
      id: 'responsabilidades',
      number: 9,
      title: 'Delimitação e Isenção de Responsabilidade da FastRifa',
      summaryTag: 'Cláusula protegida',
      locked: true,
      body: 'A FastRifa disponibiliza exclusivamente a infraestrutura tecnológica do sistema para exibição de cotas, geração de QR Codes PIX diretos e organização deste regulamento. A FastRifa não é organizadora, intermediária financeira, patrocinadora, garantidora ou avalista desta campanha, não recebendo nem retendo valores. O Organizador responde exclusiva e integralmente pela veracidade dos dados, enquadramento legal da campanha (inclusive quanto a premiações em dinheiro, quando aplicável), posse ou disponibilidade financeira do prêmio, conferência bancária, apuração e entrega, sem prejuízo das responsabilidades legalmente atribuíveis à plataforma exclusivamente pelos serviços tecnológicos prestados.',
    },
    {
      id: 'aceite',
      number: 10,
      title: 'Aceitação e Versão do Regulamento',
      summaryTag: 'Cláusula protegida',
      locked: true,
      body: 'Este regulamento específico complementa os Termos de Uso e os Termos de Criação e Responsabilidade do sistema FastRifa, sem afastar garantias da legislação brasileira (Código de Defesa do Consumidor, Lei nº 8.078/1990, e LGPD, Lei nº 13.709/2018). O aceite eletrônico registrado no checkout vincula-se de forma imutável à versão exata, ao carimbo de data/hora do servidor e ao hash criptográfico SHA-256 vigentes no momento da reserva, mantidos em registro técnico para cumprimento de obrigação legal e exercício regular de direitos (art. 7º, II e VI, da LGPD).',
    },
  ];

  if (draft.usesPhysicalCard && draft.quantity <= MAX_PHYSICAL_CARD_QUOTAS) {
    clauses.push({
      id: 'cartela-fisica',
      number: 11,
      title: 'Cartela Física Impressa e Validação via QR Code',
      summaryTag: 'Cláusula protegida · Cartela A4',
      locked: true,
      body: 'Esta campanha admite divulgação e reserva complementar por meio de Cartela Física Impressa (PDF A4 gerado pelo sistema, limitada a até 200 cotas). A cartela impressa é um suporte auxiliar sujeito integralmente à mesma versão oficial e ao código hash deste regulamento, acessível pelo QR Code impresso no rodapé da folha. Antes de efetuar pagamento presencial ou via PIX, o participante ou colaborador deve confirmar a disponibilidade em tempo real no checador oficial (/pix) via QR Code. Em caso de divergência entre anotação manual na folha impressa e a grade digital do sistema, prevalece o registro digital validado com comprovante bancário, assegurada ao participante preterido a escolha de número equivalente disponível ou a restituição integral imediata pelo Organizador.',
    });
  }

  return clauses;
}

export function formatRegulationPlainText(
  draft: RegulationDraft,
  clauses: RegulationClause[]
): string {
  const header = `REGULAMENTO OFICIAL DE CAMPANHA — ${(draft.name.trim() || 'CAMPANHA FASTRIFA').toUpperCase()}\nSistema FastRifa · Modelo v${TEMPLATE_VERSION}`;
  const body = clauses
    .map((c) => `CLÁUSULA ${c.number}ª — ${c.title.toUpperCase()}\n${c.body}`)
    .join('\n\n');
  return `${header}\n\n${body}`;
}

export function createCanonicalSnapshot(draft: RegulationDraft): string {
  const sorted = Object.fromEntries(
    Object.entries(draft)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
  );
  return JSON.stringify(sorted);
}

export function computeShortHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + ((i * 31) & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(4, '0');
  return `${part1}${part2}`;
}

export async function computeSha256Hex(input: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return computeShortHash(input);
  }
  const data = new TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => pad2(b))
    .join('');
}
