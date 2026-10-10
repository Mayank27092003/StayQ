import { MoneyUtil } from './money.util';

describe('MoneyUtil (Financial Precision & Invariant Tests)', () => {
  it('correctly converts Rupees to Paise integers without floating point loss', () => {
    expect(MoneyUtil.toPaise(100.5)).toBe(10050);
    expect(MoneyUtil.toPaise(19.99)).toBe(1999);
    expect(MoneyUtil.toPaise(0.01)).toBe(1);
    expect(MoneyUtil.toPaise(0)).toBe(0);
  });

  it('correctly converts Paise integers back to Rupees with 2 decimal places', () => {
    expect(MoneyUtil.toRupees(10050)).toBe(100.5);
    expect(MoneyUtil.toRupees(1999)).toBe(19.99);
    expect(MoneyUtil.toRupees(1)).toBe(0.01);
  });

  it('performs exact addition and subtraction avoiding standard IEEE 754 float drift', () => {
    // 0.1 + 0.2 is 0.30000000000000004 in standard JS float
    const sum = MoneyUtil.add(0.1, 0.2);
    expect(sum).toBe(0.3);

    const diff = MoneyUtil.subtract(100.55, 0.55);
    expect(diff).toBe(100);
  });

  it('calculates percentage accurately with half-up rounding', () => {
    // 18% GST on 1000 = 180
    expect(MoneyUtil.percentage(1000, 18)).toBe(180);

    // 12% on 333.33 = 40
    expect(MoneyUtil.percentage(333.33, 12)).toBe(40);
  });

  it('handles negative or invalid values gracefully', () => {
    expect(MoneyUtil.toPaise(-50)).toBe(-5000);
    expect(() => MoneyUtil.toPaise(NaN)).toThrow(RangeError);
    expect(() => MoneyUtil.toPaise(Infinity)).toThrow(RangeError);
    expect(MoneyUtil.toPaise(1.005)).toBe(101);
    expect(MoneyUtil.isPositiveFinite(-50)).toBe(false);
    expect(MoneyUtil.isPositiveFinite(50)).toBe(true);
  });
});
