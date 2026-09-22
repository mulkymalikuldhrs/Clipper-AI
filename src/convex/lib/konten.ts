/* Pure helpers: campaign scoring + brief parsing (no ctx). */

export type RawCampaign = {
  id?: string;
  slug?: string;
  title?: string;
  brand?: string;
  brand_logo?: string;
  category?: string;
  platform?: string[];
  status?: string;
  campaign_type?: string;
  rate_per_million?: number | null;
  cpm_tiktok?: number | null;
  cpm_instagram?: number | null;
  cpm_youtube?: number | null;
  budget?: number | null;
  spent?: number | null;
  clippers?: number | null;
  min_views?: number | null;
  min_video_duration?: number | null;
  max_videos_per_clipper?: number | null;
  hashtags?: string[] | null;
  deadline?: string | null;
  tier_access?: string | null;
  brief_detail?: RawBrief;
};

/** Shape of `brief_detail` as returned by GET /api/campaigns/:slug (verified 2026-09-22). */
export type RawBrief = {
  cta?: string;
  materi?: { title?: string; url?: string }[];
  narasi?: string;
  caption?: string;
  captionWajib?: string;
  hashtags?: string[];
  durasiMin?: string | number;
  durasiMax?: string | number;
  durasiVideo?: string;
  judulFile?: string;
  elemenWajib?: string;
  contohVideo?: unknown[];
  // Extra brief sections present in the live payload.
  tujuanCampaign?: string;
  targetAudiens?: string;
  instruksiBrief?: string;
  bolehDilakukan?: string[] | string;
  dilarangDilakukan?: string[] | string;
  tagSocialMedia?: Record<string, unknown>;
  minimumFollowers?: string | number; // API mengirim string ("0")
  nicheAkunDisetujui?: string[] | string;
  customSections?: { title?: string; body?: string }[] | unknown[];
};

export function scoreCampaign(c: {
  ratePerMillion?: number | null;
  budget?: number | null;
  spent?: number | null;
  clippers?: number | null;
  minViews?: number | null;
  remainingPct?: number | null;
}): number {
  const cpm = Math.max(0, Math.min(100, ((c.ratePerMillion ?? 0) / 5000) * 100));
  const budget = c.budget ?? 0;
  const spent = c.spent ?? 0;
  const remaining = Math.max(0, budget - spent);
  const remainingPct = budget > 0 ? (remaining / budget) * 100 : (c.remainingPct ?? 100);
  const liquidity = Math.max(0, Math.min(100, remainingPct)); // sisa budget = peluang payout
  const competitionRaw = Math.log10(Math.max(10, c.clippers ?? 10));
  const competition = Math.max(0, Math.min(100, 100 - (competitionRaw / 5) * 100)); // makin sedikit pesaing makin bagus
  const barrier = Math.max(0, Math.min(100, 100 - ((c.minViews ?? 0) / 50000) * 100));
  const score = cpm * 0.35 + liquidity * 0.3 + competition * 0.2 + barrier * 0.15;
  return Math.round(score);
}

/** Normalise a brief field that may be a newline string, a bullet list, or an array. */
function toLines(input: string | string[] | undefined | null, max = 20): string[] {
  const raw = Array.isArray(input) ? input.join("\n") : (input ?? "");
  return raw
    .split("\n")
    .map((l) => l.replace(/^[-•*–\d.)\s]+/, "").trim())
    .filter((l) => l.length > 2)
    .slice(0, max);
}

