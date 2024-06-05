import { configure } from "convex-effect"
import * as generatedServer from "../_generated/server.js"

export const {
	getQueryCtx,
	getMutationCtx,
	getActionCtx,
	effectQuery,
	effectMutation,
	effectAction,
	db,
} = configure(generatedServer)
