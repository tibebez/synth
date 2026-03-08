import { google } from "@ai-sdk/google";
import { genUITools } from "@synth/ai";
import { schemaToPrompt } from "@synth/core";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const Route = createFileRoute("/api/gen-ui")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const body = await request.json();
                    const messages: UIMessage[] = body.messages;
                    const schema = body.schema || (messages[messages.length - 1] as any)?.data?.schema;

                    if (!schema) {
                        throw new Error("No database schema provided in request context.");
                    }

                    const schemaContext = schemaToPrompt(schema);

                    const result = streamText({
                        model: google("gemini-2.5-flash"),
                        system: `You are Synth, an expert AI assistant that generates admin panel UIs.
            Use the provided DATABASE SCHEMA to inform your UI choices.
            When the user asks to see data, use renderDataTable.
            When they ask for metrics, use renderMetricCard or renderChart.
            When they want to input data, use renderUserForm.
            
            ${schemaContext}`,
                        messages: await convertToModelMessages(messages || []),
                        tools: genUITools,
                    });

                    return result.toUIMessageStreamResponse();
                } catch (error: any) {
                    console.error("Gen UI API error stack:", error?.stack);
                    return new Response(
                        JSON.stringify({
                            error: "Failed to process Gen UI request",
                            message: error?.message || String(error),
                            stack: error?.stack
                        }),
                        {
                            status: 500,
                            headers: { "Content-Type": "application/json" },
                        },
                    );
                }
            },
        },
    },
});
