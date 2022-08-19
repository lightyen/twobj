import utopia, { fontSize } from "./utopia.js"

/** @type {Tailwind.ConfigJS} */
export default {
	plugins: [
		utopia(fontSize()),
		function ({ addVariant }) {
			addVariant("dropdown", ".dropdown &")
			addVariant("dropdown-show", [
				".dropdown.dropdown-open &",
				".dropdown.dropdown-hover:hover &",
				".dropdown:not(.dropdown-hover):focus &",
				".dropdown:not(.dropdown-hover):focus-within &",
			])
		},
	],
	theme: {
		extend: {
			colors: {
				electric: "#db00ff",
				ribbon: "#0047ff",
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
}
