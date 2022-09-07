import daisyui from "daisyui"
import debug from "tailwindcss-debug-screens"

export default {
	daisyui: {
		logs: false,
	},
	plugins: [
		debug,
		daisyui,
		function ({ addVariant, addComponents }) {
			addVariant("dropdown", ".dropdown &")
			addVariant("dropdown-show", [
				".dropdown.dropdown-open &",
				".dropdown.dropdown-hover:hover &",
				".dropdown:not(.dropdown-hover):focus &",
				".dropdown:not(.dropdown-hover):focus-within &",
			])
			addComponents({
				"@media (min-width: 1280px)": {
					".text-container": {
						backgroundColor: "yellow",
					},
				},
			})
		},
	],
	theme: {
		container: {
			center: true,
			padding: "10rem",
		},
		extend: {
			colors: {
				electric: "#db00ff",
				ribbon: "#0047ff",
				barfoo: "var(--red)",
				foobar: {
					DEFAULT: "rgb(210 102 120)",
					100: "rgb( 33 189 291 )",
				},
			},
			fontFamily: {
				sans: [
					"Cascadia Code",
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI",
					"Roboto",
					"Helvetica Neue",
					"Arial",
					"Taipei Sans TC Beta",
					"Noto Sans",
					"sans-serif",
					"Apple Color Emoji",
					"Segoe UI Emoji",
					"Segoe UI Symbol",
					"Noto Color Emoji",
				],
			},
		},
	},
} as import("twobj").ConfigJS
