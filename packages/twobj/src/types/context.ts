/* eslint-disable @typescript-eslint/no-explicit-any */

import type * as parser from "../parser"
import { CSSProperties } from "./base"
import { CorePluginFeatures } from "./features"
import { UserPluginOptions, ValueType } from "./plugin"
import { LookupSpec, StaticSpec, VariantSpec } from "./specification"

export interface Context extends UserPluginOptions {
	/** core parser */
	parser: ReturnType<typeof parser.createParser>

	/** globalStyles */
	globalStyles: Record<string, CSSProperties>

	utilities: Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>
	variantMap: Map<string, VariantSpec>
	arbitraryVariants: Map<string, (value: string) => VariantSpec>
	arbitraryUtilities: Map<string, Set<ValueType | "any">>
	features: Set<string>

	/** Transfrom tailwind declarations to css object. */
	css(strings: string): CSSProperties
	css(strings: TemplateStringsArray): CSSProperties
	css(strings: string | TemplateStringsArray): CSSProperties

	/** Get one variant spec form strings or nodes. */
	wrap(...variants: Array<parser.Variant | string>): VariantSpec

	/** Reverse utilities mapping. */
	getPluginName(value: string): string | undefined

	/** Look up values in the user's Tailwind configuration. */
	config(path: string, defaultValue?: unknown): any

	/** Signature: `theme(colors.red.500, <default-value>)` */
	renderThemeFunc(value: string): string

	/** Signature: `colors.red.500` */
	renderTheme(value: string): string

	/** List all utilities. */
	getClassList(): string[]

	/** List all color's utilities. */
	getColorClasses(): Map<string, string[]>

	getAmbiguous(): Map<string, LookupSpec[]>

	/** Escape css. */
	e(classname: string): string
	/**
	 * Do nothing.
	 * @deprecated
	 */
	prefix(classname: string): string
	/**
	 * Do nothing.
	 * @deprecated
	 */
	variants(corePlugin: string): string[]

	/** Test a feature exists whether or not. */
	corePlugins(feature: keyof CorePluginFeatures): boolean
}
