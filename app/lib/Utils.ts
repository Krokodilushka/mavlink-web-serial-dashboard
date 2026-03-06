import { Readable, Writable } from 'node:stream'

export function readableStreamToNodeStream(reader: ReadableStreamDefaultReader<Uint8Array<ArrayBufferLike>>): Readable {
  return new Readable({
    read(): void {
      reader.read()
        .then((t) => {
          if (t.done) {
            this.push(null)
          } else {
            this.push(Buffer.from(t.value))
          }
        })
        .catch(e => this.destroy(new Error('Error while reading data', { cause: e })))
    },
  })
}

export function writableStreamToNode(writer: WritableStreamDefaultWriter<Uint8Array<ArrayBufferLike>>): Writable {
  return new Writable({
    write(chunk, _encoding, callback): void {
      writer.write(new Uint8Array(chunk))
        .then(() => callback())
        .catch(e => callback(new Error('Error while writing data', { cause: e })))
    },
    final(callback): void {
      writer.close().catch(e => callback(new Error('Error while writing data', { cause: e })))
    },
  })
}

/**
 * Maps a numeric value from one range to another.
 * @param value The input value to map
 * @param inMin Minimum of the input range
 * @param inMax Maximum of the input range
 * @param outMin Minimum of the output range
 * @param outMax Maximum of the output range
 * @param round Whether to round the result to the nearest integer
 * @returns The mapped value
 */
export function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number, round: boolean): number {
  const mapped = (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
  return round ? Math.round(mapped) : mapped
}