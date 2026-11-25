import AdminHeader from './admin-header';
import AdminGuard from '@/components/admin-guard';
import DynamicFavicon from '@/components/dynamic-favicon';
import ScrollToTopButton from '@/components/scroll-to-top-button';

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
                className="h-7 w-auto object-contain"
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

            {/* Botão único de retornar ao topo */}
            <div className="flex items-center justify-center sm:justify-end">
              <ScrollToTopButton />
            </div>
          </div>
        </footer>
      </div>
    </AdminGuard>
  );
}
