import { ReactNode } from 'react'
import styles from './ui.module.css'

/** A toggleable chip used for multi/single select groups. */
export function Chip({
  label,
  selected,
  onToggle,
}: {
  label: ReactNode
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button type="button" className="chip" aria-pressed={selected} onClick={onToggle}>
      {label}
    </button>
  )
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multi = true,
  labelFor,
}: {
  options: readonly T[]
  value: T[]
  onChange: (next: T[]) => void
  multi?: boolean
  labelFor: (opt: T) => string
}) {
  const toggle = (opt: T) => {
    if (multi) {
      onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt])
    } else {
      onChange(value.includes(opt) ? [] : [opt])
    }
  }
  return (
    <div className="cluster" role="group">
      {options.map((opt) => (
        <Chip key={opt} label={labelFor(opt)} selected={value.includes(opt)} onToggle={() => toggle(opt)} />
      ))}
    </div>
  )
}

/** A 1–5 rating scale (confidence, importance). */
export function RatingScale({
  value,
  onChange,
  min = 1,
  max = 5,
  lowLabel,
  highLabel,
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  lowLabel?: string
  highLabel?: string
  ariaLabel: string
}) {
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className={styles.rating}>
      <div className={styles.ratingBtns} role="radiogroup" aria-label={ariaLabel}>
        {items.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            className={`${styles.ratingBtn} ${value === n ? styles.ratingActive : ''}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div className={styles.ratingLabels}>
          <span className="muted">{lowLabel}</span>
          <span className="muted">{highLabel}</span>
        </div>
      )}
    </div>
  )
}

/** Free-text tag input (interests, other languages). */
export function TagInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  ariaLabel: string
}) {
  const add = (raw: string) => {
    const v = raw.trim()
    if (v && !value.includes(v)) onChange([...value, v])
  }
  return (
    <div className={styles.tagInput}>
      <div className="cluster">
        {value.map((tag) => (
          <span key={tag} className="chip is-selected">
            {tag}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        className="input"
        placeholder={placeholder}
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add((e.target as HTMLInputElement).value)
            ;(e.target as HTMLInputElement).value = ''
          }
        }}
        onBlur={(e) => {
          add(e.target.value)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export function Progress({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
    </div>
  )
}
