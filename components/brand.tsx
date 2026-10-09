import Image from "next/image";

export function Logo({ size = 40, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-2xl"
        style={{ width: size, height: size }}
      >
        <Image src="/logo.svg" alt="Logo BeDeBest" width={size} height={size} priority />
      </span>
      <span className="min-w-0 leading-none">
        <span className={`font-display block font-bold tracking-tight ${compact ? "truncate text-[20px]" : "text-[26px]"}`}>
          BeDeBest
        </span>
        {!compact && (
          <span className="mt-0.5 inline-block rounded-full bg-(--color-lemon-soft) px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-(--color-ink)">
            Offering B(EST) · PBM
          </span>
        )}
      </span>
    </span>
  );
}
