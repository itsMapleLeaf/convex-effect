import { configure } from "convex-effect"
import * as generatedServer from "../_generated/server.js"

export const { effectQuery, effectMutation, effectAction } =
	configure(generatedServer)
