/* ==========================================================================
   Inline SVG icon set.
   --------------------------------------------------------------------------
   Why not Unicode/emoji: symbols like U+2B73 (⭳ "downwards arrow to bar") and
   U+2B71 have no glyph in the default Android system fonts, so they rendered
   as tofu boxes on the Export/Import backup buttons. Emoji are worse still —
   they change shape per platform and per vendor font. These are hand-drawn
   paths from a single 24-grid, so every control looks the same everywhere.

   All icons inherit `currentColor` and scale with font-size (1em), and are
   `aria-hidden` by default: every icon in this app sits next to a real text
   label or inside a control with an aria-label, so nothing is icon-only to a
   screen reader. Pass a `title` only if that ever stops being true.
   ========================================================================== */

import { SVGProps } from 'react'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** Accessible name. Omit (the default) for purely decorative icons. */
  title?: string
  /** Icon size, in any CSS length. Defaults to 1em so it tracks the label. */
  size?: number | string
}

function Icon({ title, size = '1em', children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: '-0.125em', ...rest.style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

/* ---- Data & backups ---- */

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 20h16" />
  </Icon>
)

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
    <path d="M4 20h16" />
  </Icon>
)

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7v13h12V7" />
  </Icon>
)

/* ---- Status / affordances ---- */

export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
)

export const WarningIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4 2.5 20h19L12 4Z" />
    <path d="M12 10v4" />
    <path d="M12 17.5v.01" />
  </Icon>
)

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </Icon>
)

export const PartialIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 14c2.5-4 5-4 8 0s5.5 4 8 0" />
  </Icon>
)

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </Icon>
)

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
)

export const SeedlingIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20v-7" />
    <path d="M12 13C12 9 9 7 5 7c0 4 3 6 7 6Z" />
    <path d="M12 13c0-3 2.5-4.5 6-4.5 0 3-2.5 4.5-6 4.5Z" />
  </Icon>
)

/* ---- Lesson runner ---- */

export const TimerIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2" />
    <path d="M9 2h6" />
  </Icon>
)

export const PauseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 5v14" />
    <path d="M15 5v14" />
  </Icon>
)

export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4.5v15l13-7.5-13-7.5Z" strokeLinejoin="round" />
  </Icon>
)

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
    <circle cx="12" cy="12" r="2.5" />
  </Icon>
)

export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.3 3.9" />
    <path d="M6.3 8.1A17 17 0 0 0 2 12s3.6 6 10 6a9.7 9.7 0 0 0 3.9-.8" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Icon>
)

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
    <path d="m14.5 5.5 4 4" />
  </Icon>
)

export const RecordIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="6" fill="currentColor" stroke="none" />
  </Icon>
)

export const NoteIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 3h14v18H5z" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
    <path d="M9 16h3" />
  </Icon>
)

export const SpeakerIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 9h3l5-4v14l-5-4H4z" />
    <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
    <path d="M18.5 7a7 7 0 0 1 0 10" />
  </Icon>
)

export const PrinterIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 9V3h10v6" />
    <path d="M5 9h14a2 2 0 0 1 2 2v6h-4" />
    <path d="M7 17H3v-6a2 2 0 0 1 2-2" />
    <path d="M7 14h10v7H7z" />
  </Icon>
)

export const ClipboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 4h6v3H9z" />
    <path d="M9 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H15" />
  </Icon>
)

export const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Icon>
)

/* ---- Navigation ---- */

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </Icon>
)

export const GlobeIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
  </Icon>
)

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
  </Icon>
)

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 13.5A8 8 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5Z" />
  </Icon>
)

export const MonitorIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="4" width="19" height="12" rx="2" />
    <path d="M9 20h6" />
    <path d="M12 16v4" />
  </Icon>
)

export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12H4" />
    <path d="m10 6-6 6 6 6" />
  </Icon>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 5-7 7 7 7" />
  </Icon>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 5 7 7-7 7" />
  </Icon>
)

export const SkipIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 5 8 7-8 7z" />
    <path d="M18 5v14" />
  </Icon>
)

/* ---- Tutor guidance ---- */

export const SpeechIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 4H4v11h4v4l5-4h7z" />
  </Icon>
)

export const HandIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M12 11V3.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M15 11V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7 7 7 0 0 1-7-7v-1.5a1.5 1.5 0 0 1 3-1.3" />
    <path d="M9 11V9" />
  </Icon>
)

export const LightbulbIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9V18h7v-4.1A6 6 0 0 0 12 3Z" />
  </Icon>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12h16" />
    <path d="m14 6 6 6-6 6" />
  </Icon>
)

export const FamilyIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="7" r="3" />
    <circle cx="17" cy="8" r="2.5" />
    <path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h1A4.5 4.5 0 0 1 13 18.5V20" />
    <path d="M15 20v-1a4 4 0 0 1 4-4h.5a1.5 1.5 0 0 1 1.5 1.5V20" />
  </Icon>
)

export const SparkleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5Z" />
  </Icon>
)
