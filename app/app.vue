<template>
    <div class="flex flex-col bg-gray-700 font-mono text-gray-100 min-h-screen">

        <!-- Alert -->
        <div v-if="!serial.isSupported" class="bg-red-700 p-4 text-center text-white">
            <p class="text-xl font-bold pb-1">Web Serial is not supported</p>
            <p>To connect the ESP32 via USB, you need Chrome 89 or another compatible browser.</p>
            <p>Full list of supported browsers and more information about the Web Serial API:
                <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API" target="_blank"
                    class="underline">developer.mozilla.org</a>
            </p>
        </div>

        <!-- Header -->
        <header class="flex flex-0 flex-col px-2 py-4 border-b-2 border-gray-500">
            <div class="text-3xl font-bold text-gray-50">MAVLink &lt;-&gt; Web Serial</div>
            <!-- Ports -->
            <div class="self-start cursor-pointer hover:underline"
                @click="serial.isSupported ? serial.request() : showAlert('Web Serial is not supported')">
                <template v-if="null !== serial.port.value">
                    Device: vendor ID - {{ serial.port.value?.getInfo().usbVendorId }}, product ID -
                    {{ serial.port.value?.getInfo().usbProductId }}
                </template>
                <template v-else>
                    Select USB port
                </template>
            </div>
        </header>

        <div class="flex flex-0 flex-col lg:flex-row lg:flex-1">

            <!-- Left block -->
            <div class="flex-1 basis-1/5 border-r-2 border-gray-500">

                <!-- Gamepads -->
                <div class="text-2xl font-bold text-center bg-gray-800/75 px-2 py-1">Gamepads</div>
                <div>
                    <div v-if="gamepad.isSupported">
                        <div v-if="gamepad.gamepadsInteracted.value">
                            <div v-if="gamepad.gamepads.value.size === 0" class="p-2 text-center">
                                Gamepads not found
                            </div>
                            <div v-else>
                                <ol class="list-decimal list-inside py-2">
                                    <li v-for="v in gamepad.gamepads.value.values()" :key="v"
                                        class="odd:bg-gray-600/50 px-2"
                                        :class="{ 'font-semibold': gamepad.activeId.value === v }">
                                        <span @click="gamepad.setActive(v)" class="cursor-pointer hover:underline">
                                            {{ v }}
                                        </span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                        <div v-else>
                            <div class="p-2">
                                To display the list of gamepads, press any button on any connected gamepad.
                            </div>
                        </div>
                    </div>
                    <div v-else class="p-2 space-y-2">
                        <p>Gamepads are not supported</p>
                        <p>This feature requires Chrome 21, Firefox 29, or another compatible browser.</p>
                        <p>Full list of supported browsers and more information about the Gamepad API: <a
                                href="https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API" target="_blank"
                                class="underline">developer.mozilla.org</a></p>
                    </div>

                    <!-- Selected gamepad info -->
                    <div v-if="null !== gamepad.activeState.value" class="flex flex-col">
                        <div class="text-lg font-semibold text-center bg-gray-800/75 px-2 py-1">
                            Selected gamepad
                        </div>
                        <div class="flex flex-col">
                            <div>
                                <div class="p-2">{{ gamepad.activeState.value.id }}</div>
                                <div class="p-2 bg-gray-600/50">
                                    Refresh rate: {{ gamepad.refreshRate.lastIntervalValue }} Hz
                                </div>
                                <div class="text-lg font-semibold text-center bg-gray-800/50 px-2 py-1">Axes</div>
                                <div>
                                    <div v-for="(axis, index) in gamepad.activeState.value.axes" :key="index">
                                        <div class="px-2 odd:bg-gray-600/50">{{ index }}: {{ axis }}</div>
                                    </div>
                                </div>
                                <div class="-lg font-semibold text-center bg-gray-800/50 px-2 py-1">Buttons</div>
                                <div>
                                    <div v-for="(button, index) in gamepad.activeState.value.buttons" :key="index">
                                        <div class="px-2 odd:bg-gray-600/50">
                                            {{ index }}: pressed: {{ button.pressed }}, value: {{ button.value }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Right block -->
            <!-- MAVLink messages -->
            <div class="flex-1 basis-4/5 border-0">
                <div class="text-2xl font-bold text-center bg-gray-800/75 px-2 py-1">Incoming MAVLink messages</div>
                <div v-if="mavlink.lastMessagesByMagicNumber.value.size === 0" class="text-center p-2">
                    No messages yet
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-2 p-2">
                    <div v-for="msg in mavlink.lastMessagesByMagicNumber.value.values()" :key="msg.info.msgID"
                        class="bg-gray-800/25">
                        <div class="flex justify-between items-center bg-gray-800/50 p-2">
                            <span class="text-l font-bold text-gray-50">{{ msg.info.name }}</span>
                            <span>{{ msg.refreshRate.lastIntervalValue }} Hz</span>
                        </div>
                        <div class="divide-y divide-gray-600/50">
                            <div v-for="fieldname in msg.info.fields" :key="fieldname.name"
                                class="flex flex-row flex-nowrap justify-between odd:bg-gray-600/50 px-2">
                                <div class="flex-1">{{ fieldname.name }}</div>
                                <div class="flex-2 wrap-anywhere text-right">
                                    {{ (msg.payload as Record<string, unknown>)?.[fieldname.name] ?? '?' }}
                                        {{ fieldname.units }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>


<script setup lang="ts">
import { useMavlink } from './composables/useMavlink';
import { useWebSerial } from './composables/useWebSerial';
import { useGamepad } from './composables/useGamepad';
import { useFlydigiVader3ProGamepad } from './composables/gamepads/useFlydigiVader3ProGamepad';
import { map } from './lib/Utils';

let sendControlsTimerId: number | null = null // Timer ID for sending controls
const canControl = computed(() => null !== gamepad.activeState.value && null !== serial.port.value) // Whether we can send control packets (ESP32 connected and gamepad selected)
let runSendControlsActive = false // Whether periodic sending of controls is active

const port = ref<SerialPort | null>(null) // Reference to the selected ESP32
const mavlink = useMavlink(port, 1, 1)
watch(port, (newValue) => {
    if (null !== newValue) {
        mavlink.start()
    }
})
const serial = useWebSerial(port, async () => await mavlink.stop())
const gamepad = useGamepad(20)

const flydigiGamepad = useFlydigiVader3ProGamepad(
    gamepad.activeState, // Reference to the selected gamepad state
    // Map min-max values to smooth control
    ref({
        range: {
            pitch: { min: -0.3, max: 0.3 },
            roll: { min: -0.3, max: 0.3 },
            yaw: { min: -0.3, max: 0.3 },
        },
        throttleMultiplier: 0.0025, // How fast increase/decrease throttle
    }),
    (arm: boolean) => {
        // Send arm command only if the current state of the quadcopter is different
        if (arm !== mavlink.isArmed()) {
            console.log(`Send new arm state: ${arm}`)
            mavlink.sendArm(arm).catch(e => console.error(e))
        }
    },
)

watch(canControl, (newValue) => {
    if (newValue) {
        if (!runSendControlsActive) {
            runSendControlsActive = true
            runSendControls(20)
        }
    } else {
        runSendControlsActive = false
        if (null !== sendControlsTimerId) {
            window.clearTimeout(sendControlsTimerId)
            sendControlsTimerId = null
        }
    }
})

// Runs periodic sending of control commands
function runSendControls(intervalMs: number) {
    if (null === port.value || !runSendControlsActive) {
        return
    }
    const controls = flydigiGamepad.getControls()
    // Map controls to MAVLink scale
    const x = map(controls.pitch, -1, 1, -1000, 1000, true)
    const y = map(controls.roll, -1, 1, -1000, 1000, true)
    const r = map(controls.yaw, -1, 1, -1000, 1000, true)
    const z = map(controls.throttle, 0, 1, 0, 1000, true)
    mavlink.manualControl(x, y, z, r)
        .catch(e => console.error(e))
        .finally(() => {
            if (runSendControlsActive) {
                sendControlsTimerId = window.setTimeout(() => runSendControls(intervalMs), intervalMs)
            }
        })
}

function showAlert(text: string) {
    alert(text)
}

</script>