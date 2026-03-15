import "dotenv/config";
import fs from "node:fs/promises";
import { google } from "@ai-sdk/google";
import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { shadcnComponentDefinitions } from "@json-render/shadcn/catalog";
import { unifiedIntrospect } from "@synth/core";
import { streamText } from "ai";
import { consola } from "consola";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import {
	appendMessage,
	type ConversationMessage,
	createConversation,
	deleteConversation,
	getConversation,
	listConversations,
	updateConversationMetadata,
} from "../lib/conversations";
import {
	ensureProjectDir,
	getProjectSchemaPath,
	PROJECTS_ROOT,
	readProjectConfig,
	writeProjectConfig,
} from "../lib/workspace";

// Define the catalog with shadcn/ui component definitions
const catalog = defineCatalog(schema, {
	components: {
		// Layout components
		Card: shadcnComponentDefinitions.Card,
		Stack: shadcnComponentDefinitions.Stack,
		Grid: shadcnComponentDefinitions.Grid,
		Heading: shadcnComponentDefinitions.Heading,
		Text: shadcnComponentDefinitions.Text,
		Separator: shadcnComponentDefinitions.Separator,

		// Form components
		Button: shadcnComponentDefinitions.Button,
		Input: shadcnComponentDefinitions.Input,
		Textarea: shadcnComponentDefinitions.Textarea,
		Select: shadcnComponentDefinitions.Select,
		Checkbox: shadcnComponentDefinitions.Checkbox,
		Switch: shadcnComponentDefinitions.Switch,
		Slider: shadcnComponentDefinitions.Slider,
		Radio: shadcnComponentDefinitions.Radio,

		// Data display
		Table: shadcnComponentDefinitions.Table,
		Badge: shadcnComponentDefinitions.Badge,
		Avatar: shadcnComponentDefinitions.Avatar,
		Image: shadcnComponentDefinitions.Image,

		// Feedback
		Alert: shadcnComponentDefinitions.Alert,
		Progress: shadcnComponentDefinitions.Progress,
		Skeleton: shadcnComponentDefinitions.Skeleton,
		Spinner: shadcnComponentDefinitions.Spinner,

		// Navigation
		Tabs: shadcnComponentDefinitions.Tabs,
		Accordion: shadcnComponentDefinitions.Accordion,
		Collapsible: shadcnComponentDefinitions.Collapsible,

		// Overlay
		Dialog: shadcnComponentDefinitions.Dialog,
		Drawer: shadcnComponentDefinitions.Drawer,
		Popover: shadcnComponentDefinitions.Popover,
		Tooltip: shadcnComponentDefinitions.Tooltip,
		DropdownMenu: shadcnComponentDefinitions.DropdownMenu,

		// Carousel
		Carousel: shadcnComponentDefinitions.Carousel,

		// Toggle components
		Toggle: shadcnComponentDefinitions.Toggle,
		ToggleGroup: shadcnComponentDefinitions.ToggleGroup,
		ButtonGroup: shadcnComponentDefinitions.ButtonGroup,

		// Link
		Link: shadcnComponentDefinitions.Link,

		// Pagination
		Pagination: shadcnComponentDefinitions.Pagination,
	},
	actions: {},
});

const app = new Hono();

app.use("/*", cors());

app.get("/api/health", (c) => {
	return c.json({ status: "ok" });
});

app.get("/api/projects", async (c) => {
	try {
		const projects = await fs.readdir(PROJECTS_ROOT);
		return c.json({ success: true, projects });
	} catch (error) {
		return c.json({ success: true, projects: [] });
	}
});

app.get("/api/projects/:name", async (c) => {
	const name = c.req.param("name");
	try {
		const config = await readProjectConfig(name);
		const schemaPath = getProjectSchemaPath(name);
		const schemaData = await fs.readFile(schemaPath, "utf-8");
		const schema = JSON.parse(schemaData);
		return c.json({ success: true, config, schema });
	} catch (error: any) {
		return c.json({ success: false, error: error.message }, 404);
	}
});

app.post("/api/projects", async (c) => {
	const body = await c.req.json();
	const schema_validator = z.object({
		name: z.string(),
		dbType: z.enum(["postgresql", "mysql", "sqlite"]),
		connectionString: z.string(),
	});

	const { name, dbType, connectionString } = schema_validator.parse(body);

	try {
		consola.info(
			`Creating project ${name} with DB connection: ${connectionString}`,
		);
		const schema = await unifiedIntrospect(connectionString);

		// Ensure project directory and save config
		await ensureProjectDir(name);
		await writeProjectConfig(name, {
			name,
			dbType,
			connectionString,
			createdAt: new Date().toISOString(),
		});

		// Save schema
		const schemaPath = getProjectSchemaPath(name);
		await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2));

		return c.json({ success: true, schema });
	} catch (error: any) {
		consola.error("Project Creation Error:", error);
		return c.json({ success: false, error: error.message }, 400);
	}
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
	const {
		provider,
		model,
		apiKey: _apiKey,
	} = z
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

