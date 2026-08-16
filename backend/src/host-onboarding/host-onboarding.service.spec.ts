import { Test, TestingModule } from '@nestjs/testing';
import { HostOnboardingService } from './host-onboarding.service';

describe('HostOnboardingService', () => {
  let service: HostOnboardingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HostOnboardingService],
    }).compile();

    service = module.get<HostOnboardingService>(HostOnboardingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
