/// <reference types="tailwind-types" />
import type { CSSProperties, CSSValue, PostModifier, VariantSpec } from "./types";
import type { ValueType } from "./values";
export interface CorePluginOptions extends PluginOptions {
    config: Tailwind.ResolvedConfigJS;
    theme: Tailwind.ResolvedConfigJS["theme"];
    resolveTheme(path: string, defaultValue?: unknown): unknown;
}
/** backwards compatibility */
export interface UserPluginOptions extends PluginOptions {
    e(classname: string): string;
    variants(corePlugin: string): string[];
    config(path: string, defaultValue?: unknown): any;
    theme(path: string, defaultValue?: unknown): any;
    corePlugins(feature: keyof Tailwind.CorePluginFeatures): boolean;
    prefix(classname: string): string;
}
export interface UserPlugin {
    (options: UserPluginOptions): void;
}
export interface MatchUtilitiesOption {
    values?: Record<string, unknown>;
    type?: ValueType | ValueType[];
    supportsNegativeValues?: boolean;
    filterDefault?: boolean;
}
export interface PluginOptions {
    addBase(bases: CSSProperties | CSSProperties[]): void;
    addDefaults(pluginName: string, properties: Record<string, string | string[]>): void;
    addUtilities(utilities: CSSProperties | CSSProperties[], options?: {}): void;
    addComponents(components: CSSProperties | CSSProperties[], options?: {}): void;
    matchUtilities(utilities: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>, options?: MatchUtilitiesOption): void;
    matchComponents(components: Record<string, (value: CSSValue) => CSSProperties | CSSProperties[]>, options?: MatchUtilitiesOption): void;
    addVariant(variantName: string, variantDesc: string | string[], options?: {
        postModifier?: PostModifier;
    }): void;
    matchVariant(variants: Record<string, (value?: string) => string | string[]>, options?: {
        values?: Record<string, string>;
        postModifier?: VariantSpec;
    }): void;
}
export interface UnnamedPlugin {
    (api: CorePluginOptions): void;
}
export interface CorePlugin {
    (api: CorePluginOptions): void;
    readonly name: string;
}
export declare function plugin(fn: UnnamedPlugin): CorePlugin;
export declare function plugin(pluginName: string, fn: UnnamedPlugin): CorePlugin;
export declare namespace plugin {
    var withOption: () => void;
}
