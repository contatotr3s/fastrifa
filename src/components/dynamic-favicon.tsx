'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';

export default function DynamicFavicon() {
  const { profile } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const brandLogo = profile?.brand_logo_url;
    const targetIcon = brandLogo || '/icone-mobile-fastrifa.png';

    // Procura links de favicon existentes ou cria um novo
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = targetIcon;
  }, [profile?.brand_logo_url]);

  return null;
}