function toNumber(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? parseInt(v.replace(/[^0-9]/g, ""), 10) : Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** mm:ss label for a second offset. */
function stamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseBrief(c: RawCampaign) {
  const bd = c.brief_detail ?? {};
  const hashtags = (bd.hashtags ?? c.hashtags ?? []).filter(Boolean);
  const materi = (bd.materi ?? [])
    .filter((m) => m?.url)
    .map((m) => ({ title: m.title ?? "Materi", url: m.url as string }));

  const narasiPoints = toLines(bd.narasi, 12);
  const narasiRaw = (bd.narasi ?? "").trim();
  const elemenWajib = toLines(bd.elemenWajib, 10);
  const boleh = toLines(bd.bolehDilakukan, 12);
  const dilarang = toLines(bd.dilarangDilakukan, 12);

  const durMin = toNumber(bd.durasiMin, c.min_video_duration ?? 10);
  const durMax = toNumber(bd.durasiMax, Math.max(durMin, 120));
  // Sejumlah brief mengirim CTA kosong ("") — jangan tampilkan string kosong.
  const cta =
    (bd.cta ?? "").trim() ||
    `Brief tidak mencantumkan CTA khusus — akhiri dengan ajakan brand ${c.brand ?? ""} + nama campaign.`.trim();
  const captionWajib = (bd.captionWajib ?? "").trim();
  const goal = (bd.tujuanCampaign ?? "").trim();
  const targetAudience = (bd.targetAudiens ?? "").trim();
  const instruksiBrief = (bd.instruksiBrief ?? "").trim();
  const judulFile = (bd.judulFile ?? "").trim();

  // --- Hook: derived from the brief's own angle, not a generic template ---
  const primaryMateri = materi.find((m) => m.title)?.title ?? "materi campaign";
  const angle = narasiPoints[0] ?? elemenWajib[0] ?? goal ?? c.title ?? "sudut utama campaign";
  const hook = [
    `HOOK 3 dtk: potongan paling kuat dari "${primaryMateri}".`,
    `Sudut: ${angle.replace(/\s+/g, " ").slice(0, 140)}.`,
    "Tanpa intro/lambang di detik pertama — teks besar di layar, sound langsung jalan.",
  ].join(" ");

  // --- Caption: brief's mandated caption if any, else composed ---
  const caption =
    (bd.caption ?? "").trim() ||
    captionWajib ||
    `${narasiPoints[0] ?? "Percayalah sama perasaan ini..."}\n${cta}\n${hashtags
      .map((h) => "#" + h)
      .join(" ")}`;

  // --- Shotlist: scaled to the brief's real duration window ---
  const h = (pct: number) => stamp(Math.max(3, Math.round(durMax * pct)));
  const coreEnd = durMax > 60 ? 0.55 : 0.8; // klip panjang dapat blok variasi tambahan
  const shotlist: { detik: string; aksi: string }[] = [
    { detik: `0:00–0:03`, aksi: `HOOK: ${angle.replace(/\s+/g, " ").slice(0, 120)} — potongan paling emosional, teks besar di layar.` },
    { detik: `0:03–${h(0.15)}`, aksi: `Setup: 1–2 kalimat konteks. Pakai ${primaryMateri}${materi[1] ? ` + ${materi[1].title}` : ""}.` },
    {
      detik: `${h(0.15)}–${h(coreEnd)}`,
      aksi: narasiPoints.length
        ? `Inti: capai seluruh narasi wajib — ${narasiPoints.slice(0, 3).map((n) => n.slice(0, 70)).join(" | ")}`
        : "Inti: rakit rough cut dari materi, pastikan poin brief tercapai.",
    },
  ];
  if (durMax > 60) {
    shotlist.push({
      detik: `${h(0.55)}–${h(0.8)}`,
      aksi: "Tengah: variasi angle — tambah footage artis/podcast yang diizinkan brief (jika ada).",
    });
  }
  shotlist.push({
    detik: `${h(0.8)}–${stamp(durMax)}`,
    aksi: `Penutup: bumper ending/poster + CTA resmi "${cta.replace(/\s+/g, " ").slice(0, 90)}".`,
  });

  // Combined, backwards-compatible list (dipakai bila UI lama masih membaca doDonts).
  const doDonts = [
    ...boleh.map((b) => `BOLEH: ${b}`),
    ...dilarang.map((d) => `DILARANG: ${d}`),
    ...(boleh.length + dilarang.length === 0
      ? [
          "Wajib pakai CTA resmi di akhir video (dari brief).",
          "Patuhi durasi " + durMin + "–" + durMax + " detik.",
          "Semua hashtag wajib dimasukkan saat posting.",
        ]
      : []),
    "Hanya platform yang diizinkan campaign: " + ((c.platform ?? []).join(", ") || "-"),
  ];

  // --- Compliance score: how completely the brief can be executed ---
  let compliance = 35;
  if (materi.length > 0) compliance += 15;
  if (narasiRaw.length > 20) compliance += 12;
  if (hashtags.length >= 3) compliance += 8;
  if (cta) compliance += 8;
  if (elemenWajib.length > 0) compliance += 8;
  if (dilarang.length > 0) compliance += 7; // guard rails jelas = risiko kirim salah lebih kecil
  if (captionWajib || (bd.caption ?? "").trim()) compliance += 7;

  return {
    hook,
    narasi: narasiRaw || "Ikuti narasi wajib campaign.",
    narasiPoints,
    cta,
    caption,
    captionWajib,
    hashtags,
    durasiMin: durMin,
    durasiMax: durMax,
    materi,
    elemenWajib,
    boleh,
    dilarang,
    doDonts,
    targetAudience,
    goal,
    instruksiBrief,
    judulFile,
    shotlist,
    complianceScore: Math.min(100, compliance),
  };
}
