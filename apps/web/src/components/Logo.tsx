interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export default function Logo({ variant = "dark", className = "" }: LogoProps) {
  const wordmarkColor = variant === "light" ? "#FFFFFF" : "#0F172A";
  const subColor = variant === "light" ? "rgba(255,255,255,0.7)" : "#64748B";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="parishodh-logo-gradient" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0B4AA2" />
          </linearGradient>
        </defs>
        <path
          d="M9 16c0-3.3 2.2-5.5 5-5.5 2.1 0 3.4 1.2 4.4 2.6l.6.9.6-.9c1-1.4 2.3-2.6 4.4-2.6 2.8 0 5 2.2 5 5.5s-2.2 5.5-5 5.5c-2.1 0-3.4-1.2-4.4-2.6l-.6-.9-.6.9c-1 1.4-2.3 2.6-4.4 2.6-2.8 0-5-2.2-5-5.5z"
          stroke="url(#parishodh-logo-gradient)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="leading-none">
        <div className="text-base font-semibold" style={{ color: wordmarkColor }}>
          Parishodh
        </div>
        <div
          className="text-[9px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: subColor }}
        >
          Esimaa
        </div>
      </div>
    </div>
  );
}
