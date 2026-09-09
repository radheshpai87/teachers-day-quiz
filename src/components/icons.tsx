/**
 * Hand-drawn icon set.
 *
 * The brief rules out emoji, so every pictogram in the participant-facing UI is
 * an inline SVG: it inherits colour, scales cleanly on a projector, and costs no
 * network request. Generic admin-panel affordances use lucide-react instead.
 */

type IconProps = React.SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function HardHat(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 14a8 8 0 0 1 16 0v2H4v-2Z" />
      <path d="M2 16h20v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2Z" />
      <path d="M12 6v8" />
      <path d="M8 10h8" />
    </Svg>
  )
}

export function Blueprint(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.8} />
      <path d="M7 7h10M7 11h6M7 15h10" strokeDasharray="2 2" />
      <circle cx="16" cy="11" r="1.5" />
      <path d="M12 15l4-4" />
    </Svg>
  )
}

export function Gear(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </Svg>
  )
}

export function GearsSet(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="9" r="2.5" />
      <path d="M9 4.5v1M9 12.5v1M4.5 9h1M12.5 9h1M5.8 5.8l.7.7M11.5 11.5l.7.7M11.5 5.8l-.7.7M5.8 11.5l-.7.7" strokeWidth={1.8} />
      <circle cx="16" cy="16" r="2" />
      <path d="M16 12.5v1M16 18.5v1M12.5 16h1M18.5 16h1" strokeWidth={1.8} />
    </Svg>
  )
}

export function Pencil(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M15.6 3.6 20.4 8.4 8.9 19.9l-5.4 1.6 1.6-5.4L15.6 3.6Z" />
      <path d="m13.6 5.6 4.8 4.8" />
      <path d="m5.1 16.1 2.8 2.8" />
    </Svg>
  )
}

export function Caliper(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 5h18" strokeWidth={2} />
      <path d="M5 5v14M8 5v14" />
      <path d="M5 9h3M5 13h3M5 17h3" />
      <path d="M12 5v10l3 3V5" />
      <rect x="11" y="4" width="4" height="4" rx="1" fill="currentColor" />
    </Svg>
  )
}

export function CircuitBoard(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M9 9h6v6H9z" fill="currentColor" fillOpacity={0.2} />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </Svg>
  )
}

export function WrenchNut(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Svg>
  )
}

export function GraduationCap(props: IconProps) {
  return <HardHat {...props} />
}

export function Book(props: IconProps) {
  return <Blueprint {...props} />
}

export function Chalkboard(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.8" />
      <path d="M6 8.5h12M6 12h8" strokeDasharray="2 2" />
      <path d="M8 20.5 12 16.5l4 4" />
    </Svg>
  )
}

export function Star(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.2 1 5.9L12 16.7l-5.2 2.8 1-5.9L3.5 9.4l5.9-.8L12 3.2Z" />
    </Svg>
  )
}

export function Notebook(props: IconProps) {
  return <Blueprint {...props} />
}

export function Ruler(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.6" y="8.6" width="18.8" height="6.8" rx="1.6" transform="rotate(-14 12 12)" />
      <path d="M7 9.4v2.2M10.3 8.6v2.2M13.6 7.8v2.2M16.9 7v2.2" />
    </Svg>
  )
}

export function Compass(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="5.2" r="1.7" />
      <path d="M11.2 6.8 6 20.2M12.8 6.8 18 20.2" />
      <path d="M9.1 14.2h5.8" />
    </Svg>
  )
}

export function Trophy(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 4h8v4.5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5.5H5.6A1.6 1.6 0 0 0 4 7.1c0 2 1.6 3.6 3.6 3.6H8" />
      <path d="M16 5.5h2.4A1.6 1.6 0 0 1 20 7.1c0 2-1.6 3.6-3.6 3.6H16" />
      <path d="M12 12.5V16" />
      <path d="M8.5 20h7l-.8-3.2h-5.4L8.5 20Z" />
    </Svg>
  )
}

export function Laurel(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 20.5C5.2 18.9 3 15.4 3 11.3 3 7.6 4.9 4.6 7.6 3.5" />
      <path d="M15 20.5c3.8-1.6 6-5.1 6-9.2 0-3.7-1.9-6.7-4.6-7.8" />
      <path d="M6.4 8.2c1.3-.5 2.5-.2 3.2.7M5.6 12c1.3-.4 2.5 0 3.1 1M6.6 15.7c1.2-.6 2.5-.4 3.2.5" />
      <path d="M17.6 8.2c-1.3-.5-2.5-.2-3.2.7M18.4 12c-1.3-.4-2.5 0-3.1 1M17.4 15.7c-1.2-.6-2.5-.4-3.2.5" />
    </Svg>
  )
}

export function Clock(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12.6" r="8.2" />
      <path d="M12 8.2v4.6l3 2" />
      <path d="M9.4 2.4h5.2" />
    </Svg>
  )
}

export function Users(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8.2" r="3.3" />
      <path d="M3.2 19.4c.6-3.2 3-5.2 5.8-5.2s5.2 2 5.8 5.2" />
      <path d="M16.2 5.5a3.3 3.3 0 0 1 0 6.4" />
      <path d="M17.4 14.6c2 .6 3.5 2.4 4 4.8" />
    </Svg>
  )
}

export function Bolt(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.4 2.5 5.5 13.6h5l-1.4 7.9 8.4-11.6h-5.2l1.1-7.4Z" />
    </Svg>
  )
}

