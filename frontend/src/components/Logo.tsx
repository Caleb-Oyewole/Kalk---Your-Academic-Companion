import Link from "next/link";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className={`logo ${dark ? "logo-dark" : ""}`} aria-label="Kalk home">
      <span className="logo-mark" aria-hidden>
        <svg viewBox="0 0 64 64" width="22" height="22">
          <path
            d="M22 14v36M46 14 22 33l24 17"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="logo-word">kalk</span>
    </Link>
  );
}
