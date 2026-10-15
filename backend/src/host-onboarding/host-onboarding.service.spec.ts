import { PropertiesService } from '../properties/properties.service';
import { Test, TestingModule } from '@nestjs/testing';
import { HostOnboardingService } from './host-onboarding.service';
import { PrismaService } from '../prisma/prisma.service';

import { EmailService } from '../notifications/email.service';
import { NotificationsService } from '../notifications/notifications.service';

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
      user: {
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
        {
          provide: EmailService,
          useValue: {
            sendHostApplicationReceivedEmail: jest.fn().mockResolvedValue(true),
            sendNewHostAdminAlert: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendNotification: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<HostOnboardingService>(HostOnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
