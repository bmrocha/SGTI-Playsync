import { OTP, NobleCryptoPlugin, ScureBase32Plugin, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { query } from '@playsync/database';
import { logger } from '@/lib/logger';

const authenticator = new OTP({
  strategy: 'totp',
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin()
});

export class TwoFactorService {
  /**
   * Generates a temporary secret and QR code for 2FA setup.
   * Stores the secret and expiration in the database.
   * @param userId User ID to associate the temp secret with
   * @param email User email for the QR code label
   */
  static async generateTempSecret(userId: string, email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const serviceName = 'PlaySync'; // Use a consistent issuer

    // Check for existing valid temp secret
    const existing = await query(
      'SELECT two_factor_temp_secret, two_factor_setup_expires FROM users WHERE id = $1',
      [userId]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      const { two_factor_temp_secret, two_factor_setup_expires } = existing.rows[0];
      
      // If valid and expires in more than 2 minutes, reuse it
      if (two_factor_temp_secret && two_factor_setup_expires) {
        const expires = new Date(two_factor_setup_expires);
        const now = new Date();
        const diffMinutes = (expires.getTime() - now.getTime()) / 1000 / 60;
        
        if (diffMinutes > 2) {
           // Use generateURI for consistent otpauth URL generation
           const otpauth = generateURI({
             secret: two_factor_temp_secret,
             label: cleanEmail,
             issuer: serviceName
           });
           const qrCode = await QRCode.toDataURL(otpauth);
           return { secret: two_factor_temp_secret, qrCode };
        }
      }
    }

    const secret = authenticator.generateSecret();
    
    // Create otpauth URL
    const otpauth = generateURI({
      secret,
      label: cleanEmail,
      issuer: serviceName
    });
    
    const qrCode = await QRCode.toDataURL(otpauth);

    // Set expiration (e.g., 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      'UPDATE users SET two_factor_temp_secret = $1, two_factor_setup_expires = $2 WHERE id = $3',
      [secret, expiresAt, userId]
    );

    return { secret, qrCode };
  }

  /**
   * Verifies a token against a secret.
   * Stateless verification (used for login).
   */
  static async verifyToken(token: string, secret: string): Promise<boolean> {
    try {
        const result = await authenticator.verify({ token, secret });
        
        // Handle VerifyResult object (v13)
        if (result && typeof result === 'object' && 'valid' in result) {
             // Cast to any to access valid property safely
             return (result as any).valid === true;
        }
        
        // Handle boolean result (legacy/other strategy)
        if (typeof result === 'boolean') return result;
        
        return false;
    } catch (e) {
        logger.error({ err: e }, '2FA Verify Error:');
        return false;
    }
  }

  /**
   * Verifies a token against the stored temporary secret and enables 2FA if valid.
   * Used for initial setup.
   */
  static async verifyAndEnable(userId: string, code: string): Promise<boolean> {
      // Fetch temp secret
      const res = await query('SELECT two_factor_temp_secret, two_factor_setup_expires FROM users WHERE id = $1', [userId]);
      if (res.rowCount === 0) return false;

      const { two_factor_temp_secret, two_factor_setup_expires } = res.rows[0];

      if (!two_factor_temp_secret || !two_factor_setup_expires) return false;

      // Check expiration
      if (new Date() > new Date(two_factor_setup_expires)) {
          return false;
      }

      // Verify
      const isValid = await this.verifyToken(code, two_factor_temp_secret);

      if (isValid) {
          // Enable 2FA and clear temp fields
          await query(
            'UPDATE users SET two_factor_secret = $1, two_factor_enabled = true, force_2fa_setup = false, two_factor_temp_secret = NULL, two_factor_setup_expires = NULL WHERE id = $2',
            [two_factor_temp_secret, userId]
          );
          return true;
      }

      return false;
  }

  static async disableTwoFactor(userId: string) {
    await query(
      'UPDATE users SET two_factor_secret = NULL, two_factor_enabled = false WHERE id = $1',
      [userId]
    );
  }
}
