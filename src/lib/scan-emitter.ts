import { EventEmitter } from "events";

// In Next.js dev mode, modules get re-evaluated on HMR.
// We store the emitter on globalThis to persist it across reloads.
const globalForEmitter = globalThis as unknown as {
  __scanEmitter?: EventEmitter;
};

export const scanEmitter = globalForEmitter.__scanEmitter ?? new EventEmitter();

// Allow many SSE clients to listen simultaneously
scanEmitter.setMaxListeners(100);

globalForEmitter.__scanEmitter = scanEmitter;
