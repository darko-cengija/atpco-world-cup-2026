import sharp from 'sharp'
import { mkdirSync, writeFileSync } from 'fs'

mkdirSync('./public', { recursive: true })
mkdirSync('./docs/design/generated-app-icons', { recursive: true })

const colors = {
  paper: '#e6dcc5',
  ticket: '#f6efdb',
  ink: '#0f3a35',
  stamp: '#a8392b',
}

const fonts = {
  display: '"DM Serif Display", "Times New Roman", Georgia, serif',
  mono: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, monospace',
}

function grainPattern() {
  return `
    <pattern id="grain-a" width="3" height="3" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.55" fill="#000" opacity="0.045"/>
    </pattern>
    <pattern id="grain-b" width="7" height="7" patternUnits="userSpaceOnUse">
      <circle cx="3.5" cy="3.5" r="0.65" fill="#000" opacity="0.025"/>
    </pattern>
  `
}

function iconArtwork({ detail = 'full' } = {}) {
  const showLabels = detail !== 'minimal'
  const showAll = detail === 'full'
  const tearX = 194.56
  const leftCenter = tearX / 2
  const rightCenter = tearX + (512 - tearX) / 2

  return `
    <rect width="512" height="512" fill="${colors.ticket}"/>
    <rect width="512" height="512" fill="url(#grain-a)"/>
    <rect width="512" height="512" fill="url(#grain-b)"/>

    <rect x="36" y="36" width="440" height="440" rx="11" fill="none"
      stroke="${colors.ink}" stroke-width="5.6"/>

    <line x1="${tearX}" y1="36" x2="${tearX}" y2="476"
      stroke="${colors.ink}" stroke-opacity="0.7" stroke-width="4.1"
      stroke-linecap="round" stroke-dasharray="8 11"/>

    <circle cx="${tearX}" cy="0" r="20.5" fill="${colors.paper}"/>
    <circle cx="${tearX}" cy="512" r="20.5" fill="${colors.paper}"/>

    ${
      showLabels
        ? `
          <text x="${leftCenter}" y="229" text-anchor="middle"
            font-family='${fonts.mono}' font-size="36"
            font-weight="800" letter-spacing="1.5" fill="${colors.ink}">ADMIT</text>
          <text x="${leftCenter}" y="278" text-anchor="middle"
            font-family='${fonts.mono}' font-size="36"
            font-weight="800" letter-spacing="1.5" fill="${colors.ink}">ONE</text>
        `
        : ''
    }

    ${
      showAll
        ? `
          <line x1="${leftCenter - 36}" y1="302" x2="${leftCenter + 36}" y2="302"
            stroke="${colors.ink}" stroke-opacity="0.4" stroke-width="2.6"/>
          <text x="${leftCenter}" y="333" text-anchor="middle"
            font-family='${fonts.mono}' font-size="20.5"
            font-weight="800" letter-spacing="2" fill="${colors.stamp}">WC26</text>

          <text x="${rightCenter}" y="68" text-anchor="middle"
            font-family='${fonts.mono}' font-size="16.5"
            font-weight="600" letter-spacing="3" fill="${colors.ink}"
            fill-opacity="0.55">MATCH - POOL</text>
          <text x="${rightCenter}" y="455" text-anchor="middle"
            font-family='${fonts.mono}' font-size="16.5"
            font-weight="600" letter-spacing="3" fill="${colors.ink}"
            fill-opacity="0.55">TWENTY SIX</text>
        `
        : ''
    }

    <text x="${rightCenter}" y="280" text-anchor="middle"
      dominant-baseline="central" font-family='${fonts.display}'
      font-size="${detail === 'minimal' ? 270 : 246}" font-weight="500"
      letter-spacing="-4" fill="${colors.ink}">26</text>
  `
}

function appIconSvg({ size = 512, detail = 'full', maskable = false } = {}) {
  const scale = maskable ? 0.8 : 1
  const offset = (512 - 512 * scale) / 2

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"
      viewBox="0 0 512 512" role="img" aria-label="World Cup 26 Admit One Stub icon">
      <defs>${grainPattern()}</defs>
      ${
        maskable
          ? `
            <rect width="512" height="512" fill="${colors.ticket}"/>
            <rect width="512" height="512" fill="url(#grain-a)"/>
            <rect width="512" height="512" fill="url(#grain-b)"/>
            <g transform="translate(${offset} ${offset}) scale(${scale})">
              ${iconArtwork({ detail })}
            </g>
          `
          : iconArtwork({ detail })
      }
    </svg>
  `)
}

function badgeSvg(size = 96) {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"
      viewBox="0 0 96 96" role="img" aria-label="World Cup 26 notification badge">
      <rect x="8" y="8" width="80" height="80" rx="4" fill="none"
        stroke="#fff" stroke-width="5"/>
      <line x1="36.5" y1="8" x2="36.5" y2="88" stroke="#fff"
        stroke-width="4" stroke-linecap="round" stroke-dasharray="5 6"/>
      <text x="61" y="55" text-anchor="middle" dominant-baseline="central"
        font-family='${fonts.display}' font-size="40"
        font-weight="500" letter-spacing="-1" fill="#fff">26</text>
    </svg>
  `)
}

async function writePng(size, output, svg) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(output)

  console.log(`Wrote ${output}`)
}

writeFileSync(
  './docs/design/generated-app-icons/app-icon-source.svg',
  `${appIconSvg({ size: 1024, detail: 'full' }).toString().replace(/[ \t]+$/gm, '').trimEnd()}\n`,
)

await writePng(512, './public/logo.png', appIconSvg({ size: 512, detail: 'full' }))
await writePng(512, './public/icon-512.png', appIconSvg({ size: 512, detail: 'full' }))
await writePng(512, './public/maskable-icon-512.png', appIconSvg({ size: 512, detail: 'full', maskable: true }))
await writePng(192, './public/icon-192.png', appIconSvg({ size: 192, detail: 'full' }))
await writePng(180, './public/apple-touch-icon.png', appIconSvg({ size: 180, detail: 'full' }))
await writePng(32, './public/favicon-32.png', appIconSvg({ size: 32, detail: 'minimal' }))
await writePng(96, './public/badge-icon.png', badgeSvg(96))

console.log('Icons generated.')
