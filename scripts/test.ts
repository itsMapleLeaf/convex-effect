import { join } from "node:path"
import { backendUrl, startBackend } from "./convex-backend.ts"

const projectRoot = join(import.meta.dirname, "..")
const fixtureFolder = join(projectRoot, "fixtures/basic")

await using _backend = await startBackend()

Bun.spawnSync(
	[
		join(projectRoot, "node_modules/.bin/convex"),
		"dev",
		"--once",
		"--admin-key",
		`0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd`,
		"--url",
		backendUrl,
	],
	{ cwd: fixtureFolder, stdout: "inherit", stderr: "inherit" },
)

Bun.spawnSync(["bun", "test"], {
	cwd: projectRoot,
	stdout: "inherit",
	stderr: "inherit",
})
