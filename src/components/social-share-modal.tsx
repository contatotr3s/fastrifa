'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { generateBrandInitials } from '@/lib/image-processor';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Smartphone,
  Square,
  Sparkles,
  MessageCircle,
  QrCode as QrIcon,
} from 'lucide-react';
import type { Raffle } from '@/types/database.types';

interface SocialShareModalProps {
  raffle: Raffle;
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialShareModal({
  raffle,
  isOpen,
  onClose,
}: SocialShareModalProps) {
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [copiedText, setCopiedText] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasDataUrl, setCanvasDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const publicUrl =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
      ? `${window.location.origin}/r/${raffle.slug}`
      : `https://fastrifa.vercel.app/r/${raffle.slug}`;

  const brandName = raffle.brand_name || 'FastRifa Oficial';
  const initials = generateBrandInitials(brandName);

  // Render canvas whenever modal opens or format changes
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    async function drawCard() {
      setIsGenerating(true);
      try {
        const isStory = format === 'story';
        const width = isStory ? 1080 : 1080;
        const height = isStory ? 1920 : 1080;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Background Atmosphere (Luminous Oratry Gradient)
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#FFFFFF');
        bgGrad.addColorStop(0.35, '#F5F9FF');
        bgGrad.addColorStop(0.7, '#EAF2FF');
        bgGrad.addColorStop(1, '#D9E9FF');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Ambient radial glows
        const glow1 = ctx.createRadialGradient(width * 0.2, height * 0.2, 50, width * 0.2, height * 0.2, 600);
        glow1.addColorStop(0, 'rgba(8, 105, 245, 0.15)');
        glow1.addColorStop(1, 'rgba(8, 105, 245, 0)');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, width, height);

        const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 50, width * 0.8, height * 0.7, 700);
        glow2.addColorStop(0, 'rgba(98, 165, 255, 0.25)');
        glow2.addColorStop(1, 'rgba(98, 165, 255, 0)');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, width, height);

