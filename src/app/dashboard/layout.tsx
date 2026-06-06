import { Container } from "@/components/ui/container";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="py-8">
      {!isSupabaseConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Mode démonstration — les données affichées sont des exemples.
          Configurez Supabase pour activer la gestion réelle de vos événements.
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <DashboardSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
