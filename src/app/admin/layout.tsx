import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/data/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // En mode réel, réserver l'accès aux administrateurs.
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (!user) redirect("/connexion?redirect=/admin");
    if (user.profile?.role !== "admin") redirect("/dashboard");
  }

  return (
    <Container className="py-8">
      {!isSupabaseConfigured && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Mode démonstration — données d&apos;exemple. Configurez Supabase et
          attribuez le rôle <code>admin</code> à un compte pour accéder réellement
          à l&apos;administration.
        </div>
      )}
      {children}
    </Container>
  );
}
