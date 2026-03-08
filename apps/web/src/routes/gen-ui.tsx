import { createFileRoute } from "@tanstack/react-router";
import { GenerativeUIChat } from "@/components/gen-ui/chat";
import { z } from "zod";

const genUISearchSchema = z.object({
    schema: z.string().optional().describe("Base64 encoded JSON of the FullSchemaType"),
});

export const Route = createFileRoute("/gen-ui")({
    validateSearch: (search) => genUISearchSchema.parse(search),
    component: GenUIRouteComponent,
});

function GenUIRouteComponent() {
    const { schema: encodedSchema } = Route.useSearch();

    let schema = null;
    if (encodedSchema) {
        try {
            // In a real app, we might want to use a more robust compression/storage
            schema = JSON.parse(atob(encodedSchema));
        } catch (e) {
            console.error("Failed to parse schema from URL", e);
        }
    }

    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
            {!schema ? (
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white">No Schema Detected</h1>
                    <p className="text-slate-400 text-sm italic">
                        Please use the Synth CLI to introspect your database and open this page with the generated context.
                    </p>
                    <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 text-slate-500 font-mono text-[10px] text-left">
                        $ synth introspect "postgresql://..."
                    </div>
                </div>
            ) : (
                <div className="w-full h-full max-w-6xl">
                    <GenerativeUIChat schema={schema} />
                </div>
            )}
        </div>
    );
}
