import { EventEmitter } from "events";

const globalForEmitter = globalThis as unknown as {
  __buttonEmitter?: EventEmitter;
};

export const buttonEmitter =
  globalForEmitter.__buttonEmitter ?? new EventEmitter();

buttonEmitter.setMaxListeners(100);

globalForEmitter.__buttonEmitter = buttonEmitter;

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
