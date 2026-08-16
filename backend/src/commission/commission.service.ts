import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CommissionSettingsDto {
  guestServiceFeePercent: number; // e.g. 10
  hostCommissionPercent: number; // e.g. 3
  experienceCommissionPercent: number; // e.g. 15
  zeroBrokerageAgreementFee: number; // e.g. 1999
  monthlyRentProtectionPercent: number; // e.g. 1.5
  gstRatePercent: number; // e.g. 18
  tdsRatePercent: number; // e.g. 1
  payoutEscrowHours: number; // e.g. 24
}

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

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);
  private cachedSettings: CommissionSettingsDto | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 3000; // 3 second cache for instant reflection

  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<CommissionSettingsDto> {
    const now = Date.now();
    if (this.cachedSettings && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedSettings;
    }

    try {
      const setting = await this.prisma.adminSetting.findUnique({
        where: { key: 'commission.rules' },
      });

      if (setting && setting.value) {
        const parsed = JSON.parse(setting.value);
        const resolved: CommissionSettingsDto = { ...DEFAULT_COMMISSION_SETTINGS, ...parsed };
        this.cachedSettings = resolved;
        this.lastFetchTime = now;
        return resolved;
      }
    } catch (e) {
      this.logger.warn('Error reading commission settings, fallback to defaults:', e);
    }

    const fallback: CommissionSettingsDto = { ...DEFAULT_COMMISSION_SETTINGS };
    this.cachedSettings = fallback;
    this.lastFetchTime = now;
    return fallback;
  }

  async updateSettings(dto: Partial<CommissionSettingsDto>): Promise<CommissionSettingsDto> {
    const current = await this.getSettings();
    const updated: CommissionSettingsDto = {
      ...current,
      ...dto,
      guestServiceFeePercent: Number(dto.guestServiceFeePercent ?? current.guestServiceFeePercent),
      hostCommissionPercent: Number(dto.hostCommissionPercent ?? current.hostCommissionPercent),
      experienceCommissionPercent: Number(dto.experienceCommissionPercent ?? current.experienceCommissionPercent),
      zeroBrokerageAgreementFee: Number(dto.zeroBrokerageAgreementFee ?? current.zeroBrokerageAgreementFee),
      monthlyRentProtectionPercent: Number(dto.monthlyRentProtectionPercent ?? current.monthlyRentProtectionPercent),
      gstRatePercent: Number(dto.gstRatePercent ?? current.gstRatePercent),
      tdsRatePercent: Number(dto.tdsRatePercent ?? current.tdsRatePercent),
      payoutEscrowHours: Number(dto.payoutEscrowHours ?? current.payoutEscrowHours),
    };

    await this.prisma.adminSetting.upsert({
      where: { key: 'commission.rules' },
      create: {
        key: 'commission.rules',
        value: JSON.stringify(updated),
        valueType: 'JSON',
        group: 'financials',
        label: 'Platform Commission & Fee Rules',
        description: 'Controls guest service fee %, host commission %, TDS, GST, and escrow payout duration.',
      },
      update: {
        value: JSON.stringify(updated),
        updatedAt: new Date(),
      },
    });

    // Invalidate cache immediately so new calculations reflect right away
    this.cachedSettings = updated;
    this.lastFetchTime = Date.now();
    this.logger.log(`Commission settings updated live: ${JSON.stringify(updated)}`);

    return updated;
  }
}
