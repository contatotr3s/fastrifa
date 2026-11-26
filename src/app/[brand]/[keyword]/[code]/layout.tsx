import type { Metadata } from 'next';
import { getRaffleByPublicParams } from '@/lib/firebase/raffles';
import { getRafflePublicPath } from '@/lib/raffle-urls';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; keyword: string; code: string }>;
}): Promise<Metadata> {
  const { brand, keyword, code } = await params;
  if (!brand || !keyword || !code) {
    return { title: 'Campanha - FastRifa' };
  }

  const raffle = await getRaffleByPublicParams(brand, keyword, code);
  if (!raffle) {
    return {
      title: 'Campanha Não Encontrada | FastRifa',
      description: 'A campanha informada não foi encontrada ou foi finalizada.',
    };
  }

  const brandName = raffle.brand_name || 'FastRifa Oficial';
  const pageTitle = `${raffle.title} — ${brandName}`;
  const priceFormatted = Number(raffle.ticket_price).toFixed(2);
  const pageDescription =
    raffle.description ||
    `Garanta suas cotas da sorte por apenas R$ ${priceFormatted}. Pagamento rápido e direto via PIX para ${brandName}.`;

  const host =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://fastrifa.vercel.app');

  const imageUrl = `${host}/api/raffle/${raffle.slug}/logo`;
  const faviconUrl = raffle.brand_logo_url || `${host}/icone-mobile-fastrifa.png`;
  const publicPath = getRafflePublicPath(raffle);

  return {
    title: pageTitle,
    description: pageDescription,
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    openGraph: {
      type: 'website',
      title: pageTitle,
      description: pageDescription,
      siteName: brandName,
      url: `${host}${publicPath}`,
      images: [
        {
          url: imageUrl,
          width: 600,
          height: 600,
          alt: `Logo da marca ${brandName} - ${raffle.title}`,
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

export default function BrandRaffleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
