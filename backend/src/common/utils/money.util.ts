import { Prisma } from '@prisma/client';
export class MoneyUtil {
  private static decimal(value: number | string) {
    if (
      (typeof value !== 'number' && typeof value !== 'string') ||
      (typeof value === 'string' && !/^-?\d+(?:\.\d+)?$/.test(value)) ||
      (typeof value === 'number' && !Number.isFinite(value))
    )
      throw new RangeError('Invalid monetary value');
    return new Prisma.Decimal(value);
  }
  static toPaise(value: number | string): number {
    const paise = this.decimal(value)
      .mul(100)
      .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
      .toNumber();
    if (!Number.isSafeInteger(paise))
      throw new RangeError('Money exceeds the safe integer range');
    return paise;
  }
  static toRupees(paise: number): number {
    if (!Number.isSafeInteger(paise))
      throw new RangeError('Paise must be a safe integer');
    return paise / 100;
  }
  static round(value: number | string, decimals = 2): number {
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6)
      throw new RangeError('Invalid decimal places');
    return this.decimal(value)
      .toDecimalPlaces(decimals, Prisma.Decimal.ROUND_HALF_UP)
      .toNumber();
  }
  static add(a: number | string, b: number | string): number {
    return this.toRupees(this.toPaise(a) + this.toPaise(b));
  }
  static subtract(a: number | string, b: number | string): number {
    return this.toRupees(this.toPaise(a) - this.toPaise(b));
  }
  static percentage(value: number | string, percent: number): number {
    return this.decimal(value)
      .mul(this.decimal(percent))
      .div(100)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      .toNumber();
  }
  static isPositiveFinite(value: any): boolean {
    try {
      return this.decimal(value).gt(0);
    } catch {
      return false;
    }
  }
}
