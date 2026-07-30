export const enum ExprKind {
	Tw = 1,
	Tx,
	Wrap,
	Theme,
	GlobalStyles,
	EmotionCss,
	EmotionStyled,
}

export function regexEscape(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
