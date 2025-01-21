/// <reference types="vite-envs/client" />


type ImportMetaEnv = {
  // Auto-generated by `npx vite-envs update-types` and hot-reloaded by the `vite-env` plugin
  // You probably want to add `/src/vite-env.d.ts` to your .prettierignore
  VITE_IMPORT_REACT_SCRIPT: string
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  APP_VERSION: string
  REQUIRES_HARD_REFRESH: boolean
  SENTRY_RELEASE: string
  BASE_PATH: string
  BASE_HREF: string
  PH_CONNECT_APP_REQUIRES_HARD_REFRESH: string
  SENTRY_AUTH_TOKEN: string
  SENTRY_ORG: string
  SENTRY_PROJECT: string
  PH_CONNECT_STUDIO_MODE: string
  PH_CONNECT_ROUTER_BASENAME: string
  PH_CONNECT_DEFAULT_DRIVES_URL: string
  PH_CONNECT_ENABLED_EDITORS: string
  PH_CONNECT_DISABLE_ADD_PUBLIC_DRIVES: string
  PH_CONNECT_SEARCH_BAR_ENABLED: string
  PH_CONNECT_DISABLE_ADD_CLOUD_DRIVES: string
  PH_CONNECT_DISABLE_ADD_LOCAL_DRIVES: string
  PH_CONNECT_DISABLE_DELETE_PUBLIC_DRIVES: string
  PH_CONNECT_DISABLE_DELETE_CLOUD_DRIVES: string
  PH_CONNECT_DISABLE_DELETE_LOCAL_DRIVES: string
  PH_CONNECT_PUBLIC_DRIVES_ENABLED: string
  PH_CONNECT_CLOUD_DRIVES_ENABLED: string
  PH_CONNECT_LOCAL_DRIVES_ENABLED: string
  PH_CONNECT_ARBITRUM_ALLOW_LIST: string
  PH_CONNECT_RWA_ALLOW_LIST: string
  PH_CONNECT_HIDE_DOCUMENT_MODEL_SELECTION_SETTINGS: string
  PH_CONNECT_RENOWN_URL: string
  PH_CONNECT_RENOWN_NETWORK_ID: string
  PH_CONNECT_RENOWN_CHAIN_ID: string
  PH_CONNECT_DISABLED_EDITORS: string
  PH_CONNECT_SENTRY_DSN: string
  PH_CONNECT_SENTRY_PROJECT: string
  PH_CONNECT_SENTRY_ENV: string
  PH_CONNECT_SENTRY_TRACING_ENABLED: string
  PH_CONNECT_GA_TRACKING_ID: string
  LOCAL_DOCUMENT_MODELS: string
  LOCAL_DOCUMENT_EDITORS: string
  LOAD_EXTERNAL_PROJECTS: string
  // @user-defined-start
  /*
   *  You can use this section to explicitly extend the type definition of `import.meta.env`
   *  This is useful if you're using Vite plugins that define specific `import.meta.env` properties.
   *  If you're not using such plugins, this section should remain as is.
   */
  SSR: boolean;
  // @user-defined-end
}



interface ImportMeta {
  // Auto-generated by `npx vite-envs update-types`

  url: string

  readonly hot?: import('vite-envs/types/hot').ViteHotContext

  readonly env: ImportMetaEnv

  glob: import('vite-envs/types/importGlob').ImportGlobFunction
}


declare const __APP_VERSION__: string
declare const __REQUIRES_HARD_REFRESH__: boolean
