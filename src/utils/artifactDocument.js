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
  defaults.textContent = '@layer artifact-defaults { body { margin: 0; min-height: 100vh; } }'
  doc.head.prepend(defaults)

  // Inject Google Fonts if not already authored
  if (!doc.querySelector('link[href*="fonts.googleapis.com"]')) {
    const preconnect1 = doc.createElement('link')
    preconnect1.rel = 'preconnect'
    preconnect1.href = 'https://fonts.googleapis.com'
    const preconnect2 = doc.createElement('link')
    preconnect2.rel = 'preconnect'
    preconnect2.href = 'https://fonts.gstatic.com'
    preconnect2.crossOrigin = 'anonymous'
    const fontLink = doc.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,600&family=JetBrains+Mono:wght@400;500&display=swap'
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
    const colors = theme.primary ? { brand: theme.primary, primary: theme.primary } : {}

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
      const isSerif = /serif|playfair|merriweather|lora|literata|cinzel|bodoni|garamond/i.test(font)
      if (isSerif && !fontFamily.serif) {
        fontFamily.serif = [font, 'serif']
      } else if (!fontFamily.sans) {
        fontFamily.sans = [font, 'sans-serif']
      }
    }
    if (theme.fontFamily && !fontFamily.sans) {
      fontFamily.sans = [theme.fontFamily, 'sans-serif']
    } else if (theme.typography?.primary && !fontFamily.sans) {
      fontFamily.sans = [theme.typography.primary, 'sans-serif']
    }

    if (!fontFamily.sans) {
      fontFamily.sans = ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif']
    }
    if (!fontFamily.serif) {
      fontFamily.serif = ['"Playfair Display"', 'Georgia', 'serif']
    }
    if (!fontFamily.mono) {
      fontFamily.mono = ['"JetBrains Mono"', 'monospace']
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
