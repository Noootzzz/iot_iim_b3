import { EventEmitter } from "events";

const globalForEmitter = globalThis as unknown as {
  __registrationEmitter?: EventEmitter;
};
export const registrationEmitter =
  globalForEmitter.__registrationEmitter ?? new EventEmitter();
registrationEmitter.setMaxListeners(100);
globalForEmitter.__registrationEmitter = registrationEmitter;
