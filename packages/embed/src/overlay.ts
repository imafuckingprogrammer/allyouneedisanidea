// ============================================================
// Overlay — Operator-style visual feedback when the agent
// is controlling the host page. Injected directly into the
// host document (NOT inside Shadow DOM) so it can appear
// on top of any element on the page.
// ============================================================

let _color = '#6366f1'
let _overlayEl: HTMLDivElement | null = null
let _labelEl: HTMLDivElement | null = null
let _scanEl: HTMLDivElement | null = null
let _styleEl: HTMLStyleElement | null = null

export function initOverlay(color: string) {
  _color = color
  _injectStyles()
}

// Show a glowing highlight ring around a specific element
export async function highlightElement(
  selector: string,
  label: string
): Promise<void> {
  clearOverlay()

  const target = document.querySelector(selector)
  if (!target) return

  // Scroll into view first so bounding rect is accurate
  target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  await new Promise((r) => setTimeout(r, 250))

  const rect = target.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return

  // Match the element's border-radius
  const computed = window.getComputedStyle(target as Element)
  const radius = computed.borderRadius || '6px'

  const pad = 5

  // Highlight ring
  _overlayEl = document.createElement('div')
  _overlayEl.id = '__ai_agent_overlay__'
  Object.assign(_overlayEl.style, {
    position: 'fixed',
    top: `${rect.top - pad}px`,
    left: `${rect.left - pad}px`,
    width: `${rect.width + pad * 2}px`,
    height: `${rect.height + pad * 2}px`,
    borderRadius: radius,
    border: `2px solid ${_color}`,
    background: hexToRgba(_color, 0.06),
    pointerEvents: 'none',
    zIndex: '2147483646',
    animation: 'ai_agent_pulse 1.8s ease-in-out infinite',
    transition: 'opacity 0.15s ease',
  })

  // Floating label
  _labelEl = document.createElement('div')
  _labelEl.id = '__ai_agent_label__'

  // Position above the element (or below if too close to top)
  const labelTop = rect.top - pad - 36
  const finalTop = labelTop < 8 ? rect.bottom + pad + 6 : labelTop

  Object.assign(_labelEl.style, {
    position: 'fixed',
    top: `${finalTop}px`,
    left: `${Math.max(8, rect.left - pad)}px`,
    background: _color,
    color: '#fff',
    padding: '5px 11px',
    borderRadius: '7px',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: '2147483647',
    boxShadow: `0 3px 12px ${hexToRgba(_color, 0.4)}`,
    letterSpacing: '0.01em',
    animation: 'ai_agent_fadein 0.15s ease',
    maxWidth: '280px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  })
  _labelEl.textContent = label

  // Subtle page dim behind the ring (just the ring area, not the whole page)
  document.body.appendChild(_overlayEl)
  document.body.appendChild(_labelEl)
}

// Full-page scanning shimmer (used for get_page_state)
export function showScanOverlay(): void {
  _scanEl?.remove()
  _scanEl = document.createElement('div')
  _scanEl.id = '__ai_agent_scan__'
  Object.assign(_scanEl.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '4px',
    background: `linear-gradient(90deg, transparent 0%, ${_color} 50%, transparent 100%)`,
    backgroundSize: '200% 100%',
    pointerEvents: 'none',
    zIndex: '2147483647',
    animation: 'ai_agent_scan 1.2s ease-in-out infinite',
  })
  document.body.appendChild(_scanEl)
}

export function clearOverlay(): void {
  _overlayEl?.remove()
  _labelEl?.remove()
  _scanEl?.remove()
  _overlayEl = null
  _labelEl = null
  _scanEl = null
}

// ============================================================
// Internals
// ============================================================

function _injectStyles() {
  if (_styleEl) { _styleEl.remove() }
  _styleEl = document.createElement('style')
  _styleEl.id = '__ai_agent_styles__'
  _styleEl.textContent = `
    @keyframes ai_agent_pulse {
      0%, 100% {
        box-shadow:
          0 0 0 0 ${hexToRgba(_color, 0.3)},
          0 0 16px ${hexToRgba(_color, 0.2)};
      }
      50% {
        box-shadow:
          0 0 0 5px ${hexToRgba(_color, 0)},
          0 0 28px ${hexToRgba(_color, 0.45)};
      }
    }
    @keyframes ai_agent_scan {
      0%   { background-position: 200% 0; opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { background-position: -200% 0; opacity: 0; }
    }
    @keyframes ai_agent_fadein {
      from { opacity: 0; transform: translateY(3px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `
  document.head.appendChild(_styleEl)
}

function hexToRgba(hex: string, alpha: number): string {
  // Handle shorthand and invalid values gracefully
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  const r = parseInt(full.slice(0, 2), 16) || 99
  const g = parseInt(full.slice(2, 4), 16) || 102
  const b = parseInt(full.slice(4, 6), 16) || 241
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
