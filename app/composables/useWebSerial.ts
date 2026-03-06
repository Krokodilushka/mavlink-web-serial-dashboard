
export function useWebSerial(
    port: Ref<SerialPort | null>,
    onBeforeClose: () => Promise<void> // In this callback, close the streams before closing the port.
) {
    const isSupported = 'serial' in navigator

    onMounted(() => {
        if (!isSupported) {
            console.warn('Web Serial is not supported')
        }
    })

    onUnmounted(async () => {
        await close()
    })

    async function request(): Promise<void> {
        if (!isSupported) {
            console.error('Web Serial is not supported')
            return
        }
        try {
            const requestedPort = await navigator.serial.requestPort()
            console.info(`Access to the port granted: ${JSON.stringify(requestedPort.getInfo())}`)
            await open(requestedPort)
        } catch (e) {
            console.error('Error while requesting access to the port', e)
        }
    }

    async function open(portToOpen: SerialPort, baudRate = 9600): Promise<void> {
        await close() // Close the currently opened port
        const onDisconnect = (): void => {
            console.log(`Port disconnected ${JSON.stringify(portToOpen.getInfo())}`)
            port.value?.removeEventListener('disconnect', onDisconnect)
            port.value = null
        }
        portToOpen.addEventListener('disconnect', onDisconnect)
        try {
            await portToOpen.open({ baudRate })
            port.value = portToOpen
            console.log(`Port opened: ${JSON.stringify(portToOpen.getInfo())}`)
        } catch (e: unknown) {
            portToOpen.removeEventListener('disconnect', onDisconnect)
            console.error(e)
        }
    }

    async function close(): Promise<void> {
        if (null !== port.value) {
            await onBeforeClose()
            const info = port.value.getInfo()
            await port.value.close()
            console.log(`Port closed: ${JSON.stringify(info)}`)
            port.value = null
        }
    }

    return {
        isSupported,
        port,
        request
    }
}
