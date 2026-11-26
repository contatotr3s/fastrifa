'use client';

import { use } from 'react';
import PhysicalCartelaPixView from '@/components/physical-cartela-pix-view';

export default function PhysicalCartelaPixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <PhysicalCartelaPixView slug={slug} />;
}
