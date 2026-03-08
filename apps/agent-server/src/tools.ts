import type OpenAI from 'openai'

// ============================================================
// Tool definitions sent to OpenAI
// Each tool maps to a DOM action the embed script will execute,
// OR a server-side action (save memory, show confirmation)
// ============================================================

export const AGENT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the browser to a URL. Use for going to a different page on the site.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to navigate to. Must be on the same domain.' },
          reason: { type: 'string', description: 'Why you are navigating here (shown to user).' },
        },
        required: ['url', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'click_element',
      description: 'Click a button, link, or interactive element on the page. Use CSS selectors.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the element to click.' },
          description: { type: 'string', description: 'Human-readable description of what you are clicking (shown to user).' },
        },
        required: ['selector', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fill_input',
      description: 'Type a value into a text input, textarea, or form field. Works with React/Vue controlled inputs.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector for the input element.' },
          value: { type: 'string', description: 'The value to type.' },
          description: { type: 'string', description: 'What you are filling in (shown to user).' },
        },
        required: ['selector', 'value', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scroll_to',
      description: 'Scroll the page to an element, or to the top/bottom.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'CSS selector, "top", or "bottom".' },
        },
        required: ['target'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'extract_text',
      description: 'Read the text content of an element on the page. Use to get current values, confirm state, or read data before acting.',
      parameters: {
        type: 'object',
        properties: {
          selector: { type: 'string', description: 'CSS selector of element to read. Use "body" for full page text.' },
        },
        required: ['selector'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_page_state',
      description: 'Get the current URL, page title, and list of interactive elements. Call this after any navigation or action to verify the current state before continuing.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wait',
      description: 'Wait for the page to update (after clicking something that triggers a loading state, or after navigation in a SPA). Returns the new page state.',
      parameters: {
        type: 'object',
        properties: {
          ms: { type: 'number', description: 'Milliseconds to wait. Max 5000. Use 500-1500 for most cases.' },
          reason: { type: 'string', description: 'What you are waiting for.' },
        },
        required: ['ms', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'request_confirmation',
      description: 'REQUIRED before any destructive action: cancelling subscriptions, deleting data, submitting payments, removing items. Shows a confirmation dialog to the user. Only proceed with the action after the user confirms.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Clear description of what will happen if confirmed. E.g. "Cancel your Pro subscription — you will lose access at the end of the billing period."' },
        },
        required: ['message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_user_memory',
      description: 'Save a fact about this user to remember for future conversations. Use for name, preferences, account details, or anything useful to recall later.',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Short identifier, e.g. "name", "plan", "preferred_language".' },
          value: { type: 'string', description: 'The value to store.' },
        },
        required: ['key', 'value'],
      },
    },
  },
]

// Labels shown in the widget for each action type
export const ACTION_LABELS: Record<string, string> = {
  navigate_to: 'Navigating...',
  click_element: 'Clicking...',
  fill_input: 'Filling in form...',
  scroll_to: 'Scrolling...',
  extract_text: 'Reading page...',
  get_page_state: 'Checking page...',
  wait: 'Waiting...',
}

// Tools that require DOM execution (forwarded to embed)
export const DOM_TOOLS = new Set([
  'navigate_to',
  'click_element',
  'fill_input',
  'scroll_to',
  'extract_text',
  'get_page_state',
  'wait',
])

// Tools that are destructive and require confirmation
export const DESTRUCTIVE_SELECTORS = [
  /cancel/i, /delete/i, /remove/i, /unsubscrib/i, /deactivat/i, /terminat/i,
]

export function selectorIsDestructive(selector: string): boolean {
  return DESTRUCTIVE_SELECTORS.some((r) => r.test(selector))
}
