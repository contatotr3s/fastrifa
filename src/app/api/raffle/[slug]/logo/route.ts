import { NextRequest, NextResponse } from 'next/server';
import { getRaffleBySlug } from '@/lib/firebase/raffles';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return new NextResponse('Slug não informado', { status: 400 });
    }

    const raffle = await getRaffleBySlug(slug);
    if (!raffle) {
      return NextResponse.redirect(new URL('/icone-isolado.png', req.url));
    }

    // Prefere a logo da marca do criador; se não tiver, usa a foto do prêmio
    const rawImage = raffle.brand_logo_url || raffle.prize_image_url;

    if (!rawImage) {
      return NextResponse.redirect(new URL('/icone-isolado.png', req.url));
    }

    // Se for dataURL (base64)
    if (rawImage.startsWith('data:image/')) {
      const match = rawImage.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const mimeSub = match[1] === 'jpeg' ? 'jpeg' : match[1];
        const contentType = `image/${mimeSub}`;
        const buffer = Buffer.from(match[2], 'base64');

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
          },
        });
      }
    }

    // Se for URL externa segura HTTP/HTTPS: redireciona diretamente o cliente sem SSRF
    if (rawImage.startsWith('https://') || rawImage.startsWith('http://')) {
      return NextResponse.redirect(rawImage);
    }

    return NextResponse.redirect(new URL('/icone-isolado.png', req.url));
  } catch (err) {
    console.error('Erro na rota de logo da rifa:', err);
    return NextResponse.redirect(new URL('/icone-isolado.png', req.url));
  }
}
