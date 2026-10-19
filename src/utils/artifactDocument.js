// Compose an isolated preview without replacing the generated document's design.
// Input HTML has already passed the backend sanitization pipeline; iframe sandboxing
// remains the execution boundary. DOMParser is used only to normalize document shape.
export function buildArtifactDocument({ html, css = '', theme = {}, editorStyles = '', editorScript = '', canvas = false }) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  theme ||= {}
  if (!doc.documentElement.lang) doc.documentElement.lang = 'en'
  if (theme.mode === 'dark') doc.documentElement.classList.add('dark')
  if (!doc.querySelector('meta[charset]')) {
    const meta = doc.createElement('meta')
    meta.setAttribute('charset', 'UTF-8')
    doc.head.prepend(meta)
  }
  if (!doc.querySelector('meta[name="viewport"]')) {
    const meta = doc.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1.0'
    doc.head.append(meta)
  }

  // Low-priority defaults: authored styles and utility classes always win.
  const defaults = doc.createElement('style')
  defaults.textContent = '@layer artifact-defaults { html { scroll-behavior: smooth; } body { margin: 0; min-height: 100vh; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; } .canvas-dot-grid { background-image: radial-gradient(rgba(148, 163, 184, 0.25) 1px, transparent 1px); background-size: 20px 20px; } @keyframes rl-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } } @keyframes rl-pulse-subtle { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } } .animate-float { animation: rl-float 5s ease-in-out infinite; } .animate-pulse-subtle { animation: rl-pulse-subtle 3s ease-in-out infinite; } }'
  doc.head.prepend(defaults)

  // Inject authored fonts (only if the design explicitly declares them and they are
  // not already referenced). When no font family is requested, fall back to the
  // platform system stack so bare fragments stay untouched.
  const declaredFontFamily =
    theme.fontFamily ||
    theme.typography?.primary ||
    null
  const declaredHeadingFont =
    theme.headingFont ||
    theme.typography?.heading ||
    null
  const declaredMonoFont =
    theme.monoFont ||
    theme.typography?.mono ||
    null

  const requestedGoogleFonts = [declaredFontFamily, declaredHeadingFont, declaredMonoFont]
    .filter(f => typeof f === 'string' && f.trim().length > 0 && !/[<>"{}|\\^` + "`" + `]/.test(f))
    .map(f => f.trim())
  const uniqueRequestedFonts = [...new Set(requestedGoogleFonts)]

  const alreadyHasGoogleFonts = !!doc.querySelector('link[href*="fonts.googleapis.com"]')
  if (uniqueRequestedFonts.length > 0 && !alreadyHasGoogleFonts && !doc.querySelector('style[data-artifact-default-font]')) {
    const preconnect1 = doc.createElement('link')
    preconnect1.rel = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    const preconnect2 = doc.createElement('link')
    preconnect2.rel = 'preconnect'
    preconnect2.href = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'
    const fontLink = doc.createElement('link')
    fontLink.rel = 'stylesheet'
    const familyParams = uniqueRequestedFonts
      .map(f => 'family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':ital,wght@0,400;0,500;0,600;0,700;1,400')
      .join('&')
    fontLink.href = 'https://fonts.googleapis.com/css2?' + familyParams + '&display=swap'
    doc.head.append(preconnect1, preconnect2, fontLink)
  }

  // Ensure antialiasing on body
  doc.body.classList.add('antialiased')

  const runtime = doc.querySelector('script[src*="cdn.tailwindcss.com"], script[src*="@tailwindcss/browser"]')
  if (!runtime) {
    const script = doc.createElement('script')
    script.src = 'https://cdn.tailwindcss.com'
    doc.head.prepend(script)
  }
  // Preserve an authored Tailwind configuration (including typography and palette).
  const hasConfig = [...doc.scripts].some(script => /tailwind\.config\s*=/.test(script.textContent))
  if (!hasConfig && !doc.querySelector('script[src*="@tailwindcss/browser"]')) {
    const config = doc.createElement('script')
    const colors = {}
    if (theme.primary) {
      colors.brand = theme.primary
      colors.primary = theme.primary
    }
    if (theme.accent) {
      colors.accent = theme.accent
    }

    // Extract authored Google Fonts from link or style tags to prevent Tailwind Preflight font reset
    const fontSources = [
      ...[...doc.querySelectorAll('link[href*="fonts.googleapis.com"]')].map(l => l.href),
      ...[...doc.querySelectorAll('style')].map(s => s.textContent),
    ]
    const detectedFonts = []
    for (const src of fontSources) {
      const matches = [...src.matchAll(/family=([^:&'"\)\s]+)/g)]
      for (const m of matches) {
        detectedFonts.push(decodeURIComponent(m[1].replace(/\+/g, ' ')))
      }
    }

    const fontFamily = {}
    for (const font of detectedFonts) {
      const isSerif = /serif|playfair|merriweather|lora|literata|cinzel|bodoni|garamond|fraunces/i.test(font)
      const isMono = /mono|jetbrains|fira|consolas|courier/i.test(font)
      if (isMono && !fontFamily.mono) {
        fontFamily.mono = [font, 'ui-monospace', 'monospace']
      } else if (isSerif && !fontFamily.serif) {
        fontFamily.serif = [font, 'Georgia', 'serif']
      } else if (!fontFamily.sans) {
        fontFamily.sans = [font, 'system-ui', 'sans-serif']
      }
    }
    // Apply explicit theme font families if declared
    if (declaredFontFamily && !fontFamily.sans) {
      fontFamily.sans = [declaredFontFamily, 'system-ui', 'sans-serif']
    }
    if (declaredHeadingFont) {
      const isHeadingSerif = /serif|playfair|merriweather|lora|literata|cinzel|bodoni|garamond|fraunces/i.test(declaredHeadingFont)
      if (isHeadingSerif) {
        fontFamily.serif = [declaredHeadingFont, 'Georgia', 'serif']
      }
      fontFamily.display = [declaredHeadingFont, 'system-ui', 'sans-serif']
    }
    if (declaredMonoFont && !fontFamily.mono) {
      fontFamily.mono = [declaredMonoFont, 'ui-monospace', 'SFMono-Regular', 'monospace']
    }

    if (!fontFamily.sans) {
      fontFamily.sans = ['system-ui', 'Segoe UI', 'Inter', 'sans-serif']
    }
    if (!fontFamily.serif) {
      fontFamily.serif = ['Georgia', 'Cambria', 'serif']
    }
    if (!fontFamily.mono) {
      fontFamily.mono = ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
    }

    const extend = { colors }
    if (Object.keys(fontFamily).length > 0) {
      extend.fontFamily = fontFamily
    }

    config.textContent = 'tailwind.config = ' + JSON.stringify({ darkMode: 'class', theme: { extend } }).replace(/</g, '\\u003c')
    doc.querySelector('script[src*="cdn.tailwindcss.com"]').after(config)
  }
  if (css) {
    const style = doc.createElement('style')
    style.dataset.artifactSource = 'css'
    // Prevent CSS text from breaking out of its serialized raw-text element.
    style.textContent = css.replace(/<\/style/gi, '<\\/style')
    doc.head.append(style)
  }
  if (editorStyles) {
    const style = doc.createElement('style')
    style.textContent = editorStyles
    doc.head.append(style)
  }
  if (canvas) {
    const badge = doc.createElement('div')
    badge.id = 'rl-mode-badge'
    badge.textContent = 'EDIT'
    doc.body.append(badge)
  }
  if (editorScript) {
    const bridge = doc.createElement('script')
    bridge.textContent = editorScript
    doc.body.append(bridge)
  }
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
}
