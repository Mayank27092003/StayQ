import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { request } from 'https';
export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && [0, 168].includes(b)) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && [18, 19].includes(b))
    );
  }
  if (isIP(address) === 6)
    return /^[23][0-9a-f]{3}:/i.test(address) && !/^2001:db8:/i.test(address);
  return false;
}
export async function safeDownload(
  value: string,
  allowedHosts: string[],
  maxBytes = 2 * 1024 * 1024,
): Promise<Buffer> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('Invalid remote URL');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    !allowedHosts.includes(url.hostname.toLowerCase())
  )
    throw new BadRequestException(
      'Remote host must be an explicitly configured HTTPS provider',
    );
  const addresses = await lookup(url.hostname, { all: true }).catch(() => {
    throw new ServiceUnavailableException('Remote provider cannot be resolved');
  });
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new BadRequestException(
      'Remote URL resolves to a private or reserved address',
    );
  const resolved = addresses[0];
  return new Promise((resolve, reject) => {
    // Pin DNS resolution to the validated address. Redirects are never followed.
    const req = request(
      url,
      {
        method: 'GET',
        lookup: ((_host: any, options: any, callback: any) =>
          options?.all
            ? callback(null, [resolved])
            : callback(null, resolved.address, resolved.family)) as any,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(
            new ServiceUnavailableException(
              'Remote provider returned an unavailable resource',
            ),
          );
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy();
            reject(
              new BadRequestException('Remote file exceeds the allowed size'),
            );
          } else chunks.push(chunk);
        });
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () =>
          reject(new ServiceUnavailableException('Remote download failed')),
        );
      },
    );
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new ServiceUnavailableException('Remote download timed out'));
    });
    req.on('error', () =>
      reject(new ServiceUnavailableException('Remote download failed')),
    );
    req.end();
  });
}
