/** Billet tel que stocké sur le téléphone pour le scan hors connexion. */
export interface OfflineTicket {
  /** SHA-256 (hex) du qr_token : le token brut ne quitte jamais le serveur. */
  h: string;
  /** 8 premiers caractères du qr_token (« Réf. » imprimée sur le billet). */
  ref: string;
  holder: string | null;
  used: boolean;
  usedAt: string | null;
  usedBy: string | null;
}

export interface OfflinePack {
  eventId: string;
  title: string;
  startsAt: string;
  downloadedAt: string;
  tickets: OfflineTicket[];
}

export interface QueuedScan {
  id: string;
  eventId: string;
  token: string;
  holder: string | null;
  scannedAt: string;
}

export interface SyncResult {
  id: string;
  result: "valid" | "already_used" | "invalid";
  message: string;
  holder?: string | null;
  usedAt?: string | null;
  usedBy?: string | null;
}

export interface SyncConflict extends SyncResult {
  scannedAt: string;
}

export interface ScannableEvent {
  id: string;
  title: string;
  starts_at: string;
}
