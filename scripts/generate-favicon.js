const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const inputPath = path.join(__dirname, '../public/logo.png');
  const publicDir = path.join(__dirname, '../public');
  const appDir = path.join(__dirname, '../src/app');

  console.log('Generating favicons from:', inputPath);

  // Favicon 32x32 PNG
  await sharp(inputPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✓ favicon-32x32.png');

  // Favicon 16x16 PNG
  await sharp(inputPath)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✓ favicon-16x16.png');

  // Apple Touch Icon 180x180
  await sharp(inputPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  // Icon for app directory (Next.js convention)
  await sharp(inputPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(appDir, 'icon.png'));
  console.log('✓ src/app/icon.png');

  // Apple icon for app directory
  await sharp(inputPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('✓ src/app/apple-icon.png');

  // Create a simple favicon.ico (using 32x32 PNG as base)
  // Note: This creates a PNG renamed to .ico which works in most browsers
  await sharp(inputPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(appDir, 'favicon.ico'));
  console.log('✓ src/app/favicon.ico');

  console.log('\n✅ All favicons generated!');
}

generateFavicons().catch(console.error);




