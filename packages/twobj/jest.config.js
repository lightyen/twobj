module.exports = {
	transform: {
		"^.+\\.(t|j)s?$": "@swc/jest",
	},
	testMatch: ["**/?(*.)+(spec|test).[jt]s"],
	modulePathIgnorePatterns: [],
	moduleNameMapper: {
		"^~/(.*)": "<rootDir>/src/$1",
	},
}
