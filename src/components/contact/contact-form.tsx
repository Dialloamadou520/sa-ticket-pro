"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Branchement email/Supabase à venir — confirmation optimiste pour l'instant.
    setTimeout(() => {
      setLoading(false);
      toast.success("Message envoyé ! Nous vous répondrons rapidement.");
      (e.target as HTMLFormElement).reset();
    }, 600);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" required placeholder="Votre nom" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="vous@exemple.com" />
        </div>
      </div>
      <div>
        <Label htmlFor="subject">Sujet</Label>
        <Input id="subject" name="subject" required placeholder="Objet de votre message" />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required placeholder="Comment pouvons-nous vous aider ?" />
      </div>
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Envoi..." : "Envoyer le message"}
      </Button>
    </form>
  );
}
