import path from "node:path";
import { consola } from "consola";
import { execa } from "execa";
import open from "open";
import { startApiServer } from "../api";
import { ensureProjectDir, getProjectDir, SYNTH_ROOT } from "../lib/workspace";

export async function startCommand(projectName: string, options: any) {
	try {
		consola.start(`Starting synth project: ${projectName}`);

		// 1. Ensure project workspace exists
		const projectDir = await ensureProjectDir(projectName);
		consola.info(`Project directory: ${projectDir}`);

		// 2. Define Ports (could be configurable in the future)
		const apiPort = 4000;
		const webPort = 3000;

		// 3. Start API Server
		const apiServer = startApiServer(apiPort);
		consola.success(`API server started on http://localhost:${apiPort}`);

		// 4. Start Web App
		// Calculate repo root relative to this file (src/commands/start.ts)
		// __dirname is not available in Bun modules, use import.meta.dir
		const currentDir = import.meta.dir;
		const repoRoot = path.resolve(currentDir, "../../../../");

		consola.info(`Repo root: ${repoRoot}`);

		consola.info("Launching Web App...");

		// Injecting ENV variables
		const webProcess = execa("bun", ["run", "dev"], {
			cwd: path.join(repoRoot, "apps/web"),
			env: {
				...process.env,
				PORT: webPort.toString(),
				SYNTH_PROJECT_NAME: projectName,
				SYNTH_PROJECT_DIR: projectDir,
				SYNTH_ROOT_DIR: SYNTH_ROOT,
				SYNTH_API_PORT: apiPort.toString(),
				SYNTH_WEB_PORT: webPort.toString(),
				SYNTH_MODE: "local",
			},
			stdio: "inherit",
		});

		consola.success(`Web app starting on http://localhost:${webPort}`);

		// 5. Open Browser (with a slight delay to let the server start)
		setTimeout(async () => {
			consola.info("Opening browser...");
			await open(`http://localhost:${webPort}`);
		}, 3000);

		// 6. Handle Graceful Shutdown
		process.on("SIGINT", async () => {
			consola.info("\nGracefully shutting down...");
			webProcess.kill("SIGINT");
			process.exit(0);
		});

		// Wait for the web process to finish (or be killed)
		await webProcess;
	} catch (error: any) {
		consola.error("Failed to start project:", error.message);
		process.exit(1);
	}
}
