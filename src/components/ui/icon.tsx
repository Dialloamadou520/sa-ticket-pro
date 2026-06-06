import {
  Music,
  PartyPopper,
  Trophy,
  Mic,
  Sparkles,
  Drama,
  GraduationCap,
  Cpu,
  Calendar,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Music,
  PartyPopper,
  Trophy,
  Mic,
  Sparkles,
  Drama,
  GraduationCap,
  Cpu,
};

/** Render a lucide icon by its name (from category data). */
export function DynamicIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && map[name]) || Calendar;
  return <Icon className={className} />;
}
