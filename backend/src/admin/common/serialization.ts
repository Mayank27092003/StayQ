import { Prisma } from '@prisma/client';

/**
 * Prisma `Decimal` values serialise to JSON as objects, which breaks numeric
 * formatting in the admin panel. Every monetary field crossing the admin API
 * boundary is converted to a plain number here so one rule governs all money.
 */
export function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

/** Same conversion, substituting 0 for absent values where a total is required. */
export function decimalToNumberOrZero(value: Prisma.Decimal | number | null | undefined): number {
  return decimalToNumber(value) ?? 0;
}

/** Sums a list of Prisma decimals into a plain number. */
export function sumDecimals(values: Array<Prisma.Decimal | number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + decimalToNumberOrZero(value), 0);
}

/** Rounds to two decimal places, avoiding floating-point display artefacts. */
export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Rounds a rate/percentage to one decimal place, or returns null when unknown. */
export function roundRate(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round(value * 10) / 10;
}
