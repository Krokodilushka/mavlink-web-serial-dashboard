# MAVLink-Web Serial Dashboard
A web interface to display MAVLink data received from an ESP32 via USB and send data back to it.
Originally designed to work with [Flix](https://github.com/okalachev/flix) quadcopter and the [ESP32 USB ↔ ESP-NOW Transparent Bridge](https://github.com/Krokodilushka/esp32-usb-espnow-bridge).

Short video demonstration: https://youtube.com/shorts/47vamYl-FdA

You can see an example at https://mavnow.krokodilushka.dev.
You can check whether MAVLink packets are incoming, but to modify the gamepad controls, you need to download the code and run it locally.

You can create a QGroundControl-like interface in the browser with charts, indicators, and other custom logic.  
You can also send commands to the quadcopter programmatically—for example, by connecting a USB gamepad to control the drone directly.

This repository includes a `.devcontainer` configuration.

## Requirements
- [Nuxt 4](https://nuxt.com/docs/4.x/getting-started/installation#prerequisites)
- A modern web browser supporting:
  - [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility)
  - [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API#browser_compatibility)
- ESP32 running the [ESP32 USB ↔ ESP-NOW Transparent Bridge](https://github.com/Krokodilushka/esp32-usb-espnow-bridge)
- A second ESP32 (Flix quadcopter) sending MAVLink data over ESP-NOW

## 1. Clone the repository

```bash
git clone https://github.com/Krokodilushka/mavlink-web-serial-dashboard.git
```

## 2. Install dependencies

```bash
# npm
npm install
# pnpm
pnpm install
# yarn
yarn install
# bun
bun install
```

## 3. Start development server

Server will be started on `http://localhost:3000`:

```bash
# npm
npm run dev
# pnpm
pnpm dev
# yarn
yarn dev
# bun
bun run dev
```

You can start editing source code in app/app.vue.

See [Nuxt docs](https://nuxt.com/docs/4.x/getting-started/introduction) for more information.
