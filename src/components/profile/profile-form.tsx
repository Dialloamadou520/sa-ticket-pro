"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfile, type ProfileFormState } from "@/app/profil/actions";

export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {}
  );

  useEffect(() => {
    if (state.success) toast.success("Profil mis à jour !");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled />
      </div>
      <div>
        <Label htmlFor="full_name">Nom complet</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} />
      </div>
      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={phone} placeholder="+221 ..." />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
