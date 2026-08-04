import { brand } from '@/lib/brand';

export default function Isotype({ className = 'w-9 h-9' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      width="64"
      height="64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="acn-isotipo-top">
          <rect x="0" y="0" width="64" height="32" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill={brand.colors.blue} />
      <circle cx="32" cy="32" r="30" fill={brand.colors.red} clipPath="url(#acn-isotipo-top)" />
      <path
        d="M2 32 Q16 24 32 28 Q48 32 62 26"
        fill="none"
        stroke={brand.colors.white}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}
