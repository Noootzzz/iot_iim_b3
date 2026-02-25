import { EventEmitter } from "events";

const globalForEmitter = globalThis as unknown as {
  __scanEmitter?: EventEmitter;
};

export const scanEmitter = globalForEmitter.__scanEmitter ?? new EventEmitter();

scanEmitter.setMaxListeners(100);

globalForEmitter.__scanEmitter = scanEmitter;
