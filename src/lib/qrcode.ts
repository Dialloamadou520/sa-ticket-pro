import QRCode from "qrcode";
import { SITE } from "./constants";

/** Build the public verification URL encoded inside a ticket QR code. */
export function ticketVerifyUrl(qrToken: string): string {
  return `${SITE.url}/verifier/${qrToken}`;
}

/** Generate a QR code as a PNG data URL (works on server and client). */
export async function generateQrDataUrl(qrToken: string): Promise<string> {
  return QRCode.toDataURL(ticketVerifyUrl(qrToken), {
    width: 512,
    margin: 1,
    errorCorrectionLevel: "H",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
