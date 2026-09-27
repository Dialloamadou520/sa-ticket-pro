import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare, Phone } from "lucide-react";
import { ContactMessageActions } from "@/components/admin/contact-message-actions";
import {
  getContactMessages,
  isContactInboxAvailable,
} from "@/lib/data/contact";
import { isWhatsappConfigured } from "@/lib/notifications/whatsapp";
import { formatDateShort } from "@/lib/format";

export const metadata: Metadata = { title: "Messages" };

/** Lien « répondre sur WhatsApp » vers le visiteur, si son numéro est connu. */
function whatsappLink(phone: string, name: string) {
  const digits = phone.replace(/[^\d]/g, "");
  const text = encodeURIComponent(
    `Bonjour ${name}, nous revenons vers vous suite à votre message sur kaypass.`
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export default async function AdminMessagesPage() {
  const [messages, available] = await Promise.all([
    getContactMessages(),
    isContactInboxAvailable(),
  ]);
  const whatsappReady = isWhatsappConfigured();
  const unhandled = messages.filter((m) => !m.handled).length;

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à l&apos;administration
      </Link>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 p-4 sm:items-center sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-slate-900">
              Messages · {unhandled} à traiter
            </h1>
            <p className="text-xs text-slate-500">
              Messages envoyés depuis la page Contact.
              {whatsappReady
                ? " Le service client est aussi prévenu sur WhatsApp."
                : " La notification WhatsApp n'est pas encore configurée."}
            </p>
          </div>
        </div>

        {!available && (
          <p className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-800">
            Boîte de réception inactive : la migration{" "}
            <code>0019_contact_messages.sql</code> n&apos;a pas encore été
            appliquée dans Supabase.
          </p>
        )}

        {messages.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Aucun message pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {messages.map((m) => (
              <li key={m.id} className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    {m.subject}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      m.handled
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {m.handled ? "Traité" : "À traiter"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateShort(m.createdAt)}
                  </span>
                </div>

                <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                  {m.message}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{m.name}</span>
                  <a
                    href={`mailto:${m.email}`}
                    className="inline-flex items-center gap-1 hover:text-brand-700"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {m.email}
                  </a>
                  {m.phone && (
                    <>
                      <a
                        href={`tel:${m.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1 hover:text-brand-700"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {m.phone}
                      </a>
                      <a
                        href={whatsappLink(m.phone, m.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        Répondre sur WhatsApp
                      </a>
                    </>
                  )}
                </div>

                <ContactMessageActions id={m.id} handled={m.handled} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
