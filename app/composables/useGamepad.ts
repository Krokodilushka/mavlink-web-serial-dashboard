import { RefreshRate } from '../lib/RefreshRate'

export function useGamepad(updateStateIntervalMs: number) {
  const gamepads = ref(new Set<string>()) // List of connected gamepads
  const activeId = ref<string | null>(null) // Active gamepad id
  const activeState = ref<Gamepad | null>(null) // Last state of active gamepad
  const gamepadsInteracted = ref(!navigator.getGamepads().every(e => null === e)) // Whether any button has been pressed on any gamepad (all gamepad objects must be non-null)
  const refreshRate = new RefreshRate()
  const isSupported = 'getGamepads' in navigator
  let updateStateTimerId: number | null = null
  let updateStateLastTimestamp: number | null = null

  const onConnect = (ev: GamepadEvent) => {
    console.log(`Gamepad connected: ${ev.gamepad.id}`)
    gamepadsInteracted.value = true
    gamepads.value.add(ev.gamepad.id)
    if (null === activeId.value) {
      setActive(ev.gamepad.id)
    }
  }
  const onDisconnect = (ev: GamepadEvent) => {
    console.log(`Gamepad disconnected: ${ev.gamepad.id}`)
    gamepads.value.delete(ev.gamepad.id)
    if (activeId.value === ev.gamepad.id) {
      setActive(null)
    }
  }

  watch(activeId, (newValue) => {
    if (null === newValue) {
      // Stop updating the state if there is no active gamepad and the update timer is running
      if (null !== updateStateTimerId) {
        window.clearTimeout(updateStateTimerId)
        updateStateTimerId = null
      }
      activeState.value = null
    } else if (null === updateStateTimerId) {
      // Start updating the state if there is an active gamepad and no update timer is running
      runUpdateState()
    }
  })

  onMounted(() => {
    if (!isSupported) {
      console.warn('Gamepad API is not supported')
    } else {
      window.addEventListener('gamepadconnected', onConnect)
      window.addEventListener('gamepaddisconnected', onDisconnect)
    }
  })

  onUnmounted(() => {
    setActive(null)
    window.removeEventListener('gamepaddisconnected', onDisconnect)
    window.removeEventListener('gamepadconnected', onConnect)
  })

  function setActive(id: string | null): void {
    console.log(`Active gamepad: ${id}`)
    activeId.value = id
    activeState.value = null
  }

  // Periodically update active gamepad state
  function runUpdateState(): void {
    // Stop if no active gamepad
    if (null === activeId.value) {
      updateStateTimerId = null
      return
    }
    const g = navigator.getGamepads().find(f => f?.id === activeId.value)
    if (g) {
      activeState.value = g
      // Update refresh rate statistics if the gamepad state has changed
      if (updateStateLastTimestamp !== g.timestamp) {
        updateStateLastTimestamp = g.timestamp
        refreshRate.refresh()
      }
    }
    updateStateTimerId = window.setTimeout(() => runUpdateState(), updateStateIntervalMs)
  }

  return {
    isSupported,
    gamepads,
    activeId,
    activeState,
    gamepadsInteracted,
    refreshRate,
    setActive
  }
}
