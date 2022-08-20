module.exports = {
	transform: {
		"^.+\\.(t|j)s?$": "@swc/jest",
	},
	testMatch: ["**/?(*.)+(spec|test).[jt]s"],
}
