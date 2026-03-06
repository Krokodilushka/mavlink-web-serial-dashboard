import { common, MavLinkData, MavLinkPacket, MavLinkPacketField, MavLinkPacketParser, MavLinkPacketSplitter, MavLinkProtocolV2, minimal, send, type MavLinkDataConstructor } from 'node-mavlink'
import { RefreshRate } from '../lib/RefreshRate'
import type { Readable, Writable } from 'node:stream'
import { readableStreamToNodeStream, writableStreamToNode } from '~/lib/Utils'

type MessageType = {
  info: MessageInfoType,
  payload: MavLinkData
  refreshRate: RefreshRate
}

type MessageInfoType = {
  msgID: number,
  name: string,
  fields: MavLinkPacketField[]
}

export function useMavlink(serialPort: Ref<SerialPort | null>, targetSystemID: number, targetComponentID: number) {
  const lastMessagesByMagicNumber = ref(new Map<number, MessageType>()) // Last received messages by message type (heartbeat, battery status, etc.)
  // Web streams from the Web Serial API
  let webReadable: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>> | undefined
  let webWriter: WritableStreamDefaultWriter<Uint8Array<ArrayBufferLike>> | undefined
  // Node streams for the node-mavlink library
  let nodeReadable: Readable | undefined
  let nodeWritable: Writable | undefined
  let parser: MavLinkPacketParser | undefined
  const registry = { ...minimal.REGISTRY, ...common.REGISTRY } as Record<number, MavLinkDataConstructor<MavLinkData>>
  const protocol = new MavLinkProtocolV2()

  function start() {
    if (undefined !== webReadable) {
      console.log('Web reader already exists')
      return
    }
    if (undefined !== webWriter) {
      console.log('Web writer already exists')
      return
    }
    if (undefined !== parser) {
      console.log('Parser already exists')
      return
    }

    webReadable = serialPort.value?.readable?.getReader()
    if (undefined === webReadable) {
      console.error('No reader available')
      return
    }
    nodeReadable = readableStreamToNodeStream(webReadable)

    parser = nodeReadable.pipe(new MavLinkPacketSplitter()).pipe(new MavLinkPacketParser())
    parser.on('data', handlePacket)

    webWriter = serialPort.value?.writable?.getWriter()
    if (undefined === webWriter) {
      console.error('No writer available')
      return
    }
    nodeWritable = writableStreamToNode(webWriter)
  }

  async function stop() {
    parser?.off('data', handlePacket)
    parser?.destroy()
    parser = undefined

    nodeReadable?.destroy()
    nodeReadable = undefined
    await webReadable?.cancel()
    webReadable = undefined

    nodeWritable?.destroy()
    nodeWritable = undefined
    await webWriter?.close()
    webWriter = undefined
  }

  // Handles incoming MavLink packets
  function handlePacket(packet: MavLinkPacket) {
    const clazz = registry[packet.header.msgid]
    if (clazz) {
      const data = packet.protocol.data(packet.payload, clazz)
      // React to particular messages if needed
      // if (data instanceof minimal.Heartbeat) {
      //   console.log('Received packet:', data)
      // }
      const key = clazz.MAGIC_NUMBER
      const message = lastMessagesByMagicNumber.value.get(key)
      if (undefined !== message) {
        message.info = getMessageInfo(data)
        message.payload = data
        message.refreshRate.refresh()
      } else {
        lastMessagesByMagicNumber.value.set(key, {
          info: getMessageInfo(data),
          payload: data,
          refreshRate: new RefreshRate()
        })
      }
    } else {
      console.warn('Unknown MAVLink message type:', packet)
    }
  }

  // Returns whether the vehicle is armed based on the last heartbeat message
  function isArmed(): boolean | undefined {
    const lastHeartbeat = lastMessagesByMagicNumber.value.get(minimal.Heartbeat.MAGIC_NUMBER)?.payload as minimal.Heartbeat | undefined
    return undefined === lastHeartbeat ? undefined : lastHeartbeat?.baseMode >= minimal.MavModeFlag.SAFETY_ARMED
  }

  async function sendArm(armed: boolean): Promise<void> {
    const cmd = new common.CommandLong()
    cmd.targetSystem = targetSystemID
    cmd.targetComponent = targetComponentID
    cmd.command = common.MavCmd.COMPONENT_ARM_DISARM
    cmd._param1 = Number(armed)
    try {
      await send(getWritable(), cmd, protocol)
    } catch (e) {
      console.error('Failed to send command', e)
    }
  }

  async function manualControl(x: number, y: number, z: number, r: number): Promise<void> {
    const cmd = new common.ManualControl()
    cmd.target = targetSystemID
    cmd.x = x
    cmd.y = y
    cmd.z = z
    cmd.r = r
    await send(getWritable(), cmd, protocol)
  }

  function getWritable(): Writable {
    if (undefined === nodeWritable) {
      throw new Error('Writable stream is not initialized')
    }
    return nodeWritable
  }

  function getMessageInfo(msg: MavLinkData): MessageInfoType {
    const info = (msg.constructor as typeof MavLinkData)
    return {
      msgID: info.MSG_ID,
      name: info.MSG_NAME,
      fields: info.FIELDS
    }
  }

  return {
    start,
    stop,
    lastMessagesByMagicNumber,
    isArmed,
    sendArm,
    manualControl
  }
}