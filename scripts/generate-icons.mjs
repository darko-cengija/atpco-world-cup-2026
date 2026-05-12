import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('./public', { recursive: true })

const appBackground = '#0a1628'
const cardBackground = '#111c31'
const accent = '#facc15'
const white = '#ffffff'

function brandSvg(size, { background = 'transparent', maskable = false, badge = false } = {}) {
  const bg = background === 'transparent'
    ? ''
    : `<rect width="512" height="512" rx="${maskable ? 0 : 96}" fill="${background}"/>`

  if (badge) {
    return Buffer.from(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
        ${bg}
        <circle cx="256" cy="256" r="174" fill="${cardBackground}" stroke="${accent}" stroke-width="28"/>
        <text x="256" y="294" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="142" font-weight="900" fill="${white}">26</text>
      </svg>
    `)
  }

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
      ${bg}
      <circle cx="154" cy="156" r="74" fill="${cardBackground}" stroke="${accent}" stroke-width="18"/>
      <path d="M154 87l22 45 50 7-36 35 9 50-45-24-45 24 9-50-36-35 50-7z" fill="${white}" opacity="0.96"/>
      <text x="256" y="318" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="132" font-weight="900" letter-spacing="0" fill="${white}">WC</text>
      <text x="256" y="414" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="112" font-weight="900" letter-spacing="0" fill="${accent}">26</text>
    </svg>
  `)
}

async function writePng(size, output, options) {
  await sharp(brandSvg(size, options))
    .resize(size, size)
    .png()
    .toFile(output)

  console.log(`✓ ${output}`)
}

await writePng(512, './public/logo.png')
await writePng(512, './public/icon-512.png', { background: appBackground })
await writePng(512, './public/maskable-icon-512.png', { background: appBackground, maskable: true })
await writePng(192, './public/icon-192.png', { background: appBackground })
await writePng(180, './public/apple-touch-icon.png', { background: appBackground })
await writePng(32, './public/favicon-32.png', { background: appBackground })
await writePng(96, './public/badge-icon.png', { badge: true })

console.log('Icons generated.')
