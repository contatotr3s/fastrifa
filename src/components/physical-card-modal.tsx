'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { buildMultiPageA4Pdf } from '@/lib/pdf-builder';
import { generateBrandInitials } from '@/lib/image-processor';
import {
  X,
  Download,
  Printer,
  FileText,
  Sparkles,
  CheckCircle2,
  QrCode as QrIcon,
  Loader2,
} from 'lucide-react';
import type { Raffle } from '@/types/database.types';

interface PhysicalCardModalProps {
  raffle: Raffle;
  paidTicketNumbers: number[];
  isOpen: boolean;
  onClose: () => void;
}

// Dimensões A4 em alta definição (proporção 1 : 1.4142)
const A4_W = 1240;
const A4_H = 1754;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Desenha elementos sutis de sorte (trevo, ferradura, estrelas e bilhete)
 * com baixa opacidade ao redor da página A4.
 */
function drawLuckyWatermarks(
  ctx: CanvasRenderingContext2D,
  primaryColor: string,
  secondaryColor: string
) {
  ctx.save();

  // Helper para desenhar trevo de 4 folhas estilizado
  function drawClover(cx: number, cy: number, size: number, rot: number, alpha: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = primaryColor;
    const r = size * 0.28;
    const offsets = [
      [0, -r],
      [r, 0],
      [0, r],
      [-r, 0],
    ];
    offsets.forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(ox, oy, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
    });
    // Caule
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.5);
    ctx.quadraticCurveTo(size * 0.25, size * 0.55, size * 0.12, size * 0.78);
    ctx.stroke();
    ctx.restore();
  }

  // Helper para desenhar ferradura da sorte
  function drawHorseshoe(cx: number, cy: number, size: number, rot: number, alpha: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = size * 0.22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.42, -Math.PI * 0.15, Math.PI * 1.15, false);
    ctx.stroke();

    // Furos da ferradura
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * 0.1 + (i * Math.PI * 0.8) / 4;
      const hx = Math.cos(a) * size * 0.42;
      const hy = Math.sin(a) * size * 0.42;
      ctx.beginPath();
      ctx.arc(hx, hy, size * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Helper para desenhar estrela 4 pontas (sparkle)
  function drawSparkle(cx: number, cy: number, size: number, alpha: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Distribuir elementos sutis nas bordas da folha A4
  drawClover(85, 220, 95, -0.25, 0.065);
  drawHorseshoe(1155, 240, 95, 0.3, 0.065);
  drawClover(1145, 860, 110, 0.22, 0.055);
  drawHorseshoe(90, 920, 105, -0.35, 0.055);
  drawClover(100, 1580, 90, 0.18, 0.06);
  drawHorseshoe(1140, 1560, 90, -0.2, 0.06);

  drawSparkle(220, 130, 18, 0.09);
  drawSparkle(1030, 140, 16, 0.08);
  drawSparkle(65, 560, 20, 0.08);
  drawSparkle(1175, 540, 18, 0.08);
  drawSparkle(70, 1280, 16, 0.08);
  drawSparkle(1170, 1250, 20, 0.08);

  ctx.restore();
}

/**
 * Desenha o ícone vetorial do WhatsApp em uma posição (x, y) no Canvas.
 */
function drawWhatsAppIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  const r = size / 2;
  ctx.fillStyle = '#16A34A';
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  ctx.fill();

  // Rabicho do balão
  ctx.beginPath();
  ctx.moveTo(x + size * 0.2, y + size * 0.75);
  ctx.lineTo(x + size * 0.08, y + size * 0.96);
  ctx.lineTo(x + size * 0.4, y + size * 0.86);
  ctx.closePath();
  ctx.fill();

  // Telefone interno branco simplificado
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1.5, size * 0.13);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x + r, y + r, r * 0.45, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.restore();
}

/**
 * Desenha o símbolo losango do PIX em uma posição (x, y) no Canvas.
 */
function drawPixDiamondIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color = '#00A868'
) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = color;
  const s = size * 0.64;
  ctx.beginPath();
  ctx.roundRect(-s / 2, -s / 2, s, s, size * 0.14);
  ctx.fill();

  // Cruz interna estilizada do PIX
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1.3, size * 0.1);
  ctx.beginPath();
  ctx.moveTo(-s * 0.28, 0);
  ctx.lineTo(s * 0.28, 0);
  ctx.moveTo(0, -s * 0.28);
  ctx.lineTo(0, s * 0.28);
  ctx.stroke();
  ctx.restore();
}