export function Target(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function Check(props: IconProps) {
  return (
    <Svg strokeWidth={2.4} {...props}>
      <path d="m4.5 12.6 5 5L19.5 7.4" />
    </Svg>
  )
}

export function Cross(props: IconProps) {
  return (
    <Svg strokeWidth={2.4} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  )
}

export function ArrowUp(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="M12 19V5.8M6.2 11.6 12 5.8l5.8 5.8" />
    </Svg>
  )
}

export function ArrowDown(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="M12 5v13.2M17.8 12.4 12 18.2l-5.8-5.8" />
    </Svg>
  )
}

export function QrFrame(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 9V5.6A1.6 1.6 0 0 1 5.6 4H9" />
      <path d="M15 4h3.4A1.6 1.6 0 0 1 20 5.6V9" />
      <path d="M20 15v3.4a1.6 1.6 0 0 1-1.6 1.6H15" />
      <path d="M9 20H5.6A1.6 1.6 0 0 1 4 18.4V15" />
      <rect x="8" y="8" width="8" height="8" rx="1.2" />
    </Svg>
  )
}

// ---------------------------------------------------------------------------
// Answer shapes
//
// Colour alone must never carry meaning, so each answer slot also gets its own
// silhouette -- the same trick Kahoot uses, drawn a little more softly here.
// ---------------------------------------------------------------------------

export function ShapeTriangle(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 3.6c.7 0 1.3.36 1.65.96l7.5 13.1c.75 1.3-.2 2.94-1.7 2.94H4.55c-1.5 0-2.45-1.64-1.7-2.94l7.5-13.1c.35-.6.95-.96 1.65-.96Z" />
    </svg>
  )
}

export function ShapeDiamond(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="4.4" y="4.4" width="15.2" height="15.2" rx="2.6" transform="rotate(45 12 12)" />
    </svg>
  )
}

export function ShapeCircle(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.6" />
    </svg>
  )
}

export function ShapeSquare(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.2" />
    </svg>
  )
}

export const ANSWER_SHAPES = [ShapeTriangle, ShapeDiamond, ShapeCircle, ShapeSquare] as const

// ---------------------------------------------------------------------------
// Rank medals -- drawn rather than emoji, and distinguishable without colour.
// ---------------------------------------------------------------------------

export function Medal({ place, ...props }: IconProps & { place: 1 | 2 | 3 }) {
  const ribbon = place === 1 ? '#D9A62E' : place === 2 ? '#A9B3C2' : '#C98A5E'
  const disc = place === 1 ? '#FFE3A3' : place === 2 ? '#DCE3EC' : '#F0CDB4'
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M7.4 2.5 11 9.4h2L9.4 2.5H7.4Z" fill={ribbon} />
      <path d="M16.6 2.5 13 9.4h-2l3.6-6.9h2Z" fill={ribbon} />
      <circle cx="12" cy="15.4" r="6.1" fill={disc} stroke={ribbon} strokeWidth="1.3" />
      <text
        x="12"
        y="15.4"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="7"
        fontWeight="700"
        fill="#2A2440"
        fontFamily="var(--font-jakarta), system-ui, sans-serif"
      >
        {place}
      </text>
    </svg>
  )
}

export function PaperClip(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M13.25 7.75l-5.5 5.5a3.18 3.18 0 1 0 4.5 4.5l6-6a4.77 4.77 0 1 0-6.75-6.75l-6.5 6.5a6.36 6.36 0 1 0 9 9l4.5-4.5" />
    </Svg>
  )
}

export function SpiralBinder(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeDasharray="3 3" />
      <circle cx="5" cy="6" r="1.5" fill="currentColor" />
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="5" cy="18" r="1.5" fill="currentColor" />
    </Svg>
  )
}

export function PencilScribble(props: IconProps) {
  return (
    <Svg strokeWidth={2.2} {...props}>
      <path d="M2 12c3-4 6 4 9 0s6 4 9 0 3-2 3-2" strokeDasharray="1 2" />
      <path d="M4 16c2-2 4 2 6 0s4 2 6 0" />
    </Svg>
  )
}

export function PaperAirplaneDoodle(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M2 12l20-9-9 20-3-8-8-3z" />
      <path d="M13 11l9-8" />
      <path d="M3 18c4 3 8 1 11-2" strokeDasharray="2 3" />
    </Svg>
  )
}

export function MathFormulaDoodle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 160 80" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {/* E = mc^2 */}
      <text x="10" y="25" fill="currentColor" stroke="none" fontSize="18" fontWeight="800" fontFamily="var(--font-jakarta), sans-serif">
        E = mc²
      </text>
      {/* a^2 + b^2 = c^2 */}
      <text x="15" y="55" fill="currentColor" stroke="none" fontSize="15" fontWeight="800" fontFamily="var(--font-jakarta), sans-serif">
        a² + b² = c²
      </text>
      {/* pi and sqrt */}
      <path d="M120 18h18M126 18v16M132 18v16" />
      <path d="M110 50l4 8 6-18h16" />
      <text x="124" y="55" fill="currentColor" stroke="none" fontSize="14" fontWeight="800">x</text>
    </svg>
  )
}

export function CompassRulerDoodle(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <circle cx="12" cy="5" r="2" />
      <path d="M11 7l-5 14M13 7l5 14" />
      <path d="M8 15h8" />
    </Svg>
  )
}

export function DoodleStars(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" {...props}>
      {/* Star 1 */}
      <path d="M30 10l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      {/* Star 2 */}
      <path d="M75 40l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      {/* Star 3 */}
      <path d="M20 70l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" />
    </svg>
  )
}

export function ThumbtackPin(props: IconProps) {
  return (
    <Svg strokeWidth={2} {...props}>
      <path d="M12 17v5M9 4h6M10 4v5l-3 3v2h10v-2l-3-3V4" />
    </Svg>
  )
}
