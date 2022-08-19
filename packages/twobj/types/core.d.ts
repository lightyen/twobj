/// <reference types="tailwind-types" />
import { CSSProperties, CSSValue, LookupSpec, PostModifier, StaticSpec, VariantSpec } from "./types";
import { ValueType } from "./values";
export declare function createContext(config: Tailwind.ResolvedConfigJS): {
    globalStyles: Record<string, CSSProperties>;
    utilities: Map<string, LookupSpec | StaticSpec | (LookupSpec | StaticSpec)[]>;
    variants: Map<string, VariantSpec>;
    arbitraryVariants: Map<string, (value: string) => VariantSpec>;
    css: (value: string) => CSSProperties;
    features: Set<string>;
    config: (path: string, defaultValue?: unknown) => unknown;
    theme: (path: string, defaultValue?: unknown) => unknown;
    prefix(value: string): string;
    expandAtRules: (style?: CSSProperties | undefined) => CSSProperties;
    addBase: (bases: CSSProperties | CSSProperties[]) => void;
    addDefaults: (pluginName: string, properties: Record<string, string | string[]>) => void;
    addUtilities: (utilities: CSSProperties | CSSProperties[]) => void;
    addComponents: (utilities: CSSProperties | CSSProperties[]) => void;
    addVariant: (variantName: string, variantDesc: string | string[], options?: {
        postModifier?: PostModifier;
    }) => void;
    matchUtilities: (utilities: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>, { type, values, supportsNegativeValues, filterDefault, }?: {
        type?: "any" | ValueType | ("any" | ValueType)[] | undefined;
        values?: Record<string, unknown> | undefined;
        supportsNegativeValues?: boolean | undefined;
        filterDefault?: boolean | undefined;
    }) => void;
    matchComponents: (utilities: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>, { type, values, supportsNegativeValues, filterDefault, }?: {
        type?: "any" | ValueType | ("any" | ValueType)[] | undefined;
        values?: Record<string, unknown> | undefined;
        supportsNegativeValues?: boolean | undefined;
        filterDefault?: boolean | undefined;
    }) => void;
    matchVariant: (variants: Record<string, (value: string) => string | string[]>, options?: {
        values?: Record<string, string>;
        postModifier?: PostModifier;
    }) => void;
    resolveThemeFunc(value: string): string;
    getClassList(): string[];
};
