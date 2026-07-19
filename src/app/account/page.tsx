"use client";

import { useState } from "react";
import { Disc3, Trash2, Heart, CheckCircle2, FileText, Save, X, Shield, Cookie } from "lucide-react";
import { useAccount, Stars, type AlbumEntry, type OwnershipFormat } from "@/lib/account";
type AlbumLike = { id: number; artist: string; title: string; cover?: string | null };
import { TopNav } from "@/components/top-nav";

const FORMAT_LABELS: Record<OwnershipFormat, string> = {
  vinyl: "Vinyl",
  cd: "CD",
  cassette: "Cassette",
  other: "Other",
};

export default function AccountPage() {
  const { entries, loaded, setOwnership, setRating, setReview, remove, clearAll } = useAccount();
  const [tab, setTab] = useState<"listened" | "want" | "owned" | "privacy">("listened");
  const [reviewing, setReviewing] = useState<AlbumEntry | null>(null);

  const list = Object.values(entries).sort((a, b) => b.addedAt - a.addedAt);
  const listened = list.filter((e) => e.status === "listened");
  const want = list.filter((e) => e.status === "want");
  const owned = list.filter((e) => e.status === "owned");

  const avgRating =
    listened.filter((e) => e.rating > 0).reduce((s, e) => s + e.rating, 0) /
      (listened.filter((e) => e.rating > 0).length || 1) || 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav active="account" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-20 pb-8 sm:px-6">
        <div className="flex items-center gap-2 font-mono-funk text-[11px] tracking-[0.25em] text-cyan">
          <Disc3 className="size-4" /> YOUR PERSONAL CRATE
        </div>
        <h1 className="mt-2 font-display text-5xl uppercase tracking-tight sm:text-7xl">
          My <span className="text-gradient-funk">Account</span>
        </h1>
        <p className="mt-2 max-w-xl font-grotesk text-sm text-muted-foreground">
          Track what you've heard, what you want to hear, and the records you own on wax, CD or
          cassette. Rate them, review them — all stored locally on your device. No login, no server.
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
          <StatCard label="Listened" value={listened.length} icon={<CheckCircle2 className="size-4 text-lime" />} />
          <StatCard label="Want to hear" value={want.length} icon={<Heart className="size-4 text-hotpink" />} />
          <StatCard label="Owned" value={owned.length} icon={<Disc3 className="size-4 text-amber" />} />
          <StatCard label="Avg rating" value={avgRating ? avgRating.toFixed(1) : "—"} icon={<span className="text-amber">★</span>} />
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 border-b border-white/10">
          {(["listened", "want", "owned", "privacy"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 font-mono-funk text-[11px] tracking-wider uppercase transition ${
                tab === t ? "text-lime" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
              {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-lime" />}
            </button>
          ))}
        </div>

        {tab === "privacy" ? (
          <PrivacySection />
        ) : (
          <div className="mt-6">
            {tab === "listened" && <EntryList entries={listened} onReview={setReviewing} onRemove={remove} onSetOwnership={setOwnership} />}
            {tab === "want" && <EntryList entries={want} onReview={setReviewing} onRemove={remove} />}
            {tab === "owned" && <EntryList entries={owned} onReview={setReviewing} onRemove={remove} onSetOwnership={setOwnership} showFormat />}
          </div>
        )}

        {list.length > 0 && tab !== "privacy" && (
          <button
            onClick={() => {
              if (confirm("Clear ALL your account data? This cannot be undone.")) clearAll();
            }}
            className="mt-8 flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 font-mono-funk text-[10px] tracking-wider text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" /> CLEAR ALL DATA
          </button>
        )}
      </main>

        {reviewing && (
          <ReviewModal
            entry={reviewing}
            onClose={() => setReviewing(null)}
            onSetRating={(album, v) => {
              setRating(album, v);
              setReviewing((prev) => prev ? { ...prev, rating: v } : prev);
            }}
            onSetReview={(album, text) => {
              setReview(album, text);
              setReviewing((prev) => prev ? { ...prev, review: text } : prev);
            }}
          />
        )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card p-4">
      <div className="flex items-center gap-2 font-mono-funk text-[10px] tracking-wider text-muted-foreground uppercase">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-3xl">{value}</div>
    </div>
  );
}

function EntryList({
  entries,
  onReview,
  onRemove,
  onSetOwnership,
  showFormat,
}: {
  entries: AlbumEntry[];
  onReview: (e: AlbumEntry) => void;
  onRemove: (id: number) => void;
  onSetOwnership?: (album: any, format: OwnershipFormat) => void;
  showFormat?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-grotesk text-sm text-muted-foreground">Nothing here yet. Go back to the crate and start collecting.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-card p-3">
          <div className="size-12 shrink-0 overflow-hidden rounded-md bg-background">
            {e.cover ? <img src={e.cover} alt={e.title} className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-grotesk text-sm font-medium">{e.title}</p>
            <p className="truncate font-grotesk text-xs text-muted-foreground">{e.artist}</p>
            <div className="mt-1 flex items-center gap-2">
              <Stars value={e.rating} size={12} />
              {e.review && <FileText className="size-3 text-cyan" />}
            </div>
          </div>
          {showFormat && onSetOwnership && (
            <select
              value={e.ownershipFormat ?? "vinyl"}
              onChange={(ev) => {
                // minimal album object for the hook
                onSetOwnership({ id: e.id, artist: e.artist, title: e.title, cover: e.cover } as any, ev.target.value as OwnershipFormat);
              }}
              className="rounded-md border border-white/15 bg-card px-2 py-1 font-mono-funk text-[10px] tracking-wide"
            >
              {(Object.keys(FORMAT_LABELS) as OwnershipFormat[]).map((f) => (
                <option key={f} value={f} className="bg-card">
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => onReview(e)}
            className="rounded-full bg-white/10 p-2 transition hover:bg-cyan hover:text-black"
            aria-label="Review"
          >
            <FileText className="size-3.5" />
          </button>
          <button
            onClick={() => onRemove(e.id)}
            className="rounded-full bg-white/10 p-2 transition hover:bg-destructive"
            aria-label="Remove"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ReviewModal({
  entry,
  onClose,
  onSetRating,
  onSetReview,
}: {
  entry: AlbumEntry;
  onClose: () => void;
  onSetRating: (album: AlbumLike, rating: number) => void;
  onSetReview: (album: AlbumLike, review: string) => void;
}) {
  const [review, setReviewText] = useState(entry.review);
  const [saved, setSaved] = useState(false);

  const album = { id: entry.id, artist: entry.artist, title: entry.title, cover: entry.cover };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-2xl uppercase tracking-tight">{entry.title}</h3>
            <p className="font-grotesk text-sm text-muted-foreground">{entry.artist}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-1.5 text-foreground transition hover:bg-white/20">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5">
          <p className="font-mono-funk text-[10px] tracking-wider text-muted-foreground uppercase">Your rating</p>
          <div className="mt-2">
            <Stars value={entry.rating} onChange={(v) => { onSetRating(album, v); setSaved(false); }} size={24} />
          </div>
        </div>

        <div className="mt-5">
          <p className="font-mono-funk text-[10px] tracking-wider text-muted-foreground uppercase">Your review</p>
          <textarea
            value={review}
            onChange={(e) => { setReviewText(e.target.value); setSaved(false); }}
            placeholder="What did you think?"
            rows={5}
            className="mt-2 w-full resize-none rounded-lg border border-white/15 bg-background p-3 font-grotesk text-sm outline-none focus:border-hotpink"
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              onSetReview(album, review);
              setSaved(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-lime px-4 py-2 font-mono-funk text-[11px] tracking-wider text-black transition hover:scale-105"
          >
            <Save className="size-3.5" /> {saved ? "SAVED ✓" : "SAVE"}
          </button>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 font-mono-funk text-[11px] tracking-wider transition hover:bg-white/20"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacySection() {
  return (
    <div className="mt-6 space-y-6 max-w-2xl">
      <div className="rounded-xl border border-white/10 bg-card p-5">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-lime" />
          <h3 className="font-display text-lg uppercase tracking-tight">Privacy Policy</h3>
        </div>
        <div className="mt-3 space-y-3 font-grotesk text-sm text-foreground/80">
          <p>
            <strong className="text-foreground">Data Collection.</strong> The Service does not
            collect, store, or transmit any personally identifiable information. All "Account"
            data — including listened/want/owned lists, ratings, reviews, and ownership format —
            is stored exclusively in your browser's local storage on your device. Such data does
            not leave your device and is not accessible to the operator.
          </p>
          <p>
            <strong className="text-foreground">Third-Party Services.</strong> Album artwork,
            tracklist metadata, and 30-second audio previews are retrieved from the iTunes Search
            API and Cover Art Archive, and album metadata from MusicBrainz. These third parties may
            set their own cookies or log requests in accordance with their respective privacy
            policies. The operator has no control over such third-party data practices.
          </p>
          <p>
            <strong className="text-foreground">Future Advertising.</strong> The Service currently
            displays no advertising. Should advertising be introduced in the future, it may employ
            cookies or similar technologies to serve and measure ads, and this Policy shall be
            updated accordingly at that time.
          </p>
          <p>
            <strong className="text-foreground">Analytics.</strong> The Service does not employ
            analytics or tracking services at this time.
          </p>
          <p>
            <strong className="text-foreground">Your Rights.</strong> Because no data is collected
            or stored server-side, no account deletion request is necessary. To erase all data
            associated with your usage, clear your browser's local storage for this domain, or use
            the "Clear All Data" function within the Account section.
          </p>
          <p>
            <strong className="text-foreground">Children.</strong> The Service is not directed to
            children under 13 and does not knowingly collect any information from them.
          </p>
          <p>
            <strong className="text-foreground">Changes.</strong> The operator reserves the right
            to amend this Policy. Material changes shall be reflected by updating the "Last
            updated" date below.
          </p>
          <p className="font-mono-funk text-[10px] tracking-wider text-muted-foreground">
            LAST UPDATED: 2026. CONTACT: privacy@thecrate.example
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-5">
        <div className="flex items-center gap-2">
          <Cookie className="size-5 text-amber" />
          <h3 className="font-display text-lg uppercase tracking-tight">Cookie Policy</h3>
        </div>
        <div className="mt-3 space-y-3 font-grotesk text-sm text-foreground/80">
          <p>
            The Service itself does not set any cookies. The "Account" feature relies on browser
            local storage, which functions similarly to cookies but is not transmitted with HTTP
            requests.
          </p>
          <p>
            Third-party resources (album artwork and audio previews served from Apple's CDN, and
            MusicBrainz/Cover Art Archive) may set cookies governed by their own policies. The
            operator does not control and is not responsible for such cookies.
          </p>
          <p>
            No cookie consent banner is presently required because the operator does not set
            non-essential cookies. Should this change, a consent mechanism compliant with the
            EU General Data Protection Regulation (GDPR) and the ePrivacy Directive shall be
            implemented.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-card p-5">
        <h3 className="font-display text-lg uppercase tracking-tight">APIs, Hosting &amp; Data Sources</h3>
        <ul className="mt-3 space-y-2 font-grotesk text-sm text-foreground/80">
          <li>• <strong className="text-foreground">Vercel Inc.</strong> (vercel.com) — hosting and serverless functions for the web application. Vercel may collect standard server logs (IP address, request timestamps, user agent) as part of their infrastructure operations.</li>
          <li>• <strong className="text-foreground">iTunes Search API</strong> (itunes.apple.com) — album artwork, tracklists, 30-second previews. No API key required; subject to Apple's terms.</li>
          <li>• <strong className="text-foreground">MusicBrainz API</strong> (musicbrainz.org) — album metadata. Licensed under CC BY-SA.</li>
          <li>• <strong className="text-foreground">Cover Art Archive</strong> (coverartarchive.org) — album cover images. Licensed under CC0.</li>
          <li>• <strong className="text-foreground">Deezer API</strong> (api.deezer.com) — fallback tracklist and 30-second audio previews. Free public API, no authentication required; subject to Deezer's terms.</li>
        </ul>
      </div>
    </div>
  );
}
