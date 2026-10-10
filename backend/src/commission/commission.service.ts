import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export interface CommissionSettingsDto {
  guestServiceFeePercent: number;
  hostCommissionPercent: number;
  experienceCommissionPercent: number;
  zeroBrokerageAgreementFee: number;
  monthlyRentProtectionPercent: number;
  gstRatePercent: number;
  tdsRatePercent: number;
  payoutEscrowHours: number;
}
// Application defaults are configurable merchant settings, not a determination of tax obligations.
export const DEFAULT_COMMISSION_SETTINGS: CommissionSettingsDto = {
  guestServiceFeePercent: 10,
  hostCommissionPercent: 3,
  experienceCommissionPercent: 15,
  zeroBrokerageAgreementFee: 1999,
  monthlyRentProtectionPercent: 1.5,
  gstRatePercent: 18,
  tdsRatePercent: 1,
  payoutEscrowHours: 24,
};
export function commissionRules(input: any): CommissionSettingsDto {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new BadRequestException('Invalid commission rules');
  const result = { ...DEFAULT_COMMISSION_SETTINGS };
  for (const [key, v] of Object.entries(input)) {
    if (
      !(key in result) ||
      typeof v !== 'number' ||
      !Number.isFinite(v) ||
      v < 0 ||
      v >
        (key === 'zeroBrokerageAgreementFee'
          ? 100000
          : key === 'payoutEscrowHours'
            ? 720
            : 100)
    )
      throw new BadRequestException('Invalid commission setting: ' + key);
    result[key] = v;
  }
  if (result.hostCommissionPercent + result.tdsRatePercent > 100)
    throw new BadRequestException('Host deductions cannot exceed 100%');
  return result;
}
@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}
  async getSettings(): Promise<CommissionSettingsDto> {
    try {
      const s = await this.prisma.adminSetting.findUnique({
        where: { key: 'commission.rules' },
      });
      return s
        ? commissionRules(JSON.parse(s.value))
        : { ...DEFAULT_COMMISSION_SETTINGS };
    } catch {
      throw new ServiceUnavailableException(
        'Commission rules are unavailable; pricing has been paused',
      );
    }
  }
  async updateSettings(dto: Partial<CommissionSettingsDto>) {
    const updated = commissionRules({ ...(await this.getSettings()), ...dto });
    await this.prisma.adminSetting.upsert({
      where: { key: 'commission.rules' },
      create: {
        key: 'commission.rules',
        value: JSON.stringify(updated),
        valueType: 'JSON',
        group: 'financials',
        label: 'Commission rules',
      },
      update: { value: JSON.stringify(updated) },
    });
    return updated;
  }
}
