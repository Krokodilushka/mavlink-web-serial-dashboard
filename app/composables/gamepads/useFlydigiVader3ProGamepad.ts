import { map } from "~/lib/Utils"

type RangeType = { min: number, max: number }

type SettingsType = {
    range: {
        pitch: RangeType
        roll: RangeType
        yaw: RangeType
    },
    throttleMultiplier: number
}

type ControlsType = {
    pitch: number
    roll: number
    yaw: number
    throttle: number
}

/*
    My settings for the Flydigi Vader 3 Pro controller
    Controls similar to Ace Combat 7:
    LT / RT – decrease / increase throttle
    Left stick – pitch and yaw
    LB / RB – roll
    A – arm
    B – disarm
*/
export function useFlydigiVader3ProGamepad(
    gamepad: Ref<Gamepad | null>,
    settings: Ref<SettingsType>,
    onArmChange: (arm: boolean) => void,
) {
    let lastState: Gamepad | undefined // Holds previous state
    let throttle = 0 // Current throttle
    let throttleIntervalId: number | null = null // Throttle change timer

    onMounted(() => {
        // Start the throttle timer.
        // Gradually increases/decreases throttle based on the LT/RT buttons.
        // For example, pressing RT fully will slowly increase the throttle (not instant 100%).
        throttleIntervalId = window.setInterval(() => {
            if (undefined === lastState) {
                throttle = 0
            } else {
                throttle = Math.min(Math.max(throttle + ((lastState.buttons[7]!.value - lastState.buttons[6]!.value) * settings.value.throttleMultiplier), 0), 1)
            }
        }, 20)
    })

    onUnmounted(() => {
        // Stop the throttle timer
        if (null !== throttleIntervalId) {
            window.clearInterval(throttleIntervalId)
            throttleIntervalId = null
        }
    })

    watch(gamepad, (newValue, oldValue) => {
        if (null !== newValue) {
            lastState = newValue
            // Arm button pressed while it was not pressed in the previous state
            if (!oldValue?.buttons[0]?.pressed && newValue.buttons[0]?.pressed) {
                throttle = 0 // Set throtte to 0
                onArmChange(true)
            }
            // Disarm button pressed while it was not pressed in the previous state
            if (!oldValue?.buttons[1]?.pressed && newValue.buttons[1]?.pressed) {
                throttle = 0 // Set throtte to 0
                onArmChange(false)
            }
        }
    })

    function getControls(): ControlsType {
        if (undefined === lastState) {
            return {
                pitch: 0,
                roll: 0,
                yaw: 0,
                throttle: 0
            }
        } else {
            return {
                pitch: map(-lastState.axes[1]!, -1, 1, settings.value.range.pitch.min, settings.value.range.pitch.max, false),
                roll: map(lastState.buttons[5]!.value - lastState.buttons[4]!.value, -1, 1, settings.value.range.roll.min, settings.value.range.roll.max, false),
                yaw: map(lastState.axes[0]!, -1, 1, settings.value.range.yaw.min, settings.value.range.yaw.max, false),
                throttle: throttle
            }
        }
    }

    return { getControls }
}