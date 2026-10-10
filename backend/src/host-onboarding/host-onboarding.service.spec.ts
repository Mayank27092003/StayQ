import { PropertiesService } from '../properties/properties.service';
import { Test, TestingModule } from '@nestjs/testing';
import { HostOnboardingService } from './host-onboarding.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HostOnboardingService', () => {
  let service: HostOnboardingService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      property: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      hostPayoutAccount: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HostOnboardingService,
        { provide: PropertiesService, useValue: {} },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<HostOnboardingService>(HostOnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
