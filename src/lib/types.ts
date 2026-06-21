/**
 * Domain types for Sa Ticket Pro.
 * These mirror the Supabase schema in `supabase/migrations`.
 */

export type UserRole = "participant" | "organizer" | "admin";

export type EventStatus = "draft" | "pending" | "published" | "rejected" | "cancelled";

export type TicketType = "standard" | "vip" | "gratuit";

export type TicketStatus = "valid" | "used" | "cancelled" | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentProvider = "wave" | "orange_money" | "dexpay";

export type FeeMode = "service_fee" | "commission" | "none";

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Organizer {
  id: string;
  user_id: string;
  company_name: string;
  description: string | null;
  logo_url: string | null;
  verified: boolean;
  disabled: boolean;
  created_at: string;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  price: number;
  capacity: number;
  sold: number;
  position: number;
  created_at: string;
}

export interface Event {
  id: string;
  slug: string;
  organizer_id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  category_id: string | null;
  category?: Category | null;
  location: string;
  city: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number;
  price: number;
  ticket_type: TicketType;
  status: EventStatus;
  tickets_sold: number;
  fee_mode?: FeeMode;
  created_at: string;
  tiers?: TicketTier[];
}

export interface Ticket {
  id: string;
  event_id: string;
  user_id: string | null;
  payment_id: string | null;
  ticket_type: TicketType;
  tier_id: string | null;
  tier_name: string | null;
  price: number;
  qr_token: string;
  status: TicketStatus;
  holder_name: string | null;
  holder_email: string | null;
  created_at: string;
  event?: Event;
}

export interface Payment {
  id: string;
  user_id: string | null;
  event_id: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  provider_reference: string | null;
  quantity: number;
  ticket_type: TicketType;
  tier_id: string | null;
  tier_name: string | null;
  guest_email: string | null;
  guest_name: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  ticket_id: string;
  scanned_by: string | null;
  result: "valid" | "already_used" | "invalid";
  created_at: string;
}
