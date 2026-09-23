/**
 * Procedurally generated sample crop-leaf images as inline SVG data URIs.
 *
 * The workspace and the demo may have no network access, and hotlinking stock
 * photos would be both slow and fragile. These are drawn at runtime, cost a few
 * hundred bytes each, and give the Crop Doctor something real to display.
 */

type LeafOpts = {
  hue?: number
  spots?: number
  spotColor?: string
  yellow?: number
  curl?: number
  label?: string
}

function leafSvg(o: LeafOpts = {}): string {
  const {
    hue = 130, spots = 0, spotColor = '#6b3a1f', yellow = 0, curl = 0,
  } = o

  // Deterministic spot placement so a sample looks identical every render.
  let seed = 42
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

  const spotEls = Array.from({ length: spots }, () => {
    const cx = 60 + rnd() * 200
    const cy = 60 + rnd() * 180
    const r = 5 + rnd() * 13
    return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.82).toFixed(1)}"
      fill="${spotColor}" opacity="0.72"/>
      <ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(r * 1.55).toFixed(1)}" ry="${(r * 1.25).toFixed(1)}"
      fill="#d9c24a" opacity="${(0.18 + yellow * 0.004).toFixed(2)}"/>`
  }).join('')

  const base = `hsl(${hue} 46% ${34 - yellow * 0.06}%)`
  const tip = `hsl(${hue + yellow * 0.35} ${46 - yellow * 0.25}% ${46 + yellow * 0.14}%)`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320">
  <defs>
    <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${base}"/>
      <stop offset="100%" stop-color="${tip}"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#f4f1e8"/><stop offset="100%" stop-color="#ddd6c6"/>
    </radialGradient>
    <clipPath id="c">
      <path d="M160 24 C250 60 296 140 268 226 C244 296 176 306 160 296
               C144 306 76 296 52 226 C24 140 70 60 160 24 Z"/>
    </clipPath>
  </defs>
  <rect width="320" height="320" fill="url(#bg)"/>
  <g clip-path="url(#c)">
    <rect width="320" height="320" fill="url(#g)"/>
    ${spotEls}
    <g stroke="hsl(${hue} 40% 24%)" stroke-opacity="0.45" fill="none" stroke-width="2.4">
      <path d="M160 296 L160 30"/>
      <path d="M160 250 C126 236 100 214 84 186"/>
      <path d="M160 250 C194 236 220 214 236 186"/>
      <path d="M160 196 C132 184 112 166 98 142"/>
      <path d="M160 196 C188 184 208 166 222 142"/>
      <path d="M160 142 C138 132 122 118 112 100"/>
      <path d="M160 142 C182 132 198 118 208 100"/>
    </g>
  </g>
  <path d="M160 24 C250 60 296 140 268 226 C244 296 176 306 160 296
           C144 306 76 296 52 226 C24 140 70 60 160 24 Z"
        fill="none" stroke="hsl(${hue} 38% 22%)" stroke-opacity="0.5" stroke-width="2"/>
  ${curl ? `<g opacity="0.35" stroke="#f0e5d6" stroke-width="3" fill="none">
      <path d="M52 226 C90 250 130 258 160 254"/>
      <path d="M268 226 C230 250 190 258 160 254"/></g>` : ''}
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const sampleLeaves = [
  {
    id: 'leaf-spot',
    name: 'leaf-brown-spots.jpg',
    caption: 'Brown lesions with yellow halos',
    bytes: 482_113,
    src: leafSvg({ hue: 128, spots: 9, spotColor: '#5c3317', yellow: 22 }),
  },
  {
    id: 'yellowing',
    name: 'leaf-yellowing.jpg',
    caption: 'Uniform pale yellowing',
    bytes: 391_884,
    src: leafSvg({ hue: 88, spots: 0, yellow: 78 }),
  },
  {
    id: 'leaf-curl',
    name: 'leaf-curl-mirchi.jpg',
    caption: 'Curled, thickened margins',
    bytes: 455_207,
    src: leafSvg({ hue: 118, spots: 3, spotColor: '#7a5c1e', yellow: 34, curl: 1 }),
  },
] as const

/** Fills the upload frame when nothing is selected. */
export const placeholderLeaf = leafSvg({ hue: 132, spots: 0, yellow: 0 })
