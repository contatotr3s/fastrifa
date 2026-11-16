import AdminHeader from './admin-header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <AdminHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        FASTRIFA &copy; 2026 — Plataforma rápida de sorteios e cotas.
      </footer>
    </div>
  );
}
