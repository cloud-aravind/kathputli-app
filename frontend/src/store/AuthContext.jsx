import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

import { authApi } from '../api/auth'
import { TOKEN_KEY } from '../api/client'


// =============================================================
// AUTH CONTEXT
// =============================================================
//
// Owns the JWT + current user.
//
// The token persists in localStorage so sessions survive
// browser reloads. The Axios client reads the same token key.
//
// User information is also persisted so the UI can restore
// quickly while /api/auth/me validates the session.
// =============================================================

const AuthContext = createContext(null)

const USER_KEY = 'kathputli_user'


// =============================================================
// JWT PAYLOAD DECODER
// =============================================================
//
// Best-effort decode only.
// This does NOT verify the JWT signature.
//
// Actual authentication/authorization remains the responsibility
// of the backend.
// =============================================================

function decodeToken(token) {
  try {
    const payload = token.split('.')[1]

    if (!payload) return null

    return JSON.parse(
      atob(
        payload
          .replace(/-/g, '+')
          .replace(/_/g, '/')
      )
    )
  } catch {
    return null
  }
}


// =============================================================
// AUTH PROVIDER
// =============================================================

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY)
  )

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY)

    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      localStorage.removeItem(USER_KEY)
      return null
    }
  })

  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem(TOKEN_KEY))
  )


  // ===========================================================
  // Persist current user
  // ===========================================================

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(user)
      )
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [user])


  // ===========================================================
  // Hydrate / validate existing session
  // ===========================================================
  //
  // When a token already exists, ask the backend for the
  // current authenticated user.
  //
  // 401 → token/session is invalid → clear it.
  //
  // Other failures → keep the token and fall back to the
  // locally decoded JWT claims if possible.
  // ===========================================================

  useEffect(() => {
    let active = true

    if (!token) {
      setLoading(false)
      return
    }

    setLoading(true)

    authApi
      .me()
      .then((me) => {
        if (active) {
          setUser(me)
        }
      })
      .catch((err) => {
        if (!active) return

        const status = err?.response?.status

        // -------------------------------------------------------
        // Invalid / expired authentication session
        // -------------------------------------------------------

        if (status === 401) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)

          setToken(null)
          setUser(null)

          return
        }

        // -------------------------------------------------------
        // For non-authentication failures, keep the session and
        // use JWT claims as a best-effort fallback.
        // -------------------------------------------------------

        if (!user) {
          const claims = decodeToken(token)

          if (claims) {
            setUser(claims)
          }
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }

    // The session hydration intentionally runs when the token
    // changes. User state is handled inside the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])


  // ===========================================================
  // Apply authenticated token
  // ===========================================================

  const applyToken = useCallback(
    (newToken, maybeUser) => {
      localStorage.setItem(
        TOKEN_KEY,
        newToken
      )

      setToken(newToken)

      if (maybeUser) {
        setUser(maybeUser)
        return
      }

      const claims = decodeToken(newToken)

      if (claims) {
        setUser(claims)
      }
    },
    []
  )


  // ===========================================================
  // Login
  // ===========================================================

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials)

      applyToken(
        data.token,
        data.user
      )

      return data
    },
    [applyToken]
  )


  // ===========================================================
  // Register
  // ===========================================================

  const register = useCallback(
    async (payload) => {
      const data = await authApi.register(payload)

      // The current backend may return a token, but registration
      // does not require automatic authentication.
      if (data.token) {
        applyToken(
          data.token,
          data.user
        )
      }

      return data
    },
    [applyToken]
  )


  // ===========================================================
  // Logout
  // ===========================================================

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    setToken(null)
    setUser(null)
  }, [])


  // ===========================================================
  // Normalised role
  // ===========================================================
  //
  // The backend currently uses:
  //
  // customer
  // artist-admin       → Kathputli Artist
  // admin
  // delivery-agent
  //
  // We keep the backend role unchanged here.
  // ===========================================================

  const role =
    user?.role ||
    (
      Array.isArray(user?.roles)
        ? user.roles[0]
        : undefined
    )


  // ===========================================================
  // Context value
  // ===========================================================

  const value = {
    token,
    user,
    role,
    loading,

    isAuthenticated: Boolean(token),

    login,
    register,
    logout,

    setUser,
  }


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


// =============================================================
// AUTH HOOK
// =============================================================

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    )
  }

  return ctx
}