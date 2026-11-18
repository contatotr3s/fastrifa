import Link from 'next/link';
import HeroOrbitScene from '@/components/hero-orbit-scene';
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
      q: 'Quanto tempo leva para colocar uma rifa no ar?',
      a: 'Menos de 2 minutos. Basta definir o prêmio, a quantidade de cotas, o valor por número e informar sua chave PIX. O link fica pronto para divulgar imediatamente.',
    },
    {
      q: 'O dinheiro das vendas passa pela FastRifa?',
      a: 'Não! Essa é a grande praticidade da FastRifa: o comprador copia a sua chave PIX direto na página da rifa e paga diretamente para o seu banco. O valor cai 100% na sua conta na hora, sem taxas sobre suas vendas e sem retenções.',
    },
    {
      q: 'O meu cliente precisa fazer cadastro para comprar cotas?',
      a: 'Não. Para o comprador é tudo vapt-vupt: ele só digita o nome e WhatsApp para identificação dos números reservados. Nada de criar senhas ou preencher formulários longos.',
    },
    {
      q: 'Como eu confirmo os pagamentos?',
      a: 'Assim que o participante reserva os números, a plataforma gera um botão para ele enviar o comprovante diretamente no seu WhatsApp com os números e o valor certinho. Você confere no seu banco e aprova com 1 clique no painel.',
    },
    {
      q: 'E se alguém reservar cotas e não pagar?',
      a: 'Você tem controle total no painel. Se a pessoa não mandar o comprovante ou desistir, você libera os números de volta para a grade pública instantaneamente com apenas um toque.',
    },
    {
      q: 'Quantas cotas posso colocar na rifa?',
      a: 'Você escolhe a quantidade que quiser: 50, 100, 200, 500, 1.000 ou mais cotas. A grade conta com botões de seleção rápida da sorte (+5, +10, +25, +50) para acelerar ainda mais as vendas.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0D1729] flex flex-col">
      {/* Oratry-style Floating Pill Header with Smooth Feathered Atmosphere */}
      <header className="sticky top-0 z-50 h-[92px] flex items-center">
        <div className="ora-header-feather" aria-hidden="true" />
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Brand Pill */}
          <Link
            href="/"
            className="ora-glass-pill rounded-full pl-3 pr-5 py-2 flex items-center gap-2.5 hover:border-[#B9D3F8] transition"
          >
            <img
              src="/icone-isolado.png"
              alt="Ícone Fast Rifa"
              className="w-8 h-8 object-contain"
            />
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
              PIX Direto
            </a>
            <a href="#perguntas" className="hover:text-[#0869F5] transition">
              Dúvidas
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
              <span>Criar Rifa Rápida</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Stage — Pure Luminous Oratry Aesthetic */}
      <main className="flex-1">
        <section className="ora-hero-stage pt-8 pb-20 sm:pt-14 sm:pb-28 px-4 sm:px-8 relative overflow-hidden">
          <div className="max-w-[1180px] mx-auto text-center">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EDF5FF] border border-[#CDE0FC] text-[#0755DE] text-xs sm:text-sm font-bold tracking-wide mb-6">
              <span className="w-2 h-2 rounded-full bg-[#0869F5] animate-pulse" />
              <span>Rifa Rápida e Prática • 100% Direto no seu PIX</span>
            </div>

            <h1 className="font-display font-bold text-[clamp(2.5rem,5.2vw,4.65rem)] leading-[1.06] tracking-[-0.04em] text-[#0D1729] max-w-4xl mx-auto">
              Crie. Divulgue. Venda.
              <br />
              <span className="text-[#0869F5]">Tudo vapt-vupt no seu PIX.</span>
            </h1>

            <p className="mt-6 text-[clamp(1.05rem,1.45vw,1.25rem)] text-[#475872] max-w-[65ch] mx-auto leading-[1.6] font-normal">
              Pra você criar em 2 minutos, pra você divulgar no WhatsApp, pro seu cliente escolher, pagar no PIX e pra você receber na hora. Sem taxa no saque, sem intermediário e sem complicação.
            </p>

            {/* 3D Orbital Scene (Oratry Style with 5 Orbiting Feature Cards) */}
            <HeroOrbitScene />

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/cadastro"
                className="ora-btn-primary rounded-[20px] px-8 py-4 text-[17px] font-bold inline-flex items-center justify-center gap-3 w-full sm:w-auto"
              >
                <span>Criar Rifa Rápida Agora</span>
                <ArrowUpRight className="w-5 h-5" />
              </Link>
              <a
                href="#campanha-ao-vivo"
                className="ora-btn-secondary rounded-[20px] px-7 py-4 text-[17px] font-semibold inline-flex items-center justify-center gap-2.5 w-full sm:w-auto"
              >
                <span>Ver Demonstração</span>
                <ArrowRight className="w-4 h-4 text-[#0869F5]" />
              </a>
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
                  <div className="inline-block px-3.5 py-1.5 rounded-full bg-white text-[#0755DE] text-xs font-bold uppercase tracking-wider border border-[#CDE0FC]">
                    Experiência do Comprador
                  </div>
                  <h2 className="font-display font-bold text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] tracking-[-0.04em] text-[#0D1729]">
                    Pro seu cliente é vapt-vupt: escolheu, pagou no PIX, confirmou.
                  </h2>
                  <p className="text-[16px] sm:text-[17px] text-[#475872] leading-[1.6]">
                    Zero atrito. O comprador não precisa baixar nenhum aplicativo e nem criar conta com senha. Ele abre o seu link no celular, escolhe os números da sorte em segundos e já te manda o comprovante no WhatsApp.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-[15px] font-medium text-[#14213A]">
                      <span className="w-6 h-6 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <span>Grade interativa com números livres e ocupados em tempo real</span>
                    </div>
                    <div className="flex items-center gap-3 text-[15px] font-medium text-[#14213A]">
                      <span className="w-6 h-6 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <span>Seleção rápida da sorte (+5, +10, +25, +50 cotas com um toque)</span>
                    </div>
                    <div className="flex items-center gap-3 text-[15px] font-medium text-[#14213A]">
                      <span className="w-6 h-6 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-xs font-bold">
                        ✓
                      </span>
                      <span>Chave PIX copiada com 1 clique e envio do comprovante no zap</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link
                      href="/cadastro"
                      className="ora-btn-primary rounded-[18px] px-7 py-3.5 text-[15px] font-bold inline-flex items-center gap-2"
                    >
                      <span>Criar Minha Rifa Agora</span>
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
                          Demonstração da Grade
                        </span>
                        <h3 className="font-display font-bold text-2xl text-[#0D1729] tracking-[-0.03em]">
                          Grade Ágil de Cotas Interativas
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
                        <span>Prévia de como seu cliente visualiza</span>
                        <span className="text-[#0869F5] tabular-nums font-bold">3 cotas selecionadas (R$ 3,00)</span>
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
                        Seu comprador clica nos números da sorte, paga no seu PIX e você confirma pelo painel com 1 clique.
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

        {/* Section 3: How It Works (4 Practical Steps) */}
        <section id="como-funciona" className="ora-section-glow py-20 sm:py-28 px-4 sm:px-8">
          <div className="max-w-[1340px] mx-auto space-y-14">
            <div className="max-w-2xl">
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-[#EDF5FF] text-[#0755DE] text-xs font-bold uppercase tracking-wider border border-[#CDE0FC] mb-4">
                Praticidade de Ponta a Ponta
              </div>
              <h2 className="font-display font-bold text-[clamp(2.1rem,4vw,3.5rem)] leading-[1.05] tracking-[-0.045em] text-[#0D1729]">
                Criar. Divulgar. Vender. Receber.
              </h2>
              <p className="mt-4 text-[17px] text-[#475872] leading-[1.6]">
                Desenvolvemos a FastRifa para eliminar qualquer perda de tempo entre você e o dinheiro das suas cotas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="ora-card-soft rounded-[30px] p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#0869F5] uppercase tracking-wider block">Passo 1</span>
                  <h3 className="font-display font-bold text-[21px] text-[#0D1729] tracking-[-0.03em] leading-[1.2]">
                    Você cria em 2 minutos
                  </h3>
                  <p className="text-[14px] text-[#475872] leading-[1.6]">
                    Coloque o título do prêmio, a quantidade de cotas, o valor do número e sua chave PIX. Sem burocracia.
                  </p>
                </div>
                <div className="bg-white rounded-[16px] p-3.5 border border-[#E0E9F7] text-xs font-semibold text-[#0869F5]">
                  ⚡ Rifa no ar na hora
                </div>
              </div>

              {/* Step 2 */}
              <div className="ora-card-soft rounded-[30px] p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#0869F5] uppercase tracking-wider block">Passo 2</span>
                  <h3 className="font-display font-bold text-[21px] text-[#0D1729] tracking-[-0.03em] leading-[1.2]">
                    Você divulga no WhatsApp
                  </h3>
                  <p className="text-[14px] text-[#475872] leading-[1.6]">
                    Copie seu link exclusivo e mande nos grupos, status do zap e redes sociais. O link abre rápido em qualquer celular.
                  </p>
                </div>
                <div className="bg-white rounded-[16px] p-3.5 border border-[#E0E9F7] text-xs font-semibold text-[#0869F5]">
                  📲 Link pronto com 1 clique
                </div>
              </div>

              {/* Step 3 */}
              <div className="ora-card-soft rounded-[30px] p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center shadow-sm">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#0869F5] uppercase tracking-wider block">Passo 3</span>
                  <h3 className="font-display font-bold text-[21px] text-[#0D1729] tracking-[-0.03em] leading-[1.2]">
                    Seu cliente escolhe e paga
                  </h3>
                  <p className="text-[14px] text-[#475872] leading-[1.6]">
                    Ele clica nos números da sorte, copia seu PIX, faz o pagamento e envia o comprovante direto no seu WhatsApp.
                  </p>
                </div>
                <div className="bg-white rounded-[16px] p-3.5 border border-[#E0E9F7] text-xs font-semibold text-[#0869F5]">
                  💸 PIX direto pro seu banco
                </div>
              </div>

              {/* Step 4 */}
              <div className="ora-card-soft rounded-[30px] p-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-[#D9E5F7] text-[#0869F5] flex items-center justify-center shadow-sm">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-[#0869F5] uppercase tracking-wider block">Passo 4</span>
                  <h3 className="font-display font-bold text-[21px] text-[#0D1729] tracking-[-0.03em] leading-[1.2]">
                    Você recebe e confirma
                  </h3>
                  <p className="text-[14px] text-[#475872] leading-[1.6]">
                    O dinheiro já está na sua conta bancária. Você confere no painel e confirma as cotas com 1 toque.
                  </p>
                </div>
                <div className="bg-white rounded-[16px] p-3.5 border border-[#E0E9F7] text-xs font-semibold text-[#0869F5]">
                  🏆 100% sob seu controle
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
                  <span>Dinheiro Direto na Sua Conta Bancária</span>
                </div>
                <h2 className="font-display font-bold text-[clamp(1.85rem,3.2vw,2.75rem)] leading-[1.1] tracking-[-0.04em] text-[#0D1729]">
                  Zero taxa sobre suas vendas. Sem esperar 30 dias para sacar.
                </h2>
                <p className="text-[16px] text-[#475872] leading-[1.6] max-w-2xl">
                  Enquanto outras plataformas seguram o seu dinheiro por semanas e cobram comissões por bilhete, na FastRifa o comprador paga diretamente na sua chave PIX. Caiu na conta, é seu. Tudo vapt-vupt.
                </p>
              </div>
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
                <Link
                  href="/cadastro"
                  className="ora-btn-primary rounded-[18px] px-6 py-4 text-center text-[16px] font-bold flex items-center justify-center gap-2"
                >
                  <span>Criar Rifa Rápida Agora</span>
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="ora-btn-secondary rounded-[18px] px-6 py-3.5 text-center text-[15px] font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#0869F5]" />
                  <span>Acessar Meu Painel</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ Section (Oratry Sticky Split Layout) */}
        <section id="perguntas" className="py-20 sm:py-28 px-4 sm:px-8 bg-gradient-to-b from-white to-[#F5F9FF]">
          <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
              <div className="inline-block px-3.5 py-1.5 rounded-full bg-[#EDF5FF] text-[#0755DE] text-xs font-bold uppercase tracking-wider border border-[#CDE0FC]">
                Tira-Dúvidas Rápido
              </div>
              <h2 className="font-display font-bold text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] tracking-[-0.04em] text-[#0D1729]">
                Perguntas frequentes.
              </h2>
              <p className="text-[16px] text-[#475872] leading-[1.6]">
                Tudo o que você precisa saber sobre rapidez na criação, reservas de cotas e recebimento via PIX.
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
              Pronto para colocar sua rifa no ar?
            </h2>
            <p className="text-[17px] text-[#475872] max-w-xl mx-auto leading-[1.6]">
              Pra você criar, pra você divulgar, pro seu cliente escolher, pagar e pra você receber. Tudo vapt-vupt em menos de 2 minutos.
            </p>
            <div className="pt-2">
              <Link
                href="/cadastro"
                className="ora-btn-primary rounded-[18px] px-9 py-4 text-[18px] font-bold inline-flex items-center gap-3"
              >
                <span>Criar Rifa Rápida Grátis</span>
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
            <img
              src="/icone-isolado.png"
              alt="Ícone Fast Rifa"
              className="w-6 h-6 object-contain"
            />
            <span className="font-display font-bold text-[#0D1729] tracking-[-0.03em]">
              Fast<span className="text-[#0869F5]">Rifa</span>
            </span>
            <span>© 2026 — Rifa rápida, prática e 100% no PIX.</span>
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
