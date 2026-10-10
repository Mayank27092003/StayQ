import { AdminGuard } from '../admin/guards/admin.guard';
import { isOperationsAdmin, isFinanceAdmin } from './authorization.util';
import { publicProperty } from '../properties/property-view.util';
import { propertyInput } from '../properties/property-input.util';
import { isPublicAddress, safeDownload } from './utils/safe-fetch.util';
import { encryptSensitive, decryptSensitive } from './utils/encryption.util';
import { EmailTemplates } from '../notifications/templates/email-templates';
import { dateOnly, money, queryBoolean } from './utils/input.util';
const ctx = (user: any, path: string, method = 'GET') =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user, path, method }) }),
  }) as any;
describe('Security and input regressions', () => {
  it('parses explicit query boolean strings without truthiness coercion', () => {
    expect(queryBoolean('false')).toBe(false);
    expect(queryBoolean('true')).toBe(true);
    expect(queryBoolean('invalid')).toBe('invalid');
  });
  it.each([null, 'MARKETING', 'FINANCE'])(
    'does not grant operations privileges to %s',
    (adminRole) =>
      expect(isOperationsAdmin({ isAdmin: true, adminRole })).toBe(false),
  );
  it('allows only finance roles to access other wallets', () => {
    expect(isFinanceAdmin({ isAdmin: true, adminRole: 'MARKETING' })).toBe(
      false,
    );
    expect(isFinanceAdmin({ isAdmin: true, adminRole: 'FINANCE' })).toBe(true);
  });
  it('denies legacy administrators without explicit roles', () =>
    expect(() =>
      new AdminGuard().canActivate(
        ctx({ isAdmin: true }, '/api/v1/admin/users'),
      ),
    ).toThrow());
  it('restricts refunds and exports by role', () => {
    const guard = new AdminGuard();
    expect(() =>
      guard.canActivate(
        ctx(
          { isAdmin: true, adminRole: 'OPERATIONS' },
          '/api/v1/payments/refund',
          'POST',
        ),
      ),
    ).toThrow();
    expect(() =>
      guard.canActivate(
        ctx({ isAdmin: true, adminRole: 'FINANCE' }, '/api/v1/admin/export'),
      ),
    ).toThrow();
    expect(
      guard.canActivate(
        ctx(
          { isAdmin: true, adminRole: 'FINANCE' },
          '/api/v1/earnings/payout/x/release',
          'POST',
        ),
      ),
    ).toBe(true);
  });
  it('removes nested private metadata from public listings', () => {
    const p = publicProperty({
      address: 'Private',
      city: 'City',
      lat: 10.123,
      lng: 20.987,
      ownerIdProofDocUrl: 'secret',
      wifiPassword: 'secret',
      details: {
        roomDetails: {
          name: 'Room',
          wifiPassword: 'private',
          streetAddress: 'private',
          nested: { accessPin: '1234' },
        },
      },
    });
    expect(p.details.roomDetails).toEqual({ name: 'Room', nested: {} });
    expect(p.ownerIdProofDocUrl).toBeUndefined();
    expect(p.address).toBe('City');
  });
  it('rejects client verification and sponsorship fields', () => {
    expect(() => propertyInput({ propertyDocsVerified: true })).toThrow();
    expect(() => propertyInput({ isSponsored: true })).toThrow();
  });
  it.each([
    '127.0.0.1',
    '10.1.1.1',
    '172.16.1.1',
    '169.254.169.254',
    '192.168.1.1',
    '100.64.1.1',
    '::1',
    'fc00::1',
    '::ffff:127.0.0.1',
    '2001:db8::1',
  ])('rejects private or reserved address %s', (ip) =>
    expect(isPublicAddress(ip)).toBe(false),
  );
  it('rejects unapproved download destinations before fetching', async () => {
    await expect(
      safeDownload('https://example.test/file', []),
    ).rejects.toThrow();
    await expect(
      safeDownload('http://example.test/file', ['example.test']),
    ).rejects.toThrow();
  });
  it('encrypts sensitive values and authenticates ciphertext', () => {
    process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 5).toString('base64');
    const a = encryptSensitive('account-123');
    expect(a).not.toContain('account-123');
    expect(decryptSensitive(a)).toBe('account-123');
    const parts = a.split(':');
    parts[3] = Buffer.alloc(16).toString('base64');
    expect(() => decryptSensitive(parts.join(':'))).toThrow();
  });
  it('escapes support HTML and excludes staff passwords', () => {
    expect(
      EmailTemplates.supportTicketUpdate({
        recipientName: 'A',
        ticketId: '1',
        subjectText: 'Help',
        message: '<script>alert(1)</script>',
      }).html,
    ).not.toContain('<script>');
    expect(
      EmailTemplates.staffWelcomeCredentials({
        staffName: 'A',
        staffId: '1',
        email: 'a@example.test',
        initialPassword: 'VERY-SECRET',
        department: 'Ops',
        allowedModules: [],
      }).html,
    ).not.toContain('VERY-SECRET');
  });
  it('rejects invalid dates and fractional monetary precision', () => {
    expect(() => dateOnly('2026-02-30', 'Date')).toThrow();
    expect(() => dateOnly('2026-02-01Tgarbage', 'Date')).toThrow();
    expect(() => dateOnly('2026-02-01T24:00:00Z', 'Date')).toThrow();
    expect(dateOnly('2026-02-01T00:00:00.000', 'Date').toISOString()).toBe(
      '2026-02-01T00:00:00.000Z',
    );
    expect(() => money(1.999)).toThrow();
    expect(() => money(Infinity)).toThrow();
  });
});
