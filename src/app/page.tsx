import Link from 'next/link';
import HeroOrbitScene from '@/components/hero-orbit-scene';
import GradePrintShowcase from '@/components/grade-print-showcase';
import ScrollToTopButton from '@/components/scroll-to-top-button';
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Zap,
  QrCode,
  MessageCircle,
  Trophy,
  ShieldCheck,
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
            {/* Desktop: Logo completa */}
            <img
              src="/logo-fastrifa.png"
              alt="Fast Rifa"
              className="h-8 sm:h-[38px] w-auto object-contain hidden sm:block"
            />
            {/* Mobile celular: Logo responsiva */}
            <img
              src="/icone-mobile-fastrifa.png"
              alt="Fast Rifa"
              className="h-[30px] sm:h-8 w-auto object-contain block sm:hidden"
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
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Link
              href="/login"
              className="ora-btn-secondary rounded-full h-11 sm:h-12 px-3.5 sm:px-5 text-[13.5px] sm:text-[14px] font-semibold inline-flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#0869F5]" />
              <span>Entrar</span>
            </Link>
            <Link
              href="/cadastro"
              className="ora-btn-primary rounded-full h-11 sm:h-12 px-4 sm:px-6 text-[13.5px] sm:text-[14px] font-bold inline-flex items-center justify-center"
            >
              <span>Criar rifa</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Stage — Pure Luminous Oratry Aesthetic */}
      <main className="flex-1">
        <section className="ora-hero-stage pt-2 pb-10 sm:pt-3 sm:pb-14 px-4 sm:px-8 relative overflow-hidden">
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 items-center relative">
              {/* Left Column: Text & CTAs (Upper layer - z-20) */}
              <div className="lg:col-span-6 xl:col-span-6 text-center lg:text-left space-y-5 relative z-20 pointer-events-auto lg:-mt-4">
                <h1 className="font-display tracking-[-0.04em]">
                  <span className="block text-xl sm:text-2xl lg:text-[1.85rem] font-bold text-[#0D1729] mb-1.5 tracking-[-0.03em]">
                    Crie, divulgue e venda.
                  </span>
                  <span className="block text-[clamp(2.6rem,4.6vw,4.4rem)] font-bold text-[#0869F5] leading-[1.06]">
                    Tudo vapt-vupt
                    <br />
                    no seu PIX.
                  </span>
                </h1>

                <p className="text-[17px] sm:text-[19px] text-[#475872] leading-[1.6] max-w-[54ch] mx-auto lg:mx-0">
                  Pra você criar em 2 minutos e divulgar no WhatsApp,
                  <br className="hidden sm:inline" />
                  pro seu cliente escolher, pagar no PIX e você receber na hora.
                  <br className="hidden sm:inline" />
                  Sem taxa no saque, sem intermediário e sem complicação.
                </p>

                {/* Primary CTA Button (Only one) */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <Link
                    href="/cadastro"
                    className="ora-btn-primary rounded-[18px] px-8 py-4 text-[17px] font-bold inline-flex items-center justify-center gap-2.5 shadow-[0_12px_28px_rgba(8,105,245,0.28)] hover:scale-[1.02] transition-transform"
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

              {/* Right Column: 3D Orbital Scene side-by-side on lower layer (z-10), expanded to spread behind text */}
              <div className="lg:col-span-6 xl:col-span-6 flex items-center justify-center relative z-10 lg:-ml-16 xl:-ml-28 2xl:-ml-36 overflow-visible pointer-events-none">
                <HeroOrbitScene />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Interactive Live Demo Stage (Ajustado à dimensão da tela) */}
        <section id="campanha-ao-vivo" className="ora-section-seam py-8 sm:py-10 lg:py-12 min-h-[calc(100svh-75px)] flex items-center justify-center px-4 sm:px-8">
          <div className="max-w-[1280px] w-full mx-auto">
            <div className="ora-demo-stage rounded-[30px] p-6 sm:p-8 lg:p-8 xl:p-10 border border-[#D9E5F7] shadow-[0_22px_60px_rgba(32,77,139,0.08)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                {/* Left Editorial Explanation */}
                <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
                  <span className="text-[#0755DE] text-xs font-bold uppercase tracking-wider block">
                    Experiência do Comprador
                  </span>
                  <h2 className="font-display font-bold text-[clamp(1.75rem,2.4vw,2.35rem)] leading-[1.12] tracking-[-0.035em] text-[#0D1729]">
                    Pro seu cliente é vapt-vupt: escolheu, pagou no PIX, confirmou.
                  </h2>
                  <p className="text-[14.5px] sm:text-[15.5px] text-[#475872] leading-[1.55] max-w-xl mx-auto lg:mx-0">
                    Zero atrito. O comprador não precisa baixar nenhum aplicativo e nem criar conta com senha. Ele abre o seu link no celular, escolhe os números da sorte em segundos e já te manda o comprovante no WhatsApp.
                  </p>

                  <div className="space-y-2 pt-1 inline-flex flex-col items-start text-left mx-auto lg:mx-0">
                    <div className="flex items-center gap-2.5 text-[14px] font-medium text-[#14213A]">
                      <span className="w-5 h-5 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        ✓
                      </span>
                      <span>Grade interativa com números livres e ocupados em tempo real</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[14px] font-medium text-[#14213A]">
                      <span className="w-5 h-5 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        ✓
                      </span>
                      <span>Seleção rápida da sorte (+5, +10, +25, +50 cotas com um toque)</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[14px] font-medium text-[#14213A]">
                      <span className="w-5 h-5 rounded-full bg-[#0869F5] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        ✓
                      </span>
                      <span>Chave PIX copiada com 1 clique e envio do comprovante no zap</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-center lg:justify-start">
                    <Link
                      href="/cadastro"
                      className="ora-btn-primary rounded-[18px] px-6 py-3 text-[14.5px] font-bold inline-flex items-center gap-2"
                    >
                      <span>Criar Minha Rifa Agora</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Right Animated Soft-Frame Print Showcase */}
                <div className="lg:col-span-7 flex items-center justify-center">
                  <GradePrintShowcase />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works (4 Practical Steps) */}
        <section id="como-funciona" className="ora-section-seam py-14 sm:py-20 px-4 sm:px-8">
          <div className="max-w-[1340px] mx-auto space-y-14">
            <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
              <span className="text-[#0755DE] text-xs font-bold uppercase tracking-wider block mb-4">
                Praticidade de Ponta a Ponta
              </span>
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
                    <Zap className="w-6 h-6" />
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
        <section id="transparencia" className="ora-section-seam py-14 sm:py-20 px-4 sm:px-8">
          <div className="max-w-[1160px] mx-auto">
            <div className="ora-card rounded-[32px] p-8 sm:p-12 border-2 border-[#0869F5] shadow-[0_20px_50px_rgba(8,105,245,0.10)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0869F5] text-white text-xs font-bold tracking-wider uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dinheiro Direto na Sua Conta Bancária</span>
                </div>
                <h2 className="font-display font-bold text-[clamp(1.85rem,3.2vw,2.75rem)] leading-[1.1] tracking-[-0.04em] text-[#0D1729]">
                  Zero taxa sobre suas vendas. Sem esperar 30 dias para sacar.
                </h2>
                <p className="text-[16px] text-[#475872] leading-[1.6] max-w-2xl mx-auto lg:mx-0">
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
        <section id="perguntas" className="ora-section-seam py-14 sm:py-20 px-4 sm:px-8">
          <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4 text-center lg:text-left max-w-xl mx-auto lg:mx-0 lg:max-w-none">
              <span className="text-[#0755DE] text-xs font-bold uppercase tracking-wider block">
                Tira-Dúvidas Rápido
              </span>
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
        <div className="max-w-[1340px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#526480]">
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

          {/* Links & Contact */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 font-medium text-xs sm:text-sm">
            <a
              href="mailto:contatotr3s@gmail.com"
              className="inline-flex items-center gap-1.5 text-[#526480] hover:text-[#0869F5] transition"
              title="Fale conosco por e-mail"
            >
              <Mail className="w-4 h-4 text-[#0869F5]" />
              <span>contatotr3s@gmail.com</span>
            </a>
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

          {/* Back to top button na extremidade direita */}
          <div className="flex items-center justify-center md:justify-end">
            <ScrollToTopButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
