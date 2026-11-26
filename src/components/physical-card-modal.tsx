'use client';

import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { buildMultiPageA4Pdf } from '@/lib/pdf-builder';
import { generateBrandInitials } from '@/lib/image-processor';
import { getRafflePixPath, getRafflePublicPath } from '@/lib/raffle-urls';
import {
  X,
  Download,
  Printer,
  Sparkles,
  QrCode as QrIcon,
  Loader2,
} from 'lucide-react';
import type { Raffle } from '@/types/database.types';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/firebase/auth-context';

interface PhysicalCardModalProps {
  raffle: Raffle;
  paidTicketNumbers: number[];
  pendingTicketNumbers?: number[];
  isOpen: boolean;
  onClose: () => void;
}

// Dimensões A4 em alta definição (proporção exata A4 1 : 1.4142)
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

function formatNumberList(nums: number[], maxItems = 28): string {
  if (nums.length === 0) return 'Nenhum até o momento';
  const sorted = [...nums].sort((a, b) => a - b);
  const formatted = sorted
    .slice(0, maxItems)
    .map((n) => `#${n.toString().padStart(3, '0')}`)
    .join(', ');
  if (sorted.length > maxItems) {
    return `${formatted} e mais ${sorted.length - maxItems}...`;
  }
  return formatted;
}

/**
 * Desenha elementos sutis de sorte (trevo, ferradura, estrelas)
 * com baixa opacidade ao redor da página A4.
 */
