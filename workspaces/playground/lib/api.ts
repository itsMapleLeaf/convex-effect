import { createServerApi } from "convex-effect"
import type { DataModel } from "../convex/_generated/dataModel"

export const {
	query,
	internalQuery,
	mutation,
	internalMutation,
	action,
	internalAction,
	httpAction,
} = createServerApi<DataModel>()
