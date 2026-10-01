jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => [{ name: '[DEFAULT]' }]),
  initializeApp: jest.fn(),
}));

import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminGuard } from '../../src/admin/guards/admin.guard';
import { FirebaseAuthGuard } from '../../src/common/guards/firebase-auth.guard';
import { BookingsService } from '../../src/bookings/bookings.service';
import { PropertiesService } from '../../src/properties/properties.service';
import { PropertiesBoostService } from '../../src/properties/boost/properties-boost.service';
import { ExperiencesService } from '../../src/experiences/experiences.service';
import { LeasesService } from '../../src/leases/leases.service';

describe('BRUTAL SECURITY SUITE 1: Authentication & IDOR Protection', () => {
  describe('1. Backdoor Elimination & Auth Guard', () => {
    let authGuard: FirebaseAuthGuard;
    const mockFirebaseService: any = {
      verifyIdToken: jest.fn(),
    };
    const mockReflector: any = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };

    beforeEach(() => {
      authGuard = new FirebaseAuthGuard(mockFirebaseService, mockReflector);
      jest.clearAllMocks();
    });

    it('FATAL REJECTION: Request with legacy x-admin-key header MUST be rejected with 401', async () => {
      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-admin-key': 'stayq-admin-secret-2026',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('REJECTION: Request with missing Authorization header MUST be rejected with 401', async () => {
      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('REJECTION: Malformed Bearer token MUST be rejected with 401', async () => {
      mockFirebaseService.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid.forged.token',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      await expect(authGuard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('2. AdminGuard Privilege Escalation Prevention', () => {
    let adminGuard: AdminGuard;

    beforeEach(() => {
      adminGuard = new AdminGuard();
    });

    it('REJECTION: Regular user (isAdmin: false) MUST be blocked with 403 Forbidden', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'regular-user-123', isAdmin: false, role: 'GUEST' },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('REJECTION: Unauthenticated or missing user MUST be blocked with 403 Forbidden', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: null,
          }),
        }),
      } as unknown as ExecutionContext;

      expect(() => adminGuard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('SUCCESS: Verified Admin user (isAdmin: true) MUST be granted access', () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'admin-super-999', isAdmin: true, role: 'SUPER_ADMIN' },
          }),
        }),
      } as unknown as ExecutionContext;

      expect(adminGuard.canActivate(mockContext)).toBe(true);
    });
  });

  describe('3. Booking IDOR Protection (Door PIN, WiFi & Ticket Access)', () => {
    let bookingsService: BookingsService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        booking: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
      };
      bookingsService = new BookingsService(
        mockPrisma,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );
    });

    it('IDOR ATTACK BLOCKED: User A cannot read User B door lock PIN or WiFi credentials', async () => {
      const victimBooking = {
        id: 'booking-victim-111',
        guestId: 'victim-guest-id',
        confirmationCode: 'SQ-998877',
        property: {
          id: 'prop-xyz',
          hostId: 'host-owner-id',
          title: 'Luxury Villa',
        },
      };
      mockPrisma.booking.findUnique.mockResolvedValue(victimBooking);

      const attackerUser = { id: 'attacker-user-id', isAdmin: false };

      await expect(
        bookingsService.getAccessDetails('booking-victim-111', attackerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('IDOR ATTACK BLOCKED: User A cannot cancel User B booking', async () => {
      const victimBooking = {
        id: 'booking-victim-111',
        guestId: 'victim-guest-id',
        status: 'CONFIRMED',
      };
      mockPrisma.booking.findUnique.mockResolvedValue(victimBooking);

      const attackerUser = { id: 'attacker-user-id', isAdmin: false };

      await expect(
        bookingsService.cancelBooking('booking-victim-111', 'Malicious cancellation', attackerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('AUTHORIZATION SUCCESS: The actual guest CAN cancel their own booking', async () => {
      const guestBooking = {
        id: 'booking-guest-111',
        guestId: 'my-guest-id',
        status: 'CONFIRMED',
      };
      mockPrisma.booking.findUnique.mockResolvedValue(guestBooking);
      mockPrisma.booking.update.mockResolvedValue({ ...guestBooking, status: 'CANCELLED' });

      const legitimateGuest = { id: 'my-guest-id', isAdmin: false };

      const result = await bookingsService.cancelBooking('booking-guest-111', 'Change of plans', legitimateGuest);
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('4. Property IDOR Protection (Host Property Tampering)', () => {
    let propertiesService: PropertiesService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        property: {
          findUnique: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      };
      propertiesService = new PropertiesService(mockPrisma);
    });

    it('IDOR ATTACK BLOCKED: Host A cannot update Host B property', async () => {
      const victimProperty = {
        id: 'prop-victim-555',
        hostId: 'legit-host-id',
        title: 'Original Title',
      };
      mockPrisma.property.findUnique.mockResolvedValue(victimProperty);

      const attackerHost = { id: 'attacker-host-999', isAdmin: false };

      await expect(
        propertiesService.update('prop-victim-555', { title: 'Hacked Property' }, attackerHost),
      ).rejects.toThrow(ForbiddenException);
    });

    it('IDOR ATTACK BLOCKED: Host A cannot delete Host B property', async () => {
      const victimProperty = {
        id: 'prop-victim-555',
        hostId: 'legit-host-id',
      };
      mockPrisma.property.findUnique.mockResolvedValue(victimProperty);

      const attackerHost = { id: 'attacker-host-999', isAdmin: false };

      await expect(
        propertiesService.remove('prop-victim-555', attackerHost),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Lease Agreement IDOR Protection', () => {
    let leasesService: LeasesService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        leaseAgreement: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
      };
      leasesService = new LeasesService(mockPrisma);
    });

    it('IDOR ATTACK BLOCKED: Non-participant cannot generate or download confidential lease PDF', async () => {
      const confidentialLease = {
        id: 'lease-999',
        booking: {
          guestId: 'tenant-user-id',
          property: {
            hostId: 'landlord-user-id',
          },
        },
      };
      mockPrisma.leaseAgreement.findUnique.mockResolvedValue(confidentialLease);

      const snoopingUser = { id: 'unrelated-snooper-id', isAdmin: false };

      await expect(
        leasesService.generateLeasePdf('lease-999', snoopingUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
