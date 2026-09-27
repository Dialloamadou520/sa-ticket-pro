"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitContactMessage } from "@/app/contact/actions";

export function ContactForm() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setLoading(true);
    const result = await submitContactMessage({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    });
    setLoading(false);

    if (result.ok) {
      toast.success("Message envoyé ! Nous vous répondrons rapidement.");
      form.reset();
    } else {
      toast.error(result.error ?? "Envoi impossible.");
    }
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
        <Label htmlFor="phone">Téléphone (facultatif)</Label>
        <Input id="phone" name="phone" type="tel" placeholder="+221 77 000 00 00" />
      </div>
      <div>
        <Label htmlFor="subject">Sujet</Label>
        <Input id="subject" name="subject" required placeholder="Objet de votre message" />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required placeholder="Comment pouvons-nous vous aider ?" />
      </div>
      <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Envoi..." : "Envoyer le message"}
      </Button>
    </form>
  );
}
