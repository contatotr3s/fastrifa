/**
 * Utilitários de processamento de imagens e identidade de marca no navegador
 */

/**
 * Gera as iniciais da marca a partir do nome (ex: "Freire Rifas" -> "FR")
 */
export function generateBrandInitials(name: string): string {
  if (!name) return 'FR';
  const clean = name.trim().toUpperCase();
  const words = clean.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 1) {
    return words[0].substring(0, 2);
  }

  return (words[0][0] + words[1][0]).substring(0, 2);
}

/**
 * Redimensiona e centraliza uma imagem para um quadrado perfeito (ex: 512x512)
 * Retorna uma DataURL WebP/PNG otimizada (< 70KB).
 */
export function processLogoImage(file: File, targetSize: number = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado deve ser uma imagem válida.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Não foi possível inicializar o contexto gráfico.'));
            return;
          }

          // Ativa suavização de alta fidelidade
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Limpa fundo com transparência
          ctx.clearRect(0, 0, targetSize, targetSize);

          // Calcula proporções de corte centralizado (center-crop)
          const srcWidth = img.width;
          const srcHeight = img.height;
          const minDim = Math.min(srcWidth, srcHeight);

          const srcX = (srcWidth - minDim) / 2;
          const srcY = (srcHeight - minDim) / 2;

          // Desenha centralizado no canvas quadrado
          ctx.drawImage(
            img,
            srcX,
            srcY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize
          );

          // Tenta exportar em formato WebP moderno de alta compressão; fallback para PNG
          let dataUrl = canvas.toDataURL('image/webp', 0.90);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/png');
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Erro ao carregar os dados da imagem.'));
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Falha ao ler o arquivo local.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona a foto de um prêmio de rifa mantendo proporção original (max 1200x900)
 * Retorna uma DataURL WebP/PNG compactada de alta nitidez (< 120KB).
 */
export function processPrizeImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 900
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // Calcula proporção para não ultrapassar os limites máximos
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Não foi possível inicializar o processador gráfico da imagem.'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Desenha a imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Exporta em WebP moderno com qualidade 0.88; fallback para JPEG/PNG
          let dataUrl = canvas.toDataURL('image/webp', 0.88);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          }

          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Falha ao carregar a imagem do prêmio.'));
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Falha ao ler a imagem local.'));
    reader.readAsDataURL(file);
  });
}
