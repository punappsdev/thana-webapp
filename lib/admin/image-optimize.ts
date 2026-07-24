import "server-only";

import sharp from "sharp";

/**
 * Longest-edge cap for stored images. 2000px covers a full-bleed hero on a
 * Retina (2x) display, so downscaling to it is invisible on the web while
 * discarding the excess pixels phone/DSLR originals carry.
 */
export const MAX_IMAGE_DIMENSION = 2000;

/** WebP quality where the result is visually indistinguishable from the source. */
export const WEBP_QUALITY = 85;

/**
 * Re-encodes an uploaded image to a web-optimized WebP before it is written to
 * disk: auto-orients from EXIF (phone photos otherwise land sideways), caps the
 * longest edge at {@link MAX_IMAGE_DIMENSION} without ever enlarging, and drops
 * metadata (smaller file + strips GPS EXIF). Always returns WebP bytes; PNG
 * transparency is preserved. Throws if `input` is not a decodable image.
 */
export async function optimizeImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { failOn: "none", animated: true })
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}
