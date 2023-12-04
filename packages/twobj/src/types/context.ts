import type * as parser from "../parser"
import { UserPluginOptions, ValueType } from "./plugin"
import { CSSProperties, LookupSpec, LookupVariantSpec, StaticSpec, Variant, VariantSpec } from "./specification"

export interface CreateContextOptions {
	/**
	 * Throw an error if any variant or utility is not found.
	 * @default false
	 */
	throwError?: boolean
}

export interface Context extends UserPluginOptions {
	/** core parser */
	parser: ReturnType<typeof parser.createParser>

	/** globalStyles */
	globalStyles: Record<string, CSSProperties>

	utilities: Map<string, LookupSpec | StaticSpec | Array<LookupSpec | StaticSpec>>
	variantMap: Map<string, VariantSpec | LookupVariantSpec | Array<VariantSpec | LookupVariantSpec>>
	arbitraryVariants: Set<string>
	arbitraryUtilities: Map<string, Set<ValueType | "any">>
	features: Set<string>

	fromProgram(program: parser.Program): CSSProperties

	/** Transfrom tailwind declarations to css object. */
	css(strings: string): CSSProperties
	css(strings: TemplateStringsArray): CSSProperties
	css(strings: string | TemplateStringsArray): CSSProperties

	/** Get one variant spec form strings or nodes. */
	wrap(variants: string): Variant
	wrap(variants: TemplateStringsArray): Variant
	wrap(...variants: parser.Variant[]): Variant
	wrap(variants: string | TemplateStringsArray | parser.Variant, ...args: parser.Variant[]): Variant

	/** Reverse utility mapping. */
	resolveUtility(value: string): [style?: CSSProperties | undefined, spec?: LookupSpec | StaticSpec | undefined]

	/** Reverse variant mapping. */
	resolveVariant(value: string): [variant?: Variant | undefined, spec?: LookupVariantSpec | VariantSpec | undefined]

	/** Signature: `theme(colors.red.500, <default-value>)` */
	renderThemeFunc(value: string): string

	/** Signature: `colors.red.500` */
	renderTheme(value: string): string

	/** List all utilities. */
	getUtilities(): Set<string>

	/** List all variants. */
	getVariants(): Set<string>

	/** List all color utilities. */
	getColorUtilities(): Map<string, string[]>

	/** List all ambiguous utilities. */
	getAmbiguous(): Map<string, LookupSpec[]>

	set throwError(e: boolean)
	get throwError(): boolean
}
