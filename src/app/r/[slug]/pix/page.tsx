'use client';

import { Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PhysicalCartelaPixView from '@/components/physical-cartela-pix-view';

function PhysicalCartelaPixPageContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const requestedOrganizerMode = searchParams.get('canal') === 'organizador';

  return (
    <PhysicalCartelaPixView
      slug={slug}
      requestedOrganizerMode={requestedOrganizerMode}
    />
  );
}

export default function PhysicalCartelaPixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] ora-hero-stage flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00A868]" />
        </div>
      }
    >
      <PhysicalCartelaPixPageContent slug={slug} />
    </Suspense>
  );
}
