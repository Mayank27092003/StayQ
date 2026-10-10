import { DomainStateMachine } from './domain-state-machines';
import { BadRequestException } from '@nestjs/common';
import { BookingStatus, PayoutStatus, PropertyStatus } from '@prisma/client';

describe('DomainStateMachine (Security & Invariant Tests)', () => {
  describe('Booking State Transitions', () => {
    it('allows valid transition PENDING_PAYMENT -> CONFIRMED', () => {
      expect(
        DomainStateMachine.canTransitionBooking(
          BookingStatus.PENDING_PAYMENT,
          BookingStatus.CONFIRMED,
        ),
      ).toBe(true);
      expect(() =>
        DomainStateMachine.assertBookingTransition(
          BookingStatus.PENDING_PAYMENT,
          BookingStatus.CONFIRMED,
        ),
      ).not.toThrow();
    });

    it('allows valid transition PENDING_PAYMENT -> CANCELLED', () => {
      expect(
        DomainStateMachine.canTransitionBooking(
          BookingStatus.PENDING_PAYMENT,
          BookingStatus.CANCELLED,
        ),
      ).toBe(true);
      expect(() =>
        DomainStateMachine.assertBookingTransition(
          BookingStatus.PENDING_PAYMENT,
          BookingStatus.CANCELLED,
        ),
      ).not.toThrow();
    });

    it('allows valid transition CONFIRMED -> COMPLETED', () => {
      expect(
        DomainStateMachine.canTransitionBooking(
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
        ),
      ).toBe(true);
      expect(() =>
        DomainStateMachine.assertBookingTransition(
          BookingStatus.CONFIRMED,
          BookingStatus.COMPLETED,
        ),
      ).not.toThrow();
    });

    it('prevents illegal resurrection of CANCELLED booking to CONFIRMED', () => {
      expect(
        DomainStateMachine.canTransitionBooking(
          BookingStatus.CANCELLED,
          BookingStatus.CONFIRMED,
        ),
      ).toBe(false);
      expect(() =>
        DomainStateMachine.assertBookingTransition(
          BookingStatus.CANCELLED,
          BookingStatus.CONFIRMED,
        ),
      ).toThrow(BadRequestException);
    });

    it('prevents illegal modification of terminal COMPLETED booking', () => {
      expect(
        DomainStateMachine.isTerminalBookingStatus(BookingStatus.COMPLETED),
      ).toBe(true);
      expect(
        DomainStateMachine.canTransitionBooking(
          BookingStatus.COMPLETED,
          BookingStatus.PENDING_PAYMENT,
        ),
      ).toBe(false);
      expect(() =>
        DomainStateMachine.assertBookingTransition(
          BookingStatus.COMPLETED,
          BookingStatus.PENDING_PAYMENT,
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('Payment State Transitions', () => {
    it('allows PENDING -> CAPTURED', () => {
      expect(
        DomainStateMachine.canTransitionPayment('PENDING', 'CAPTURED'),
      ).toBe(true);
      expect(() =>
        DomainStateMachine.assertPaymentTransition('PENDING', 'CAPTURED'),
      ).not.toThrow();
    });

    it('allows CAPTURED -> REFUNDED', () => {
      expect(
        DomainStateMachine.canTransitionPayment('CAPTURED', 'REFUNDED'),
      ).toBe(true);
    });

    it('rejects FAILED -> CAPTURED directly without re-initiation', () => {
      expect(
        DomainStateMachine.canTransitionPayment('FAILED', 'CAPTURED'),
      ).toBe(false);
      expect(() =>
        DomainStateMachine.assertPaymentTransition('FAILED', 'CAPTURED'),
      ).toThrow(BadRequestException);
    });
  });

  describe('KYC State Transitions', () => {
    it('allows UNVERIFIED -> PENDING_REVIEW -> VERIFIED', () => {
      expect(
        DomainStateMachine.canTransitionKyc('UNVERIFIED', 'PENDING_REVIEW'),
      ).toBe(true);
      expect(
        DomainStateMachine.canTransitionKyc('PENDING_REVIEW', 'VERIFIED'),
      ).toBe(true);
    });

    it('prevents skipping PENDING_REVIEW from REJECTED directly to VERIFIED', () => {
      expect(DomainStateMachine.canTransitionKyc('REJECTED', 'VERIFIED')).toBe(
        false,
      );
      expect(() =>
        DomainStateMachine.assertKycTransition('REJECTED', 'VERIFIED'),
      ).toThrow(BadRequestException);
    });
  });

  describe('Payout State Transitions', () => {
    it('follows strict linear lifecycle: PENDING -> ELIGIBLE -> PROCESSING -> COMPLETED', () => {
      expect(
        DomainStateMachine.canTransitionPayout(
          PayoutStatus.PENDING,
          PayoutStatus.ELIGIBLE,
        ),
      ).toBe(true);
      expect(
        DomainStateMachine.canTransitionPayout(
          PayoutStatus.ELIGIBLE,
          PayoutStatus.PROCESSING,
        ),
      ).toBe(true);
      expect(
        DomainStateMachine.canTransitionPayout(
          PayoutStatus.PROCESSING,
          PayoutStatus.COMPLETED,
        ),
      ).toBe(true);
    });

    it('rejects jumping from PENDING directly to COMPLETED', () => {
      expect(
        DomainStateMachine.canTransitionPayout(
          PayoutStatus.PENDING,
          PayoutStatus.COMPLETED,
        ),
      ).toBe(false);
      expect(() =>
        DomainStateMachine.assertPayoutTransition(
          PayoutStatus.PENDING,
          PayoutStatus.COMPLETED,
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('Property State Transitions', () => {
    it('allows DRAFT -> PENDING_REVIEW', () => {
      expect(
        DomainStateMachine.canTransitionProperty(
          PropertyStatus.DRAFT,
          PropertyStatus.PENDING_REVIEW,
        ),
      ).toBe(true);
      expect(() =>
        DomainStateMachine.assertPropertyTransition(
          PropertyStatus.DRAFT,
          PropertyStatus.PENDING_REVIEW,
          false,
        ),
      ).not.toThrow();
    });

    it('allows PENDING_REVIEW -> ACTIVE for admin', () => {
      expect(
        DomainStateMachine.canTransitionProperty(
          PropertyStatus.PENDING_REVIEW,
          PropertyStatus.ACTIVE,
        ),
      ).toBe(true);
      expect(() =>
        DomainStateMachine.assertPropertyTransition(
          PropertyStatus.PENDING_REVIEW,
          PropertyStatus.ACTIVE,
          true,
        ),
      ).not.toThrow();
    });

    it('rejects PENDING_REVIEW -> ACTIVE for non-admin', () => {
      expect(() =>
        DomainStateMachine.assertPropertyTransition(
          PropertyStatus.PENDING_REVIEW,
          PropertyStatus.ACTIVE,
          false,
        ),
      ).toThrow();
    });

    it('rejects invalid direct transition DRAFT -> ACTIVE', () => {
      expect(
        DomainStateMachine.canTransitionProperty(
          PropertyStatus.DRAFT,
          PropertyStatus.ACTIVE,
        ),
      ).toBe(false);
      expect(() =>
        DomainStateMachine.assertPropertyTransition(
          PropertyStatus.DRAFT,
          PropertyStatus.ACTIVE,
          true,
        ),
      ).toThrow();
    });

    it('allows ACTIVE -> PAUSED for host and admin', () => {
      expect(
        DomainStateMachine.canTransitionProperty(
          PropertyStatus.ACTIVE,
          PropertyStatus.PAUSED,
        ),
      ).toBe(true);
      expect(() =>
        DomainStateMachine.assertPropertyTransition(
          PropertyStatus.ACTIVE,
          PropertyStatus.PAUSED,
          false,
        ),
      ).not.toThrow();
    });
  });
});
