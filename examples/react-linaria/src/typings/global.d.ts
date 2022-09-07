export declare global {
	interface Window {
		__locale__: string
	}

	interface ProcessEnv {
		NODE_ENV: "development" | "production"
		APP_NAME: string
	}

	declare let process: { env: ProcessEnv }
}
