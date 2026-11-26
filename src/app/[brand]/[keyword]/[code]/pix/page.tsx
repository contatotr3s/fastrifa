'use client';

import { use } from 'react';
import PhysicalCartelaPixView from '@/components/physical-cartela-pix-view';

export default function BrandRafflePixPage({
  params,
}: {
  params: Promise<{ brand: string; keyword: string; code: string }>;
}) {
  const { brand, keyword, code } = use(params);
  return <PhysicalCartelaPixView brand={brand} keyword={keyword} code={code} />;
}
