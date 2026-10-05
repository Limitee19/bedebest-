import Image from "next/image";

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex items-center justify-center overflow-hidden rounded-2xl"
        style={{ width: size, height: size }}
      >
        <Image src="/logo.svg" alt="Logo TóngBǎn" width={size} height={size} priority />
      </span>
      <span className="leading-none">
        <span className="font-display block text-[26px] font-bold tracking-tight">
          TóngBǎn
        </span>
        <span className="mt-0.5 inline-block rounded-full bg-(--color-lemon-soft) px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-(--color-ink)">
          同班 · Offering B(EST)
        </span>
      </span>
    </span>
  );
}