function drawLuckyWatermarks(
  ctx: CanvasRenderingContext2D,
  primaryColor: string,
  secondaryColor: string
) {
  ctx.save();

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
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = size * 0.08;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, r * 0.5);
    ctx.quadraticCurveTo(size * 0.25, size * 0.55, size * 0.12, size * 0.78);
    ctx.stroke();
    ctx.restore();
  }

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

  drawClover(115, 220, 62, -0.25, 0.055);
  drawHorseshoe(1125, 240, 62, 0.3, 0.055);
  drawClover(1120, 860, 66, 0.22, 0.05);
  drawHorseshoe(120, 920, 66, -0.35, 0.05);
  drawClover(125, 1580, 60, 0.18, 0.055);
  drawHorseshoe(1115, 1560, 60, -0.2, 0.055);

  drawSparkle(220, 130, 13, 0.07);
  drawSparkle(1030, 140, 13, 0.07);
  drawSparkle(105, 560, 14, 0.07);
  drawSparkle(1135, 540, 14, 0.07);
  drawSparkle(110, 1280, 13, 0.07);
  drawSparkle(1130, 1250, 14, 0.07);

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

  ctx.beginPath();
  ctx.moveTo(x + size * 0.2, y + size * 0.75);
  ctx.lineTo(x + size * 0.08, y + size * 0.96);
  ctx.lineTo(x + size * 0.4, y + size * 0.86);
  ctx.closePath();
  ctx.fill();

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
  pendingTicketNumbers = [],
  isOpen,
  onClose,
}: PhysicalCardModalProps) {
  const { theme } = useTheme();
  const { profile } = useAuth();

  const [activePreviewPage, setActivePreviewPage] = useState<1 | 2>(1);
  const [markOccupiedOnGrid, setMarkOccupiedOnGrid] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [page1DataUrl, setPage1DataUrl] = useState<string | null>(null);
  const [page2DataUrl, setPage2DataUrl] = useState<string | null>(null);

  // Determina a cor com prioridade para o seletor ativo do painel
  const defaultThemeColor = useMemo<'green' | 'blue'>(() => {
    if (theme === 'green' || theme === 'blue') return theme;
    if (profile?.brand_color === 'green' || profile?.brand_color === 'blue') return profile.brand_color;
    if (raffle.brand_color === 'green' || raffle.brand_color === 'blue') return raffle.brand_color;
    return 'green';
  }, [theme, profile?.brand_color, raffle.brand_color]);

  const [selectedColor, setSelectedColor] = useState<'green' | 'blue'>(defaultThemeColor);

  useEffect(() => {
    setSelectedColor(defaultThemeColor);
  }, [defaultThemeColor, isOpen]);

  // Nunca codifica localhost nos QR Codes da cartela para que celulares externos sempre consigam abrir
  const publicOrigin = useMemo(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        return window.location.origin;
      }
    }
    return 'https://fastrifa.vercel.app';
  }, []);

  const publicPath = getRafflePublicPath(raffle);
  const pixPath = getRafflePixPath(raffle);
  const publicRaffleUrl = `${publicOrigin}${publicPath}`;
  const smartPixCalculatorUrl = `${publicOrigin}${pixPath}`;

  const isGreen = selectedColor === 'green';
  const primary = isGreen ? '#00A868' : '#0869F5';
  const primaryDark = isGreen ? '#064E3B' : '#052498';
  const primarySoft = isGreen ? '#E8F7F0' : '#EDF5FF';
  const primaryBorder = isGreen ? '#B9E7D2' : '#CDE0FC';
  const surfaceBg = isGreen ? '#F3FAF6' : '#F5F9FF';

  useEffect(() => {
    if (!isOpen || raffle.total_tickets > 200) return;
    let cancelled = false;

    async function renderPages() {
      setIsGenerating(true);
      try {
        const [fastRifaLogo, brandLogo, prizeImg, qrOnlineUrl, qrPixCalcUrl] =
          await Promise.all([
            loadImage('/logo-fastrifa.png'),
            raffle.brand_logo_url
              ? loadImage(raffle.brand_logo_url)
              : Promise.resolve(null),
            raffle.prize_image_url
              ? loadImage(raffle.prize_image_url)
              : Promise.resolve(null),
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

        const paidSet = new Set(markOccupiedOnGrid ? paidTicketNumbers : []);
        const pendingSet = new Set(
          markOccupiedOnGrid
            ? pendingTicketNumbers.filter((n) => !paidSet.has(n))
            : []
        );

        const brandName = raffle.brand_name || 'Organizador Oficial';
        const brandInitials = generateBrandInitials(brandName);
        const total = Math.min(200, Math.max(1, raffle.total_tickets));
        const availableCount = Math.max(0, total - paidSet.size - pendingSet.size);
        const hasOccupied = paidSet.size > 0 || pendingSet.size > 0;

        // =========================================================================
        // PÁGINA 1: VITRINE ESTILIZADA & GRADE COM DISCRIMINAÇÃO DE VENDIDOS E RESERVADOS
        // =========================================================================
        const c1 = document.createElement('canvas');
        c1.width = A4_W;
        c1.height = A4_H;
        const ctx1 = c1.getContext('2d')!;

        const bgGrad1 = ctx1.createLinearGradient(0, 0, A4_W, A4_H);
        bgGrad1.addColorStop(0, '#FFFFFF');
        bgGrad1.addColorStop(0.5, surfaceBg);
        bgGrad1.addColorStop(1, primarySoft);
        ctx1.fillStyle = bgGrad1;
        ctx1.fillRect(0, 0, A4_W, A4_H);

        drawLuckyWatermarks(ctx1, primary, primaryDark);

        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 3;
        ctx1.beginPath();
        ctx1.roundRect(36, 36, A4_W - 72, A4_H - 72, 34);
        ctx1.stroke();

        // --- TOPO: Logo FastRifa (Esquerda) + Badge Central + Logo/Marca do Criador (Direita) ---
        ctx1.save();
        ctx1.fillStyle = '#FFFFFF';
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(68, 60, 240, 64, 32);
        ctx1.fill();
        ctx1.stroke();
        if (fastRifaLogo) {
          const lh = 40;
          const lw = (fastRifaLogo.width / fastRifaLogo.height) * lh;
          ctx1.drawImage(
            fastRifaLogo,
            68 + (240 - lw) / 2,
            60 + (64 - lh) / 2,
            lw,
            lh
          );
        } else {
          ctx1.fillStyle = primary;
          ctx1.font = 'bold 26px sans-serif';
          ctx1.textAlign = 'center';
          ctx1.fillText('FastRifa', 188, 102);
        }
        ctx1.restore();

        // Badge Central
        ctx1.save();
        ctx1.fillStyle = primarySoft;
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(450, 66, 340, 50, 25);
        ctx1.fill();
        ctx1.stroke();
        ctx1.fillStyle = primary;
        ctx1.font = 'bold 17px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText('✦ CARTELA FÍSICA OFICIAL ✦', 620, 97);
        ctx1.restore();

        // Pílula do Criador
        ctx1.save();
        ctx1.fillStyle = '#FFFFFF';
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(840, 60, 332, 64, 32);
        ctx1.fill();
        ctx1.stroke();

        const avX = 856;
        const avY = 70;
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
        ctx1.font = 'bold 12px sans-serif';
        ctx1.fillText('ORGANIZADOR OFICIAL', 912, 86);
        ctx1.fillStyle = '#0D1729';
        ctx1.font = 'bold 18px sans-serif';
        ctx1.fillText(brandName.slice(0, 20), 912, 109);
        ctx1.restore();

        // --- CARD DE DESTAQUE DO PRÊMIO (HERO CARD) ---
        const heroY = 142;
        const heroH = 266;
        ctx1.save();
        ctx1.fillStyle = '#FFFFFF';
        ctx1.shadowColor = 'rgba(13, 23, 41, 0.07)';
        ctx1.shadowBlur = 24;
        ctx1.shadowOffsetY = 8;
        ctx1.beginPath();
        ctx1.roundRect(68, heroY, A4_W - 136, heroH, 26);
        ctx1.fill();
        ctx1.restore();

        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(68, heroY, A4_W - 136, heroH, 26);
        ctx1.stroke();

        // Foto do Prêmio
        const imgBoxX = 90;
        const imgBoxY = heroY + 20;
        const imgBoxW = 226;
        const imgBoxH = 226;
        ctx1.save();
        ctx1.beginPath();
        ctx1.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 20);
        ctx1.closePath();
        ctx1.clip();
        ctx1.fillStyle = surfaceBg;
        ctx1.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);
        if (prizeImg) {
          const scale = Math.max(
            imgBoxW / prizeImg.width,
            imgBoxH / prizeImg.height
          );
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
          ctx1.font = 'bold 20px sans-serif';
          ctx1.textAlign = 'center';
          ctx1.fillText(
            'PRÊMIO OFICIAL',
            imgBoxX + imgBoxW / 2,
            imgBoxY + imgBoxH / 2 + 8
          );
        }
        ctx1.restore();

        // Informações Centrais do Prêmio
        const infoX = 342;
        ctx1.textAlign = 'left';
        ctx1.fillStyle = primary;
        ctx1.font = 'bold 15px sans-serif';
        ctx1.fillText(`CAMPANHA COM ${total} COTAS`, infoX, heroY + 42);

        ctx1.fillStyle = '#0D1729';
        ctx1.font = 'bold 32px sans-serif';
        const titleWords = raffle.title.split(' ');
        let tLine1 = '';
        let tLine2 = '';
        for (const w of titleWords) {
          const test = tLine1 ? `${tLine1} ${w}` : w;
          if (ctx1.measureText(test).width < 530) {
            tLine1 = test;
          } else {
            tLine2 = tLine2 ? `${tLine2} ${w}` : w;
          }
        }
        ctx1.fillText(tLine1, infoX, heroY + 82);
        if (tLine2) {
          ctx1.fillText(tLine2.slice(0, 34), infoX, heroY + 118);
        }

        const priceBoxY = heroY + (tLine2 ? 138 : 112);
        ctx1.fillStyle = surfaceBg;
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(infoX, priceBoxY, 285, 86, 18);
        ctx1.fill();
        ctx1.stroke();

        ctx1.fillStyle = '#526480';
        ctx1.font = 'bold 13px sans-serif';
        ctx1.fillText('VALOR POR COTA:', infoX + 18, priceBoxY + 28);
        ctx1.fillStyle = primary;
        ctx1.font = 'bold 34px sans-serif';
        ctx1.fillText(
          `R$ ${Number(raffle.ticket_price).toFixed(2)}`,
          infoX + 18,
          priceBoxY + 68
        );

        // QR Code Online
        const qrBoxX = 924;
        const qrBoxY = heroY + 18;
        const qrBoxW = 224;
        const qrBoxH = 230;
        ctx1.fillStyle = surfaceBg;
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 2;
        ctx1.beginPath();
        ctx1.roundRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 20);
        ctx1.fill();
        ctx1.stroke();

        if (qrOnlineImg) {
          ctx1.drawImage(qrOnlineImg, qrBoxX + 27, qrBoxY + 10, 170, 170);
        }
        ctx1.fillStyle = '#0D1729';
        ctx1.font = 'bold 14px sans-serif';
        ctx1.textAlign = 'center';
        ctx1.fillText('VER RIFA ONLINE', qrBoxX + qrBoxW / 2, qrBoxY + 198);
        ctx1.fillStyle = '#526480';
        ctx1.font = '600 11px sans-serif';
        ctx1.fillText(
          'Aponte a câmera do celular',
          qrBoxX + qrBoxW / 2,
          qrBoxY + 216
        );

        // --- BARRA DE LEGENDA VISUAL ---
        const legendBarY = 424;
        ctx1.fillStyle = '#FFFFFF';
        ctx1.strokeStyle = primaryBorder;
        ctx1.lineWidth = 1.8;
        ctx1.beginPath();
        ctx1.roundRect(68, legendBarY, A4_W - 136, 52, 16);
        ctx1.fill();
        ctx1.stroke();

        ctx1.textAlign = 'left';
        ctx1.fillStyle = '#0D1729';
        ctx1.font = 'bold 18px sans-serif';
        ctx1.fillText('ESCOLHA SEUS NÚMEROS:', 88, legendBarY + 33);

        if (hasOccupied) {
          // Indicador 1: Disponível
          const leg1X = 425;
          ctx1.fillStyle = '#FFFFFF';
          ctx1.strokeStyle = primaryBorder;
          ctx1.lineWidth = 2;
          ctx1.beginPath();
          ctx1.roundRect(leg1X, legendBarY + 14, 24, 24, 6);
          ctx1.fill();
          ctx1.stroke();
          ctx1.fillStyle = '#14213A';
          ctx1.font = 'bold 15px sans-serif';
          ctx1.fillText(`Disponível (${availableCount})`, leg1X + 34, legendBarY + 32);

          // Indicador 2: Vendido / Pago (Vermelho com traço)
          const leg2X = 660;
          ctx1.fillStyle = '#FEE2E2';
          ctx1.strokeStyle = '#EF4444';
          ctx1.lineWidth = 2;
          ctx1.beginPath();
          ctx1.roundRect(leg2X, legendBarY + 14, 24, 24, 6);
          ctx1.fill();
          ctx1.stroke();
          ctx1.strokeStyle = '#DC2626';
          ctx1.beginPath();
          ctx1.moveTo(leg2X + 4, legendBarY + 26);
          ctx1.lineTo(leg2X + 20, legendBarY + 26);
          ctx1.stroke();
          ctx1.fillStyle = '#DC2626';
          ctx1.font = 'bold 15px sans-serif';
          ctx1.fillText(`Vendido / Pago (${paidSet.size})`, leg2X + 34, legendBarY + 32);

          // Indicador 3: Reservado (Vermelho/Coral com traço)
          const leg3X = 925;
          ctx1.fillStyle = '#FFF1F2';
          ctx1.strokeStyle = '#FB7185';
          ctx1.lineWidth = 2;
          ctx1.beginPath();
          ctx1.roundRect(leg3X, legendBarY + 14, 24, 24, 6);
          ctx1.fill();
          ctx1.stroke();
          ctx1.strokeStyle = '#E11D48';
          ctx1.beginPath();
          ctx1.moveTo(leg3X + 4, legendBarY + 26);
          ctx1.lineTo(leg3X + 20, legendBarY + 26);
          ctx1.stroke();
          ctx1.fillStyle = '#E11D48';
          ctx1.font = 'bold 15px sans-serif';
          ctx1.fillText(`Reservado (${pendingSet.size})`, leg3X + 34, legendBarY + 32);
        } else {
          // Rifa sem reservas/vendas ainda: visual 100% limpo e positivo
          const leg1X = 425;
          ctx1.fillStyle = '#FFFFFF';
          ctx1.strokeStyle = primaryBorder;
          ctx1.lineWidth = 2;
          ctx1.beginPath();
          ctx1.roundRect(leg1X, legendBarY + 14, 24, 24, 6);
          ctx1.fill();
          ctx1.stroke();
          ctx1.fillStyle = primaryDark;
          ctx1.font = 'bold 15px sans-serif';
          ctx1.fillText(`Todas as ${total} cotas livres e disponíveis para você escolher!`, leg1X + 34, legendBarY + 32);
        }

        // --- GRADE DE COTAS (10 COLUNAS, FIEL AO SITE) ---
        const gridTop = 490;
        const gridBottom = hasOccupied ? 1528 : 1640;
        const availH = gridBottom - gridTop;
        const cols = 10;
        const rows = Math.ceil(total / cols);
        const gapX = 10;
        const gapY = rows <= 10 ? 11 : rows <= 15 ? 8 : 6;
        const gridW = A4_W - 136;
        const cellW = (gridW - gapX * (cols - 1)) / cols;
        const cellH = Math.min(74, (availH - gapY * (rows - 1)) / rows);

        for (let i = 1; i <= total; i++) {
          const idx = i - 1;
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          const cx = 68 + c * (cellW + gapX);
          const cy = gridTop + r * (cellH + gapY);
          const isPaid = paidSet.has(i);
          const isPending = pendingSet.has(i);
          const isOccupied = isPaid || isPending;

          ctx1.save();
          ctx1.fillStyle = isPaid
            ? '#FEE2E2'
            : isPending
            ? '#FFF1F2'
            : '#FFFFFF';
          ctx1.strokeStyle = isPaid
            ? '#EF4444'
            : isPending
            ? '#FB7185'
            : primaryBorder;
          ctx1.lineWidth = isOccupied ? 2.2 : 2;
          ctx1.beginPath();
          ctx1.roundRect(cx, cy, cellW, cellH, 13);
          ctx1.fill();
          ctx1.stroke();

          const numLabel = i.toString().padStart(3, '0');
          ctx1.fillStyle = isPaid
            ? '#B91C1C'
            : isPending
            ? '#E11D48'
            : '#0D1729';
          ctx1.font = `bold ${cellH >= 54 ? 22 : 18}px sans-serif`;
          ctx1.textAlign = 'center';
          const numY = isOccupied
            ? cy + cellH * 0.46 + (cellH >= 54 ? 4 : 3)
            : cy + cellH / 2 + (cellH >= 54 ? 8 : 6);
          ctx1.fillText(numLabel, cx + cellW / 2, numY);

          if (isOccupied) {
            // Traço vermelho horizontal cortando o número (Vendido ou Reservado)
            ctx1.strokeStyle = isPaid ? '#B91C1C' : '#E11D48';
            ctx1.lineWidth = 2.6;
            ctx1.beginPath();
            ctx1.moveTo(cx + 14, numY - 6);
            ctx1.lineTo(cx + cellW - 14, numY - 6);
            ctx1.stroke();

            // Tag discriminando VENDIDO vs RESERVADO
            ctx1.font = `bold ${cellH >= 54 ? 10 : 8.5}px sans-serif`;
            ctx1.fillStyle = isPaid ? '#B91C1C' : '#E11D48';
            ctx1.fillText(
              isPaid ? 'VENDIDO' : 'RESERVADO',
              cx + cellW / 2,
              cy + cellH - (cellH >= 54 ? 7 : 4)
            );
          }
          ctx1.restore();
        }

        // --- BOX INFERIOR DE LEGENDA DISCRIMINADA (QUAIS NÚMEROS FORAM VENDIDOS E RESERVADOS) ---
        if (hasOccupied) {
          const summaryBoxY = 1544;
          const summaryBoxH = 116;
          ctx1.fillStyle = '#FFFFFF';
          ctx1.strokeStyle = '#FECACA';
          ctx1.lineWidth = 2;
          ctx1.beginPath();
          ctx1.roundRect(68, summaryBoxY, A4_W - 136, summaryBoxH, 18);
          ctx1.fill();
          ctx1.stroke();

          ctx1.textAlign = 'left';
          ctx1.fillStyle = '#0D1729';
          ctx1.font = 'bold 14px sans-serif';
          ctx1.fillText(
            'LEGENDA DE COTAS INDISPONÍVEIS (MARCADAS EM VERMELHO COM TRAÇO):',
            88,
            summaryBoxY + 26
          );

          ctx1.fillStyle = '#B91C1C';
          ctx1.font = 'bold 13px sans-serif';
          ctx1.fillText(
            `• VENDIDOS / PAGOS (${paidSet.size}): ${formatNumberList(Array.from(paidSet), 26)}`,
            88,
            summaryBoxY + 58
          );

          ctx1.fillStyle = '#E11D48';
          ctx1.font = 'bold 13px sans-serif';
          ctx1.fillText(
            `• RESERVADOS AGUARDANDO PIX (${pendingSet.size}): ${formatNumberList(Array.from(pendingSet), 24)}`,
            88,
            summaryBoxY + 92
          );
        }

        // Rodapé Página 1
        ctx1.textAlign = 'center';
        ctx1.fillStyle = '#526480';
        ctx1.font = 'bold 14px sans-serif';
        ctx1.fillText(
          `Página 1/2 • Campanha Oficial gerenciada por ${brandName} • Tecnologia FastRifa (${publicRaffleUrl})`,
          A4_W / 2,
          1695
        );

        // =========================================================================
        // PÁGINA 2: FOLHA DE CONTROLE PRESENCIAL + QR CODE CALCULADORA PIX + LEGENDA
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
        const p2HeaderY = 56;
        const p2HeaderH = 216;
        ctx2.fillStyle = surfaceBg;
        ctx2.strokeStyle = primaryBorder;
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.roundRect(64, p2HeaderY, A4_W - 128, p2HeaderH, 24);
        ctx2.fill();
        ctx2.stroke();

        if (fastRifaLogo) {
          const lh = 32;
          const lw = (fastRifaLogo.width / fastRifaLogo.height) * lh;
          ctx2.drawImage(fastRifaLogo, 88, p2HeaderY + 18, lw, lh);
        }
        ctx2.textAlign = 'left';
        ctx2.fillStyle = primary;
        ctx2.font = 'bold 14px sans-serif';
        ctx2.fillText(
          `FOLHA DE CONTROLE PRESENCIAL • ${brandName.toUpperCase()}`,
          240,
          p2HeaderY + 40
        );

        ctx2.fillStyle = '#0D1729';
        ctx2.font = 'bold 26px sans-serif';
        ctx2.fillText(raffle.title.slice(0, 42), 88, p2HeaderY + 82);

        ctx2.fillStyle = '#475872';
        ctx2.font = 'bold 17px sans-serif';
        ctx2.fillText(
          `Valor unitário: R$ ${Number(raffle.ticket_price).toFixed(2)}  |  Chave PIX (${raffle.pix_key_type.toUpperCase()}): ${raffle.pix_key}`,
          88,
          p2HeaderY + 116
        );

        // Box de instrução do QR Code Inteligente
        ctx2.fillStyle = '#FFFFFF';
        ctx2.strokeStyle = primaryBorder;
        ctx2.lineWidth = 1.5;
        ctx2.beginPath();
        ctx2.roundRect(88, p2HeaderY + 134, 820, 62, 14);
        ctx2.fill();
        ctx2.stroke();

        drawPixDiamondIcon(ctx2, 104, p2HeaderY + 150, 30, primary);
        ctx2.fillStyle = '#0D1729';
        ctx2.font = 'bold 15px sans-serif';
        ctx2.fillText('CHECADOR DE NÚMEROS & PIX SOMADO (PÁGINA EXCLUSIVA):', 146, p2HeaderY + 162);
        ctx2.fillStyle = '#475872';
        ctx2.font = '600 13.5px sans-serif';
        ctx2.fillText(
          'Escaneie o QR Code → Cheque se cada número está livre (✓) → Reserve na hora e gere o PIX somado!',
          146,
          p2HeaderY + 184
        );

        // QR Code Calculadora PIX à direita
        const pixQrBoxX = 936;
        const pixQrBoxY = p2HeaderY + 12;
        ctx2.fillStyle = '#FFFFFF';
        ctx2.strokeStyle = primary;
        ctx2.lineWidth = 2.5;
        ctx2.beginPath();
        ctx2.roundRect(pixQrBoxX, pixQrBoxY, 216, 192, 18);
        ctx2.fill();
        ctx2.stroke();

        if (qrPixCalcImg) {
          ctx2.drawImage(qrPixCalcImg, pixQrBoxX + 33, pixQrBoxY + 8, 150, 150);
        }
        ctx2.fillStyle = primary;
        ctx2.font = 'bold 12px sans-serif';
        ctx2.textAlign = 'center';
        ctx2.fillText('CHECAR & GERAR PIX', pixQrBoxX + 108, pixQrBoxY + 176);

        // --- FAIXA DE LEGENDA DE VENDIDOS E RESERVADOS NA PÁGINA 2 ---
        if (hasOccupied) {
          const p2LegendY = 284;
          const p2LegendH = 58;
          ctx2.fillStyle = '#FFF5F5';
          ctx2.strokeStyle = '#FECACA';
          ctx2.lineWidth = 1.6;
          ctx2.beginPath();
          ctx2.roundRect(64, p2LegendY, A4_W - 128, p2LegendH, 14);
          ctx2.fill();
          ctx2.stroke();

          ctx2.textAlign = 'left';
          ctx2.fillStyle = '#0D1729';
          ctx2.font = 'bold 13px sans-serif';
          ctx2.fillText(
            `STATUS DA CARTELA:  Disponíveis: ${availableCount}   |   Vendidos/Pagos: ${paidSet.size}   |   Reservados: ${pendingSet.size}`,
            82,
            p2LegendY + 23
          );
          ctx2.fillStyle = '#B91C1C';
          ctx2.font = 'bold 12px sans-serif';
          ctx2.fillText(
            `Vendidos: ${formatNumberList(Array.from(paidSet), 14)}   •   Reservados: ${formatNumberList(Array.from(pendingSet), 14)}`,
            82,
            p2LegendY + 45
          );
        }

        // --- TABELA DE LINHAS NUMERADAS PARA ANOTAÇÃO À MÃO ---
        const listTop = hasOccupied ? 354 : 290;
        const listBottom = 1656;
        const listH = listBottom - listTop;
        const listCols =
          total <= 45 ? 1 : total <= 100 ? 2 : total <= 150 ? 3 : 4;
        const rowsPerCol = Math.ceil(total / listCols);
        const colGap = 18;
        const totalListW = A4_W - 128;
        const colW = (totalListW - colGap * (listCols - 1)) / listCols;
        const rowH = listH / (rowsPerCol + 1);

        for (let c = 0; c < listCols; c++) {
          const colX = 64 + c * (colW + colGap);

          // Cabeçalho da coluna
          ctx2.fillStyle = primary;
          ctx2.beginPath();
          ctx2.roundRect(colX, listTop, colW, Math.min(32, rowH * 0.92), 8);
          ctx2.fill();

          ctx2.fillStyle = '#FFFFFF';
          ctx2.font = `bold ${listCols >= 3 ? 10.5 : 12.5}px sans-serif`;
          ctx2.textAlign = 'left';
          ctx2.fillText('Nº', colX + 10, listTop + Math.min(21, rowH * 0.65));
          ctx2.fillText(
            'NOME DO COMPRADOR',
            colX + 50,
            listTop + Math.min(21, rowH * 0.65)
          );
          ctx2.textAlign = 'right';
          ctx2.fillText(
            'WHATSAPP  /  PIX PAGO',
            colX + colW - 10,
            listTop + Math.min(21, rowH * 0.65)
          );

          for (let r = 0; r < rowsPerCol; r++) {
            const ticketNum = c * rowsPerCol + r + 1;
            if (ticketNum > total) break;

            const ry = listTop + (r + 1) * rowH;
            const isPaidOnline = paidSet.has(ticketNum);
            const isPendingOnline = pendingSet.has(ticketNum);
            const isOccupied = isPaidOnline || isPendingOnline;

            // Fundo da linha: vermelho suave se vendido ou reservado
            if (isPaidOnline) {
              ctx2.fillStyle = '#FEE2E2';
              ctx2.fillRect(colX, ry, colW, rowH - 1.5);
            } else if (isPendingOnline) {
              ctx2.fillStyle = '#FFF1F2';
              ctx2.fillRect(colX, ry, colW, rowH - 1.5);
            } else if (r % 2 === 1) {
              ctx2.fillStyle = '#F8FAFC';
              ctx2.fillRect(colX, ry, colW, rowH - 1.5);
            }

            const midY = ry + rowH * 0.68;
            const iconSize = Math.min(15, Math.max(11, rowH * 0.55));

            // Número da cota (#001)
            ctx2.textAlign = 'left';
            ctx2.fillStyle = isPaidOnline
              ? '#B91C1C'
              : isPendingOnline
              ? '#E11D48'
              : '#0D1729';
            ctx2.font = `bold ${listCols >= 3 ? 11.5 : 13.5}px sans-serif`;
            const numText = `#${ticketNum.toString().padStart(3, '0')}`;
            ctx2.fillText(numText, colX + 6, midY);

            const nameStartX = colX + (listCols >= 3 ? 44 : 52);
            const pixSectionW = listCols >= 3 ? 42 : 52;
            const whatsSectionW = listCols >= 3 ? 82 : 130;
            const nameEndX = colX + colW - pixSectionW - whatsSectionW - 10;

            if (isOccupied) {
              // Traço vermelho no número da cota
              ctx2.strokeStyle = isPaidOnline ? '#B91C1C' : '#E11D48';
              ctx2.lineWidth = 2;
              ctx2.beginPath();
              ctx2.moveTo(colX + 5, midY - 4);
              ctx2.lineTo(nameStartX - 6, midY - 4);
              ctx2.stroke();
            }

            // Linha para anotar o Nome
            ctx2.strokeStyle = isOccupied ? '#FCA5A5' : '#CBD5E1';
            ctx2.lineWidth = 1.2;
            ctx2.beginPath();
            ctx2.moveTo(nameStartX, ry + rowH - 3.5);
            ctx2.lineTo(nameEndX, ry + rowH - 3.5);
            ctx2.stroke();

            if (isPaidOnline) {
              ctx2.fillStyle = '#B91C1C';
              ctx2.font = `bold ${listCols >= 3 ? 9.5 : 11.5}px sans-serif`;
              ctx2.fillText('VENDIDO / PAGO', nameStartX + 4, midY);
              // Traço vermelho na linha
              ctx2.strokeStyle = '#DC2626';
              ctx2.lineWidth = 1.6;
              ctx2.beginPath();
              ctx2.moveTo(nameStartX + 2, midY - 4);
              ctx2.lineTo(nameEndX - 4, midY - 4);
              ctx2.stroke();
            } else if (isPendingOnline) {
              ctx2.fillStyle = '#E11D48';
              ctx2.font = `bold ${listCols >= 3 ? 9.5 : 11.5}px sans-serif`;
              ctx2.fillText('RESERVADO', nameStartX + 4, midY);
              // Traço vermelho na linha
              ctx2.strokeStyle = '#E11D48';
              ctx2.lineWidth = 1.6;
              ctx2.beginPath();
              ctx2.moveTo(nameStartX + 2, midY - 4);
              ctx2.lineTo(nameEndX - 4, midY - 4);
              ctx2.stroke();
            }

            // Ícone do WhatsApp + linha para anotar telefone
            const whatsX = nameEndX + 6;
            drawWhatsAppIcon(ctx2, whatsX, midY - iconSize + 2, iconSize);

            ctx2.strokeStyle = isOccupied ? '#FCA5A5' : '#CBD5E1';
            ctx2.lineWidth = 1.2;
            ctx2.beginPath();
            ctx2.moveTo(whatsX + iconSize + 4, ry + rowH - 3.5);
            ctx2.lineTo(colX + colW - pixSectionW - 8, ry + rowH - 3.5);
            ctx2.stroke();

            // Ícone do PIX + Checkbox [ ☐ ]
            const pixX = colX + colW - pixSectionW;
            drawPixDiamondIcon(
              ctx2,
              pixX,
              midY - iconSize + 2,
              iconSize,
              isOccupied ? '#DC2626' : primary
            );

            const boxSize = Math.min(15, Math.max(11.5, rowH * 0.56));
            const boxX = pixX + iconSize + 6;
            const boxY = midY - boxSize + 2;

            ctx2.fillStyle = isPaidOnline
              ? '#FEE2E2'
              : isPendingOnline
              ? '#FFF1F2'
              : '#FFFFFF';
            ctx2.strokeStyle = isPaidOnline
              ? '#DC2626'
              : isPendingOnline
              ? '#E11D48'
              : '#64748B';
            ctx2.lineWidth = 1.6;
            ctx2.beginPath();
            ctx2.roundRect(boxX, boxY, boxSize, boxSize, 3);
            ctx2.fill();
            ctx2.stroke();

            if (isPaidOnline) {
              // Vzinho marcado para vendido/pago
              ctx2.strokeStyle = '#B91C1C';
              ctx2.lineWidth = 2;
              ctx2.beginPath();
              ctx2.moveTo(boxX + 2.5, boxY + boxSize * 0.55);
              ctx2.lineTo(boxX + boxSize * 0.42, boxY + boxSize - 2.5);
              ctx2.lineTo(boxX + boxSize - 2.5, boxY + 2.5);
              ctx2.stroke();
            } else if (isPendingOnline) {
              // Traço/R indicando reservado no checkbox
              ctx2.strokeStyle = '#E11D48';
              ctx2.lineWidth = 2;
              ctx2.beginPath();
              ctx2.moveTo(boxX + 3, boxY + boxSize / 2);
              ctx2.lineTo(boxX + boxSize - 3, boxY + boxSize / 2);
              ctx2.stroke();
            }
          }
        }

        // Rodapé Página 2
        ctx2.textAlign = 'center';
        ctx2.fillStyle = '#526480';
        ctx2.font = 'bold 14px sans-serif';
        ctx2.fillText(
          `Página 2/2 • Controle Presencial e Calculadora PIX (${smartPixCalculatorUrl})`,
          A4_W / 2,
          1695
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
    pendingTicketNumbers,
    markOccupiedOnGrid,
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

  if (!isOpen) return null;

  if (raffle.total_tickets > 200) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0D1729]/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="ora-card rounded-[24px] max-w-md w-full p-6 space-y-4 text-center relative">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F5F9FF] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700] flex items-center justify-center mx-auto">
            <Printer className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-xl text-[#0D1729]">
            Campanha Somente Virtual
          </h3>
          <p className="text-sm text-[#475872] leading-relaxed">
            Rifas com mais de 200 números ({raffle.total_tickets} cotas) funcionam exclusivamente no modo virtual (online) e não permitem a emissão de cartela física em PDF.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="ora-btn-primary w-full py-3 rounded-[16px] text-sm font-bold cursor-pointer"
          >
            Entendi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0D1729]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="ora-card rounded-[24px] sm:rounded-[32px] max-w-4xl w-full p-4 sm:p-8 space-y-5 sm:space-y-6 relative my-auto max-h-[92vh] overflow-y-auto">
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
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isGreen
              ? 'bg-[#E8F7F0] border border-[#B9E7D2] text-[#00A868]'
              : 'bg-[#EDF5FF] border border-[#CDE0FC] text-[#0869F5]'
          }`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cartela Física A4 Pronta para Impressão (2 Páginas)</span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#0D1729] tracking-[-0.03em]">
            Gerar Cartela Física em PDF
          </h2>
          <p className="text-xs sm:text-sm text-[#475872]">
            Página 1 e Página 2 já discriminam automaticamente os números <strong>Vendidos</strong> e <strong>Reservados</strong> em vermelho com traço e legenda completa.
          </p>
        </div>

        {/* Controles de Visualização, Cor e Sincronização */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#F5F9FF] border border-[#E0E9F7] rounded-[20px]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePreviewPage(1)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activePreviewPage === 1
                  ? isGreen
                    ? 'bg-[#00A868] text-white shadow-sm'
                    : 'bg-[#0869F5] text-white shadow-sm'
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
                  ? isGreen
                    ? 'bg-[#00A868] text-white shadow-sm'
                    : 'bg-[#0869F5] text-white shadow-sm'
                  : 'bg-white text-[#475872] border border-[#D9E5F7] hover:text-[#0D1729]'
              }`}
            >
              Página 2: Lista + QR Code PIX
            </button>

            {/* Seletor Rápido de Cor da Cartela (Honra o tema do painel) */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#D9E5F7] ml-1">
              <span className="text-[11px] font-bold text-[#526480] px-1">Cor:</span>
              <button
                type="button"
                onClick={() => setSelectedColor('green')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedColor === 'green'
                    ? 'bg-[#00A868] text-white shadow-xs'
                    : 'text-[#475872] hover:text-[#0D1729]'
                }`}
                title="Versão Verde da Cartela"
              >
                Verde
              </button>
              <button
                type="button"
                onClick={() => setSelectedColor('blue')}
                className={`px-2 py-0.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  selectedColor === 'blue'
                    ? 'bg-[#0869F5] text-white shadow-xs'
                    : 'text-[#475872] hover:text-[#0D1729]'
                }`}
                title="Versão Azul da Cartela"
              >
                Azul
              </button>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-[#14213A] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={markOccupiedOnGrid}
              onChange={(e) => setMarkOccupiedOnGrid(e.target.checked)}
              className={`w-4 h-4 rounded ${isGreen ? 'accent-[#00A868]' : 'accent-[#0869F5]'}`}
            />
            <span>
              Discriminar Vendidos ({paidTicketNumbers.length}) e Reservados ({pendingTicketNumbers.length})
            </span>
          </label>
        </div>

        {/* Preview da Folha A4 */}
        <div className={`rounded-[24px] p-4 sm:p-6 flex flex-col items-center justify-center min-h-[420px] border ${
          isGreen ? 'bg-[#E8F7F0] border-[#B9E7D2]' : 'bg-[#E8F0FE] border-[#CDE0FC]'
        }`}>
          {isGenerating || !page1DataUrl || !page2DataUrl ? (
            <div className="py-20 flex flex-col items-center gap-3 text-[#475872]">
              <Loader2 className={`w-8 h-8 animate-spin ${isGreen ? 'text-[#00A868]' : 'text-[#0869F5]'}`} />
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
            href={pixPath}
            target="_blank"
            rel="noreferrer"
            className={`text-xs font-bold hover:underline inline-flex items-center gap-1.5 ${
              isGreen ? 'text-[#00A868]' : 'text-[#0869F5]'
            }`}
          >
            <QrIcon className="w-4 h-4" />
            <span>Testar página do QR Code PIX da Cartela ({pixPath})</span>
          </a>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handlePrintDirect}
              className="ora-btn-secondary w-full sm:w-auto px-5 py-3.5 rounded-[18px] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className={`w-4 h-4 ${isGreen ? 'text-[#00A868]' : 'text-[#0869F5]'}`} />
              <span>Imprimir Direto</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleDownloadPdf}
              className={`ora-btn-primary w-full sm:w-auto px-6 py-3.5 rounded-[18px] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer ${
                isGreen
                  ? 'shadow-[0_12px_28px_rgba(0,168,104,0.28)]'
                  : 'shadow-[0_12px_28px_rgba(8,105,245,0.28)]'
              }`}
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
