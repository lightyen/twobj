declare global {
	declare module "@emotion/react" {
		export interface Theme {
			colors: {
				/** primary */
				primary: string
			}
		}
	}
}
