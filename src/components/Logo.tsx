/** The Espresso Index mark: an espresso cup from above — saucer, cup,
 *  handle at four o'clock. Strokes inherit currentColor. */
export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="43" stroke="currentColor" strokeWidth="6" />
      <circle cx="48.5" cy="47" r="24.5" stroke="currentColor" strokeWidth="6" />
      <line
        x1="66"
        y1="64.5"
        x2="73.5"
        y2="71.5"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}
