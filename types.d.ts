interface Navigator {
    readonly serial: Serial;
}

type EventHandler = (event: Event) => void;

interface SerialPortInfoBase {
    usbVendorId?: number;
    usbProductId?: number;
    serialNumber?: string;
    manufacturer?: string;
    locationId?: string;
}

interface SerialPortFilter {
    usbVendorId?: number;
    usbProductId?: number;
}

interface SerialPortInfo extends SerialPortInfoBase { }

type ParityType = "none" | "even" | "odd" | "mark" | "space";
type FlowControlType = "none" | "hardware";

interface SerialOptions {
    baudRate: number;
    dataBits?: 7 | 8;
    stopBits?: 1 | 2;
    parity?: ParityType;
    bufferSize?: number;
    flowControl?: FlowControlType;
}

interface SerialPort extends EventTarget {
    readonly readable?: ReadableStream<Uint8Array>;
    readonly writable?: WritableStream<Uint8Array>;
    readonly onconnect: EventHandler | null;
    readonly ondisconnect: EventHandler | null;
    open(options: SerialOptions): Promise<void>;
    close(): Promise<void>;
    getInfo(): SerialPortInfo;
    forget(): Promise<void>;
}

interface SerialPortRequestOptions {
    filters?: SerialPortFilter[];
}

interface Serial extends EventTarget {
    onconnect: EventHandler | null;
    ondisconnect: EventHandler | null;
    getPorts(): Promise<SerialPort[]>;
    requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
}