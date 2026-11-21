/// <reference types="vite/client" />

declare const __BUILD_TIME__: string
declare const __BUILD_DATE_LABEL__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}
