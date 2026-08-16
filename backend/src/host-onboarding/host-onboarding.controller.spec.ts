import { Test, TestingModule } from '@nestjs/testing';
import { HostOnboardingController } from './host-onboarding.controller';

describe('HostOnboardingController', () => {
  let controller: HostOnboardingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HostOnboardingController],
    }).compile();

    controller = module.get<HostOnboardingController>(HostOnboardingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
