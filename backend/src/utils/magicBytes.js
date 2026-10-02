/**
 * Validates image buffer magic bytes for JPEG, PNG, and WebP
 */
export function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) {
    return { valid: false, mimeType: null };
  }

  // JPEG magic bytes: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: 'image/jpeg' };
  }

  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mimeType: 'image/png' };
  }

  // WebP magic bytes: RIFF .... WEBP
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isRiff && isWebp) {
    return { valid: true, mimeType: 'image/webp' };
  }

  return { valid: false, mimeType: null };
}

/**
 * Strips EXIF metadata from JPEG buffers
 */
export function stripExifMetadata(buffer) {
  // Simple clean buffer copy ensuring transient memory isolation
  // For production JPEG, if APP1 (0xFF 0xE1) marker exists, we slice or replace
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 4) {
      if (buffer[offset] === 0xff && buffer[offset + 1] === 0xe1) {
        // Found EXIF APP1 marker
        const length = (buffer[offset + 2] << 8) + buffer[offset + 3];
        // Strip marker segment
        return Buffer.concat([
          buffer.subarray(0, offset),
          buffer.subarray(offset + 2 + length)
        ]);
      }
      offset++;
    }
  }
  return buffer;
}
