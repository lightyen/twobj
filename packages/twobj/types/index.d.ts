export { resolveConfig } from "./config/resolveConfig";
export { createContext } from "./core";
export type { CSSProperties } from "./types";
import type { CSSProperties } from "./types";
export declare const globalStyles: Record<string, CSSProperties>;
export declare function tw(arr: TemplateStringsArray): CSSProperties;
export declare function theme(arr: TemplateStringsArray): unknown;
