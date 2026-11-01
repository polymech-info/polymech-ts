

export interface UserIdentity {
  id: string
  user_id: string
  identity_data?: {
    [key: string]: any
  }
  identity_id: string
  provider: string
  created_at?: string
  last_sign_in_at?: string
  updated_at?: string
}

const FactorTypes = ['totp', 'phone', 'webauthn'] as const

/**
 * Type of factor. `totp` and `phone` supported with this version
 */
export type FactorType = (typeof FactorTypes)[number]

const FactorVerificationStatuses = ['verified', 'unverified'] as const

/**
 * The verification status of the factor, default is `unverified` after `.enroll()`, then `verified` after the user verifies it with `.verify()`
 */
type FactorVerificationStatus = (typeof FactorVerificationStatuses)[number]

export type Factor<
  Type extends FactorType = FactorType,
  Status extends FactorVerificationStatus = (typeof FactorVerificationStatuses)[number],
> = {
  /** ID of the factor. */
  id: string

  /** Friendly name of the factor, useful to disambiguate between multiple factors. */
  friendly_name?: string

  /**
   * Type of factor. `totp` and `phone` supported with this version
   */
  factor_type: Type

  /**
   * The verification status of the factor, default is `unverified` after `.enroll()`, then `verified` after the user verifies it with `.verify()`
   */
  status: Status

  created_at: string
  updated_at: string
}

export interface UserAppMetadata {
  /**
   * The first provider that the user used to sign up with.
   */
  provider?: string
  /**
   * A list of all providers that the user has linked to their account.
   */
  providers?: string[]
  [key: string]: any
}

export interface UserMetadata {
  [key: string]: any
}

export interface User {
    id: string
    app_metadata: UserAppMetadata
    user_metadata: UserMetadata
    aud: string
    confirmation_sent_at?: string
    recovery_sent_at?: string
    email_change_sent_at?: string
    new_email?: string
    new_phone?: string
    invited_at?: string
    action_link?: string
    email?: string
    phone?: string
    created_at: string
    confirmed_at?: string
    email_confirmed_at?: string
    phone_confirmed_at?: string
    last_sign_in_at?: string
    role?: string
    updated_at?: string
    identities?: UserIdentity[]
    is_anonymous?: boolean
    is_sso_user?: boolean
    factors?: (Factor<FactorType, 'verified'> | Factor<FactorType, 'unverified'>)[]
    deleted_at?: string
  }
