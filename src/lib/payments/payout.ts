import type { PayoutOperator, PayoutStatus } from "@/lib/types";

export const PAYOUT_OPERATORS: PayoutOperator[] = ["wave", "orange_money"];

export const PAYOUT_OPERATOR_LABELS: Record<PayoutOperator, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
};

/** En dessous, les frais de transfert rendent le reversement inintéressant. */
export const MIN_PAYOUT_AMOUNT = 1000;

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  requested: "Demandé",
  processing: "En cours",
  completed: "Payé",
  failed: "Échec",
  cancelled: "Annulé",
};
