import AdminHeader from './admin-header';
import AdminGuard from '@/components/admin-guard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#F8FBFF] text-[#0D1729] flex flex-col">
        <AdminHeader />
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-[#E0E9F7] bg-white py-6 text-center text-xs text-[#526480]">
          FastRifa &copy; 2026 — Gestão transparente de campanhas e cotas via PIX.
        </footer>
      </div>
    </AdminGuard>
  );
}
