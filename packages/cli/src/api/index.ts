import { unifiedIntrospect } from "@synth/core";
import { consola } from "consola";
import { Hono } from "hono";
import { z } from "zod";

const app = new Hono();

app.get("/api/health", (c) => {
	return c.json({ status: "ok" });
});

app.post("/api/validate-db", async (c) => {
	const body = await c.req.json();
	const { connectionString } = z
		.object({ connectionString: z.string() })
		.parse(body);

	try {
		consola.info(`Validating DB connection: ${connectionString}`);
		const schema = await unifiedIntrospect(connectionString);
		return c.json({ success: true, schema });
	} catch (error: any) {
		consola.error("DB Validation Error:", error);
		return c.json({ success: false, error: error.message }, 400);
	}
});

app.post("/api/validate-ai", async (c) => {
	const body = await c.req.json();
	const { provider, model, apiKey } = z
		.object({
			provider: z.string(),
			model: z.string(),
			apiKey: z.string(),
		})
		.parse(body);

	try {
		consola.info(`Validating AI provider: ${provider}, model: ${model}`);
		// Mocking AI validation for now.
		// In actual implementation, we'd use the provided credentials to make a small test request.
		return c.json({ success: true });
	} catch (error: any) {
		consola.error("AI Validation Error:", error);
		return c.json({ success: false, error: error.message }, 400);
	}
});

export function startApiServer(port: number) {
	consola.info(`Starting CLI API server on port ${port}...`);
	return {
		port,
		server: Bun.serve({
			port,
			fetch: app.fetch,
		}),
	};
}
