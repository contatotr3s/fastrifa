import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Sparkles,
  QrCode,
  MessageCircle,
  Trophy,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const sampleCotas = [
    { num: '001', status: 'paid' },
    { num: '002', status: 'paid' },
    { num: '003', status: 'free' },
    { num: '004', status: 'selected' },
    { num: '005', status: 'free' },
    { num: '006', status: 'pending' },
    { num: '007', status: 'selected' },
    { num: '008', status: 'free' },
    { num: '009', status: 'paid' },
    { num: '010', status: 'free' },
    { num: '011', status: 'free' },
    { num: '012', status: 'selected' },
  ];

  const faqs = [
    {
      q: 'O dinheiro das vendas passa pela plataforma?',
      a: 'Não. O comprador copia a sua chave PIX diretamente na página da rifa e faz a transferência para a sua conta bancária. Você recebe 100% do valor na hora, sem retenções e sem taxas de intermediação.',
    },
    {
      q: 'Como eu confirmo que o participante pagou?',
      a: 'Assim que o comprador reserva as cotas, o sistema gera um botão direto para o seu WhatsApp já preenchido com o nome dele, os números escolhidos e o valor total. Você confere o comprovante e aprova com 1 clique no painel.',
    },
    {
      q: 'E se alguém reservar números e não pagar?',
      a: 'No seu painel de controle você visualiza todos os pedidos pendentes e pode liberar as cotas de volta para a grade pública com apenas um clique.',
    },
    {
      q: 'Quantas cotas posso criar em cada campanha?',
      a: 'Você pode criar campanhas rápidas de 50, 100, 200, 500 ou até 10.000 cotas. A grade interativa possui busca instantânea por número e botões de seleção aleatória (+5, +10, +25, +50).',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0D1729] flex flex-col">
      {/* Oratry-style Floating Pill Header */}
      <header className="sticky top-0 z-50 h-[92px] flex items-center bg-gradient-to-b from-white/95 via-white/80 to-transparent backdrop-blur-[6px]">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Brand Pill */}
          <Link
            href="/"
            className="ora-glass-pill rounded-full pl-3 pr-5 py-2 flex items-center gap-2.5 hover:border-[#B9D3F8] transition"
          >
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] via-[#0869F5] to-[#052498] shadow-[0_4px_14px_rgba(8,105,245,0.35)]">
              <img
                src="/icone-isolado.png"
                alt="Ícone Fast Rifa"
                className="w-16 h-16 object-contain brightness-0 invert"
              />
            </div>
            <span className="font-display font-bold text-xl tracking-[-0.04em] text-[#0D1729]">
              Fast<span className="text-[#0869F5]">Rifa</span>
            </span>
          </Link>

          {/* Center Navigation Pill */}
          <nav
            aria-label="Navegação principal"
            className="ora-glass-pill rounded-full px-7 py-3 hidden md:flex items-center gap-8 text-[15px] font-medium text-[#475872]"
          >
            <a href="#como-funciona" className="hover:text-[#0869F5] transition">
              Como funciona
            </a>
            <a href="#campanha-ao-vivo" className="hover:text-[#0869F5] transition">
              Demonstração
            </a>
            <a href="#transparencia" className="hover:text-[#0869F5] transition">
              Recebimento PIX
            </a>
            <a href="#perguntas" className="hover:text-[#0869F5] transition">
              FAQ
            </a>
          </nav>

          {/* Right Action Pills */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="ora-btn-secondary rounded-full px-4 sm:px-5 py-2.5 text-[14px] font-semibold inline-flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#0869F5]" />
              <span>Entrar</span>
            </Link>
            <Link
              href="/cadastro"
              className="ora-btn-primary rounded-full px-5 sm:px-6 py-2.5 text-[14px] font-bold inline-flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>Comece agora mesmo</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Stage — Pure Luminous Oratry Aesthetic */}
      <main className="flex-1">
        <section className="ora-hero-stage pt-8 pb-20 sm:pt-14 sm:pb-28 px-4 sm:px-8 relative overflow-hidden">
          <div className="max-w-[1180px] mx-auto text-center">
            <h1 className="font-display font-bold text-[clamp(2.5rem,5.2vw,4.65rem)] leading-[1.06] tracking-[-0.04em] text-[#0D1729] max-w-4xl mx-auto">
              Sua próxima campanha
              <br />
              pode <span className="text-[#0869F5]">abrir uma porta.</span>
            </h1>

            <p className="mt-6 text-[clamp(1.05rem,1.45vw,1.25rem)] text-[#475872] max-w-[62ch] mx-auto leading-[1.6] font-normal">
              Um objetivo que merece sair do papel. Uma arrecadação simples, limpa e direta na sua conta. Crie sua rifa em segundos e receba 100% via PIX.
            </p>

            {/* Bioluminescent Centerpiece + Floating Pills Stage */}
            <div className="relative my-12 sm:my-16 py-6 flex flex-col items-center justify-center">
              {/* Ambient Radial Halo */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] rounded-full bg-[radial-gradient(circle,rgba(98,165,255,0.28)_0%,rgba(225,237,255,0.45)_45%,transparent_72%)] blur-xl"
              />

              <div className="relative z-10 w-full max-w-[1120px] flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-5">
                {/* Left Floating Stream (Before / Common doubts) */}
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-3">
                  <div className="ora-glass-pill rounded-[18px] px-4 py-3 text-[14px] text-[#526480] shadow-sm">
                    planilhas confusas...
                  </div>
                  <div className="ora-glass-pill rounded-[18px] px-4 py-3 text-[14px] text-[#526480] shadow-sm">
                    taxas retidas no saque...
                  </div>
                  <div className="ora-glass-pill rounded-[18px] px-4 py-3 text-[14px] text-[#526480] shadow-sm hidden sm:block">
                    qual número está livre?
                  </div>
                </div>

                {/* Central Bioluminescent 3D Brand Badge (The "Ora" of FastRifa) */}
                <div className="relative mx-4 my-2 w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center animate-float-slow flex-shrink-0">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(98,165,255,0.35)_0%,rgba(8,105,245,0.18)_55%,transparent_75%)] blur-2xl"
                  />
                  <img
                    src="/badge-3d-centro.png"
                    alt="FastRifa Oficial"
                    className="relative z-10 w-full h-full object-contain drop-shadow-[0_24px_48px_rgba(8,105,245,0.35)] transition-transform hover:scale-105 duration-300"
                  />
                </div>

                {/* Right Floating Stream (Clarity & Action in Cobalt Blue) */}
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-3">
                  <div className="ora-glass-pill rounded-[18px] px-4 py-3 text-[14px] font-semibold text-[#0869F5] shadow-sm">
                    PIX direto na sua conta.
                  </div>
                  <div className="ora-glass-pill rounded-[18px] px-4 py-3 text-[14px] font-semibold text-[#0869F5] shadow-sm">
                    Cota #007 confirmada.
                  </div>
                  <div className="ora-glass-pill rounded-[18px] px-4 py-3 text-[14px] font-semibold text-[#0869F5] shadow-sm hidden sm:block">
                    Comprovante no WhatsApp.
                  </div>
                </div>
              </div>
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/cadastro"
                className="ora-btn-primary rounded-[20px] px-8 py-4 text-[17px] font-bold inline-flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                <span>Comece agora mesmo</span>
                <ArrowUpRight className="w-5 h-5" />
              </Link>
              <Link
                href="/cadastro"
                className="ora-btn-secondary rounded-[20px] px-7 py-4 text-[17px] font-semibold inline-flex items-center justify-center gap-2.5 w-full sm:w-auto"
              >
                <span>Criar uma rifa</span>
                <ArrowRight className="w-4 h-4 text-[#0869F5]" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Live Demo Stage */}
        <section id="campanha-ao-vivo" className="py-20 sm:py-28 px-4 sm:px-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="rounded-[34px] p-6 sm:p-12 lg:p-16 bg-[radial-gradient(ellipse_at_50%_40%,#DCECFF,#F5FAFF_80%)] border border-[#D9E5F7] shadow-[0_22px_60px_rgba(32,77,139,0.08)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                {/* Left Editorial Explanation */}
                <div className="lg:col-span-5 space-y-6">
                  <h2 className="font-display font-bold text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] tracking-[-0.04em] text-[#0D1729]">
                    Uma página tão clara que o comprador escolhe em segundos.
                  </h2>
                  <p className="text-[16px] sm:text-[17px] text-[#475872] leading-[1.6]">
                    Sem cadastros longos para quem compra. O participante abre o seu link, escolhe seus números favoritos ou adiciona cotas aleatórias com um toque e paga via PIX.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-[15px] font-medium text-[#14213A]">
                      <span className="w-6 h-6 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <span>Grade visual com status em tempo real</span>
                    </div>
                    <div className="flex items-center gap-3 text-[15px] font-medium text-[#14213A]">
                      <span className="w-6 h-6 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <span>Seleção rápida (+5, +10, +25, +50 cotas)</span>
                    </div>
                    <div className="flex items-center gap-3 text-[15px] font-medium text-[#14213A]">
                      <span className="w-6 h-6 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <span>Envio automático de comprovante para seu WhatsApp</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link
                      href="/cadastro"
                      className="ora-btn-primary rounded-[18px] px-7 py-3.5 text-[15px] font-bold inline-flex items-center gap-2"
                    >
                      <span>Criar campanha personalizada</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Live Interactive Preview Card */}
                <div className="lg:col-span-7">
                  <div className="bg-white/95 backdrop-blur-md border border-white rounded-[26px] p-6 sm:p-8 shadow-[0_18px_45px_rgba(28,103,197,0.10)] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E3EDFB]">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#EDF5FF] text-[#0755DE] text-xs font-bold tracking-wide uppercase mb-2">
                          Exemplo de Demonstração
                        </span>
                        <h3 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
                          Grade Interativa com Baixa PIX
                        </h3>
                      </div>
                      <div className="text-left sm:text-right tabular-nums">
                        <span className="text-xs font-semibold text-[#526480] block">Valor por cota</span>
                        <span className="font-display font-bold text-3xl text-[#0869F5]">R$ 1,00</span>
                      </div>
                    </div>

                    {/* Sample Cota Grid Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#475872]">
                        <span>Prévia da grade de números</span>
                        <span className="text-[#0869F5] tabular-nums">3 cotas selecionadas (R$ 3,00)</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 tabular-nums">
                        {sampleCotas.map((cota) => {
                          let style =
                            'bg-[#F5F9FF] border-[#D9E5F7] text-[#14213A]';
                          if (cota.status === 'selected') {
                            style =
                              'bg-[#0869F5] border-[#0869F5] text-white shadow-[0_6px_16px_rgba(8,105,245,0.25)]';
                          } else if (cota.status === 'paid') {
                            style =
                              'bg-[#EBF3FF] border-[#C5DCFA] text-[#526480] line-through opacity-60';
                          } else if (cota.status === 'pending') {
                            style =
                              'bg-[#FFF8EB] border-[#F5D08A] text-[#9A6700]';
                          }
                          return (
                            <div
                              key={cota.num}
                              className={`h-11 rounded-[13px] border font-display font-bold text-xs flex items-center justify-center select-none ${style}`}
                            >
                              #{cota.num}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5F9FF] rounded-[18px] p-4 border border-[#E0E9F7]">
                      <div className="text-xs sm:text-sm text-[#475872]">
                        Os compradores selecionam números na grade visual e pagam diretamente via PIX com baixa automática.
                      </div>
                      <Link
                        href="/cadastro"
                        className="text-xs font-bold text-[#0869F5] hover:text-[#052498] whitespace-nowrap inline-flex items-center gap-1"
                      >
                        <span>Criar minha rifa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works (3 Editorial Steps) */}
        <section id="como-funciona" className="ora-section-glow py-20 sm:py-28 px-4 sm:px-8">
          <div className="max-w-[1340px] mx-auto space-y-14">
            <div className="max-w-2xl">
              <h2 className="font-display font-bold text-[clamp(2.1rem,4vw,3.5rem)] leading-[1.05] tracking-[-0.045em] text-[#0D1729]">
                Publique. Compartilhe. Receba direto no PIX.
              </h2>
              <p className="mt-4 text-[17px] text-[#475872] leading-[1.6]">
                Construímos um fluxo sem atrito para organizadores que precisam de agilidade, visual impecável e controle total das cotas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="ora-card-soft rounded-[32px] p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-[23px] text-[#0D1729] tracking-[-0.03em] leading-[1.18]">
                    Configure o prêmio e a quantidade de cotas
                  </h3>
                  <p className="text-[15px] text-[#475872] leading-[1.6]">
                    Escolha o título, foto do prêmio, valor por bilhete e total de números. O sistema calcula sua meta de arrecadação na hora.
                  </p>
                </div>
                <div className="bg-white rounded-[20px] p-4 border border-[#E0E9F7] flex items-center justify-between text-xs tabular-nums">
                  <span className="font-semibold text-[#475872]">200 cotas × R$ 10,00</span>
                  <span className="font-display font-bold text-sm text-[#0869F5]">Meta: R$ 2.000,00</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="ora-card-soft rounded-[32px] p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center shadow-sm">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-[23px] text-[#0D1729] tracking-[-0.03em] leading-[1.18]">
                    O comprador paga na sua chave PIX
                  </h3>
                  <p className="text-[15px] text-[#475872] leading-[1.6]">
                    CPF, CNPJ, celular, e-mail ou chave aleatória. O participante copia sua chave com um clique e transfere direto para o seu banco.
                  </p>
                </div>
                <div className="bg-white rounded-[20px] p-4 border border-[#E0E9F7] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#475872]">Taxa da plataforma</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#EDF5FF] text-[#0755DE] font-bold">
                    R$ 0,00 (Zero)
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="ora-card-soft rounded-[32px] p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center shadow-sm">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-[23px] text-[#0D1729] tracking-[-0.03em] leading-[1.18]">
                    Aprove pedidos e publique o ganhador
                  </h3>
                  <p className="text-[15px] text-[#475872] leading-[1.6]">
                    Confirme comprovantes recebidos no WhatsApp e, no dia do sorteio, registre a cota vencedora para exibição pública.
                  </p>
                </div>
                <div className="bg-white rounded-[20px] p-4 border border-[#E0E9F7] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#475872]">Status público</span>
                  <span className="inline-flex items-center gap-1 text-[#0869F5] font-bold">
                    <CheckCircle2 className="w-4 h-4" /> Transparente
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Transparency & Direct PIX Highlight */}
        <section id="transparencia" className="py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-b from-white via-[#F7FAFF] to-white">
          <div className="max-w-[1160px] mx-auto">
            <div className="ora-card rounded-[32px] p-8 sm:p-12 border-2 border-[#0869F5] shadow-[0_20px_50px_rgba(8,105,245,0.10)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0869F5] text-white text-xs font-bold tracking-wider uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Autonomia Total para o Organizador</span>
                </div>
                <h2 className="font-display font-bold text-[clamp(1.85rem,3.2vw,2.75rem)] leading-[1.1] tracking-[-0.04em] text-[#0D1729]">
                  Você no comando da sua arrecadação, do primeiro número ao sorteio final.
                </h2>
                <p className="text-[16px] text-[#475872] leading-[1.6] max-w-2xl">
                  Acesse o painel de demonstração agora mesmo com 1 clique ou crie sua conta gratuita para lançar sua primeira campanha.
                </p>
              </div>
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <Link
                  href="/cadastro"
                  className="ora-btn-primary rounded-[18px] px-6 py-4 text-center text-[16px] font-bold flex items-center justify-center gap-2"
                >
                  <span>Criar minha campanha</span>
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="ora-btn-secondary rounded-[18px] px-6 py-3.5 text-center text-[15px] font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#0869F5]" />
                  <span>Acessar painel demo</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ Section (Oratry Sticky Split Layout) */}
        <section id="perguntas" className="py-20 sm:py-28 px-4 sm:px-8 bg-gradient-to-b from-white to-[#F5F9FF]">
          <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
              <h2 className="font-display font-bold text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] tracking-[-0.04em] text-[#0D1729]">
                Perguntas frequentes.
              </h2>
              <p className="text-[16px] text-[#475872] leading-[1.6]">
                Tudo o que você precisa saber sobre criação de campanhas, reservas de cotas e recebimento via PIX.
              </p>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {faqs.map((item, idx) => (
                <div
                  key={idx}
                  className="ora-card rounded-[24px] p-6 sm:p-7 space-y-2.5 hover:border-[#B9D3F8] transition"
                >
                  <h3 className="font-display font-bold text-[19px] text-[#0D1729] tracking-[-0.02em]">
                    {item.q}
                  </h3>
                  <p className="text-[15px] text-[#475872] leading-[1.6]">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA Section */}
        <section className="py-20 sm:py-28 px-4 text-center bg-[radial-gradient(ellipse_at_50%_95%,#E5F0FF_0%,transparent_65%),#FFFFFF]">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="font-display font-bold text-[clamp(2.2rem,4.4vw,3.75rem)] leading-[1.06] tracking-[-0.04em] text-[#0D1729]">
              Pronto para colocar sua campanha no ar?
            </h2>
            <p className="text-[17px] text-[#475872] max-w-xl mx-auto leading-[1.6]">
              Leva menos de 2 minutos para configurar o prêmio, informar sua chave PIX e compartilhar seu link exclusivo.
            </p>
            <div className="pt-2">
              <Link
                href="/cadastro"
                className="ora-btn-primary rounded-[18px] px-9 py-4 text-[18px] font-bold inline-flex items-center gap-3"
              >
                <span>Comece agora mesmo</span>
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E0E9F7] bg-white py-10 px-4 sm:px-8">
        <div className="max-w-[1340px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#526480]">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#62A5FF] via-[#0869F5] to-[#052498] shadow-[0_4px_14px_rgba(8,105,245,0.35)]">
              <img
                src="/icone-isolado.png"
                alt="Ícone Fast Rifa"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </div>
            <span className="font-display font-bold text-[#0D1729] tracking-[-0.03em]">
              Fast<span className="text-[#0869F5]">Rifa</span>
            </span>
            <span>© 2026 — Plataforma de campanhas e cotas online.</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/admin" className="hover:text-[#0869F5] transition">
              Painel
            </Link>
            <Link href="/login" className="hover:text-[#0869F5] transition">
              Entrar
            </Link>
            <Link href="/cadastro" className="hover:text-[#0869F5] transition">
              Criar Conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
