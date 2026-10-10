import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';

export function text(value: unknown, name: string, max = 255): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new BadRequestException(
      `${name} must be a non-empty string of at most ${max} characters`,
    );
  return value.trim();
}
export function integer(
  value: unknown,
  name: string,
  min = 0,
  max = 10000,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new BadRequestException(
      `${name} must be an integer between ${min} and ${max}`,
    );
  return value;
}
export function money(
  value: unknown,
  name = 'Amount',
  allowZero = false,
): number {
  const str =
    typeof value === 'number'
      ? String(value)
      : typeof value === 'string'
        ? value
        : '';
  if (!/^\d+(?:\.\d{1,2})?$/.test(str))
    throw new BadRequestException(
      `${name} must be a valid monetary amount with at most two decimal places`,
    );
  const amount = Number(str);
  if (
    !Number.isFinite(amount) ||
    amount < (allowZero ? 0 : 0.01) ||
    amount > 100000000
  )
    throw new BadRequestException(`${name} is outside the allowed range`);
  return Math.round(amount * 100) / 100;
}
export function dateOnly(value: unknown, name: string): Date {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(
      value,
    )
  )
    throw new BadRequestException(`${name} must be an ISO date`);
  if (value.length > 10 && !Number.isFinite(new Date(value).getTime()))
    throw new BadRequestException(`${name} must be a valid ISO timestamp`);
  const day = value.slice(0, 10);
  const date = new Date(`${day}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== day
  )
    throw new BadRequestException(`${name} is not a valid calendar date`);
  return date;
}
export function fingerprint(value: unknown): string {
  const normalize = (v: any): any =>
    Array.isArray(v)
      ? v.map(normalize)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.keys(v)
              .filter((k) => v[k] !== undefined)
              .sort()
              .map((k) => [k, normalize(v[k])]),
          )
        : v;
  return createHash('sha256')
    .update(JSON.stringify(normalize(value)))
    .digest('hex');
}
export function idempotencyKey(value?: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(value))
    throw new BadRequestException('Invalid Idempotency-Key');
  return value;
}

/** Query booleans use explicit strings; invalid values remain invalid for IsBoolean. */
export function queryBoolean(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
