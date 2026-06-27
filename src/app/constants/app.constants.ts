/**
 * Constantes centralizadías de la aplicación StayCool.
 * Modificar aquÀafecta a toda la aplicación sin tocar cada componente.
 */

// ─── Roles del sistema (deben coincidir con lo que devuelve el backend JWT) ───
export const ROLES = {
  PATIENT:      ['ROLE_USER', 'USER', 'ROLE_PACIENTE'],
  PSYCHOLOGIST: ['ROLE_PSYCHOLOGIST', 'PSYCHOLOGIST', 'ROLE_PSICOLOGO']
} as const;

// ─── Rutas principales ────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN:                 '/login',
  REGISTER:              '/register',
  PATIENT_DASHBOARD:     '/patient/dashboard',
  PATIENT_META:          '/patient/meta',
  PATIENT_CALENDAR:      '/patient/calendar',
  PATIENT_RECURSOS:      '/patient/recursos',
  PATIENT_LOGROS:        '/patient/logros',
  PATIENT_SETTINGS:      '/patient/settings',
  PSYCH_DASHBOARD:       '/psychologist/dashboard',
  PSYCH_PATIENTS:        '/psychologist/patients',
  PSYCH_MATERIALES:      '/psychologist/materiales',
  PSYCH_CALENDAR:        '/psychologist/calendar',
  PSYCH_SETTINGS:        '/psychologist/settings',
} as const;

// ─── Claves de localStorage (un único lugar para cambiarlas) ─────────────────
export const STORAGE_KEYS = {
  TOKEN:     'staycool_token',
  USER_ID:   'staycool_user_id',
  USER_NAME: 'staycool_user_name',
} as const;

// ─── Valores por defecto de formularios ──────────────────────────────────────
export const DEFAULTS = {
  DAILY_GOAL_MINUTES:     60,
  ACTIVE_MINUTES:         30,
  REST_MINUTES:           10,
  SLEEP_HOURS:             8,
  SOCIAL_MEDIA_MINUTES:   60,
  NIGHT_USE_MINUTES:       0,
  FALLBACK_USER_INITIAL: 'U',
  FALLBACK_PATIENT_NAME: 'Usuario',
  FALLBACK_PSYCH_NAME:   'Doctor(a)',
} as const;
