/// <reference types="tailwind-types" />
import * as parser from "./parser";
import type { CSSProperties, CSSValue, Template } from "./types";
export declare type ValueType = "number" | "percentage" | "length" | "angle" | "url" | "color" | "position" | "image" | "line-width" | "absolute-size" | "relative-size" | "shadow" | "generic-name" | "family-name";
interface ValueTypeSpec<ConfigValue = any> {
    type: ValueType;
    isTag(tag?: string): boolean;
    handleValue(value: string, options?: {
        negative?: boolean;
        opacity?: string;
    }): string | number | undefined;
    handleConfig(config: ConfigValue, options: {
        negative: boolean;
        opacity?: string;
    }): unknown;
}
export declare function representAny({ input, node, getText, values, negative, template, ambiguous, config, filterDefault, }: {
    input: string;
    node: parser.Classname | parser.ArbitraryClassname;
    getText: (node: parser.BaseNode) => string;
    values: Record<string, any>;
    negative: boolean;
    template: Template;
    ambiguous: boolean;
    config: Tailwind.ResolvedConfigJS;
    filterDefault: boolean;
}): CSSProperties | undefined;
export declare function formatBoxShadowValues(values: string): string;
declare type Types = {
    [P in Exclude<ValueType, "any">]: ValueTypeSpec;
};
export declare const __types: Types;
export declare function representTypes({ input, node, getText, values, negative, template, ambiguous, config, filterDefault, types, }: {
    input: string;
    node: parser.Classname | parser.ArbitraryClassname;
    getText: (node: parser.BaseNode) => string;
    values: Record<string, any>;
    negative: boolean;
    template: Template;
    ambiguous: boolean;
    config: Tailwind.ResolvedConfigJS;
    filterDefault: boolean;
    types: ValueType[];
}): CSSProperties | undefined;
export declare function withAlphaValue(color: CSSValue | ((options: {
    opacityValue?: string;
}) => CSSValue), opacityValue?: string): CSSValue;
export {};