        // 2. Decorative Top Pill (Brand Badge)
        const pillY = isStory ? 120 : 70;
        const pillHeight = 76;
        const pillWidth = 420;
        const pillX = (width - pillWidth) / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(32, 75, 134, 0.12)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 38);
        ctx.fill();
        ctx.strokeStyle = '#D9E5F7';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // Brand Circle / Logo inside pill
        const logoSize = 54;
        const logoX = pillX + 12;
        const logoY = pillY + (pillHeight - logoSize) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.clip();

        let brandLogoLoaded = false;
        if (raffle.brand_logo_url) {
          try {
            const logoImg = await loadImage(raffle.brand_logo_url);
            ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
            brandLogoLoaded = true;
          } catch {
            // fallback to initials
          }
        }

        if (!brandLogoLoaded) {
          const brandGrad = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize);
          brandGrad.addColorStop(0, '#529BFF');
          brandGrad.addColorStop(1, '#0869F5');
          ctx.fillStyle = brandGrad;
          ctx.fillRect(logoX, logoY, logoSize, logoSize);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 22px Satoshi, Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, logoX + logoSize / 2, logoY + logoSize / 2);
        }
        ctx.restore();

        // Brand Name Text inside pill
        ctx.fillStyle = '#0D1729';
        ctx.font = 'bold 26px Satoshi, Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const truncatedBrand = brandName.length > 20 ? brandName.substring(0, 18) + '...' : brandName;
        ctx.fillText(truncatedBrand, logoX + logoSize + 16, pillY + pillHeight / 2 - 2);

        // 3. Prize Image Container
        const cardMargin = 80;
        const cardX = cardMargin;
        const cardY = isStory ? 240 : 170;
        const cardW = width - cardMargin * 2;
        const cardH = isStory ? 740 : 420;

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(8, 105, 245, 0.16)';
        ctx.shadowBlur = 45;
        ctx.shadowOffsetY = 18;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 40);
        ctx.fill();
        ctx.strokeStyle = '#D9E5F7';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.clip();

        // Load Prize Image or fallback
        if (raffle.prize_image_url) {
          try {
            const prizeImg = await loadImage(raffle.prize_image_url);
            // Center crop fit
            const imgRatio = prizeImg.width / prizeImg.height;
            const containerRatio = cardW / cardH;
            let drawW = cardW;
            let drawH = cardH;
            let drawX = cardX;
            let drawY = cardY;

            if (imgRatio > containerRatio) {
              drawW = cardH * imgRatio;
              drawX = cardX - (drawW - cardW) / 2;
            } else {
              drawH = cardW / imgRatio;
              drawY = cardY - (drawH - cardH) / 2;
            }
            ctx.drawImage(prizeImg, drawX, drawY, drawW, drawH);
          } catch {
            drawFallbackPrize(ctx, cardX, cardY, cardW, cardH);
          }
        } else {
          drawFallbackPrize(ctx, cardX, cardY, cardW, cardH);
        }
        ctx.restore();

        // 4. Headline & Details Section
        const contentY = isStory ? 1040 : 630;

        // "CAMPANHA OFICIAL" pill
        ctx.fillStyle = '#0869F5';
        ctx.font = 'bold 22px Satoshi, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ CAMPANHA OFICIAL • SORTEIO NO PIX', width / 2, contentY);

        // Title
        ctx.fillStyle = '#0D1729';
        ctx.font = 'bold 54px Satoshi, Inter, sans-serif';
        ctx.textAlign = 'center';
        wrapText(ctx, raffle.title, width / 2, contentY + 60, width - 160, 62, 2);

        // Price Highlight Badge
        const priceBadgeY = isStory ? contentY + 200 : contentY + 160;
        const priceBadgeW = 540;
        const priceBadgeH = 100;
        const priceBadgeX = (width - priceBadgeW) / 2;

        ctx.save();
        const priceGrad = ctx.createLinearGradient(priceBadgeX, 0, priceBadgeX + priceBadgeW, 0);
        priceGrad.addColorStop(0, '#529BFF');
        priceGrad.addColorStop(0.55, '#0869F5');
        priceGrad.addColorStop(1, '#0755DE');
        ctx.fillStyle = priceGrad;
        ctx.shadowColor = 'rgba(8, 105, 245, 0.35)';
        ctx.shadowBlur = 35;
        ctx.shadowOffsetY = 12;
        ctx.beginPath();
        ctx.roundRect(priceBadgeX, priceBadgeY, priceBadgeW, priceBadgeH, 50);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 44px Satoshi, Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `Cotas por apenas R$ ${Number(raffle.ticket_price).toFixed(2)}`,
          width / 2,
          priceBadgeY + priceBadgeH / 2
        );

        // 5. QR Code Section (Only in Story format or compact in Square)
        if (isStory) {
          const qrBoxY = 1420;
          const qrBoxSize = 340;
          const qrBoxX = (width - qrBoxSize) / 2;

          // White container for QR Code
          ctx.save();
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = 'rgba(32, 75, 134, 0.12)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 12;
          ctx.beginPath();
          ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 36);
          ctx.fill();
          ctx.strokeStyle = '#D9E5F7';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Generate real QR code image
          const qrDataUrl = await QRCode.toDataURL(publicUrl, {
            margin: 1,
            width: 280,
            color: {
              dark: '#0869F5',
              light: '#FFFFFF',
            },
          });
          const qrImg = await loadImage(qrDataUrl);
          ctx.drawImage(qrImg, qrBoxX + 30, qrBoxY + 30, 280, 280);

          // Call to action below QR
          ctx.fillStyle = '#0D1729';
          ctx.font = 'bold 30px Satoshi, Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Aponte a câmera para participar!', width / 2, qrBoxY + qrBoxSize + 48);

          ctx.fillStyle = '#475872';
          ctx.font = '500 24px Inter, sans-serif';
          ctx.fillText('ou acesse o link no perfil/WhatsApp', width / 2, qrBoxY + qrBoxSize + 85);
        } else {
          // Bottom Footer for square format
          ctx.fillStyle = '#475872';
          ctx.font = 'bold 24px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Participe online com PIX instantâneo:`, width / 2, height - 70);
          ctx.fillStyle = '#0869F5';
          ctx.font = 'bold 26px Satoshi, sans-serif';
          ctx.fillText(publicUrl.replace('https://', ''), width / 2, height - 35);
        }

        if (!isCancelled) {
          setCanvasDataUrl(canvas.toDataURL('image/png'));
          canvasRef.current = canvas;
        }
      } catch (err) {
        console.error('Erro ao renderizar card de compartilhamento:', err);
      } finally {
        if (!isCancelled) setIsGenerating(false);
      }
    }

    drawCard();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, format, raffle, publicUrl, brandName, initials]);

  if (!isOpen) return null;

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  function drawFallbackPrize(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, '#E1EDFF');
    grad.addColorStop(1, '#CDE0FC');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#0869F5';
    ctx.font = 'bold 40px Satoshi, Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏆 Grande Prêmio Oficial', x + w / 2, y + h / 2);
  }

  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let linesCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        linesCount++;
        if (linesCount >= maxLines) {
          ctx.fillText(line.trim() + '...', x, currentY);
          return;
        }
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  function handleDownload() {
    if (!canvasDataUrl) return;
    const link = document.createElement('a');
    link.download = `fastrifa-${raffle.slug}-${format}.png`;
    link.href = canvasDataUrl;
    link.click();
  }

  const shareText = `🎟️ *${raffle.title.toUpperCase()}*
🏆 Prêmio: ${raffle.description || raffle.title}
💸 Apenas R$ ${Number(raffle.ticket_price).toFixed(2)} por cota!

📲 Garanta suas cotas da sorte direto no PIX:
${publicUrl}

Organizado por: *${brandName}*`;

  function copyText() {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2200);
  }

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    shareText
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0D1729]/65 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-[0_24px_70px_rgba(13,23,41,0.25)] border border-[#E0E9F7] max-h-[92vh] overflow-y-auto flex flex-col md:flex-row gap-5 sm:gap-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#475872] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Live Card Preview */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F5F9FF] border border-[#E0E9F7] rounded-[24px] p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0869F5] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prévia do Card em Alta Definição</span>
            </span>
          </div>

          <div
            className={`relative rounded-[20px] overflow-hidden shadow-[0_16px_40px_rgba(8,105,245,0.18)] border border-[#D9E5F7] bg-white transition-all duration-300 flex items-center justify-center ${
              format === 'story'
                ? 'w-[210px] sm:w-[280px] h-[373px] sm:h-[498px]'
                : 'w-[240px] sm:w-[320px] h-[240px] sm:h-[320px]'
            }`}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-[#0869F5]">
                <div className="w-7 h-7 border-3 border-[#0869F5] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold">Renderizando Card...</span>
              </div>
            ) : canvasDataUrl ? (
              <img
                src={canvasDataUrl}
                alt="Preview Social"
                className="w-full h-full object-contain"
              />
            ) : null}
          </div>

          <span className="text-[11px] text-[#526480] mt-3">
            {format === 'story'
              ? 'Formato vertical 9:16 (Stories do Instagram e WhatsApp Status)'
              : 'Formato quadrado 1:1 (Feed do Instagram e Post no Facebook)'}
          </span>
        </div>

        {/* Right Side: Format Switcher & Export Controls */}
        <div className="w-full md:w-[360px] flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div>
              <h2 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
                Divulgar nas Redes
              </h2>
              <p className="text-xs text-[#475872] mt-1">
                Gere cards oficiais com a foto do prêmio, o nome da sua marca e QR Code pronto para vender.
              </p>
            </div>

            {/* Format Toggle Buttons */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
                Escolha o Formato da Imagem
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('story')}
                  className={`p-3 rounded-[16px] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                    format === 'story'
                      ? 'bg-[#0869F5] text-white border-[#0869F5] shadow-sm'
                      : 'bg-[#F5F9FF] text-[#475872] border-[#D9E5F7] hover:border-[#0869F5]'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Stories / Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('square')}
                  className={`p-3 rounded-[16px] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                    format === 'square'
                      ? 'bg-[#0869F5] text-white border-[#0869F5] shadow-sm'
                      : 'bg-[#F5F9FF] text-[#475872] border-[#D9E5F7] hover:border-[#0869F5]'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span>Feed / Post</span>
                </button>
              </div>
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating || !canvasDataUrl}
              className="ora-btn-primary w-full py-3.5 rounded-[18px] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Imagem Pronta (.PNG)</span>
            </button>

            {/* Quick Share Buttons */}
            <div className="pt-3 border-t border-[#E0E9F7] space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#0D1729]">
                Divulgação no WhatsApp
              </span>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-[16px] bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartilhar Texto no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={copyText}
                className="w-full py-2.5 px-4 rounded-[16px] bg-[#F5F9FF] hover:bg-[#EDF5FF] border border-[#D9E5F7] text-xs font-bold text-[#14213A] flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00A868]" />
                    <span className="text-[#00A868]">Texto Copiado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#0869F5]" />
                    <span>Copiar Texto Promocional</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#526480] bg-[#F5F9FF] p-3 rounded-[14px] border border-[#E0E9F7]">
            💡 <strong>Dica de Vendas:</strong> Salve a imagem nos Stories do Instagram e inclua a figurinha de link apontando para a sua rifa!
          </div>
        </div>
      </div>
    </div>
  );
}
