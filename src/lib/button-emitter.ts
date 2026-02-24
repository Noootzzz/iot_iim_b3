import { EventEmitter } from "events";

// Persist across HMR in dev mode (same pattern as scan-emitter)
const globalForEmitter = globalThis as unknown as {
  __buttonEmitter?: EventEmitter;
};

export const buttonEmitter =
  globalForEmitter.__buttonEmitter ?? new EventEmitter();

buttonEmitter.setMaxListeners(100);

globalForEmitter.__buttonEmitter = buttonEmitter;

// Button action types
export type ButtonAction =
  | "increment_p1"
  | "increment_p2"
  | "decrement_p1"
  | "decrement_p2"
  | "back";

export interface ButtonEvent {
  machineId: string;
  action: ButtonAction;
  timestamp: number;
}
