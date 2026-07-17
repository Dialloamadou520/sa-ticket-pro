"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Identifiant anonyme et stable d'un visiteur (localStorage), pour compter
 *  les visiteurs uniques sans cookie de suivi. */
function getVisitorId(): string {
  try {
    const key = "kp_visitor";
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return "";
  }
}

/**
 * Enregistre une visite de page à chaque navigation. Monté dans le layout
 * racine. Les pages d'administration sont ignorées (console interne).
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const body = JSON.stringify({ path: pathname, visitorId: getVisitorId() });
    // `keepalive` pour ne pas perdre l'événement si l'utilisateur quitte vite.
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
