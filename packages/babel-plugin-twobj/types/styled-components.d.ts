// styled-components

import {
	AnyStyledComponent,
	CSSObject,
	DefaultTheme,
	StyledComponent,
	StyledComponentInnerAttrs,
	StyledComponentInnerComponent,
	StyledComponentInnerOtherProps,
	StyledComponentPropsWithRef,
	StyledConfig,
} from "styled-components"

import {} from "react"

type AnyIfEmpty<T extends object> = keyof T extends never ? any : T
interface ThemeProps<T> {
	theme: T
}
type ThemedStyledProps<P, T> = P & ThemeProps<T>
type Attrs<P, A extends Partial<P>, T> = ((props: ThemedStyledProps<P, T>) => A) | A

declare module "react" {
	interface Attributes {
		tw?: string
	}
}

declare module "twobj" {
	export interface ThemedStyledFunctionBase<
		C extends keyof JSX.IntrinsicElements | React.ComponentType<any>,
		T extends object,
		O extends object = {},
		A extends keyof any = never,
	> {
		(first: TemplateStringsArray): StyledComponent<C, T, O, A>
	}

	export interface ThemedStyledFunction<
		C extends keyof JSX.IntrinsicElements | React.ComponentType<any>,
		T extends object,
		O extends object = {},
		A extends keyof any = never,
	> extends ThemedStyledFunctionBase<C, T, O, A> {
		// Fun thing: 'attrs' can also provide a polymorphic 'as' prop
		// My head already hurts enough so maybe later...
		attrs<
			U,
			NewA extends Partial<StyledComponentPropsWithRef<C> & U> & {
				[others: string]: any
			} = {},
		>(
			attrs: Attrs<StyledComponentPropsWithRef<C> & U, NewA, T>,
		): ThemedStyledFunction<C, T, O & NewA, A | keyof NewA>

		withConfig: <Props extends O = O>(
			config: StyledConfig<StyledComponentPropsWithRef<C> & Props>,
		) => ThemedStyledFunction<C, T, Props, A>
	}

	export type ThemedStyledComponentFactories<T extends object> = {
		[TTag in keyof JSX.IntrinsicElements]: ThemedStyledFunction<TTag, T>
	}

	export interface ThemedBaseStyledInterface<T extends object> extends ThemedStyledComponentFactories<T> {
		<C extends AnyStyledComponent>(component: C): ThemedStyledFunction<
			StyledComponentInnerComponent<C>,
			T,
			StyledComponentInnerOtherProps<C>,
			StyledComponentInnerAttrs<C>
		>
		<C extends keyof JSX.IntrinsicElements | React.ComponentType<any>>(
			// unfortunately using a conditional type to validate that it can receive a `theme?: Theme`
			// causes tests to fail in TS 3.1
			component: C,
		): ThemedStyledFunction<C, T>
	}

	export interface StyledInterfaceTw extends ThemedBaseStyledInterface<AnyIfEmpty<DefaultTheme>> {
		(arr: TemplateStringsArray): CSSObject
	}

	export const tw: StyledInterfaceTw

	export const globalStyles: CSSObject
	export function theme(arr: TemplateStringsArray): unknown
	export function wrap(arr: TemplateStringsArray): (arg: CSSObject) => CSSObject
}
