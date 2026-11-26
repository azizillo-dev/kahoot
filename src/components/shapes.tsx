/** M3 Expressive uslubidagi qutb (polar) shakllar: "cookie", "clover", "burst" va h.k. */
export function blobPath(lobes: number, amp: number, rot = 0, r = 48, cx = 50, cy = 50, steps = 180) {
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r * (1 - amp + amp * Math.cos(lobes * (a + rot)));
    const x = cx + rr * Math.cos(a);
    const y = cy + rr * Math.sin(a);
    d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d + "Z";
}

export const SHAPES = {
  cookie9: blobPath(9, 0.06),
  cookie12: blobPath(12, 0.05),
  clover4: blobPath(4, 0.16, Math.PI / 4),
  clover8: blobPath(8, 0.1),
  flower6: blobPath(6, 0.12),
  burst: blobPath(10, 0.14),
  soft3: blobPath(3, 0.12, Math.PI / 6),
  soft5: blobPath(5, 0.1, -Math.PI / 10),
} as const;

export type ShapeName = keyof typeof SHAPES;

export function Shape({
  name,
  className = "",
  style,
}: {
  name: ShapeName;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden>
      <path d={SHAPES[name]} fill="currentColor" />
    </svg>
  );
}

/** Fon uchun suzuvchi shakllar. */
export function ShapeBackdrop({ dense = false }: { dense?: boolean }) {
  const items: { n: ShapeName; c: string; s: string; d: string }[] = [
    { n: "cookie9", c: "text-primary-container", s: "w-72 h-72 -top-20 -left-20", d: "0s" },
    { n: "clover4", c: "text-tertiary-container", s: "w-56 h-56 top-1/3 -right-16", d: "-3s" },
    { n: "burst", c: "text-secondary-container", s: "w-64 h-64 -bottom-24 left-1/4", d: "-6s" },
  ];
  if (dense)
    items.push(
      { n: "flower6", c: "text-primary-container", s: "w-40 h-40 bottom-10 -right-10", d: "-2s" },
      { n: "soft5", c: "text-secondary-container", s: "w-32 h-32 top-10 right-1/3", d: "-4s" },
    );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {items.map((it, i) => (
        <div key={i} className={`absolute ${it.s} anim-float opacity-70`} style={{ animationDelay: it.d }}>
          <Shape name={it.n} className={`w-full h-full ${it.c} anim-spin-slow`} />
        </div>
      ))}
    </div>
  );
}

export function Logo({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`relative inline-grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <Shape name="cookie9" className="absolute inset-0 w-full h-full text-primary anim-spin-slow" />
      <span className="icon fill relative text-on-primary" style={{ fontSize: size * 0.52 }}>
        auto_stories
      </span>
    </span>
  );
}
