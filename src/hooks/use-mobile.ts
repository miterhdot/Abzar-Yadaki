import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

/* دستور ۳۲ (A4): الگوی useSyncExternalStore به‌جای setState درون اثر —
   هم‌رفتار قبلی (بولین، false در سرور، واکنش‌پذیر به تغییر اندازه) بدون رندر آبشاری */
const mqlOf = () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

const subscribe = (cb: () => void) => {
  const mql = mqlOf()
  mql.addEventListener("change", cb)
  return () => mql.removeEventListener("change", cb)
}

const getSnapshot = () => mqlOf().matches
const getServerSnapshot = () => false

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
