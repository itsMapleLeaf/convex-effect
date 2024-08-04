import chalk from "chalk"
import extract from "extract-zip"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { oraPromise } from "ora"

export const backendUrl = "http://127.0.0.1:3210"

const projectRoot = new URL("../", import.meta.url)
const backendFolder = new URL("convex-backend/", projectRoot)
const backendBin = new URL("convex-local-backend", backendFolder)
const backendDataFolder = new URL("data/", backendFolder)

const releaseTag = "precompiled-2024-08-02-72f1835"

function fromProjectRoot(fullPath: string | URL) {
	const normalizedPath =
		typeof fullPath !== "string" ? fileURLToPath(fullPath) : fullPath
	return path.relative(fileURLToPath(projectRoot), normalizedPath)
}

function getConvexBackendReleaseUrl() {
	const baseUrl = new URL(
		`https://github.com/get-convex/convex-backend/releases/download/${releaseTag}/`,
	)
	if (os.platform() === "win32") {
		return new URL("convex-local-backend-x86_64-pc-windows-msvc.zip", baseUrl)
	}
	if (os.platform() === "darwin") {
		return new URL("convex-local-backend-x86_64-apple-darwin.zip", baseUrl)
	}
	return new URL("convex-local-backend-x86_64-unknown-linux-gnu.zip", baseUrl)
}

function resolveBinaryPath() {
	const binaryPath = fileURLToPath(backendBin)
	if (os.platform() === "win32") {
		return `${binaryPath}.exe`
	}
	return binaryPath
}

async function isReachable(input: string | URL | Request) {
	try {
		await fetch(input)
		return true
	} catch {
		return false
	}
}

export async function startBackend() {
	const binaryPath = resolveBinaryPath()

	if (!existsSync(binaryPath)) {
		throw new Error(
			"Failed to find convex backend, make sure it's downloaded first!",
		)
	}

	rmSync(backendDataFolder, { recursive: true, force: true })
	mkdirSync(backendDataFolder, { recursive: true })

	const process = Bun.spawn({
		cmd: [binaryPath],
		cwd: fileURLToPath(backendDataFolder),
	})

	while (!(await isReachable(backendUrl))) {
		await Bun.sleep(100)
	}

	Bun.spawnSync(
		[
			"bun",
			"convex",
			"dev",
			"--once",
			"--admin-key",
			"0135d8598650f8f5cb0f30c34ec2e2bb62793bc28717c8eb6fb577996d50be5f4281b59181095065c5d0f86a2c31ddbe9b597ec62b47ded69782cd",
			"--url",
			backendUrl,
		],
		{ stdout: "inherit", stderr: "inherit" },
	)

	console.info(`✓ Convex backend running at ${backendUrl}`)

	return {
		url: backendUrl,
		async [Symbol.asyncDispose]() {
			process.kill()
			await process.exited
		},
	}
}

export async function downloadConvexBackend() {
	const url = getConvexBackendReleaseUrl()
	const downloadDestination = new URL("release.zip", backendFolder)

	console.info("ℹ️ Convex backend not found! Downloading.")
	console.info()
	console.info(chalk.dim("Release url:"), chalk.bold(url))
	console.info(
		chalk.dim("Download destination:"),
		chalk.bold(fromProjectRoot(downloadDestination)),
	)
	console.info()

	const response = await oraPromise(
		async () => await fetch(url),
		`Downloading Convex Backend from ${url.href}...`,
	)

	await Bun.write(downloadDestination, await response.arrayBuffer())

	await oraPromise(
		() =>
			extract(fileURLToPath(downloadDestination), {
				dir: fileURLToPath(backendFolder),
			}),
		"Extracting Convex Backend...",
	)
}

if (import.meta.main) {
	const [command] = process.argv.slice(2)
	if (command === "download") {
		await downloadConvexBackend()
	}
	if (command === "start") {
		await using _ = await startBackend()
	}
}
