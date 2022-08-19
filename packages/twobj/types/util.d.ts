/// <reference types="tailwind-types" />
import { CSSProperties, CSSValue, PlainCSSProperties, PostModifier } from "./types";
export declare function isCSSValue(value: unknown): value is CSSValue;
export declare function isPlainCSSProperties(css: CSSProperties): css is PlainCSSProperties;
export declare const IMPORTANT = "!important";
export declare function applyImportant(css: CSSProperties): CSSProperties;
export declare function applyCamelCase(css: CSSProperties): CSSProperties;
export declare function applyModifier(css: CSSProperties, modifier: PostModifier): CSSProperties;
export declare function isObject(value: unknown): boolean;
export declare function isPlainObject(value: unknown): boolean;
export declare function assignImpotant(target: any, source: any): any;
export declare function merge(target: any, ...sources: any[]): any;
export declare function flattenColorPalette(colors: Tailwind.Palette | null | undefined): {
    [color: string]: Tailwind.Value | Tailwind.ColorValueFunc | undefined;
};
export declare function excludeDefaultPalette(palette: ReturnType<typeof flattenColorPalette>): {
    [color: string]: unknown;
};
/** opacityToFloat accept: ("48", "0.48", "48%") => (0.48, 0.48, 0.48) */
export declare function opacityToFloat(value: string): number;
export declare function toArray<T>(target: T | T[]): T[];
export declare function reverseSign(value: string): string | undefined;
interface NormalizedScreen {
    min?: CSSValue;
    max?: CSSValue;
}
export declare function normalizeScreens(screens: any): [breakingPoint: string, minmax: NormalizedScreen][];
export {};
