import crypto from 'crypto';

export class WebhookValidator {
    private static get secret(): string {
        const secret = process.env.MP_WEBHOOK_SECRET;
        if (!secret) {
            throw new Error('MP_WEBHOOK_SECRET environment variable is required');
        }
        return secret;
    }

    static validateSignature(receivedSignature: string, rawBody: string): boolean {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', this.secret)
                .update(rawBody, 'utf8')
                .digest('hex');

            // Usar timingSafeEqual para prevenir timing attacks
            return crypto.timingSafeEqual(
                Buffer.from(receivedSignature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            );
        } catch (error) {
            return false;
        }
    }

    static extractSignatureFromHeader(signatureHeader: string): string | null {
        if (!signatureHeader) return null;

        // Manejar diferentes formatos de signature header
        // Formato: "sha256=hash" o solo "hash"
        if (signatureHeader.startsWith('sha256=')) {
            return signatureHeader.replace('sha256=', '');
        }

        return signatureHeader;
    }
} 