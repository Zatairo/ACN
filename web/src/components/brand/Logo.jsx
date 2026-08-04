import { brand } from '@/lib/brand';

export default function Logo({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 64"
      width="220"
      height="64"
      aria-label={brand.name}
      role="img"
    >
      <defs>
        <clipPath id="acn-logo-top">
          <rect x="0" y="0" width="64" height="32" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill={brand.colors.blue} />
      <circle cx="32" cy="32" r="30" fill={brand.colors.red} clipPath="url(#acn-logo-top)" />
      <path
        d="M2 32 Q16 24 32 28 Q48 32 62 26"
        fill="none"
        stroke={brand.colors.white}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <text x="76" y="42" fontFamily={brand.fonts.heading} fontSize="28" fontWeight="700" fill={brand.colors.blue}>
        ACN
      </text>
      <text
        x="76"
        y="56"
        fontFamily={brand.fonts.body}
        fontSize="9"
        fontWeight="500"
        fill={brand.colors.red}
        letterSpacing="1.5"
      >
        INSTITUTE
      </text>
    </svg>
  );
}
