// plugins/node-nextTick.client.ts
export default defineNuxtPlugin(() => {
  if (typeof window === 'undefined') return

  // Простой полифилл nextTick через queueMicrotask (стандарт браузера)
  if (typeof process === 'undefined') {
    window.process = {} as any
  }

  if (!process.nextTick) {
    process.nextTick = (callback: (...args: any[]) => void, ...args: any[]) => {
      queueMicrotask(() => callback(...args))
    }
  }

  process.env = process.env || {}
})