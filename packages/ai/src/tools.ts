import { tool } from "ai";
import { z } from "zod";

/**
 * Tool definitions for the Generative UI engine.
 * These map to the AgenticGenUI component registry.
 */
export const renderDataTable = tool({
    description: "Render a data table for a specific database table.",
    inputSchema: z.object({
        table: z.string().describe("The name of the database table to display."),
        columns: z.array(z.object({
            field: z.string(),
            header: z.string(),
        })).describe("List of columns to show."),
        title: z.string().optional().describe("Title of the table component."),
    }),
    execute: async (args) => {
        // In a real scenario, this would fetch actual data from the database
        return { ...args, mockData: [] };
    },
});

export const renderMetricCard = tool({
    description: "Render a card showing a specific metric or aggregated value.",
    inputSchema: z.object({
        title: z.string().describe("The label for the metric (e.g., 'Total Users')."),
        value: z.string().describe("The formatted value to display."),
        trend: z.object({
            value: z.number(),
            isPositive: z.boolean(),
        }).optional(),
        icon: z.string().optional().describe("Icon name from Lucide (e.g., 'users', 'dollar-sign')."),
    }),
    execute: async (args) => args,
});

export const renderChart = tool({
    description: "Render a data visualization chart (bar, line, pie).",
    inputSchema: z.object({
        title: z.string(),
        type: z.enum(["bar", "line", "pie", "area"]),
        data: z.array(z.any()),
        xAxis: z.string(),
        yAxis: z.string(),
    }),
    execute: async (args) => args,
});

export const renderUserForm = tool({
    description: "Render a form to capture user input for creating or editing data.",
    inputSchema: z.object({
        title: z.string(),
        fields: z.array(z.object({
            name: z.string(),
            label: z.string(),
            type: z.enum(["text", "number", "email", "select", "date"]),
            options: z.array(z.string()).optional(),
        })),
        submitLabel: z.string().optional(),
    }),
    execute: async (args) => args,
});

export const genUITools = {
    renderDataTable,
    renderMetricCard,
    renderChart,
    renderUserForm,
};
