import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { SITE } from "@/lib/constants";
import { getEventBySlug } from "@/lib/data/events";
import { formatDate, formatPrice, formatTime } from "@/lib/format";

export const alt = "Affiche de l'événement sur kaypass";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

const POSTER_BOX = { width: 440, height: 550 };
const BRAND = "#067a46";

interface BannerImages {
  background: string;
  poster: string;
  posterWidth: number;
  posterHeight: number;
}

function toDataUri(buf: Buffer, mime: string): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function loadBanner(url: string | null): Promise<BannerImages | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const source = Buffer.from(await res.arrayBuffer());
    const [poster, background] = await Promise.all([
      sharp(source)
        .rotate()
        .resize({ ...POSTER_BOX, fit: "inside" })
        .jpeg({ quality: 85 })
        .toBuffer({ resolveWithObject: true }),
      sharp(source)
        .rotate()
        .resize(size.width, size.height, { fit: "cover" })
        .blur(28)
        .modulate({ brightness: 0.5 })
        .jpeg({ quality: 70 })
        .toBuffer(),
    ]);
    return {
      background: toDataUri(background, "image/jpeg"),
      poster: toDataUri(poster.data, "image/jpeg"),
      posterWidth: poster.info.width,
      posterHeight: poster.info.height,
    };
  } catch {
    return null;
  }
}

async function loadAssets() {
  const fontDir = join(process.cwd(), "src/assets/fonts");
  const [regular, bold, logo] = await Promise.all([
    readFile(join(fontDir, "Geist-Regular.ttf")),
    readFile(join(fontDir, "Geist-Bold.ttf")),
    readFile(join(process.cwd(), "public/logo-kaypass-white.png")).then((buf) =>
      sharp(buf).resize({ height: 96 }).png().toBuffer(),
    ),
  ]);
  return { regular, bold, logo: toDataUri(logo, "image/png") };
}

function titleSize(title: string): number {
  if (title.length <= 22) return 76;
  if (title.length <= 44) return 62;
  return 50;
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function tidy(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [event, assets] = await Promise.all([getEventBySlug(slug), loadAssets()]);
  const banner = event ? await loadBanner(event.banner_url) : null;

  const title = clip(tidy(event?.title ?? SITE.name), 80);
  const place = event
    ? [event.location, event.city]
        .map((part) => (part ? tidy(part) : ""))
        .filter(Boolean)
        .join(", ")
    : "";
  const when = event
    ? `${capitalize(formatDate(event.starts_at))} · ${formatTime(event.starts_at)}`
    : SITE.tagline;
  const price = event
    ? event.price > 0
      ? `À partir de ${formatPrice(event.price)}`
      : "Entrée gratuite"
    : null;

  const card = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0b1220",
          ...(banner
            ? {}
            : {
                backgroundImage: `linear-gradient(135deg, #0b1220 0%, #053d24 60%, ${BRAND} 100%)`,
              }),
          color: "white",
          fontFamily: "Geist",
        }}
      >
        {banner && (
           
          <img
            src={banner.background}
            width={size.width}
            height={size.height}
            alt=""
            style={{ position: "absolute", top: 0, left: 0 }}
          />
        )}
        <div
          style={{
            width: POSTER_BOX.width + 80,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {banner ? (
             
            <img
              src={banner.poster}
              width={banner.posterWidth}
              height={banner.posterHeight}
              alt=""
              style={{
                borderRadius: 28,
                border: "3px solid rgba(255,255,255,0.25)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.55)",
              }}
            />
          ) : (
            <div
              style={{
                width: 380,
                height: 380,
                borderRadius: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "3px solid rgba(255,255,255,0.2)",
              }}
            >
              { }
              <img src={assets.logo} height={64} alt="" style={{ height: 64 }} />
            </div>
          )}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 64px 52px 8px",
          }}
        >
          { }
          <img src={assets.logo} height={48} alt="" style={{ height: 48, alignSelf: "flex-start" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div
              style={{
                fontSize: titleSize(title),
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                display: "flex",
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 30 }}>
              <div style={{ display: "flex", color: "#bbf7d0", fontWeight: 700 }}>{when}</div>
              {place && (
                <div style={{ display: "flex", color: "rgba(255,255,255,0.85)" }}>
                  {clip(place, 60)}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {price ? (
              <div
                style={{
                  display: "flex",
                  backgroundColor: BRAND,
                  borderRadius: 999,
                  padding: "14px 30px",
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                {price}
              </div>
            ) : (
              <div style={{ display: "flex" }} />
            )}
            <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.7)" }}>
              {SITE.url.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: assets.regular, weight: 400, style: "normal" },
        { name: "Geist", data: assets.bold, weight: 700, style: "normal" },
      ],
    },
  );

  const jpeg = await sharp(Buffer.from(await card.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
