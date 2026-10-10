import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, PayoutStatus, PropertyStatus } from '@prisma/client';

export type PaymentState = 'PENDING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
export type KycState =
  'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
export type WithdrawalState =
  'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export class DomainStateMachine {
  // 1. Booking State Transitions
  private static readonly BOOKING_TRANSITIONS: Record<
    BookingStatus,
    BookingStatus[]
  > = {
    [BookingStatus.PENDING_PAYMENT]: [
      BookingStatus.CONFIRMED,
      BookingStatus.PENDING_HOST_APPROVAL,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.PENDING_HOST_APPROVAL]: [
      BookingStatus.CONFIRMED,
      BookingStatus.CANCELLED,
    ],
    [BookingStatus.CONFIRMED]: [
      BookingStatus.CANCELLED,
      BookingStatus.COMPLETED,
    ],
    [BookingStatus.CANCELLED]: [], // Terminal state
    [BookingStatus.COMPLETED]: [], // Terminal state
  };

  // 2. Payment State Transitions
  private static readonly PAYMENT_TRANSITIONS: Record<
    PaymentState,
    PaymentState[]
  > = {
    PENDING: ['CAPTURED', 'FAILED'],
    CAPTURED: ['REFUNDED'],
    FAILED: [],
    REFUNDED: [],
  };

  // 3. Payout & Host Earning State Transitions
  private static readonly PAYOUT_TRANSITIONS: Record<
    PayoutStatus,
    PayoutStatus[]
  > = {
    [PayoutStatus.PENDING]: [PayoutStatus.ELIGIBLE, PayoutStatus.ON_HOLD],
    [PayoutStatus.ELIGIBLE]: [PayoutStatus.PROCESSING, PayoutStatus.ON_HOLD],
    [PayoutStatus.PROCESSING]: [PayoutStatus.COMPLETED, PayoutStatus.ON_HOLD],
    [PayoutStatus.ON_HOLD]: [PayoutStatus.ELIGIBLE, PayoutStatus.PROCESSING],
    [PayoutStatus.COMPLETED]: [], // Terminal
  };

  // 4. KYC State Transitions
  private static readonly KYC_TRANSITIONS: Record<KycState, KycState[]> = {
    UNVERIFIED: ['PENDING_REVIEW', 'VERIFIED', 'REJECTED'],
    PENDING_REVIEW: ['VERIFIED', 'REJECTED'],
    VERIFIED: ['REJECTED'], // Revocation by admin
    REJECTED: ['PENDING_REVIEW'], // Host re-applies
  };

  // 5. Property State Transitions
  private static readonly PROPERTY_TRANSITIONS: Record<
    PropertyStatus,
    PropertyStatus[]
  > = {
    [PropertyStatus.DRAFT]: [PropertyStatus.PENDING_REVIEW],
    [PropertyStatus.PENDING_REVIEW]: [
      PropertyStatus.ACTIVE,
      PropertyStatus.REJECTED,
      PropertyStatus.DRAFT,
    ],
    [PropertyStatus.ACTIVE]: [PropertyStatus.PAUSED, PropertyStatus.REJECTED],
    [PropertyStatus.PAUSED]: [
      PropertyStatus.ACTIVE,
      PropertyStatus.REJECTED,
      PropertyStatus.PENDING_REVIEW,
    ],
    [PropertyStatus.REJECTED]: [
      PropertyStatus.PENDING_REVIEW,
      PropertyStatus.DRAFT,
    ],
  };

  /**
   * Validate and assert booking state transition
   */
  static assertBookingTransition(from: BookingStatus, to: BookingStatus): void {
    if (from === to) return; // Idempotent no-op
    const allowed = this.BOOKING_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Illegal booking state transition: Cannot transition from ${from} to ${to}. Allowed transitions: [${allowed.join(', ')}]`,
      );
    }
  }

  /**
   * Validate and assert payment state transition
   */
  static assertPaymentTransition(from: PaymentState, to: PaymentState): void {
    if (from === to) return;
    const allowed = this.PAYMENT_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Illegal payment state transition: Cannot transition from ${from} to ${to}. Allowed transitions: [${allowed.join(', ')}]`,
      );
    }
  }

  /**
   * Validate and assert payout state transition
   */
  static assertPayoutTransition(from: PayoutStatus, to: PayoutStatus): void {
    if (from === to) return;
    const allowed = this.PAYOUT_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Illegal payout state transition: Cannot transition from ${from} to ${to}. Allowed transitions: [${allowed.join(', ')}]`,
      );
    }
  }

  /**
   * Validate and assert property state transition
   */
  static assertPropertyTransition(
    from: PropertyStatus,
    to: PropertyStatus,
    isAdmin: boolean = false,
  ): void {
    if (from === to) return;
    const allowed = this.PROPERTY_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Illegal property state transition: Cannot transition from ${from} to ${to}. Allowed transitions: [${allowed.join(', ')}]`,
      );
    }
    // Only admins can approve property to ACTIVE or mark REJECTED
    if (
      (to === PropertyStatus.ACTIVE || to === PropertyStatus.REJECTED) &&
      !isAdmin
    ) {
      throw new ForbiddenException(
        `Only administrators can transition a property to ${to}. Hosts must submit for review.`,
      );
    }
  }

  /**
   * Check if booking status is terminal
   */
  static isTerminalBookingStatus(status: BookingStatus): boolean {
    return (this.BOOKING_TRANSITIONS[status] || []).length === 0;
  }

  /**
   * Check if booking transition is allowed
   */
  static canTransitionBooking(from: BookingStatus, to: BookingStatus): boolean {
    if (from === to) return true;
    return (this.BOOKING_TRANSITIONS[from] || []).includes(to);
  }

  /**
   * Check if payment transition is allowed
   */
  static canTransitionPayment(from: PaymentState, to: PaymentState): boolean {
    if (from === to) return true;
    return (this.PAYMENT_TRANSITIONS[from] || []).includes(to);
  }

  /**
   * Check if payout transition is allowed
   */
  static canTransitionPayout(from: PayoutStatus, to: PayoutStatus): boolean {
    if (from === to) return true;
    return (this.PAYOUT_TRANSITIONS[from] || []).includes(to);
  }

  /**
   * Check if property transition is allowed
   */
  static canTransitionProperty(
    from: PropertyStatus,
    to: PropertyStatus,
  ): boolean {
    if (from === to) return true;
    return (this.PROPERTY_TRANSITIONS[from] || []).includes(to);
  }

  /**
   * Check if KYC transition is allowed
   */
  static canTransitionKyc(from: KycState, to: KycState): boolean {
    if (from === to) return true;
    return (this.KYC_TRANSITIONS[from] || []).includes(to);
  }

  /**
   * Validate and assert KYC state transition
   */
  static assertKycTransition(from: KycState, to: KycState): void {
    if (from === to) return;
    const allowed = this.KYC_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Illegal KYC state transition: Cannot transition from ${from} to ${to}. Allowed transitions: [${allowed.join(', ')}]`,
      );
    }
  }
}
