import { CSSObject, Interpolation, PropsOf, SerializedStyles, Theme } from "@emotion/react"
import { CSSInterpolation } from "@emotion/serialize"
import { FilteringStyledOptions, StyledComponent, StyledOptions } from "@emotion/styled"
import {} from "react"

declare module "react" {
	interface Attributes {
		tw?: string
	}
}

declare module "twobj" {
	/**
	 * @typeparam ComponentProps  Props which will be included when withComponent is called
	 * @typeparam SpecificComponentProps  Props which will *not* be included when withComponent is called
	 */
	export interface CreateStyledComponent<
		ComponentProps extends {},
		SpecificComponentProps extends {} = {},
		JSXProps extends {} = {},
	> {
		/**
		 * @typeparam AdditionalProps  Additional props to add to your styled component
		 */
		<AdditionalProps extends {} = {}>(
			...styles: Array<
				Interpolation<ComponentProps & SpecificComponentProps & AdditionalProps & { theme: Theme }>
			>
		): StyledComponent<ComponentProps & AdditionalProps, SpecificComponentProps, JSXProps>

		(template: TemplateStringsArray): StyledComponent<ComponentProps, SpecificComponentProps, JSXProps>

		/**
		 * @typeparam AdditionalProps  Additional props to add to your styled component
		 */
		<AdditionalProps extends {}>(
			template: TemplateStringsArray,
		): StyledComponent<ComponentProps & AdditionalProps, SpecificComponentProps, JSXProps>
	}

	export interface CreateStyled {
		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width }))
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width }))
		 */
		<
			C extends React.ComponentClass<React.ComponentProps<C>>,
			ForwardedProps extends keyof React.ComponentProps<C> & string = keyof React.ComponentProps<C> & string,
		>(
			component: C,
			options: FilteringStyledOptions<React.ComponentProps<C>, ForwardedProps>,
		): CreateStyledComponent<
			Pick<PropsOf<C>, ForwardedProps> & {
				theme?: Theme
			},
			{},
			{
				ref?: React.Ref<InstanceType<C>>
			}
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)<Props>(myComponentProps => ({ width: myComponentProps.width }))
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width }))
		 */
		<C extends React.ComponentClass<React.ComponentProps<C>>>(
			component: C,
			options?: StyledOptions<React.ComponentProps<C>>,
		): CreateStyledComponent<
			PropsOf<C> & {
				theme?: Theme
			},
			{},
			{
				ref?: React.Ref<InstanceType<C>>
			}
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width }))
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width }))
		 */
		<
			C extends React.ComponentType<React.ComponentProps<C>>,
			ForwardedProps extends keyof React.ComponentProps<C> & string = keyof React.ComponentProps<C> & string,
		>(
			component: C,
			options: FilteringStyledOptions<React.ComponentProps<C>, ForwardedProps>,
		): CreateStyledComponent<
			Pick<PropsOf<C>, ForwardedProps> & {
				theme?: Theme
			}
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width }))
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width }))
		 */
		<C extends React.ComponentType<React.ComponentProps<C>>>(
			component: C,
			options?: StyledOptions<React.ComponentProps<C>>,
		): CreateStyledComponent<
			PropsOf<C> & {
				theme?: Theme
			}
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width }))
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width }))
		 */
		<
			Tag extends keyof React.JSX.IntrinsicElements,
			ForwardedProps extends keyof React.JSX.IntrinsicElements[Tag] &
				string = keyof React.JSX.IntrinsicElements[Tag] & string,
		>(
			tag: Tag,
			options: FilteringStyledOptions<React.JSX.IntrinsicElements[Tag], ForwardedProps>,
		): CreateStyledComponent<
			{ theme?: Theme; as?: React.ElementType },
			Pick<React.JSX.IntrinsicElements[Tag], ForwardedProps>
		>

		/**
		 * @desc
		 * This function accepts a React component or tag ('div', 'a' etc).
		 *
		 * @example tw(MyComponent)`w-full`
		 * @example tw(MyComponent)(myComponentProps => ({ width: myComponentProps.width }))
		 * @example tw('div')`w-full`
		 * @example tw('div')<Props>(props => ({ width: props.width }))
		 */
		<Tag extends keyof React.JSX.IntrinsicElements>(
			tag: Tag,
			options?: StyledOptions<React.JSX.IntrinsicElements[Tag]>,
		): CreateStyledComponent<{ theme?: Theme; as?: React.ElementType }, React.JSX.IntrinsicElements[Tag]>
	}

	export type StyledTags = {
		[Tag in keyof React.JSX.IntrinsicElements]: CreateStyledComponent<
			{
				theme?: Theme
				as?: React.ElementType
			},
			React.JSX.IntrinsicElements[Tag]
		>
	}

	interface CreateStyledTw extends StyledTags, CreateStyled {
		(arr: TemplateStringsArray): SerializedStyles
	}

	export const tw: CreateStyledTw
	export const globalStyles: CSSObject
	export function theme(arr: TemplateStringsArray): unknown
	export function wrap(arr: TemplateStringsArray): (arg: CSSInterpolation) => CSSObject
	export function tx(arr: TemplateStringsArray): CSSObject
}
