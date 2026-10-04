import Image from "next/image";
import type { PayoutOperator } from "@/lib/types";

const LOGOS: Record<PayoutOperator, { src: string; alt: string }> = {
  wave: { src: "/payments/wave.png", alt: "Wave" },
  orange_money: { src: "/payments/orange-money.svg", alt: "Orange Money" },
};

export function ProviderLogo({
  provider,
  size = 28,
  className = "",
}: {
  provider: PayoutOperator;
  size?: number;
  className?: string;
}) {
  const logo = LOGOS[provider];
  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={size}
      height={size}
      unoptimized
      className={`shrink-0 rounded-[22%] ${className}`}
    />
  );
}
