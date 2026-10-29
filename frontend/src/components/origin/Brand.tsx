/**
 * Origin brand — the approved local logo artwork with its original transparency.
 * Wordmark and OriginMark deliberately use the same unmodified source image.
 * - FingerprintArt: decorative hero illustration, kept as code-based SVG.
 */
import approvedLogo from "@/assets/origin-logo.png";

const NAVY = "#0B1328";
const VIOLET = "#6366F1";
const LAVENDER = "#C7D2FE";

export function Wordmark({ className = "h-7" }: { className?: string }) {
  return (
    <img
      src={approvedLogo}
      alt="Origin"
      dir="ltr"
      className={`w-auto object-contain select-none ${className}`}
      draggable={false}
    />
  );
}

export function OriginMark({ className = "size-8" }: { className?: string }) {
  return (
    <img
      src={approvedLogo}
      alt=""
      aria-hidden
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
}

/** Hero art: illuminated fingerprint contours rippling out of an origin point. */
export function FingerprintArt({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const rings = Array.from({ length: 16 }, (_, i) => i);
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden>
      <defs>
        <radialGradient id="fp-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={VIOLET} stopOpacity={tone === "light" ? ".18" : ".55"} />
          <stop offset="1" stopColor={VIOLET} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fp-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tone === "light" ? NAVY : LAVENDER} />
          <stop offset="1" stopColor={VIOLET} />
        </linearGradient>
        <filter id="fp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <circle cx="300" cy="300" r="230" fill="url(#fp-core)" />
      <g transform="translate(300 300) rotate(-18) skewX(-8)">
        {[0, 1].map((layer) => (
          <g
            key={layer}
            filter={layer === 0 ? "url(#fp-glow)" : undefined}
            opacity={layer === 0 ? 0.6 : 1}
          >
            {rings.map((i) => {
              const rx = 26 + i * 17;
              const ry = rx * (0.78 - i * 0.008);
              const gap = 6 + ((i * 7) % 11);
              return (
                <ellipse
                  key={i}
                  cx={i * 1.6}
                  cy={i * -1.2}
                  rx={rx}
                  ry={ry}
                  pathLength={100}
                  fill="none"
                  stroke="url(#fp-stroke)"
                  strokeWidth={i < 3 ? 2 : 1.3}
                  strokeOpacity={Math.max(0.12, 0.95 - i * 0.05)}
                  strokeDasharray={`${100 - gap} ${gap}`}
                  strokeDashoffset={i * 9}
                  strokeLinecap="round"
                  className="fp-ring"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              );
            })}
          </g>
        ))}
      </g>
      <circle cx="300" cy="300" r="5" fill={tone === "light" ? VIOLET : LAVENDER} />
    </svg>
  );
}

export const BRAND_COLORS = { NAVY, VIOLET, LAVENDER };
