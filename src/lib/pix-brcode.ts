import type { PixKeyType } from '@/types/database.types';

/**
 * Formata um campo TLV (Tag-Length-Value) no padrão EMVCo do Banco Central (BR Code).
 */
function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Remove acentos e caracteres especiais para campos ASCII do EMVCo (Nome e Cidade).
 */
function sanitizeAscii(text: string, maxLength: number): string {
  const cleaned = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  return (cleaned || 'FASTRIFA').slice(0, maxLength);
}

/**
 * Normaliza a chave PIX conforme o tipo exigido pelo DICT / Banco Central.
 */
export function normalizePixKey(key: string, type?: PixKeyType | string): string {
  const raw = (key || '').trim();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');

  if (type === 'cpf') {
    return digits.slice(0, 11);
  }

  if (type === 'cnpj') {
    return digits.slice(0, 14);
  }

  if (type === 'phone') {
    if (raw.startsWith('+')) {
      return '+' + digits;
    }
    if (digits.length === 13 && digits.startsWith('55')) {
      return '+' + digits;
    }
    if (digits.length >= 10 && digits.length <= 11) {
      return '+55' + digits;
    }
    return '+55' + digits;
  }

  if (type === 'email') {
    return raw.toLowerCase();
  }

  // Caso seja chave aleatória (EVP) ou auto-detectada
  if (raw.includes('@')) {
    return raw.toLowerCase();
  }
  if (/^[0-9a-fA-F-]{32,36}$/.test(raw)) {
    return raw.toLowerCase();
  }
  if (digits.length === 11 && !raw.startsWith('+')) {
    // Pode ser CPF ou celular sem +55; respeita o type se fornecido
    return digits;
  }

  return raw;
}

/**
 * Calcula o CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) oficial do PIX.
 */
function computeCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixBrCodeOptions {
  pixKey: string;
  pixKeyType?: PixKeyType | string;
  merchantName?: string;
  merchantCity?: string;
  amount?: number;
  txId?: string;
  description?: string;
}

/**
 * Gera o código "PIX Copia e Cola" (BR Code EMVCo) oficial com valor já incluso.
 * Compatível com todos os bancos brasileiros.
 */
export function generatePixBrCode({
  pixKey,
  pixKeyType,
  merchantName = 'FASTRIFA',
  merchantCity = 'BRASIL',
  amount,
  txId = '***',
  description,
}: PixBrCodeOptions): string {
  const normalizedKey = normalizePixKey(pixKey, pixKeyType);
  if (!normalizedKey) return '';

  // 00: Payload Format Indicator
  const pfi = emvField('00', '01');

  // 26: Merchant Account Information - PIX
  const gui = emvField('00', 'br.gov.bcb.pix');
  const keyField = emvField('01', normalizedKey);
  const descField = description
    ? emvField('02', sanitizeAscii(description, 20))
    : '';
  const merchantAccountInfo = emvField('26', `${gui}${keyField}${descField}`);

  // 52: Merchant Category Code
  const mcc = emvField('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  const currency = emvField('53', '986');

  // 54: Transaction Amount (opcional, quando presente já crava o valor no app do banco)
  const amountField =
    typeof amount === 'number' && amount > 0
      ? emvField('54', amount.toFixed(2))
      : '';

  // 58: Country Code
  const country = emvField('58', 'BR');

  // 59: Merchant Name (até 25 caracteres)
  const nameField = emvField('59', sanitizeAscii(merchantName, 25));

  // 60: Merchant City (até 15 caracteres)
  const cityField = emvField('60', sanitizeAscii(merchantCity, 15));

  // 62: Additional Data Field Template (05 = Reference Label / TxID)
  const safeTxId =
    txId === '***'
      ? '***'
      : txId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';
  const additionalData = emvField('62', emvField('05', safeTxId));

  // 63: CRC16 header
  const basePayload = `${pfi}${merchantAccountInfo}${mcc}${currency}${amountField}${country}${nameField}${cityField}${additionalData}6304`;
  const crc = computeCRC16(basePayload);

  return `${basePayload}${crc}`;
}
