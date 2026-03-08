// ============================================================
// DOM Executor — runs actions sent from the agent server
// Handles React/Vue/Angular synthetic events correctly
// ============================================================

export type ActionResult =
  | { success: true; data?: unknown }
  | { success: false; error: string }

// Dispatch input events in a way React/Vue/Angular all understand
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    'value'
  )?.set
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value)
  } else {
    element.value = value
  }
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

// Wait for an element to appear in the DOM (SPAs load content async)
export function waitForElement(selector: string, timeoutMs = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector)
    if (existing) return resolve(existing)

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) {
        observer.disconnect()
        resolve(el)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeoutMs)
  })
}

// Intercept SPA navigation so we know when URL changes without a page reload
export function setupNavigationTracking(onNavigate: (url: string) => void) {
  const originalPushState = history.pushState.bind(history)
  const originalReplaceState = history.replaceState.bind(history)

  history.pushState = function (...args) {
    originalPushState(...args)
    onNavigate(window.location.href)
  }
  history.replaceState = function (...args) {
    originalReplaceState(...args)
    onNavigate(window.location.href)
  }
  window.addEventListener('popstate', () => onNavigate(window.location.href))
}

// Get a snapshot of the current page state to give the agent context
export function getPageState(): Record<string, unknown> {
  const interactiveElements: Array<Record<string, string>> = []

  // Collect buttons, links, inputs — things the agent can interact with
  const selectors = 'button, a[href], input, select, textarea, [role="button"], [onclick]'
  document.querySelectorAll(selectors).forEach((el) => {
    const rect = el.getBoundingClientRect()
    // Skip hidden/offscreen elements
    if (rect.width === 0 && rect.height === 0) return

    const info: Record<string, string> = {
      tag: el.tagName.toLowerCase(),
    }
    if (el.id) info.id = el.id
    if (el.className && typeof el.className === 'string') {
      info.class = el.className.slice(0, 80)
    }
    const text = el.textContent?.trim().slice(0, 60)
    if (text) info.text = text
    if (el instanceof HTMLInputElement) {
      info.type = el.type
      info.name = el.name
      info.placeholder = el.placeholder
    }
    if (el instanceof HTMLAnchorElement && el.href) {
      info.href = el.href
    }
    interactiveElements.push(info)
  })

  return {
    url: window.location.href,
    title: document.title,
    interactiveElements: interactiveElements.slice(0, 40), // cap at 40 to keep tokens sane
  }
}

// ============================================================
// Action handlers — one function per tool the agent can call
// ============================================================

export async function executeAction(
  action: string,
  params: Record<string, unknown>
): Promise<ActionResult> {
  try {
    switch (action) {
      case 'navigate_to': {
        const url = params.url as string
        window.location.href = url
        return { success: true }
      }

      case 'click_element': {
        const selector = params.selector as string
        const el = await waitForElement(selector, 4000)
        if (!el) return { success: false, error: `Element not found: ${selector}` }
        ;(el as HTMLElement).click()
        // Wait a tick for React to process
        await new Promise((r) => setTimeout(r, 100))
        return { success: true }
      }

      case 'scroll_to': {
        const target = params.target as string
        if (target === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else if (target === 'bottom') {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
        } else {
          const el = document.querySelector(target)
          if (!el) return { success: false, error: `Element not found: ${target}` }
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return { success: true }
      }

      case 'fill_input': {
        const selector = params.selector as string
        const value = params.value as string
        const el = await waitForElement(selector, 4000)
        if (!el) return { success: false, error: `Input not found: ${selector}` }
        if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLTextAreaElement)) {
          return { success: false, error: `Element is not an input: ${selector}` }
        }
        setNativeValue(el, value)
        return { success: true }
      }

      case 'extract_text': {
        const selector = params.selector as string
        const el = selector === 'body' ? document.body : document.querySelector(selector)
        if (!el) return { success: false, error: `Element not found: ${selector}` }
        return { success: true, data: el.textContent?.trim().slice(0, 2000) }
      }

      case 'get_page_state': {
        return { success: true, data: getPageState() }
      }

      case 'wait': {
        const ms = Math.min((params.ms as number) || 1000, 5000) // max 5s wait
        await new Promise((r) => setTimeout(r, ms))
        return { success: true, data: getPageState() }
      }

      default:
        return { success: false, error: `Unknown action: ${action}` }
    }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
