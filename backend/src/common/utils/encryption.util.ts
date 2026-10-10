import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ServiceUnavailableException } from '@nestjs/common';
function key() {
  const value = Buffer.from(process.env.DATA_ENCRYPTION_KEY || '', 'base64');
  if (value.length !== 32)
    throw new ServiceUnavailableException(
      'Sensitive-data encryption is not configured',
    );
  return value;
}
export function encryptSensitive(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `enc:v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${data.toString('base64')}`;
}
export function decryptSensitive(value: string): string {
  if (!value.startsWith('enc:v1:')) return value; // Legacy rows are migrated by the explicit encryption maintenance command.
  const [, , iv, tag, data] = value.split(':');
  const cipher = createDecipheriv(
    'aes-256-gcm',
    key(),
    Buffer.from(iv, 'base64'),
  );
  cipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([
    cipher.update(Buffer.from(data, 'base64')),
    cipher.final(),
  ]).toString('utf8');
}
