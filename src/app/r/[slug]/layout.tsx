import type { Metadata } from 'next';
import { getRaffleBySlug } from '@/lib/firebase/raffles';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) {
    return { title: 'Campanha - FastRifa' };
  }

  const raffle = await getRaffleBySlug(slug);
  if (!raffle) {
    return {
      title: 'Campanha Não Encontrada | FastRifa',
      description: 'A campanha informada não foi encontrada ou foi finalizada.',
    };
  }

  const brand = raffle.brand_name || 'FastRifa Oficial';
  const pageTitle = `${raffle.title} — ${brand}`;
  const priceFormatted = Number(raffle.ticket_price).toFixed(2);
  const pageDescription =
    raffle.description ||
    `Garanta suas cotas da sorte por apenas R$ ${priceFormatted}. Pagamento rápido e direto via PIX para ${brand}.`;

  // URL absoluta da logo do criador para exibição em cards do WhatsApp e Redes Sociais
  const host =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://fastrifa.vercel.app');

  const imageUrl = `${host}/api/raffle/${slug}/logo`;

  return {
    title: pageTitle,
    description: pageDescription,
    icons: {
      icon: imageUrl,
      shortcut: imageUrl,
      apple: imageUrl,
    },
    openGraph: {
      type: 'website',
      title: pageTitle,
      description: pageDescription,
      siteName: brand,
      url: `${host}/r/${slug}`,
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 600,
          alt: `Logo da marca ${brand} - ${raffle.title}`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: pageDescription,
      images: [imageUrl],
    },
  };
}

export default function RaffleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
