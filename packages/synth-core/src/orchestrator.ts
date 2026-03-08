import { google } from "@ai-sdk/google";
import {
	type FullSchemaType,
	type SynthManifest,
	SynthManifestSchema,
} from "@synth/types";
import { generateObject } from "ai";
import { schemaToPrompt } from "./utils/schema-prompt";

export async function planAdminPanel(
	schema: FullSchemaType,
	userPrompt: string,
): Promise<SynthManifest> {
	const schemaContext = schemaToPrompt(schema);

	const { object } = await generateObject({
		model: google("gemini-2.5-flash"),
		schema: SynthManifestSchema,
		system:
			"You are Synth, an expert architect for admin panels and internal tools. " +
			"Given a database schema (tables, columns, relationships) and a user prompt, " +
			"generate a high-level manifest for an admin panel that fulfills the user's requirements.\n\n" +
			schemaContext,
		prompt: `
            User Intent:
            "${userPrompt}"
        
            Generate a manifest that includes pages, permissions (RBAC), and branding.
            Match the pages to the appropriate database tables.
          `,
	});

	return object as SynthManifest;
}
