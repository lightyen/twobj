import { createReducer } from "@reduxjs/toolkit"
import { QueryClient } from "@tanstack/react-query"

export interface AppStore {
	queryClient: QueryClient
}

const init: AppStore = {
	queryClient: new QueryClient(),
}

export const app = createReducer(init, builder => builder)
