// src/polyfill.ts
import { randomUUID } from "crypto";

// Define global.crypto before any module uses it
if (!(global as any).crypto) {
  (global as any).crypto = { randomUUID };
}