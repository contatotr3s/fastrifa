import type { PixKeyType } from '@/types/database.types';

/**
 * Conjunto oficial dos 67 DDDs ativos no Brasil (ANATEL).
 */
export const VALID_BRAZIL_DDDS = new Set<string>([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

/**
 * Extrai apenas dígitos numéricos de uma string.
 */
export function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Valida formato real de e-mail (usuário@domínio.tld, sem espaços ou pontos duplos).
 */
export function isValidEmail(value: string): boolean {
  const email = (value || '').trim().toLowerCase();
  if (!email || email.length > 254 || /\s/.test(email) || email.includes('..')) {
    return false;
  }

  const emailRegex =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
  if (!emailRegex.test(email)) {
    return false;
  }

  const parts = email.split('@');
  if (parts.length !== 2 || parts[0].length > 64) {
    return false;
  }

  const tld = parts[1].split('.').pop() || '';
  return /^[a-z]{2,}$/i.test(tld);
}

/**
 * Retorna mensagem amigável caso o e-mail seja inválido.
 */
export function getEmailError(value: string): string | null {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return 'Informe um endereço de e-mail.';
  }
  if (!isValidEmail(trimmed)) {
    return 'Informe um e-mail válido (ex: nome@dominio.com).';
  }
  return null;
}

/**
 * Normaliza dígitos de celular brasileiro removendo DDI +55 quando presente.
 */
export function normalizeBrazilMobileDigits(value: string): string {
  let digits = onlyDigits(value);
  if (
    digits.length === 13 &&
    digits.startsWith('55') &&
    VALID_BRAZIL_DDDS.has(digits.slice(2, 4)) &&
    digits[4] === '9'
  ) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
}

/**
 * Aplica máscara de celular brasileiro: (DD) 9XXXX-XXXX.
 */
export function formatBrazilMobile(value: string): string {
  const d = normalizeBrazilMobileDigits(value);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/**
 * Verifica se o número é um celular brasileiro válido (DDD oficial + dígito 9 + 8 dígitos).
 */
export function isValidBrazilMobile(value: string): boolean {
  const d = normalizeBrazilMobileDigits(value);
  if (d.length !== 11) return false;
  const ddd = d.slice(0, 2);
  if (!VALID_BRAZIL_DDDS.has(ddd)) return false;
  if (d[2] !== '9') return false;
  if (d.slice(3) === '00000000' || /^(\d)\1{7}$/.test(d.slice(3))) {
    return false;
  }
  return true;
}

/**
 * Retorna erro específico de validação de celular brasileiro.
 */
export function getBrazilMobileError(value: string): string | null {
  const d = normalizeBrazilMobileDigits(value);
  if (!d) {
    return 'Informe o número de celular com DDD.';
  }
  if (d.length < 11) {
    return 'O celular deve conter DDD + 9 dígitos (ex: (11) 99999-9999).';
  }
  const ddd = d.slice(0, 2);
  if (!VALID_BRAZIL_DDDS.has(ddd)) {
    return `O DDD "${ddd}" não é válido no Brasil.`;
  }
  if (d[2] !== '9') {
    return 'O número de celular deve começar com o dígito 9 após o DDD.';
  }
  if (d.slice(3) === '00000000' || /^(\d)\1{7}$/.test(d.slice(3))) {
    return 'Informe um número de celular real e válido.';
  }
  return null;
}

/**
 * Aplica máscara de CPF: 000.000.000-00.
 */
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (!d) return '';
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

/**
 * Valida matematicamente os 2 dígitos verificadores do CPF (Receita Federal).
 */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(cpf[10]);
}

/**
 * Retorna erro específico de validação de CPF.
 */
export function getCpfError(value: string): string | null {
  const d = onlyDigits(value);
  if (!d) {
    return 'Informe o CPF do responsável.';
  }
  if (d.length < 11) {
    return 'O CPF deve conter 11 dígitos.';
  }
  if (!isValidCpf(d)) {
    return 'O CPF informado é inválido. Confira os números digitados.';
  }
  return null;
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00.
 */
export function formatCnpj(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (!d) return '';
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

/**
 * Valida matematicamente os 2 dígitos verificadores do CNPJ.
 */
export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calcDigit = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += Number(base[i]) * weights[i];
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(cnpj.slice(0, 12), w1);
  if (d1 !== Number(cnpj[12])) return false;

  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d2 = calcDigit(cnpj.slice(0, 13), w2);
  return d2 === Number(cnpj[13]);
}

/**
 * Aplica máscara automática de CPF (até 11 dígitos) ou CNPJ (acima de 11 dígitos).
 */
export function formatCpfOrCnpj(value: string): string {
  const d = onlyDigits(value);
  return d.length <= 11 ? formatCpf(d) : formatCnpj(d);
}

/**
 * Valida chave aleatória PIX (UUID padrão BACEN).
 */
export function isValidRandomPixKey(value: string): boolean {
  const trimmed = (value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    trimmed
  );
}

/**
 * Infere o tipo de uma chave PIX a partir de seu conteúdo.
 */
export function detectPixKeyType(value: string): PixKeyType {
  const trimmed = (value || '').trim();
  if (trimmed.includes('@')) return 'email';
  if (isValidRandomPixKey(trimmed)) return 'random';

  const digits = onlyDigits(trimmed);
  if (digits.length === 14 && isValidCnpj(digits)) return 'cnpj';
  if (digits.length === 11) {
    if (isValidCpf(digits)) return 'cpf';
    if (isValidBrazilMobile(digits)) return 'phone';
    return 'cpf';
  }

  return 'random';
}

/**
 * Formata o valor digitado no input de Chave PIX de acordo com o tipo selecionado.
 */
export function formatPixKeyInput(
  value: string,
  type: PixKeyType | 'cpf_cnpj'
): string {
  if (type === 'cpf') return formatCpf(value);
  if (type === 'cnpj') return formatCnpj(value);
  if (type === 'cpf_cnpj') return formatCpfOrCnpj(value);
  if (type === 'phone') return formatBrazilMobile(value);
  if (type === 'email') return (value || '').replace(/\s+/g, '');
  return (value || '').trim();
}

export interface PixValidationResult {
  valid: boolean;
  error?: string;
  resolvedType: PixKeyType;
  normalizedValue: string;
}

/**
 * Valida rigorosamente a Chave PIX conforme o tipo escolhido e retorna tipo/valor normalizados.
 */
export function validatePixKey(
  value: string,
  type: PixKeyType | 'cpf_cnpj'
): PixValidationResult {
  const trimmed = (value || '').trim();
  const digits = onlyDigits(trimmed);

  if (!trimmed) {
    return {
      valid: false,
      error: 'Informe a Chave PIX de recebimento.',
      resolvedType: type === 'cpf_cnpj' ? 'cpf' : type,
      normalizedValue: '',
    };
  }

  if (type === 'cpf') {
    if (!isValidCpf(digits)) {
      return {
        valid: false,
        error: 'A Chave PIX selecionada é CPF, mas o CPF informado é inválido.',
        resolvedType: 'cpf',
        normalizedValue: digits,
      };
    }
    return { valid: true, resolvedType: 'cpf', normalizedValue: digits };
  }

  if (type === 'cnpj') {
    if (!isValidCnpj(digits)) {
      return {
        valid: false,
        error: 'A Chave PIX selecionada é CNPJ, mas o CNPJ informado é inválido.',
        resolvedType: 'cnpj',
        normalizedValue: digits,
      };
    }
    return { valid: true, resolvedType: 'cnpj', normalizedValue: digits };
  }

  if (type === 'cpf_cnpj') {
    if (digits.length === 14) {
      if (!isValidCnpj(digits)) {
        return {
          valid: false,
          error: 'O CNPJ informado como Chave PIX é inválido.',
          resolvedType: 'cnpj',
          normalizedValue: digits,
        };
      }
      return { valid: true, resolvedType: 'cnpj', normalizedValue: digits };
    }
    if (!isValidCpf(digits)) {
      return {
        valid: false,
        error: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido como Chave PIX.',
        resolvedType: 'cpf',
        normalizedValue: digits,
      };
    }
    return { valid: true, resolvedType: 'cpf', normalizedValue: digits };
  }

  if (type === 'phone') {
    const mobileError = getBrazilMobileError(trimmed);
    if (mobileError) {
      return {
        valid: false,
        error: `Chave PIX Celular inválida: ${mobileError}`,
        resolvedType: 'phone',
        normalizedValue: normalizeBrazilMobileDigits(trimmed),
      };
    }
    return {
      valid: true,
      resolvedType: 'phone',
      normalizedValue: normalizeBrazilMobileDigits(trimmed),
    };
  }

  if (type === 'email') {
    const emailErr = getEmailError(trimmed);
    if (emailErr) {
      return {
        valid: false,
        error: `Chave PIX E-mail inválida: ${emailErr}`,
        resolvedType: 'email',
        normalizedValue: trimmed.toLowerCase(),
      };
    }
    return {
      valid: true,
      resolvedType: 'email',
      normalizedValue: trimmed.toLowerCase(),
    };
  }

  if (!isValidRandomPixKey(trimmed)) {
    return {
      valid: false,
      error:
        'Chave PIX aleatória inválida. Cole o código completo com 36 caracteres (ex: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).',
      resolvedType: 'random',
      normalizedValue: trimmed.toLowerCase(),
    };
  }

  return {
    valid: true,
    resolvedType: 'random',
    normalizedValue: trimmed.toLowerCase(),
  };
}
