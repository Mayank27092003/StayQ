jest.mock('../common/guards/firebase-auth.guard', () => ({
  FirebaseAuthGuard: class {
    canActivate() {
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { HostOnboardingController } from './host-onboarding.controller';
import { HostOnboardingService } from './host-onboarding.service';

describe('HostOnboardingController', () => {
  let controller: HostOnboardingController;
  let service: Partial<HostOnboardingService>;

  beforeEach(async () => {
    service = {
      createDraft: jest.fn(),
      updateStep: jest.fn(),
      setRooms: jest.fn(),
      submitProperty: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HostOnboardingController],
      providers: [{ provide: HostOnboardingService, useValue: service }],
    }).compile();

    controller = module.get<HostOnboardingController>(HostOnboardingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
