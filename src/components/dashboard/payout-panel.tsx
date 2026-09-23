"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Send, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  requestPayout,
  savePayoutAccount,
  type PayoutFormState,
} from "@/app/dashboard/actions";
import { formatAmount } from "@/lib/format";
import { MIN_PAYOUT_AMOUNT, PAYOUT_OPERATOR_LABELS } from "@/lib/payments/payout";
import type { PayoutOperator } from "@/lib/types";

interface Props {
  payoutPhone: string | null;
  payoutOperator: PayoutOperator | null;
  available: number;
}

function useNotify(state: PayoutFormState) {
  useEffect(() => {
    if (state.success) toast.success(state.success);
    else if (state.error) toast.error(state.error);
  }, [state]);
}

export function PayoutPanel({ payoutPhone, payoutOperator, available }: Props) {
  const [accountState, saveAccount, savingAccount] = useActionState<
    PayoutFormState,
    FormData
  >(savePayoutAccount, {});
  const [requestState, sendRequest, requesting] = useActionState<
    PayoutFormState,
    FormData
  >(requestPayout, {});

  useNotify(accountState);
  useNotify(requestState);

  const canRequest = Boolean(payoutPhone) && available >= MIN_PAYOUT_AMOUNT;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        action={saveAccount}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 className="font-semibold text-slate-900">Compte de reversement</h2>
        <p className="mt-1 text-xs text-slate-500">
          Numéro Wave ou Orange Money sur lequel vous recevrez votre argent.
        </p>

        <label
          htmlFor="operator"
          className="mt-4 mb-1 block text-sm font-medium text-slate-700"
        >
          Opérateur
        </label>
        <select
          id="operator"
          name="operator"
          defaultValue={payoutOperator ?? "wave"}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-brand-500 focus:outline-none"
        >
          {(Object.keys(PAYOUT_OPERATOR_LABELS) as PayoutOperator[]).map((op) => (
            <option key={op} value={op}>
              {PAYOUT_OPERATOR_LABELS[op]}
            </option>
          ))}
        </select>

        <label
          htmlFor="phone"
          className="mt-4 mb-1 block text-sm font-medium text-slate-700"
        >
          Numéro (9 chiffres)
        </label>
        <div className="relative">
          <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="phone"
            name="phone"
            inputMode="tel"
            required
            defaultValue={payoutPhone ?? ""}
            placeholder="77 123 45 67"
            className="pl-9"
          />
        </div>

        <Button
          type="submit"
          disabled={savingAccount}
          className="mt-4 w-full justify-center sm:w-auto"
        >
          {savingAccount ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </form>

      <form
        action={sendRequest}
        className="rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 className="font-semibold text-slate-900">Demander un reversement</h2>
        <p className="mt-1 text-xs text-slate-500">
          Disponible : <strong>{formatAmount(available)}</strong> · minimum{" "}
          {formatAmount(MIN_PAYOUT_AMOUNT)}.
        </p>

        <label
          htmlFor="amount"
          className="mt-4 mb-1 block text-sm font-medium text-slate-700"
        >
          Montant (FCFA)
        </label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={MIN_PAYOUT_AMOUNT}
          max={available}
          step={100}
          required
          defaultValue={available >= MIN_PAYOUT_AMOUNT ? available : ""}
          disabled={!canRequest}
        />

        {!payoutPhone && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Enregistrez d&apos;abord votre numéro de reversement.
          </p>
        )}

        <Button
          type="submit"
          disabled={!canRequest || requesting}
          className="mt-4 w-full justify-center sm:w-auto"
        >
          {requesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Envoi…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Demander
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
