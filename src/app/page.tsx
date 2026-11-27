import Link from 'next/link';
import HeroOrbitScene from '@/components/hero-orbit-scene';
import GradePrintShowcase from '@/components/grade-print-showcase';
import HowItWorksShowcase from '@/components/how-it-works-showcase';
import ScrollToTopButton from '@/components/scroll-to-top-button';
import FacildanTextoDinamico from '@/components/facildan-texto-dinamico';
import HomeHeaderActions from '@/components/home-header-actions';
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Mail,
} from 'lucide-react';

export default function HomePage() {
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
      {/* Oratry-style Clean Atmosphere Header */}
      <header
        data-menu-open="false"
        style={{ '--nav-blur-height': '75px' } as React.CSSProperties}
        className="ora-header-container flex items-center"
      >
        <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-8 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Pill */}
          <Link
            href="/"
            className="ora-glass-pill rounded-full h-11 sm:h-12 px-3 sm:px-4 flex items-center justify-center hover:border-[#B9D3F8] transition shrink-0"
          >
            <img
              src="/logo-fastrifa.png"
              alt="Fast Rifa"
              className="h-7 sm:h-[38px] w-auto object-contain"
            />
          </Link>

          {/* Center Navigation Pill with Oratry Smooth Links */}
          <nav
            aria-label="Navegação principal"
            className="ora-glass-pill rounded-full px-3 py-1.5 hidden md:flex items-center gap-1"
          >
            <a href="#como-funciona" className="ora-nav-link">
              Como funciona
            </a>
            <a href="#campanha-ao-vivo" className="ora-nav-link">
              Demonstração
            </a>
            <a href="#transparencia" className="ora-nav-link">
              PIX Direto
            </a>
            <a href="#perguntas" className="ora-nav-link">
              Dúvidas
            </a>
          </nav>

          {/* Right Action Pills */}
          <HomeHeaderActions />
        </div>
      </header>

      {/* Hero Stage — Pure Luminous Oratry Aesthetic */}
      <main className="flex-1">
        <section className="ora-hero-stage pt-2 pb-8 sm:pt-3 sm:pb-14 relative overflow-hidden min-h-[calc(100svh-72px)] flex flex-col justify-center">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-8">
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 items-center relative">
              {/* Left Column: Text & CTAs (Upper layer - z-20) */}
              <div className="w-full lg:w-1/2 lg:shrink-0 text-center lg:text-left space-y-2.5 sm:space-y-5 relative z-20 pointer-events-auto lg:-mt-4">
                <h1 className="font-display tracking-[-0.04em]">
                  <span className="block text-lg sm:text-2xl lg:text-[1.85rem] font-bold text-[#0D1729] mb-1 tracking-[-0.03em]">
                    Crie, divulgue e venda.
                  </span>
                  <span className="block text-[clamp(2.15rem,4.6vw,4.4rem)] font-bold text-[#00A868] leading-[1.06]">
                    Tudo{' '}
                    <FacildanTextoDinamico
                      words={['vapt-vupt', 'rápido', 'na hora', 'prático', 'fluido']}
                      effect="typewriter"
                      speed={0.6}
                      hold={1800}
                      variant="plain"
                    />
                    <br />
                    no seu PIX.
                  </span>
                </h1>

                <p className="text-[14.5px] sm:text-[19px] text-[#475872] leading-[1.48] sm:leading-[1.6] max-w-[54ch] mx-auto lg:mx-0">
                  Pra você criar em 2 minutos e divulgar no WhatsApp,
                  <br className="hidden sm:inline" />
                  pro seu cliente escolher, pagar no PIX e você receber na hora.
                  <br className="hidden sm:inline" />
                  Sem taxa no saque, sem intermediário e sem complicação.
                </p>

                {/* 3D Orbital Scene no modo responsivo (harmonizada no fluxo mobile) */}
                <div className="block lg:hidden -my-1.5 sm:my-0 w-full overflow-visible">
                  <HeroOrbitScene variant="mobile" />
                </div>

                {/* Primary CTA Button (Only one) */}
                <div className="pt-0.5 sm:pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <Link
                    href="/cadastro"
                    className="ora-btn-primary rounded-[18px] px-7 py-3.5 sm:px-8 sm:py-4 text-[16px] sm:text-[17px] font-bold inline-flex items-center justify-center gap-2.5 shadow-[0_12px_28px_rgba(8,105,245,0.28)] hover:scale-[1.02] transition-transform"
                  >
                    <span>Criar Minha Rifa Rápida</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* Social Proof Line */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs sm:text-sm text-[#526480] font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0869F5]" />
                    100% no seu PIX
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0869F5]" />
                    Sem taxa de saque
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0869F5]" />
                    Criação em menos de 2 min
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0869F5]" />
                    Sem cadastro pro cliente
                  </span>
                </div>
              </div>

              {/* Right Column: 3D Orbital Scene side-by-side no desktop (lower layer z-10) */}
              <div className="hidden lg:flex w-full lg:flex-1 min-w-0 items-center justify-center relative z-10 lg:-ml-28 xl:-ml-44 2xl:-ml-44 overflow-visible">
                <HeroOrbitScene variant="desktop" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Live Demo Stage (Ajustado à dimensão da tela) */}
        <section id="campanha-ao-vivo" className="ora-section-seam scroll-mt-20 py-2 sm:py-4 lg:py-12 min-h-[calc(100svh-75px)] flex items-center justify-center px-3.5 sm:px-8">
          <div className="max-w-[1280px] w-full mx-auto">
            <div className="ora-demo-stage rounded-[22px] lg:rounded-[30px] p-3.5 sm:p-5 lg:p-8 xl:p-10 border border-[#D9E5F7] shadow-[0_22px_60px_rgba(32,77,139,0.08)]">
              <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-4 lg:gap-8 items-center">
                {/* Left Editorial Explanation */}
                <div className="w-full lg:w-[calc(41.666667%-18.6667px)] lg:shrink-0 min-w-0 space-y-1.5 sm:space-y-2.5 lg:space-y-4 text-center lg:text-left">
                  <span className="text-[#0869f5] text-[11px] lg:text-xs font-bold uppercase tracking-wider block">
                    Experiência do Comprador
                  </span>
                  <h2 className="font-display font-bold text-[1.18rem] sm:text-[1.55rem] lg:text-[clamp(1.75rem,2.4vw,2.35rem)] leading-[1.1] tracking-[-0.035em] text-[#0D1729]">
                    Pro seu cliente é vapt-vupt: escolheu, pagou no PIX, confirmou.
                  </h2>
                  <p className="text-[11.5px] sm:text-[13.5px] lg:text-[15.5px] text-[#475872] leading-[1.36] lg:leading-[1.55] max-w-xl mx-auto lg:mx-0">
                    Zero atrito. O comprador não precisa baixar nenhum aplicativo e nem criar conta com senha. Ele abre o seu link no celular, escolhe os números da sorte em segundos e já te manda o comprovante no WhatsApp.
                  </p>

                  <div className="space-y-1 sm:space-y-1.5 lg:space-y-2 pt-0.5 lg:pt-1 inline-flex flex-col items-start text-left mx-auto lg:mx-0">
                    <div className="flex items-center gap-1.5 lg:gap-2.5 text-[11px] sm:text-[13px] lg:text-[14px] leading-tight lg:leading-snug font-medium text-[#14213A]">
                      <span className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-[9.5px] lg:text-[11px] font-bold shrink-0">
                        ✓
                      </span>
                      <span>Grade interativa com números livres e ocupados em tempo real</span>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2.5 text-[11px] sm:text-[13px] lg:text-[14px] leading-tight lg:leading-snug font-medium text-[#14213A]">
                      <span className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-[9.5px] lg:text-[11px] font-bold shrink-0">
                        ✓
                      </span>
                      <span>Seleção rápida da sorte (+5, +10, +25, +50 cotas com um toque)</span>
                    </div>
                    <div className="flex items-center gap-1.5 lg:gap-2.5 text-[11px] sm:text-[13px] lg:text-[14px] leading-tight lg:leading-snug font-medium text-[#14213A]">
                      <span className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-[9.5px] lg:text-[11px] font-bold shrink-0">
                        ✓
                      </span>
                      <span>Chave PIX copiada com 1 clique e envio do comprovante no zap</span>
                    </div>
                  </div>

                  <div className="pt-1 lg:pt-2 flex justify-center lg:justify-start">
                    <Link
                      href="/cadastro"
                      className="ora-btn-primary rounded-[16px] lg:rounded-[18px] px-4 py-2 lg:px-6 lg:py-3 text-[12.5px] lg:text-[14.5px] font-bold inline-flex items-center gap-2"
                    >
                      <span>Criar Minha Rifa Agora</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Animated Soft-Frame Print Showcase */}
                <div className="w-full lg:flex-1 min-w-0 flex items-center justify-center">
                  <GradePrintShowcase />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works (4 Practical Steps — Interactive Showcase) */}
        <HowItWorksShowcase />

        {/* Section 4: Transparency & Direct PIX Highlight */}
        <section id="transparencia" className="ora-section-seam py-14 sm:py-20 px-4 sm:px-8">
          <div className="max-w-[1160px] mx-auto">
            <div className="ora-card rounded-[32px] p-8 sm:p-12 border-2 border-[#0869F5] shadow-[0_20px_50px_rgba(8,105,245,0.10)] flex flex-col lg:flex-row gap-8 items-center">
              <div className="w-full lg:w-[calc(66.666667%-10.6667px)] lg:shrink-0 min-w-0 space-y-4 text-center lg:text-left">
                <span className="block text-[#0869f5] text-xs font-bold tracking-wider uppercase">
                  Dinheiro Direto na Sua Conta Bancária
                </span>
                <h2 className="font-display font-bold text-[clamp(1.85rem,3.2vw,2.75rem)] leading-[1.1] tracking-[-0.04em] text-[#0D1729]">
                  Zero taxa sobre suas vendas. Sem esperar 30 dias para sacar.
                </h2>
                <p className="text-[16px] text-[#475872] leading-[1.6] max-w-2xl mx-auto lg:mx-0">
                  Enquanto outras plataformas seguram o seu dinheiro por semanas e cobram comissões por bilhete, na FastRifa o comprador paga diretamente na sua chave PIX. Caiu na conta, é seu. Tudo vapt-vupt.
                </p>
              </div>
              <div className="w-full lg:flex-1 min-w-0 flex flex-col justify-center">
                <Link
                  href="/cadastro"
                  className="ora-btn-primary rounded-[18px] px-6 py-4 text-center text-[16px] font-bold flex items-center justify-center gap-2"
                >
                  <span>Criar Rifa Rápida Agora</span>
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ Section (Oratry Sticky Split Layout + Mobile Stacking Deck) */}
        <section id="perguntas" className="ora-section-seam scroll-mt-20 py-12 sm:py-16 lg:py-20 px-4 sm:px-8">
          <div className="max-w-[1240px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
            <div className="w-full lg:w-[calc(41.666667%-23.3333px)] lg:shrink-0 min-w-0 lg:sticky lg:top-28 space-y-4 text-center lg:text-left max-w-xl mx-auto lg:mx-0 lg:max-w-none">
              <span className="text-[#0869f5] text-xs font-bold uppercase tracking-wider block">
                Tira-Dúvidas Rápido
              </span>
              <h2 className="font-display font-bold text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.06] tracking-[-0.04em] text-[#0D1729]">
                Perguntas frequentes.
              </h2>
              <p className="text-[16px] text-[#475872] leading-[1.6]">
                Tudo o que você precisa saber sobre rapidez na criação, reservas de cotas e recebimento via PIX.
              </p>
            </div>

            <div className="w-full lg:flex-1 min-w-0 space-y-6 lg:space-y-4 pb-6 lg:pb-0">
              {faqs.map((item, idx) => (
                <div
                  key={idx}
                  style={
                    {
                      '--faq-top': `${88 + idx * 14}px`,
                      zIndex: idx + 1,
                    } as React.CSSProperties
                  }
                  className="ora-card rounded-[24px] p-5 sm:p-6 lg:p-7 space-y-2.5 hover:border-[#B9D3F8] transition sticky top-[var(--faq-top)] lg:static lg:top-auto bg-white shadow-[0_-10px_28px_rgba(13,23,41,0.06),0_12px_30px_rgba(32,77,139,0.08)] lg:shadow-none"
                >
                  <div className="flex lg:hidden items-center justify-between text-[11px] font-bold text-[#0869f5] uppercase tracking-wider">
                    <span>Dúvida 0{idx + 1}</span>
                    <span className="text-[#8A9BB3] tabular-nums">
                      0{idx + 1} / 0{faqs.length}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[17.5px] lg:text-[19px] text-[#0D1729] tracking-[-0.02em]">
                    {item.q}
                  </h3>
                  <p className="text-[14px] lg:text-[15px] text-[#475872] leading-[1.6]">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Closing CTA Section */}
        <section className="ora-section-seam py-14 sm:py-20 px-4 text-center">
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
        <div className="max-w-[1336px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#526480]">
          {/* Brand & Rights */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <img
              src="/logo-fastrifa.png"
              alt="Fast Rifa"
              className="h-8 sm:h-9 w-auto object-contain flex-shrink-0"
            />
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm text-[#0D1729] font-medium">
                © 2026 Fast Rifa. Todos os direitos reservados.
              </p>
              <p className="text-xs text-[#526480]">
                Rifa rápida, prática e 100% no PIX.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-wrap items-center justify-center font-medium text-xs sm:text-sm">
            <a
              href="mailto:contatotr3s@gmail.com"
              className="inline-flex items-center gap-1.5 text-[#526480] hover:text-[#0869F5] transition"
              title="Fale conosco por e-mail"
            >
              <Mail className="w-4 h-4 text-[#0869F5]" />
              <span>contatotr3s@gmail.com</span>
            </a>
          </div>

          {/* Back to top button na extremidade direita */}
          <div className="flex items-center justify-center md:justify-end">
            <ScrollToTopButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
