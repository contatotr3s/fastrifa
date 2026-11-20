'use client';

import { useState, useRef } from 'react';
import { processPrizeImage } from '@/lib/image-processor';
import {
  Upload,
  Image as ImageIcon,
  X,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Star,
  Plus,
  Trash2,
  Camera,
} from 'lucide-react';

interface PrizeImageUploaderProps {
  value?: string;
  values?: string[];
  onChange: (primaryImage: string, allImages: string[]) => void;
  maxImages?: number;
}

export default function PrizeImageUploader({
  value = '',
  values,
  onChange,
  maxImages = 5,
}: PrizeImageUploaderProps) {
  // Inicializa lista de imagens a partir de values ou value
  const initialImages: string[] = values && values.length > 0 
    ? values 
    : value 
    ? [value] 
    : [];

  const [images, setImages] = useState<string[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function notifyChange(newImages: string[]) {
    setImages(newImages);
    const primary = newImages.length > 0 ? newImages[0] : '';
    onChange(primary, newImages);
  }

  async function processFiles(files: FileList | File[]) {
    setError(null);
    const validFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      setError('Por favor, selecione arquivos de imagem válidos (PNG, JPG, WebP).');
      return;
    }

    const availableSlots = maxImages - images.length;
    if (availableSlots <= 0) {
      setError(`Limite de até ${maxImages} fotos por campanha atingido.`);
      return;
    }

    const filesToProcess = validFiles.slice(0, availableSlots);
    setIsProcessing(true);

    try {
      const processedPromises = filesToProcess.map((f) => processPrizeImage(f));
      const processedResults = await Promise.all(processedPromises);
      const updated = [...images, ...processedResults];
      notifyChange(updated);
      setShowUrlInput(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar as fotos selecionadas.';
      setError(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleRemove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    notifyChange(updated);
  }

  function handleSetPrimary(index: number) {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    notifyChange([target, ...rest]);
  }

  function handleUrlSubmit() {
    if (!urlInput.trim()) return;
    if (images.length >= maxImages) {
      setError(`Limite de ${maxImages} fotos atingido.`);
      return;
    }
    const updated = [...images, urlInput.trim()];
    notifyChange(updated);
    setUrlInput('');
    setShowUrlInput(false);
  }

  return (
    <div className="space-y-4">
      {/* Header com contagem */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-[13px] font-semibold text-[#14213A]">
            Fotos do Prêmio da Rifa
          </label>
          <span className="text-[11px] text-[#526480]">
            Anexe de 1 a {maxImages} fotos para criar um carrossel de fotos interativo.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F5F9FF] border border-[#D9E5F7] text-[#0869F5] tabular-nums">
            {images.length} de {maxImages} fotos
          </span>

          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-[#0869F5] hover:text-[#052498] font-bold inline-flex items-center gap-1 transition cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{showUrlInput ? 'Ocultar Link' : 'Colar Link URL'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Caixa de Orientações de Enquadramento */}
      <div className="bg-[#F5F9FF] border border-[#CDE0FC] rounded-[20px] p-3.5 sm:p-4 text-xs text-[#475872] space-y-1.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-[#0D1729]">
            <Camera className="w-4 h-4 text-[#0869F5]" />
            <span>Dicas para Enquadramento Perfeito do Prêmio</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="text-[11px] text-[#0869F5] hover:underline font-semibold"
          >
            {showTips ? 'Ocultar dicas' : 'Ver dicas'}
          </button>
        </div>

        {showTips && (
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5 text-[11px] leading-relaxed text-[#526480]">
            <li className="flex items-start gap-1.5 bg-white p-2.5 rounded-xl border border-[#E0E9F7]">
              <span className="text-[#0869F5] font-bold">1.</span>
              <span><strong>Proporção ideal:</strong> 16:9 (horizontal) ou 4:3. Fotos horizontais preenchem melhor o carrossel no celular.</span>
            </li>
            <li className="flex items-start gap-1.5 bg-white p-2.5 rounded-xl border border-[#E0E9F7]">
              <span className="text-[#0869F5] font-bold">2.</span>
              <span><strong>Centralize o objeto:</strong> Deixe uma margem ao redor para evitar cortes nas extremidades da tela.</span>
            </li>
            <li className="flex items-start gap-1.5 bg-white p-2.5 rounded-xl border border-[#E0E9F7]">
              <span className="text-[#0869F5] font-bold">3.</span>
              <span><strong>Boa iluminação:</strong> Destaque detalhes nítidos. Adicione vários ângulos para valorizar o prêmio!</span>
            </li>
          </ul>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold rounded-[14px]">
          {error}
        </div>
      )}

      {/* URL Input Mode */}
      {showUrlInput && images.length < maxImages && (
        <div className="flex gap-2 animate-in fade-in">
          <input
            type="url"
            placeholder="https://exemplo.com/foto-do-carro.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-xs font-medium text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5]"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="ora-btn-primary px-4 py-2.5 rounded-[16px] text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            Adicionar Foto
          </button>
        </div>
      )}

      {/* Grade de Fotos Carregadas */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((imgUrl, index) => {
            const isCover = index === 0;
            return (
              <div
                key={index}
                className={`relative aspect-4/3 rounded-2xl overflow-hidden border-2 transition-all shadow-xs group bg-[#F5F9FF] ${
                  isCover
                    ? 'border-[#0869F5] ring-2 ring-[#0869F5]/20'
                    : 'border-[#E0E9F7] hover:border-[#0869F5]/50'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Foto do prêmio ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Badge de Capa */}
                {isCover ? (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#0869F5] text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-white" />
                    <span>Capa</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 hover:bg-[#0869F5] text-white text-[10px] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Definir como foto de capa principal"
                  >
                    <Star className="w-3 h-3" />
                    <span>Tornar Capa</span>
                  </button>
                )}

                {/* Botão de Excluir */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-[#DC2626] text-white transition opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                  title="Remover foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                {/* Indicador de ordem */}
                <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded tabular-nums">
                  {index + 1}/{images.length}
                </span>
              </div>
            );
          })}

          {/* Slot para adicionar mais fotos se não atingiu o limite */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="aspect-4/3 rounded-2xl border-2 border-dashed border-[#CDE0FC] hover:border-[#0869F5] bg-[#F5F9FF] hover:bg-[#EDF5FF] flex flex-col items-center justify-center gap-1.5 text-[#0869F5] transition cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="text-[11px] font-bold">Adicionar Foto</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Dropzone Principal (exibida quando não há nenhuma foto ou para arrastar) */}
      {images.length === 0 && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-[24px] p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-[#0869F5] bg-[#EDF5FF] scale-[1.01]'
              : 'border-[#CDE0FC] hover:border-[#0869F5] bg-[#F5F9FF] hover:bg-[#EDF5FF]'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-[#0869F5]">
              <Loader2 className="w-8 h-8 animate-spin" />
              <div className="text-center">
                <span className="text-sm font-bold block">
                  Otimizando fotos em alta nitidez...
                </span>
                <span className="text-xs text-[#526480]">
                  Convertendo para formato leve e ultrarrápido
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#CDE0FC] flex items-center justify-center text-[#0869F5] shadow-[0_8px_20px_rgba(32,75,134,0.08)]">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#0D1729] block">
                  Clique ou arraste até {maxImages} fotos do prêmio aqui
                </span>
                <span className="text-xs text-[#526480] mt-1 block">
                  Formatos aceitos: JPG, PNG ou WebP. Fotos múltiplas criam um carrossel interativo.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input de arquivo invisível para seleção */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="prize-images-upload-input"
      />
    </div>
  );
}