// AI JSON Render endpoint - generates UI using JSON Render format
app.post("/api/ai-json-render", async (c) => {
	try {
		const body = await c.req.json();
		const prompt = body.prompt;
		const projectName = body.projectName;
		const conversationId = body.conversationId;

		if (!prompt) {
			return c.json({ error: "No prompt provided in request body." }, 400);
		}

		// Check if API key is available
		if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
			return c.json(
				{
					error:
						"API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY environment variable.",
				},
				500,
			);
		}

		// Load conversation history if provided
		let conversationContext = "";
		if (projectName && conversationId) {
			const conversation = await getConversation(projectName, conversationId);
			if (conversation && conversation.messages.length > 0) {
				// Get last 10 messages for context
				const recentMessages = conversation.messages.slice(-10);
				const historyText = recentMessages
					.map((m) => `${m.role}: ${m.content}`)
					.join("\n");
				conversationContext = `\n\nCONVERSATION HISTORY:\n${historyText}\n`;
			}
		}

		// Generate system prompt from catalog
		const systemPrompt = catalog.prompt({
			customRules: [
				"IMPORTANT:",
				"- ALWAYS respond with valid JSON only (no markdown, no explanations)",
				"- Use appropriate components based on the user's request",
				"- For tables, use the Table component with column definitions",
				"- For forms, use Input/Select/Checkbox components",
				"- For metrics, use Card with Text components inside",
			],
		});

		const enhancedPrompt = conversationContext
			? `${conversationContext}\nCurrent user request: ${prompt}`
			: prompt;

		const result = streamText({
			model: google("gemini-2.5-flash"),
			system: systemPrompt,
			prompt: enhancedPrompt,
		});

		return result.toTextStreamResponse();
	} catch (error: any) {
		consola.error("AI JSON Render API error:", error);
		return c.json(
			{
				error: "Failed to process AI request",
				message: error?.message || String(error),
			},
			500,
		);
	}
});

// Conversation endpoints

app.get("/api/conversations/:projectName", async (c) => {
	const projectName = c.req.param("projectName");
	try {
		const conversations = await listConversations(projectName);
		return c.json({ success: true, conversations });
	} catch (error: any) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

app.get("/api/conversations/:projectName/:id", async (c) => {
	const projectName = c.req.param("projectName");
	const conversationId = c.req.param("id");
	try {
		const conversation = await getConversation(projectName, conversationId);
		if (!conversation) {
			return c.json({ success: false, error: "Conversation not found" }, 404);
		}
		return c.json({ success: true, conversation });
	} catch (error: any) {
		return c.json({ success: false, error: error.message }, 500);
	}
});

app.post("/api/conversations/:projectName", async (c) => {
	const projectName = c.req.param("projectName");
	const body = await c.req.json();
	const schema_validator = z.object({
		title: z.string().optional(),
		schema: z.object({
			tables: z.array(z.any()),
			relationships: z.array(z.any()),
		}),
	});

	try {
		const { title, schema } = schema_validator.parse(body);
		consola.info(`Creating conversation for project: ${projectName}`);
		const conversation = await createConversation(projectName, {
			title,
			schema,
		});
		consola.success(`Conversation created: ${conversation.metadata.id}`);
		return c.json({ success: true, conversation });
	} catch (error: any) {
		consola.error("Conversation creation error:", error);
		return c.json({ success: false, error: error.message }, 400);
	}
});

app.put("/api/conversations/:projectName/:id", async (c) => {
	const projectName = c.req.param("projectName");
	const conversationId = c.req.param("id");
	const body = await c.req.json();
	const schema_validator = z.object({
		title: z.string().optional(),
		schema: z
			.object({
				tables: z.array(z.any()),
				relationships: z.array(z.any()),
			})
			.optional(),
		lastGeneratedUiJson: z.unknown().optional(),
	});

	try {
		const metadata = schema_validator.parse(body);
		await updateConversationMetadata(projectName, conversationId, metadata);
		const conversation = await getConversation(projectName, conversationId);
		return c.json({ success: true, conversation });
	} catch (error: any) {
		return c.json({ success: false, error: error.message }, 400);
	}
});

app.post("/api/conversations/:projectName/:id/messages", async (c) => {
	const projectName = c.req.param("projectName");
	const conversationId = c.req.param("id");
	const body = await c.req.json();
	const schema_validator = z.object({
		role: z.enum(["user", "assistant", "system"]),
		content: z.string(),
	});

	try {
		const message = schema_validator.parse(body);
		await appendMessage(projectName, conversationId, {
			...message,
			timestamp: new Date().toISOString(),
		} as ConversationMessage);
		const conversation = await getConversation(projectName, conversationId);
		return c.json({ success: true, conversation });
	} catch (error: any) {
		return c.json({ success: false, error: error.message }, 400);
	}
});

app.delete("/api/conversations/:projectName/:id", async (c) => {
	const projectName = c.req.param("projectName");
	const conversationId = c.req.param("id");
	try {
		await deleteConversation(projectName, conversationId);
		return c.json({ success: true });
	} catch (error: any) {
		return c.json({ success: false, error: error.message }, 500);
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
