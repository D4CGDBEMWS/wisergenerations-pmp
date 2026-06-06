import { NextRequest } from 'next/server'

// ---------------------------------------------------------------------------
// Cloudflare Turnstile — server-side token verification helper
//
// Required env var:
//   TURNSTILE_SECRET_KEY — from Cloudflare Turnstile dashboard
//     (Turnstile → your widget → Secret Key)
//
// Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
// ---------------------------------------------------------------------------

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export interface TurnstileVerifyResult {
    success: boolean
    errorCodes?: string[]
}

/**
 * Verify a Cloudflare Turnstile token submitted from the client.
 *
 * @param token  - The cf-turnstile-response token from the client form
 * @param req    - The incoming NextRequest (used to extract client IP)
 * @returns      TurnstileVerifyResult with success flag
 */
export async function verifyTurnstile(
    token: string | undefined | null,
    req: NextRequest
  ): Promise<TurnstileVerifyResult> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY

  // If no secret key is configured (e.g. local dev), skip verification
  // and allow the request through. Log a warning so developers are aware.
  if (!secretKey) {
        console.warn(
                '[turnstile] TURNSTILE_SECRET_KEY is not set — skipping CAPTCHA verification. ' +
                  'Set this env var in production.'
              )
        return { success: true }
  }

  if (!token) {
        return { success: false, errorCodes: ['missing-input-response'] }
  }

  // Extract client IP for Turnstile's optional remoteip parameter.
  // This improves accuracy of bot detection.
  const xff = req.headers.get('x-forwarded-for')
    const remoteIp = xff ? xff.split(',')[0]!.trim() : (req.headers.get('x-real-ip') ?? undefined)

  try {
        const formData = new URLSearchParams()
        formData.append('secret', secretKey)
        formData.append('response', token)
        if (remoteIp) formData.append('remoteip', remoteIp)

      const response = await fetch(TURNSTILE_VERIFY_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: formData.toString(),
      })

      if (!response.ok) {
              console.error('[turnstile] Verification endpoint returned HTTP', response.status)
              return { success: false, errorCodes: ['http-error'] }
      }

      const result = await response.json() as {
              success: boolean
              'error-codes'?: string[]
        }

            if (!result.success) {
              console.warn('[turnstile] Token verification failed:', result['error-codes'])
              return { success: false, errorCodes: result['error-codes'] }
      }

      return { success: true }
  } catch (err) {
        console.error('[turnstile] Unexpected error during verification:', err)
        return { success: false, errorCodes: ['network-error'] }
  }
}
