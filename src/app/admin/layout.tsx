import Link from 'next/link';
import { Mail, Sparkles } from 'lucide-react';
import AdminHeader from './admin-header';
import AdminGuard from '@/components/admin-guard';
import DynamicFavicon from '@/components/dynamic-favicon';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#F8FBFF] text-[#0D1729] flex flex-col">
        <DynamicFavicon />
        <AdminHeader />
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-[#D9E5F7] bg-white/90 backdrop-blur-md py-6 sm:py-8 mt-auto">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            {/* Brand + Copyright */}
            <div className="flex items-center gap-3">
              <img
                src="/logo-fastrifa.png"
                alt="Fast Rifa"
                className="h-7 w-auto object-contain hidden sm:block"
              />
              <img
                src="/icone-mobile-fastrifa.png"
                alt="Fast Rifa"
                className="h-6 w-auto object-contain block sm:hidden"
              />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#0D1729]">
                  © 2026 Fast Rifa. Gestão de rifas 100% no PIX.
                </p>
                <p className="text-[11px] text-[#526480]">
                  Painel do Organizador oficial e campanhas em tempo real.
                </p>
              </div>
            </div>

            {/* Links & Support */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#526480]">
              <Link href="/admin" className="hover:text-[#0869F5] transition">
                Painel
              </Link>
              <Link href="/admin/rifas/nova" className="hover:text-[#0869F5] transition">
                Nova Rifa
              </Link>
              <a
                href="mailto:contatotr3s@gmail.com"
                className="hover:text-[#0869F5] transition inline-flex items-center gap-1"
                title="Suporte por e-mail"
              >
                <Mail className="w-3.5 h-3.5 text-[#0869F5]" />
                <span>contatotr3s@gmail.com</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </AdminGuard>
  );
}
