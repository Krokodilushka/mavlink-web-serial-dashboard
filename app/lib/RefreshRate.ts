/**
 * Simple utility to measure event frequency (per second).
 * Useful for monitoring refresh rates of inputs like gamepads or sensors.
 */
export class RefreshRate {

  private _intervalStartTime = 0
  private _lastIntervalValue = 0
  private _currentIntervalValue = 0

  public get lastIntervalValue(): number {
    return this._lastIntervalValue
  }

  public refresh(): void {
    const currentTime = Date.now()
    if (this._intervalStartTime < currentTime - 1000) {
      this._intervalStartTime = currentTime
      this._lastIntervalValue = this._currentIntervalValue
      this._currentIntervalValue = 1
    } else {
      this._currentIntervalValue++
    }
  }

}
