'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Save,
  Loader2,
  KeyRound,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Store,
  Phone,
  Mail,
  Tag,
  CreditCard,
  Sparkles,
  Palette,
} from 'lucide-react';
import type { Profile, Raffle, PixKeyType, RaffleStatus } from '@/types/database.types';

interface CreatorItem {
  email?: string;
  profile: Profile;
}

// ---------------------------------------------------------------------------
// MODAL: EDITAR / ADMINISTRAR USUÁRIO (MASTER)
// ---------------------------------------------------------------------------
interface MasterEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorItem: CreatorItem | null;
  onSave: (userId: string, updates: Partial<Profile>, updatedEmail?: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  onDeleteUser: (userId: string, userName: string) => Promise<void>;
}

export function MasterEditUserModal({
  isOpen,
  onClose,
  creatorItem,
  onSave,
  onResetPassword,
  onDeleteUser,
}: MasterEditUserModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandInitials, setBrandInitials] = useState('');
  const [brandColor, setBrandColor] = useState<'blue' | 'green'>('blue');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('cpf');
  const [pixKey, setPixKey] = useState('');

  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (creatorItem) {
      const p = creatorItem.profile;
      setFullName(p.full_name || '');
      setEmail(creatorItem.email || (p as { email?: string }).email || '');
      setPhone(p.phone_whatsapp || '');
      setBrandName(p.brand_name || '');
      setBrandInitials(p.brand_initials || '');
      setBrandColor((p.brand_color as 'blue' | 'green') || 'blue');
      setPixKeyType((p.pix_key_type as PixKeyType) || 'cpf');
      setPixKey(p.pix_key || '');
      setResetFeedback(null);
      setErrorMessage(null);
    }
  }, [creatorItem]);

  if (!isOpen || !creatorItem) return null;

  const profile = creatorItem.profile;
  const isProtectedMaster = profile.role === 'master' || email.toLowerCase().trim() === 'dancos3@gmail.com';

  async function handleSaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setErrorMessage(null);
    setSaving(true);

    try {
      await onSave(
        profile.id,
        {
          full_name: fullName.trim(),
          phone_whatsapp: phone.trim(),
          brand_name: brandName.trim() || fullName.trim(),
          brand_initials: brandInitials.trim().toUpperCase() || (brandName.trim().slice(0, 2).toUpperCase() || 'FR'),
          brand_color: brandColor,
          pix_key_type: pixKeyType,
          pix_key: pixKey.trim(),
        },
        email.trim()
      );
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao salvar as alterações do usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPasswordClick() {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMessage('Este usuário não possui um e-mail cadastrado para redefinição.');
      return;
    }

    setResettingPassword(true);
    setResetFeedback(null);
    try {
      const res = await onResetPassword(targetEmail);
      if (res.error) {
        setResetFeedback({ success: false, msg: res.error });
      } else {
        setResetFeedback({
          success: true,
          msg: `Link oficial de redefinição de senha enviado para ${targetEmail}.`,
        });
      }
    } catch {
      setResetFeedback({ success: false, msg: 'Falha ao enviar e-mail de redefinição.' });
    } finally {
      setResettingPassword(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1729]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#D9E5F7] max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E0E9F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EDF5FF] text-[#0869F5] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#0D1729]">
                Administrar Usuário
              </h3>
              <p className="text-xs text-[#526480]">
                Ajuste dados cadastrais, marca, chave PIX e redefina a senha.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-[16px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {resetFeedback && (
          <div
            className={`p-3.5 rounded-[16px] border text-xs font-semibold flex items-center gap-2 ${
              resetFeedback.success
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]'
                : 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]'
            }`}
          >
            {resetFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{resetFeedback.msg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
          {/* Seção 1: Dados Pessoais */}
          <div className="space-y-3 p-4 rounded-[20px] bg-[#F8FBFF] border border-[#E0E9F7]">
            <h4 className="font-bold text-[#0D1729] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#0869F5]" />
              <span>Identificação & Contato</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#475872] font-semibold mb-1">
                  Nome Completo / Responsável
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[#475872] font-semibold mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#0869F5]" />
                  <span>E-mail</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#475872] font-semibold mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#0869F5]" />
                  <span>WhatsApp (com DDD)</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[#475872] font-semibold mb-1">
                  Nome da Marca / Organização
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#475872] font-semibold mb-1">
                  Iniciais da Marca (2 letras)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={brandInitials}
                  onChange={(e) => setBrandInitials(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-bold uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-[#475872] font-semibold mb-1 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-[#0869F5]" />
                  <span>Cor da Marca</span>
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setBrandColor('blue')}
                    className={`flex-1 py-1.5 px-3 rounded-[12px] font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      brandColor === 'blue'
                        ? 'bg-[#0869F5] text-white border-[#0869F5]'
                        : 'bg-white text-[#475872] border-[#D9E5F7]'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#0869F5] border border-white" />
                    <span>Azul</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandColor('green')}
                    className={`flex-1 py-1.5 px-3 rounded-[12px] font-bold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      brandColor === 'green'
                        ? 'bg-[#00A868] text-white border-[#00A868]'
                        : 'bg-white text-[#475872] border-[#D9E5F7]'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-[#00A868] border border-white" />
                    <span>Verde</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Dados PIX */}
          <div className="space-y-3 p-4 rounded-[20px] bg-[#F8FBFF] border border-[#E0E9F7]">
            <h4 className="font-bold text-[#0D1729] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#00A868]" />
              <span>Recebimento PIX Padrão</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#475872] font-semibold mb-1">
                  Tipo de Chave
                </label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="phone">Telefone</option>
                  <option value="email">E-mail</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#475872] font-semibold mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Informe a chave PIX do organizador"
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Ações de Conta & Segurança */}
          <div className="p-4 rounded-[20px] bg-[#FFF8EB] border border-[#F5D08A] space-y-3">
            <h4 className="font-bold text-[#9A6700] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#9A6700]" />
              <span>Segurança & Recuperação de Acesso</span>
            </h4>
            <p className="text-xs text-[#92400E]">
              Caso o usuário tenha esquecido a senha ou não consiga entrar, envie um link oficial de redefinição para o e-mail cadastrado.
            </p>

            <button
              type="button"
              disabled={resettingPassword || !email}
              onClick={handleResetPasswordClick}
              className="px-4 py-2 rounded-[12px] bg-white hover:bg-[#FFFDF7] border border-[#F5D08A] text-[#9A6700] font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {resettingPassword ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <KeyRound className="w-3.5 h-3.5" />
              )}
              <span>Enviar Link de Redefinição de Senha</span>
            </button>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E0E9F7]">
            {!isProtectedMaster ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Tem certeza que deseja excluir o usuário "${fullName || brandName}"?`)) {
                    onDeleteUser(profile.id, fullName || brandName);
                    onClose();
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full text-[#BE123C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Usuário</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full border border-[#D9E5F7] text-[#475872] hover:bg-[#F2F7FF] font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-[#0869F5] hover:bg-[#0656cc] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MODAL: EDITAR / ADMINISTRAR CAMPANHA / RIFA (MASTER)
// ---------------------------------------------------------------------------
interface MasterEditRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: Raffle | null;
  onSave: (raffleId: string, updates: Partial<Raffle>) => Promise<void>;
  onDeleteRaffle: (raffleId: string, title: string) => Promise<void>;
}

export function MasterEditRaffleModal({
  isOpen,
  onClose,
  raffle,
  onSave,
  onDeleteRaffle,
}: MasterEditRaffleModalProps) {
  const [title, setTitle] = useState('');
  const [ticketPrice, setTicketPrice] = useState(1);
  const [status, setStatus] = useState<RaffleStatus>('active');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('cpf');
  const [pixKey, setPixKey] = useState('');
  const [description, setDescription] = useState('');
  const [prizeImageUrl, setPrizeImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (raffle) {
      setTitle(raffle.title || '');
      setTicketPrice(Number(raffle.ticket_price) || 1);
      setStatus(raffle.status || 'active');
      setPixKeyType((raffle.pix_key_type as PixKeyType) || 'cpf');
      setPixKey(raffle.pix_key || '');
      setDescription(raffle.description || '');
      setPrizeImageUrl(raffle.prize_image_url || '');
      setErrorMessage(null);
    }
  }, [raffle]);

  if (!isOpen || !raffle) return null;

  async function handleSaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!raffle) return;
    setErrorMessage(null);
    setSaving(true);

    try {
      await onSave(raffle.id, {
        title: title.trim(),
        ticket_price: Number(ticketPrice),
        status,
        pix_key_type: pixKeyType,
        pix_key: pixKey.trim(),
        description: description.trim(),
        prize_image_url: prizeImageUrl.trim() || null,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao salvar as alterações da rifa.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1729]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[28px] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#D9E5F7] max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E0E9F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF7F0] text-[#00A868] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#0D1729]">
                Administrar Campanha
              </h3>
              <p className="text-xs text-[#526480]">
                Ajuste título, cota, status, dados PIX e imagem da campanha.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-[16px] bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Links */}
        <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-[16px] bg-[#F5F9FF] border border-[#E0E9F7]">
          <Link
            href={`/admin/rifas/${raffle.id}`}
            target="_blank"
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EDF5FF] border border-[#D9E5F7] text-[#0869F5] text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <span>Gerenciador de Cotas e Pedidos</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/r/${raffle.slug}`}
            target="_blank"
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EDF5FF] border border-[#D9E5F7] text-[#475872] text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <span>Página Pública da Rifa</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
          <div className="space-y-3 p-4 rounded-[20px] bg-[#F8FBFF] border border-[#E0E9F7]">
            <h4 className="font-bold text-[#0D1729] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#0869F5]" />
              <span>Dados Gerais da Campanha</span>
            </h4>

            <div>
              <label className="block text-[#475872] font-semibold mb-1">
                Título da Rifa
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#475872] font-semibold mb-1">
                  Valor da Cota (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0.01)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-bold tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="block text-[#475872] font-semibold mb-1">
                  Status da Campanha
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RaffleStatus)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-bold"
                >
                  <option value="active">Ativa (Vendas abertas)</option>
                  <option value="paused">Pausada (Vendas suspensas)</option>
                  <option value="completed">Finalizada (Sorteio realizado)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#475872] font-semibold mb-1">
                URL da Imagem do Prêmio
              </label>
              <input
                type="url"
                value={prizeImageUrl}
                onChange={(e) => setPrizeImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-[#475872] font-semibold mb-1">
                Descrição / Regulamento
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium"
              />
            </div>
          </div>

          {/* Dados PIX da Campanha */}
          <div className="space-y-3 p-4 rounded-[20px] bg-[#F8FBFF] border border-[#E0E9F7]">
            <h4 className="font-bold text-[#0D1729] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#00A868]" />
              <span>Chave PIX de Recebimento da Rifa</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#475872] font-semibold mb-1">
                  Tipo de Chave
                </label>
                <select
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="phone">Telefone</option>
                  <option value="email">E-mail</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#475872] font-semibold mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-[12px] bg-white border border-[#D9E5F7] text-[#0D1729] focus:outline-none focus:border-[#0869F5] font-medium tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E0E9F7]">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Tem certeza que deseja excluir a rifa "${title}"?`)) {
                  onDeleteRaffle(raffle.id, title);
                  onClose();
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-full text-[#BE123C] bg-[#FFF1F2] hover:bg-[#FFE4E6] border border-[#FECDD3] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Rifa</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-full border border-[#D9E5F7] text-[#475872] hover:bg-[#F2F7FF] font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-[#0869F5] hover:bg-[#0656cc] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
