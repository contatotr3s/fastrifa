'use client';

import React from 'react';
import { ShieldCheck, FileText, X, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

/**
 * Modal dos Termos de Uso e Privacidade da Plataforma (Cadastro de Usuário)
 */
export function PlatformTermsModal({ isOpen, onClose, onAccept }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#0D1729]/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[680px] bg-white rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-[0_24px_70px_rgba(13,23,41,0.25)] border border-[#E0E9F7] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E0E9F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF3FF] border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em]">
                Termos de Uso e Privacidade
              </h2>
              <span className="text-xs text-[#526480]">
                FastRifa — Gestão de Campanhas e Cotas Digitais
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar termos"
            className="p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 pr-2 space-y-5 text-xs sm:text-sm text-[#334661] leading-relaxed select-text">
          <div className="p-3.5 rounded-[16px] bg-[#F5F9FF] border border-[#D9E5F7] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0869F5] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#1D3B66] font-medium">
              Ao cadastrar uma conta no FastRifa, você adere integralmente a estes Termos e Condições, declarando ciência sobre as regras operacionais da plataforma.
            </p>
          </div>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              1. Natureza da Plataforma (Sistema)
            </h3>
            <p>
              O FastRifa é um sistema desenvolvido para fornecer infraestrutura tecnológica de exibição, controle de numerações (cotas) e geração de bilhetes digitais para ações promocionais, beneficentes ou independentes.
            </p>
            <p>
              O FastRifa <strong>não é instituição financeira, gateway de pagamento, casa de apostas ou intermediador financeiro</strong>. A plataforma não cobra comissões sobre vendas de cotas nem retém valores arrecadados.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              2. Pagamentos Diretos via PIX (Sem Custódia)
            </h3>
            <p>
              Todos os pagamentos realizados pelos compradores de cotas ocorrem por transferência bancária direta via PIX, do pagador diretamente para a Chave PIX cadastrada e sob titularidade exclusiva do Organizador.
            </p>
            <p>
              Nenhum valor passa pelas contas bancárias do FastRifa. Consequentemente, a plataforma não possui custódia financeira e não realiza estornos, reembolsos ou repasses bancários.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              3. Responsabilidade do Organizador
            </h3>
            <p>
              O Organizador da conta é o único, exclusivo e integral responsável por:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Veracidade e titularidade de todos os dados cadastrais, telefone WhatsApp e Chave PIX informados;</li>
              <li>Existência, procedência, conservação e efetiva entrega dos prêmios anunciados;</li>
              <li>Cumprimento da legislação brasileira aplicável à realização de campanhas e promoções comerciais;</li>
              <li>Conferência manual ou automatizada dos comprovantes de pagamento antes da validação das cotas;</li>
              <li>Atendimento aos participantes e resolução de quaisquer dúvidas ou reclamações.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              4. Condutas Vedadas e Banimento
            </h3>
            <p>
              É terminantemente proibido utilizar o FastRifa para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Campanhas fraudulentas, simuladas ou com prêmios fictícios;</li>
              <li>Venda de armas, munições, drogas, substâncias proibidas ou pornografia;</li>
              <li>Práticas de estelionato, pirâmides financeiras ou lavagem de capitais;</li>
              <li>Inserção de dados falsos ou uso de chaves PIX de terceiros sem autorização comprovada.</li>
            </ul>
            <p>
              O descumprimento ensejará o cancelamento imediato da conta, bloqueio permanente e comunicação formal às autoridades policiais e judiciais competentes.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              5. Privacidade e Proteção de Dados (LGPD)
            </h3>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o FastRifa coleta e trata exclusivamente os dados necessários para o funcionamento e a segurança do serviço (e-mail, nome, telefone e logs de acesso). Não comercializamos nem compartilhamos seus dados com terceiros para fins publicitários.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              6. Legislação e Foro
            </h3>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer litígios oriundos do presente termo, fica eleito o foro da comarca de domicílio do usuário ou, subsidiariamente, o foro central da capital do estado.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E0E9F7] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="ora-btn-secondary rounded-full px-5 py-2.5 text-xs font-bold"
          >
            Fechar
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="ora-btn-primary rounded-full px-6 py-2.5 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Li e Concordo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal dos Termos de Criação e Responsabilidade da Campanha (Criação de Rifa)
 */
export function RaffleCreationTermsModal({ isOpen, onClose, onAccept }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#0D1729]/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[680px] bg-white rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-[0_24px_70px_rgba(13,23,41,0.25)] border border-[#E0E9F7] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E0E9F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF8EB] border border-[#F5D08A] text-[#9A6700] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em]">
                Termos de Criação e Responsabilidade
              </h2>
              <span className="text-xs text-[#526480]">
                Compromisso Legal de Idoneidade e Entrega da Rifa
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar termos"
            className="p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 pr-2 space-y-5 text-xs sm:text-sm text-[#334661] leading-relaxed select-text">
          <div className="p-3.5 rounded-[16px] bg-[#FFF8EB] border border-[#F5D08A] flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#D97706] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#78350F] font-semibold">
              ATENÇÃO: A criação de uma campanha implica responsabilidade civil e criminal pessoal do Organizador perante todos os compradores das cotas.
            </p>
          </div>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              1. Declaração de Posse e Idoneidade do Prêmio
            </h3>
            <p>
              Ao cadastrar esta campanha, o Organizador declara, sob as penas do art. 299 do Código Penal Brasileiro (falsidade ideológica), que o bem ou premiação descrita é de sua real propriedade, encontra-se livre de ônus, penhoras ou impedimentos legais, e está em perfeitas condições para entrega ao contemplado.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              2. Compromisso Irrevogável de Entrega
            </h3>
            <p>
              O Organizador assume a obrigação irrevogável e irretratável de entregar o prêmio ao ganhador legítimo no prazo máximo estipulado na campanha, responsabilizando-se por custos de frete, transferência ou despesas cartorárias conforme anunciado na descrição.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              3. Transparência na Apuração do Ganhador
            </h3>
            <p>
              O sorteio deve ser realizado com método transparente, idôneo e auditável (preferencialmente vinculado aos resultados oficiais da Loteria Federal ou por gravação/transmissão ao vivo acessível a todos os participantes). É expressamente proibida qualquer manipulação de resultados ou favorecimento de participantes.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              4. Isenção Total da Plataforma FastRifa
            </h3>
            <p>
              O Organizador reconhece e concorda expressamente que o FastRifa disponibiliza exclusivamente a ferramenta de software para catalogação de bilhetes e geração de QR Codes. <strong>O FastRifa não é organizador, garantidor, intermediário, patrocinador ou avalista desta campanha.</strong>
            </p>
            <p>
              Em caso de qualquer disputa, desacordo comercial ou questionamento por parte de compradores, o Organizador responderá direta e exclusivamente, isentando o FastRifa e seus desenvolvedores de toda e qualquer responsabilidade.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              5. Titularidade da Chave PIX e Comprovantes
            </h3>
            <p>
              O Organizador declara que a Chave PIX cadastrada para esta campanha é de sua legítima titularidade e que o mesmo assume o dever de conferir os extratos bancários antes de validar qualquer cota pendente. O FastRifa não tem acesso nem controle sobre a conta bancária do Organizador.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              6. Consequências por Fraude ou Descumprimento
            </h3>
            <p>
              O não cumprimento da entrega do prêmio ou a constatação de má-fé caracterizam ilícitos civis e penais (incluindo estelionato previsto no art. 171 do Código Penal), autorizando o FastRifa a suspender a campanha, fornecer todos os registros técnicos e dados cadastrais às autoridades policiais, ao Ministério Público e aos órgãos de defesa do consumidor (PROCON).
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E0E9F7] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="ora-btn-secondary rounded-full px-5 py-2.5 text-xs font-bold"
          >
            Fechar
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="ora-btn-primary rounded-full px-6 py-2.5 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Li e Concordo com os Termos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Modal do Termo de Ciência e Participação do Comprador (Página Pública da Rifa)
 */
export function BuyerParticipationTermsModal({ isOpen, onClose, onAccept }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-[#0D1729]/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[680px] bg-white rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 shadow-[0_24px_70px_rgba(13,23,41,0.25)] border border-[#E0E9F7] max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E0E9F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF3FF] border border-[#CDE0FC] text-[#0869F5] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0D1729] tracking-[-0.03em]">
                Termo de Ciência e Participação do Comprador (FastRifa)
              </h2>
              <span className="text-xs text-[#526480]">
                FastRifa — Termos de Participação da Campanha
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar termos"
            className="p-2 rounded-full text-[#526480] hover:text-[#0D1729] hover:bg-[#F2F7FF] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-5 pr-2 space-y-5 text-xs sm:text-sm text-[#334661] leading-relaxed select-text">
          <div className="p-3.5 rounded-[16px] bg-[#F5F9FF] border border-[#D9E5F7] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0869F5] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#1D3B66] font-medium">
              Ao reservar ou adquirir cotas nesta campanha, o Participante declara ciência e concordância integral com os termos abaixo.
            </p>
          </div>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              1. Ciência sobre o Papel da Plataforma FastRifa
            </h3>
            <p>
              Ao reservar ou adquirir cotas nesta campanha, o Participante declara estar plenamente ciente e de acordo que o FastRifa atua exclusivamente como fornecedor de software para organização, catalogação de bilhetes e geração de QR Codes. O FastRifa não organiza, não intermedia financeiramente, não garante, não patrocina e não avaliza esta campanha ou a entrega do prêmio anunciado.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              2. Relação Direta com o Organizador
            </h3>
            <p>
              O Participante reconhece que toda a relação jurídica, comercial e financeira ocorre exclusivamente entre ele e o Organizador identificado na página da campanha. Qualquer dúvida, solicitação de reembolso, contestação sobre o regulamento ou cobrança referente à entrega do prêmio deve ser tratada diretamente com o Organizador, isentando o FastRifa e seus desenvolvedores de qualquer responsabilidade solidária ou subsidiária.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              3. Veracidade dos Dados e Pagamento via PIX
            </h3>
            <p>
              O Participante compromete-se a fornecer dados cadastrais verdadeiros (nome completo e telefone/WhatsApp) para garantir sua correta identificação e contato em caso de premiação. O Participante declara ainda estar ciente de que o pagamento via PIX é transferido diretamente para a conta bancária de titularidade do Organizador, sem qualquer trânsito de valores pela plataforma FastRifa, cabendo ao Participante conferir o nome do destinatário no momento da transferência.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              4. Prazo de Reserva e Validação de Cotas
            </h3>
            <p>
              A reserva de números não garante a participação efetiva no sorteio até que o pagamento seja devidamente comprovado e baixado pelo Organizador no sistema. Cotas não pagas dentro do prazo estipulado na campanha poderão ser canceladas e liberadas novamente para outros interessados sem aviso prévio.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              5. Aceitação das Regras da Campanha e Apuração
            </h3>
            <p>
              Ao confirmar a aquisição da cota, o Participante declara ter lido e aceito integralmente a descrição do prêmio, o valor da cota, a data prevista e o método de apuração estabelecidos pelo Organizador na página da campanha, concordando com o critério definido para a definição do ganhador.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-[#0D1729] text-sm sm:text-base">
              6. Boa-Fé e Uso Indevido
            </h3>
            <p>
              É expressamente proibido o envio de comprovantes de pagamento falsos, adulterados ou duplicados, bem como a reserva massiva de cotas com o intuito de bloquear o andamento da campanha. Tais condutas sujeitam o infrator ao cancelamento imediato das reservas e à liberação dos números para outros participantes.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E0E9F7] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="ora-btn-secondary rounded-full px-5 py-2.5 text-xs font-bold cursor-pointer"
          >
            Fechar
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="ora-btn-primary rounded-full px-6 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Li e Concordo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
