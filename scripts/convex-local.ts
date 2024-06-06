const backendUrl = `http://127.0.0.1:3210`
const adminKey = `0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd`

const args = process.argv.slice(2)
args.push("--admin-key", adminKey, "--url", backendUrl)

Bun.spawn({
	cmd: ["bunx", "convex", ...args],
	cwd: Bun.fileURLToPath(new URL("../packages/test-project", import.meta.url)),
	stdio: ["inherit", "inherit", "inherit"],
})
