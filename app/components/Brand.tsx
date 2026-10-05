import Image from "next/image";

/** Zenserp's own wordmark — light artwork on dark surfaces, dark on light. */
export function ZenserpLogo({ height = 18, className = "" }: { height?: number; className?: string }) {
  const width = Math.round(height * (885 / 188));
  return (
    <span className={`relative inline-block align-middle ${className}`} style={{ width, height }}>
      <Image
        src="/brand/zenserp-logo-light.svg"
        alt="Zenserp"
        width={width}
        height={height}
        className="hidden object-contain dark:block"
        priority
      />
      <Image
        src="/brand/zenserp-logo-dark.svg"
        alt="Zenserp"
        width={width}
        height={height}
        className="block object-contain dark:hidden"
        priority
      />
    </span>
  );
}

export function ApiLayerLogo({ height = 14, className = "" }: { height?: number; className?: string }) {
  return (
    <Image
      src="/apilayer-logo.png"
      alt="APILayer"
      width={Math.round(height * 5)}
      height={height}
      className={`w-auto dark:brightness-0 dark:invert ${className}`}
      style={{ height }}
    />
  );
}

/** Shield with a magnifier — checking a listing before you trust it. */
export function Mark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden>
      <path d="M16 2.5 27 6.5v9.2c0 6.9-4.6 12.6-11 14.3-6.4-1.7-11-7.4-11-14.3V6.5L16 2.5z" fill="currentColor" />
      <circle cx="14.2" cy="14.2" r="4.6" stroke="var(--bg-elev)" strokeWidth="2.1" fill="none" />
      <path d="m17.8 17.8 4 4" stroke="var(--bg-elev)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
