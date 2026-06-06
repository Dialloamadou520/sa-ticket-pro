import { Badge } from "@/components/ui/badge";
import { EVENT_STATUS_LABELS } from "@/lib/constants";
import type { EventStatus } from "@/lib/types";

const tone: Record<EventStatus, "green" | "amber" | "slate" | "red" | "purple"> = {
  published: "green",
  pending: "amber",
  draft: "slate",
  rejected: "red",
  cancelled: "red",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <Badge tone={tone[status]}>{EVENT_STATUS_LABELS[status]}</Badge>;
}
