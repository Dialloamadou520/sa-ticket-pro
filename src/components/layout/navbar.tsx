import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { SITE } from "@/lib/constants";
import { getCurrentUser } from "@/lib/data/auth";
import { getControllerEventIds } from "@/lib/data/controllers";
import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Explorer", href: "/explorer" },
  { label: "Créer un événement", href: "/dashboard/evenements/nouveau" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
];

export async function Navbar() {
  const user = await getCurrentUser();
  const isController = user ? (await getControllerEventIds()).length > 0 : false;
  const displayName =
    user?.profile?.full_name || user?.email?.split("@")[0] || "Mon compte";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <Image
            src="/logo-mark.png"
            alt={SITE.name}
            width={804}
            height={448}
            priority
            className="h-9 w-auto"
          />
          <span className="text-lg tracking-tight">{SITE.name}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu
              name={displayName}
              role={user.profile?.role ?? "participant"}
              isController={isController}
            />
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <LinkButton href="/connexion" variant="ghost" size="sm">
                Connexion
              </LinkButton>
              <LinkButton href="/inscription" size="sm">
                Inscription
              </LinkButton>
            </div>
          )}
          <MobileMenu links={navLinks} isAuthed={!!user} />
        </div>
      </Container>
    </header>
  );
}
