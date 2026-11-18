/**
 * Utilitário para conversão de valores em reais (BRL) para texto por extenso em português do Brasil.
 * Suporta de R$ 0,01 (um centavo) até milhões de reais.
 */

function converterAte99(n: number): string {
  const unidades = [
    'zero',
    'um',
    'dois',
    'três',
    'quatro',
    'cinco',
    'seis',
    'sete',
    'oito',
    'nove',
    'dez',
    'onze',
    'doze',
    'treze',
    'quatorze',
    'quinze',
    'dezesseis',
    'dezessete',
    'dezoito',
    'dezenove',
  ];
  const dezenas = [
    '',
    '',
    'vinte',
    'trinta',
    'quarenta',
    'cinquenta',
    'sessenta',
    'setenta',
    'oitenta',
    'noventa',
  ];

  if (n < 20) return unidades[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  return u === 0 ? dezenas[d] : `${dezenas[d]} e ${unidades[u]}`;
}

function converterCentenas(n: number): string {
  const centenas = [
    '',
    'cento',
    'duzentos',
    'trezentos',
    'quatrocentos',
    'quinhentos',
    'seiscentos',
    'setecentos',
    'oitocentos',
    'novecentos',
  ];

  if (n === 0) return '';
  if (n === 100) return 'cem';
  if (n >= 100) {
    const c = Math.floor(n / 100);
    const resto = n % 100;
    const nomeC = c === 1 ? 'cento' : centenas[c];
    if (resto === 0) return nomeC;
    return `${nomeC} e ${converterAte99(resto)}`;
  }
  return converterAte99(n);
}

function converterInteiro(n: number): string {
  if (n === 0) return 'zero';
  if (n < 1000) return converterCentenas(n);
  if (n < 1000000) {
    const mil = Math.floor(n / 1000);
    const resto = n % 1000;
    const prefix = mil === 1 ? 'mil' : `${converterCentenas(mil)} mil`;
    if (resto === 0) return prefix;
    const conector = resto < 100 || resto % 100 === 0 ? ' e ' : ', ';
    return `${prefix}${conector}${converterCentenas(resto)}`;
  }
  const milhao = Math.floor(n / 1000000);
  const resto = n % 1000000;
  const prefix = milhao === 1 ? 'um milhão' : `${converterCentenas(milhao)} milhões`;
  if (resto === 0) return prefix;
  return `${prefix} e ${converterInteiro(resto)}`;
}

/**
 * Converte um valor numérico em reais (BRL) para sua representação por extenso.
 * Exemplos:
 *  - 0.01 -> "Um centavo"
 *  - 0.10 -> "Dez centavos"
 *  - 0.50 -> "Cinquenta centavos"
 *  - 1.00 -> "Um real"
 *  - 1.50 -> "Um real e cinquenta centavos"
 *  - 2.25 -> "Dois reais e vinte e cinco centavos"
 */
export function numeroPorExtensoBRL(valor: number): string {
  if (isNaN(valor) || valor <= 0) return '';
  const valorFixado = Math.round(valor * 100) / 100;
  const reais = Math.floor(valorFixado);
  const centavos = Math.round((valorFixado - reais) * 100);

  let texto = '';
  if (reais === 0 && centavos > 0) {
    texto = `${converterInteiro(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
  } else if (reais > 0 && centavos === 0) {
    texto = `${converterInteiro(reais)} ${reais === 1 ? 'real' : 'reais'}`;
  } else if (reais > 0 && centavos > 0) {
    const extReais = `${converterInteiro(reais)} ${reais === 1 ? 'real' : 'reais'}`;
    const extCentavos = `${converterInteiro(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
    texto = `${extReais} e ${extCentavos}`;
  }

  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
