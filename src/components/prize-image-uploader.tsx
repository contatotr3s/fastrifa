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
} from 'lucide-react';

interface PrizeImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PrizeImageUploader({
  value,
  onChange,
}: PrizeImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setIsProcessing(true);
    try {
      const processed = await processPrizeImage(file);
      onChange(processed);
      setShowUrlInput(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar a imagem.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleRemove() {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleUrlSubmit() {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setShowUrlInput(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[13px] font-semibold text-[#14213A]">
          Foto do Prêmio da Rifa
        </label>
        {!value && (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-xs text-[#0869F5] hover:text-[#052498] font-bold inline-flex items-center gap-1 transition cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{showUrlInput ? 'Enviar arquivo do celular/PC' : 'Ou colar link da web'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold rounded-[14px]">
          {error}
        </div>
      )}

      {/* URL Input Mode */}
      {showUrlInput && !value && (
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://exemplo.com/foto-do-carro.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 px-4 py-3 bg-[#F5F9FF] border border-[#D9E5F7] rounded-[16px] text-xs font-medium text-[#0D1729] focus:outline-none focus:bg-white focus:border-[#0869F5]"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="ora-btn-primary px-4 py-3 rounded-[16px] text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            Aplicar URL
          </button>
        </div>
      )}

      {/* Upload Dropzone or Preview */}
      {value ? (
        <div className="relative w-full h-64 sm:h-72 rounded-[24px] overflow-hidden bg-[#F5F9FF] border-2 border-[#CDE0FC] shadow-[0_12px_36px_rgba(32,75,134,0.08)] group">
          <img
            src={value}
            alt="Preview do Prêmio"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Overlay controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1729]/80 via-transparent to-transparent flex items-end justify-between p-4">
            <div className="flex items-center gap-2 text-white">
              <span className="p-1.5 bg-[#0869F5] rounded-full">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold drop-shadow">
                Foto do prêmio otimizada
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="prize-image-replace"
              />
              <label
                htmlFor="prize-image-replace"
                className="ora-btn-secondary px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer bg-white/90 backdrop-blur-sm shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-[#0869F5]" />
                <span>Trocar</span>
              </label>

              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFF1F2]/90 backdrop-blur-sm text-[#BE123C] hover:bg-[#FFF1F2] border border-[#FECDD3] transition cursor-pointer"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-[24px] p-8 text-center transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
            isDragging
              ? 'border-[#0869F5] bg-[#EDF5FF]'
              : 'border-[#D9E5F7] bg-[#F5F9FF] hover:border-[#B9D3F8] hover:bg-[#F0F6FF]'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {isProcessing ? (
            <div className="space-y-3 py-4">
              <Loader2 className="w-8 h-8 text-[#0869F5] animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#0869F5]">
                Otimizando imagem para alta velocidade no WhatsApp...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#D0E2FC] shadow-sm text-[#0869F5] flex items-center justify-center mx-auto">
                <ImageIcon className="w-7 h-7" />
              </div>
              <div>
                <strong className="block text-sm font-bold text-[#0D1729]">
                  Clique para carregar a foto do prêmio
                </strong>
                <span className="block text-xs text-[#526480] mt-1">
                  ou arraste e solte o arquivo aqui (celular, carro, moto, PIX, etc.)
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E0E9F7] text-[11px] text-[#526480]">
                <Sparkles className="w-3.5 h-3.5 text-[#0869F5]" />
                <span>Redimensionamento e compressão automática para carregar rápido</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