export default function PhysicalCardModal({
  raffle,
  paidTicketNumbers,
  isOpen,
  onClose,
}: PhysicalCardModalProps) {
  const [activePreviewPage, setActivePreviewPage] = useState<1 | 2>(1);
  const [markPaidOnGrid, setMarkPaidOnGrid] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [page1DataUrl, setPage1DataUrl] = useState<string | null>(null);
  const [page2DataUrl, setPage2DataUrl] = useState<string | null>(null);

  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://fastrifa.vercel.app';

  const publicRaffleUrl = `${origin}/r/${raffle.slug}`;
  const smartPixCalculatorUrl = `${origin}/r/${raffle.slug}/pix`;

  const isGreen = raffle.brand_color === 'green';
  const primary = isGreen ? '#059669' : '#0869F5';
  const primaryDark = isGreen ? '#065F46' : '#052498';
  const primarySoft = isGreen ? '#ECFDF5' : '#EDF5FF';
  const primaryBorder = isGreen ? '#A7F3D0' : '#CDE0FC';
  const surfaceBg = isGreen ? '#F3FBF7' : '#F5F9FF';

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function renderPages() {
      setIsGenerating(true);
      try {
        const [fastRifaLogo, brandLogo, prizeImg, qrOnlineUrl, qrPixCalcUrl] =
          await Promise.all([
            loadImage('/logo-fastrifa.png'),
            raffle.brand_logo_url ? loadImage(raffle.brand_logo_url) : Promise.resolve(null),
            raffle.prize_image_url ? loadImage(raffle.prize_image_url) : Promise.resolve(null),
            QRCode.toDataURL(publicRaffleUrl, {
              width: 340,
              margin: 1,
              color: { dark: '#0D1729', light: '#FFFFFF' },
            }),
            QRCode.toDataURL(smartPixCalculatorUrl, {
              width: 360,
              margin: 1,
              color: { dark: '#0D1729', light: '#FFFFFF' },
            }),
          ]);

        const [qrOnlineImg, qrPixCalcImg] = await Promise.all([
          loadImage(qrOnlineUrl),
          loadImage(qrPixCalcUrl),
        ]);

        if (cancelled) return;

        const paidSet = new Set(markPaidOnGrid ? paidTicketNumbers : []);
        const brandName = raffle.brand_name || 'Organizador Oficial';
        const brandInitials = generateBrandInitials(brandName);
        const total = Math.min(200, Math.max(1, raffle.total_tickets));

        // =========================================================================
        // PÁGINA 1: VITRINE ESTILIZADA & GRADE FIEL À TELA
        // =========================================================================
        const c1 = document.createElement('canvas');
        c1.width = A4_W;
        c1.height = A4_H;
        const ctx1 = c1.getContext('2d')!;

        // Fundo luminoso A4
        const bgGrad1 = ctx1.createLinearGradient(0, 0, A4_W, A4_H);
        bgGrad1.addColorStop(0, '#FFFFFF');
        bgGrad1.addColorStop(0.5, surfaceBg);
        bgGrad1.addColorStop(1, primarySoft);
        ctx1.fillStyle = bgGrad1;
        ctx1.fillRect(0, 0, A4_W, A4_H);

        // Brilhos radiais suaves
        const radial1 = ctx1.createRadialGradient(200, 180, 30, 200, 180, 500);
        radial1.addColorStop(0, isGreen ? 'rgba(16,185,129,0.12)' : 'rgba(8,105,245,0.12)');
        radial1.addColorStop(1, 'rgba(255,255,255,0)');
        ctx1.fillStyle = radial1;
        ctx1.fillRect(0, 0, A4_W, A4_H);

        // Elementos de sorte em baixa opacidade ao redor da página
        drawLuckyWatermarks(ctx1, primary, primaryDark);

        // Moldura externa sutil da folha
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 3;
        ctx1.beginPath();
        ctx1.roundRect(36, 36, A4_W - 72, A4_H - 72, 34);
        ctx1.stroke();

        // --- TOPO: Logo FastRifa (Esquerda) + Logo/Marca do Criador (Direita) ---
        // Pílula FastRifa
        ctx1.save();
        ctx1.fillStyle = '#FFFFFF';
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(68, 64, 240, 68, 34);
        ctx1.fill();
        ctx1.stroke();
        if (fastRifaLogo) {
          const lh = 42;
          const lw = (fastRifaLogo.width / fastRifaLogo.height) * lh;
          ctx1.drawImage(fastRifaLogo, 68 + (240 - lw) / 2, 64 + (68 - lh) / 2, lw, lh);
        } else {
          ctx1.fillStyle = primary;
          ctx1.font = 'bold 26px sans-serif';
          ctx1.textAlign = 'center';
          ctx1.fillText('FastRifa', 188, 107);
        }
        ctx1.restore();

        // Badge Central: CARTELA OFICIAL
        ctx1.save();
        ctx1.fillStyle = primarySoft;
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(450, 72, 340, 52, 26);
        ctx1.fill();
        ctx1.stroke();
        ctx1.fillStyle = primary;
        ctx1.font = 'bold 18px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText('✦ CARTELA FÍSICA OFICIAL ✦', 620, 104);
        ctx1.restore();

        // Pílula do Criador (Direita)
        ctx1.save();
        ctx1.fillStyle = '#FFFFFF';
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(840, 64, 332, 68, 34);
        ctx1.fill();
        ctx1.stroke();

        // Avatar/Logo do Criador
        const avX = 856;
        const avY = 76;
        const avR = 22;
        ctx1.save();
        ctx1.beginPath();
        ctx1.arc(avX + avR, avY + avR, avR, 0, Math.PI * 2);
        ctx1.closePath();
        ctx1.clip();
        if (brandLogo) {
          ctx1.drawImage(brandLogo, avX, avY, avR * 2, avR * 2);
        } else {
          ctx1.fillStyle = primary;
          ctx1.fillRect(avX, avY, avR * 2, avR * 2);
          ctx1.fillStyle = '#FFFFFF';
          ctx1.font = 'bold 17px sans-serif';
          ctx1.textAlign = 'center';
          ctx1.fillText(brandInitials, avX + avR, avY + avR + 6);
        }
        ctx1.restore();

        ctx1.textAlign = 'left';
        ctx1.fillStyle = '#526480';
        ctx1.font = 'bold 13px sans-serif';
        ctx1.fillText('ORGANIZADOR OFICIAL', 912, 91);
        ctx1.fillStyle = '#0D1729';
        ctx1.font = 'bold 19px sans-serif';
        ctx1.fillText(brandName.slice(0, 20), 912, 115);
        ctx1.restore();

        // --- CARD DE DESTAQUE DO PRÊMIO (HERO CARD) ---
        const heroY = 154;
        const heroH = 290;
        ctx1.save();
        ctx1.fillStyle = '#FFFFFF';
        ctx1.shadowColor = 'rgba(13, 23, 41, 0.07)';
        ctx1.shadowBlur = 24;
        ctx1.shadowOffsetY = 8;
        ctx1.beginPath();
        ctx1.roundRect(68, heroY, A4_W - 136, heroH, 28);
        ctx1.fill();
        ctx1.restore();

        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(68, heroY, A4_W - 136, heroH, 28);
        ctx1.stroke();

        // Foto do Prêmio (Esquerda do Card)
        const imgBoxX = 92;
        const imgBoxY = heroY + 24;
        const imgBoxW = 242;
        const imgBoxH = 242;
        ctx1.save();
        ctx1.beginPath();
        ctx1.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 22);
        ctx1.closePath();
        ctx1.clip();
        ctx1.fillStyle = surfaceBg;
        ctx1.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
        if (prizeImg) {
          const scale = Math.max(imgBoxW / prizeImg.width, imgBoxH / prizeImg.height);
          const dw = prizeImg.width * scale;
          const dh = prizeImg.height * scale;
          ctx1.drawImage(
            prizeImg,
            imgBoxX + (imgBoxW - dw) / 2,
            imgBoxY + (imgBoxH - dh) / 2,
            dw,
            dh
          );
        } else {
          ctx1.fillStyle = primarySoft;
          ctx1.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
          ctx1.fillStyle = primary;
          ctx1.font = 'bold 22px sans-serif';
          ctx1.textAlign = 'center';
          ctx1.fillText('PRÊMIO OFICIAL', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 + 8);
        }
        ctx1.restore();

        // Informações Centrais do Prêmio
        const infoX = 358;
        ctx1.textAlign = 'left';
        ctx1.fillStyle = primary;
        ctx1.font = 'bold 16px sans-serif';
        ctx1.fillText(`CAMPANHA COM ${total} COTAS`, infoX, heroY + 48);

        // Título da rifa (até 2 linhas)
        ctx1.fillStyle = '#0D1729';
        ctx1.font = 'bold 34px sans-serif';
        const titleWords = raffle.title.split(' ');
        let tLine1 = '';
        let tLine2 = '';
        for (const w of titleWords) {
          const test = tLine1 ? `${tLine1} ${w}` : w;
          if (ctx1.measureText(test).width < 520) {
            tLine1 = test;
          } else {
            tLine2 = tLine2 ? `${tLine2} ${w}` : w;
          }
        }
        ctx1.fillText(tLine1, infoX, heroY + 90);
        if (tLine2) {
          ctx1.fillText(tLine2.slice(0, 32), infoX, heroY + 130);
        }

        // Box de Valor por Cota
        const priceBoxY = heroY + (tLine2 ? 152 : 125);
        ctx1.fillStyle = surfaceBg;
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(infoX, priceBoxY, 290, 92, 20);
        ctx1.fill();
        ctx1.stroke();

        ctx1.fillStyle = '#526480';
        ctx1.font = 'bold 14px sans-serif';
        ctx1.fillText('VALOR POR COTA:', infoX + 20, priceBoxY + 30);
        ctx1.fillStyle = primary;
        ctx1.font = 'bold 36px sans-serif';
        ctx1.fillText(
          `R$ ${Number(raffle.ticket_price).toFixed(2)}`,
          infoX + 20,
          priceBoxY + 72
        );

        // QR Code da Página Online da Rifa (Direita do Hero Card)
        const qrBoxX = 918;
        const qrBoxY = heroY + 22;
        const qrBoxW = 230;
        const qrBoxH = 246;
        ctx1.fillStyle = surfaceBg;
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 22);
        ctx1.fill();
        ctx1.stroke();

        if (qrOnlineImg) {
          ctx1.drawImage(qrOnlineImg, qrBoxX + 25, qrBoxY + 14, 180, 180);
        }
        ctx1.fillStyle = '#0D1729';
        ctx1.font = 'bold 15px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText('VER RIFA ONLINE', qrBoxX + qrBoxW / 2, qrBoxY + 214);
        ctx1.fillStyle = '#526480';
        ctx1.font = '600 12px sans-serif';
        ctx1.fillText('Aponte a câmera do celular', qrBoxX + qrBoxW / 2, qrBoxY + 233);

        // --- CABEÇALHO DA GRADE DE COTAS ---
        const gridHeaderY = 474;
        ctx1.textAlign = 'left';
        ctx1.fillStyle = '#0D1729';
        ctx1.font = 'bold 24px sans-serif';
        ctx1.fillText('ESCOLHA SEUS NÚMEROS DA SORTE', 68, gridHeaderY);

        // Legenda direita
        ctx1.textAlign = 'right';
        ctx1.fillStyle = '#475872';
        ctx1.font = 'bold 15px sans-serif';
        ctx1.fillText(
          markPaidOnGrid && paidSet.size > 0
            ? `[  ] Disponível   |   [ X ] Já Vendido (${paidSet.size})`
            : 'Assinale os números escolhidos e anote seus dados na Página 2',
          A4_W - 68,
          gridHeaderY
        );

        // --- GRADE DE COTAS (10 COLUNAS, FIEL AO SITE) ---
        const gridTop = 496;
        const gridBottom = 1648;
        const availH = gridBottom - gridTop;
        const cols = 10;
        const rows = Math.ceil(total / cols);
        const gapX = 10;
        const gapY = rows <= 10 ? 12 : rows <= 15 ? 9 : 7;
        const gridW = A4_W - 136;
        const cellW = (gridW - gapX * (cols - 1)) / cols;
        const cellH = Math.min(78, (availH - gapY * (rows - 1)) / rows);

        for (let i = 1; i <= total; i++) {
          const idx = i - 1;
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          const cx = 68 + c * (cellW + gapX);
          const cy = gridTop + r * (cellH + gapY);
          const isPaid = paidSet.has(i);

          ctx1.save();
          ctx1.fillStyle = isPaid ? '#FFF0F0' : '#FFFFFF';
          ctx1.strokeStyle = isPaid ? '#FCA5A5' : primaryBorder;
          ctx1.lineWidth = 2;
          ctx1.beginPath();
          ctx1.roundRect(cx, cy, cellW, cellH, 14);
          ctx1.fill();
          ctx1.stroke();

          const numLabel = i.toString().padStart(3, '0');
          ctx1.fillStyle = isPaid ? '#DC2626' : '#0D1729';
          ctx1.font = `bold ${cellH >= 58 ? 24 : 20}px sans-serif`;
          ctx1.textAlign = 'center';
          ctx1.fillText(numLabel, cx + cellW / 2, cy + cellH / 2 + (cellH >= 58 ? 8 : 7));

          if (isPaid) {
            // Traço vermelho de cota paga
            ctx1.strokeStyle = '#DC2626';
            ctx1.lineWidth = 2.5;
            ctx1.beginPath();
            ctx1.moveTo(cx + 16, cy + cellH / 2);
            ctx1.lineTo(cx + cellW - 16, cy + cellH / 2);
            ctx1.stroke();
          }
          ctx1.restore();
        }

        // Rodapé Página 1
        ctx1.textAlign = 'center';
        ctx1.fillStyle = '#526480';
        ctx1.font = 'bold 15px sans-serif';
        ctx1.fillText(
          `Página 1/2 • Campanha Oficial gerenciada por ${brandName} • Tecnologia FastRifa (${publicRaffleUrl})`,
          A4_W / 2,
          1700
        );

        // =========================================================================
        // PÁGINA 2: FOLHA DE CONTROLE PRESENCIAL + QR CODE CALCULADORA PIX
        // =========================================================================
        const c2 = document.createElement('canvas');
        c2.width = A4_W;
        c2.height = A4_H;
        const ctx2 = c2.getContext('2d')!;

        ctx2.fillStyle = '#FFFFFF';
        ctx2.fillRect(0, 0, A4_W, A4_H);

        drawLuckyWatermarks(ctx2, primary, primaryDark);

        ctx2.strokeStyle = primaryBorder;
        ctx2.lineWidth = 3;
        ctx2.beginPath();
        ctx2.roundRect(36, 36, A4_W - 72, A4_H - 72, 34);
        ctx2.stroke();

        // --- CABEÇALHO DA PÁGINA 2 COM QR CODE DE PAGAMENTO PIX INTELIGENTE ---
        const p2HeaderY = 60;
        const p2HeaderH = 225;
        ctx2.fillStyle = surfaceBg;
        ctx2.strokeStyle = primaryBorder;
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.roundRect(64, p2HeaderY, A4_W - 128, p2HeaderH, 24);
        ctx2.fill();
        ctx2.stroke();

        // Logos e Título à esquerda do cabeçalho da Página 2
        if (fastRifaLogo) {
          const lh = 34;
          const lw = (fastRifaLogo.width / fastRifaLogo.height) * lh;
          ctx2.drawImage(fastRifaLogo, 88, p2HeaderY + 22, lw, lh);
        }
        ctx2.textAlign = 'left';
        ctx2.fillStyle = primary;
        ctx2.font = 'bold 15px sans-serif';
        ctx2.fillText(
          `FOLHA DE CONTROLE PRESENCIAL • ${brandName.toUpperCase()}`,
          245,
          p2HeaderY + 45
        );

        ctx2.fillStyle = '#0D1729';
        ctx2.font = 'bold 28px sans-serif';
        ctx2.fillText(raffle.title.slice(0, 40), 88, p2HeaderY + 92);

        ctx2.fillStyle = '#475872';
        ctx2.font = 'bold 18px sans-serif';
        ctx2.fillText(
          `Valor unitário: R$ ${Number(raffle.ticket_price).toFixed(2)}  |  Chave PIX (${raffle.pix_key_type.toUpperCase()}): ${raffle.pix_key}`,
          88,
          p2HeaderY + 128
        );

        // Box de instrução do QR Code Inteligente
        ctx2.fillStyle = '#FFFFFF';
        ctx2.strokeStyle = primaryBorder;
        ctx2.lineWidth = 1.5;
        ctx2.beginPath();
        ctx2.roundRect(88, p2HeaderY + 146, 820, 60, 14);
        ctx2.fill();
        ctx2.stroke();

        drawPixDiamondIcon(ctx2, 104, p2HeaderY + 161, 30, primary);
        ctx2.fillStyle = '#0D1729';
        ctx2.font = 'bold 16px sans-serif';
        ctx2.fillText(
          'COMO PAGAR PELO QR CODE AO LADO:',
          146,
          p2HeaderY + 172
        );
        ctx2.fillStyle = '#475872';
        ctx2.font = '600 14px sans-serif';
        ctx2.fillText(
          'Escaneie o QR Code → Digite quantas cotas escolheu → O sistema gera o PIX já com o valor total somado!',
          146,
          p2HeaderY + 194
        );

        // QR Code Calculadora PIX à direita
        const pixQrBoxX = 936;
        const pixQrBoxY = p2HeaderY + 14;
        ctx2.fillStyle = '#FFFFFF';
        ctx2.strokeStyle = primary;
        ctx2.lineWidth = 2.5;
        ctx2.beginPath();
        ctx2.roundRect(pixQrBoxX, pixQrBoxY, 216, 198, 18);
        ctx2.fill();
        ctx2.stroke();

        if (qrPixCalcImg) {
          ctx2.drawImage(qrPixCalcImg, pixQrBoxX + 31, pixQrBoxY + 10, 154, 154);
        }
        ctx2.fillStyle = primary;
        ctx2.font = 'bold 13px sans-serif';
        ctx2.textAlign = 'center';
        ctx2.fillText(
          'GERAR PIX SOMADO',
          pixQrBoxX + 108,
          pixQrBoxY + 182
        );

        // --- TABELA DE LINHAS NUMERADAS PARA ANOTAÇÃO À MÃO ---
        // Colunas adaptativas para caber até 200 números confortavelmente
        const listTop = 306;
        const listBottom = 1656;
        const listH = listBottom - listTop;
        const listCols = total <= 45 ? 1 : total <= 100 ? 2 : total <= 150 ? 3 : 4;
        const rowsPerCol = Math.ceil(total / listCols);
        const colGap = 18;
        const totalListW = A4_W - 128;
        const colW = (totalListW - colGap * (listCols - 1)) / listCols;
        const rowH = listH / (rowsPerCol + 1); // +1 para cabeçalho da coluna

        // Mapear compradores já pagos online caso markPaidOnGrid esteja ativo
        for (let c = 0; c < listCols; c++) {
          const colX = 64 + c * (colW + colGap);

          // Cabeçalho da coluna
          ctx2.fillStyle = primary;
          ctx2.beginPath();
          ctx2.roundRect(colX, listTop, colW, Math.min(34, rowH * 0.92), 8);
          ctx2.fill();

          ctx2.fillStyle = '#FFFFFF';
          ctx2.font = `bold ${listCols >= 3 ? 11 : 13}px sans-serif`;
          ctx2.textAlign = 'left';
          ctx2.fillText('Nº', colX + 10, listTop + Math.min(22, rowH * 0.65));
          ctx2.fillText('NOME DO COMPRADOR', colX + 52, listTop + Math.min(22, rowH * 0.65));
          ctx2.textAlign = 'right';
          ctx2.fillText('WHATSAPP  /  PIX PAGO', colX + colW - 10, listTop + Math.min(22, rowH * 0.65));

          for (let r = 0; r < rowsPerCol; r++) {
            const ticketNum = c * rowsPerCol + r + 1;
            if (ticketNum > total) break;

            const ry = listTop + (r + 1) * rowH;
            const isPaidOnline = paidSet.has(ticketNum);

            // Fundo zebrado suave para facilitar escrita
            if (r % 2 === 1) {
              ctx2.fillStyle = '#F8FAFC';
              ctx2.fillRect(colX, ry, colW, rowH - 2);
            }

            const midY = ry + rowH * 0.68;
            const iconSize = Math.min(16, Math.max(11, rowH * 0.56));

            // Número da cota (#001)
            ctx2.textAlign = 'left';
            ctx2.fillStyle = isPaidOnline ? '#DC2626' : '#0D1729';
            ctx2.font = `bold ${listCols >= 3 ? 12 : 14}px sans-serif`;
            ctx2.fillText(
              `#${ticketNum.toString().padStart(3, '0')}`,
              colX + 6,
              midY
            );

            // Cálculo das posições de Nome, WhatsApp e Checkbox PIX
            const nameStartX = colX + (listCols >= 3 ? 44 : 52);
            const pixSectionW = listCols >= 3 ? 42 : 52;
            const whatsSectionW = listCols >= 3 ? 85 : 135;
            const nameEndX = colX + colW - pixSectionW - whatsSectionW - 12;

            // Linha para anotar o Nome
            ctx2.strokeStyle = '#CBD5E1';
            ctx2.lineWidth = 1.2;
            ctx2.beginPath();
            ctx2.moveTo(nameStartX, ry + rowH - 4);
            ctx2.lineTo(nameEndX, ry + rowH - 4);
            ctx2.stroke();

            if (isPaidOnline) {
              ctx2.fillStyle = '#DC2626';
              ctx2.font = `bold ${listCols >= 3 ? 10 : 12}px sans-serif`;
              ctx2.fillText('PAGO ONLINE', nameStartX + 4, midY);
            }

            // Ícone do WhatsApp + linha para anotar telefone
            const whatsX = nameEndX + 8;
            drawWhatsAppIcon(ctx2, whatsX, midY - iconSize + 2, iconSize);

            ctx2.strokeStyle = '#CBD5E1';
            ctx2.beginPath();
            ctx2.moveTo(whatsX + iconSize + 4, ry + rowH - 4);
            ctx2.lineTo(colX + colW - pixSectionW - 8, ry + rowH - 4);
            ctx2.stroke();

            // Ícone do PIX + Checkbox [ ☐ ] para marcar Vzinho quando pago
            const pixX = colX + colW - pixSectionW;
            drawPixDiamondIcon(ctx2, pixX, midY - iconSize + 2, iconSize, primary);

            const boxSize = Math.min(16, Math.max(12, rowH * 0.58));
            const boxX = pixX + iconSize + 6;
            const boxY = midY - boxSize + 2;

            ctx2.fillStyle = isPaidOnline ? '#DCFCE7' : '#FFFFFF';
            ctx2.strokeStyle = isPaidOnline ? '#16A34A' : '#64748B';
            ctx2.lineWidth = 1.6;
            ctx2.beginPath();
            ctx2.roundRect(boxX, boxY, boxSize, boxSize, 3);
            ctx2.fill();
            ctx2.stroke();

            // Se já foi pago online, desenha o Vzinho dentro do checkbox
            if (isPaidOnline) {
              ctx2.strokeStyle = '#16A34A';
              ctx2.lineWidth = 2;
              ctx2.beginPath();
              ctx2.moveTo(boxX + 3, boxY + boxSize * 0.55);
              ctx2.lineTo(boxX + boxSize * 0.42, boxY + boxSize - 3);
              ctx2.lineTo(boxX + boxSize - 2.5, boxY + 3);
              ctx2.stroke();
            }
          }
        }

        // Rodapé Página 2
        ctx2.textAlign = 'center';
        ctx2.fillStyle = '#526480';
        ctx2.font = 'bold 15px sans-serif';
        ctx2.fillText(
          `Página 2/2 • Controle Presencial e Calculadora PIX (${smartPixCalculatorUrl})`,
          A4_W / 2,
          1700
        );

        setPage1DataUrl(c1.toDataURL('image/jpeg', 0.94));
        setPage2DataUrl(c2.toDataURL('image/jpeg', 0.94));
      } catch (err) {
        console.error('Erro ao renderizar cartela física:', err);
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    renderPages();

    return () => {
      cancelled = true;
    };
  }, [
    isOpen,
    raffle,
    paidTicketNumbers,
    markPaidOnGrid,
    publicRaffleUrl,
    smartPixCalculatorUrl,
    isGreen,
    primary,
    primaryDark,
    primarySoft,
    primaryBorder,
    surfaceBg,
  ]);

  if (!isOpen) return null;

  function handleDownloadPdf() {
    if (!page1DataUrl || !page2DataUrl) return;
    const pdfBlob = buildMultiPageA4Pdf([
      { jpegDataUrl: page1DataUrl, widthPx: A4_W, heightPx: A4_H },
      { jpegDataUrl: page2DataUrl, widthPx: A4_W, heightPx: A4_H },
    ]);

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cartela-fastrifa-${raffle.slug}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function handlePrintDirect() {
    if (!page1DataUrl || !page2DataUrl) return;
    const printWin = window.open('', '_blank');
    if (!printWin) {
      handleDownloadPdf();
      return;
    }
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cartela Física — ${raffle.title}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; }
            .page { width: 210mm; height: 297mm; page-break-after: always; display: block; }
            .page:last-child { page-break-after: auto; }
          </style>
        </head>
        <body>
          <img src="${page1DataUrl}" class="page" />
          <img src="${page2DataUrl}" class="page" />
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0D1729]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="ora-card rounded-[32px] max-w-4xl w-full p-5 sm:p-8 space-y-6 relative my-auto max-h-[94vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar gerador de cartela"
          className="absolute right-5 top-5 p-2.5 bg-[#F5F9FF] hover:bg-[#E0E9F7] text-[#475872] hover:text-[#0D1729] rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="space-y-1.5 pr-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF5FF] border border-[#CDE0FC] text-[#0869F5] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cartela Física A4 Pronta para Impressão (2 Páginas)</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.03em]">
            Gerar Cartela Física em PDF
          </h2>
          <p className="text-xs sm:text-sm text-[#475872]">
            Página 1 com vitrine estilizada e grade de números + Página 2 com controle de compradores, ícones WhatsApp/PIX, checkbox e QR Code de pagamento PIX somado.
          </p>
        </div>

        {/* Controles de Visualização e Sincronização */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[20px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePreviewPage(1)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activePreviewPage === 1
                  ? 'bg-[#0869F5] text-white shadow-sm'
                  : 'bg-white text-[#475872] border border-[#D9E5F7] hover:text-[#0D1729]'
              }`}
            >
              Página 1: Cartela Vitrine
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewPage(2)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activePreviewPage === 2
                  ? 'bg-[#0869F5] text-white shadow-sm'
                  : 'bg-white text-[#475872] border border-[#D9E5F7] hover:text-[#0D1729]'
              }`}
            >
              Página 2: Lista + QR Code PIX
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-[#14213A] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={markPaidOnGrid}
              onChange={(e) => setMarkPaidOnGrid(e.target.checked)}
              className="w-4 h-4 rounded accent-[#0869F5]"
            />
            <span>Marcar cotas já pagas online ({paidTicketNumbers.length})</span>
          </label>
        </div>

        {/* Preview da Folha A4 */}
        <div className="bg-[#E8F0FE] border border-[#CDE0FC] rounded-[24px] p-4 sm:p-6 flex flex-col items-center justify-center min-h-[420px]">
          {isGenerating || !page1DataUrl || !page2DataUrl ? (
            <div className="py-20 flex flex-col items-center gap-3 text-[#475872]">
              <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin" />
              <span className="text-sm font-semibold">
                Montando as 2 páginas A4 em alta definição...
              </span>
            </div>
          ) : (
            <div className="w-full max-w-[520px] shadow-[0_20px_50px_rgba(13,23,41,0.18)] rounded-xl overflow-hidden border border-white bg-white">
              <img
                src={activePreviewPage === 1 ? page1DataUrl : page2DataUrl}
                alt={`Preview Página ${activePreviewPage}`}
                className="w-full h-auto block"
              />
            </div>
          )}
        </div>

        {/* Ações Finais: Baixar PDF, Imprimir e Testar Calculadora PIX */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <a
            href={`/r/${raffle.slug}/pix`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-[#0869F5] hover:underline inline-flex items-center gap-1.5"
          >
            <QrIcon className="w-4 h-4" />
            <span>Testar página do QR Code PIX da Cartela (/r/{raffle.slug}/pix)</span>
          </a>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handlePrintDirect}
              className="ora-btn-secondary px-5 py-3.5 rounded-[18px] text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#0869F5]" />
              <span>Imprimir Direto</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className="ora-btn-primary px-6 py-3.5 rounded-[18px] text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-[0_12px_28px_rgba(8,105,245,0.28)] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Cartela em PDF (2 Páginas)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
