import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Code,
	Columns,
	Database,
	Layout,
	MessageSquare,
	Send,
	Sparkles,
	Table2,
} from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/$projectName")({
	component: ProjectDashboard,
});

function ProjectDashboard() {
	const { projectName } = Route.useParams();
	const [activeTab, setActiveTab] = useState<"database" | "ai">("database");

	return (
		<div className="flex h-screen w-full flex-col bg-background font-sans text-foreground">
			{/* Top Navigation */}
			<header className="flex h-12 shrink-0 items-center border-b bg-background">
				<div className="flex h-full w-full items-center justify-between px-4">
					{/* Left: Back + project name */}
					<div className="flex items-center gap-3">
						<Link
							to="/"
							className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							<ArrowLeft className="h-4 w-4" />
						</Link>
						<div className="h-4 w-px bg-border" />
						<div className="flex items-center gap-2.5">
							<div className="flex h-6 w-6 items-center justify-center rounded bg-foreground">
								<Database className="h-3 w-3 text-background" />
							</div>
							<span className="font-medium text-sm tracking-tight">
								{projectName}
							</span>
						</div>
					</div>

					{/* Center: Tab switcher */}
					<div className="absolute left-1/2 flex -translate-x-1/2 items-center">
						<div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
							<button
								type="button"
								onClick={() => setActiveTab("database")}
								className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-xs transition-all ${
									activeTab === "database"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Database className="h-3 w-3" />
								Database
							</button>
							<button
								type="button"
								onClick={() => setActiveTab("ai")}
								className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-xs transition-all ${
									activeTab === "ai"
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Sparkles className="h-3 w-3" />
								AI Studio
							</button>
						</div>
					</div>

					{/* Right: theme + avatar */}
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<div className="h-4 w-px bg-border" />
						<div className="flex h-7 w-7 items-center justify-center rounded-full border font-medium text-muted-foreground text-xs">
							U
						</div>
					</div>
				</div>
			</header>

			{/* Main Content Area */}
			<main className="flex-1 overflow-hidden">
				{activeTab === "database" ? <DatabaseModule /> : <AIModule />}
			</main>
		</div>
	);
}

function DatabaseModule() {
	const [selectedTable, setSelectedTable] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"structure" | "records">(
		"structure",
	);
	const tables = ["users", "posts", "comments", "profiles"];

	return (
		<div className="flex h-full w-full">
			{/* Sidebar */}
			<div className="flex w-56 shrink-0 flex-col border-r bg-background">
				<div className="px-4 py-3">
					<p className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
						Tables
					</p>
				</div>
				<ScrollArea className="flex-1 px-2">
					<div className="space-y-0.5 pb-4">
						{tables.map((table) => (
							<button
								type="button"
								key={table}
								onClick={() => setSelectedTable(table)}
								className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${
									selectedTable === table
										? "bg-accent font-medium text-foreground"
										: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
								}`}
							>
								<Table2 className="h-3.5 w-3.5 shrink-0" />
								<span className="truncate">{table}</span>
							</button>
						))}
					</div>
				</ScrollArea>
			</div>

			{/* Main Area */}
			<div className="flex flex-1 flex-col">
				{selectedTable ? (
					<>
						{/* Table Header */}
						<div className="flex items-center justify-between border-b px-6 py-3">
							<div className="flex items-center gap-2">
								<Table2 className="h-4 w-4 text-muted-foreground" />
								<h2 className="font-medium text-sm">{selectedTable}</h2>
							</div>
							<div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
								<button
									type="button"
									onClick={() => setViewMode("structure")}
									className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-xs transition-all ${
										viewMode === "structure"
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<Columns className="h-3 w-3" />
									Structure
								</button>
								<button
									type="button"
									onClick={() => setViewMode("records")}
									className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-xs transition-all ${
										viewMode === "records"
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									<Layout className="h-3 w-3" />
									Records
								</button>
							</div>
						</div>

						{/* Table Content Placeholder */}
						<ScrollArea className="flex-1 p-6">
							<div className="animate-fade-in rounded-lg border bg-card">
								<div className="p-10">
									<div className="flex flex-col items-center justify-center text-center">
										{viewMode === "structure" ? (
											<>
												<Columns className="mb-3 h-8 w-8 text-muted-foreground/30" />
												<h3 className="font-medium text-sm">Table Structure</h3>
												<p className="mt-1 max-w-[220px] text-muted-foreground text-xs">
													Column definitions, types, and constraints for{" "}
													<span className="font-mono text-foreground/80">
														{selectedTable}
													</span>
												</p>
											</>
										) : (
											<>
												<Layout className="mb-3 h-8 w-8 text-muted-foreground/30" />
												<h3 className="font-medium text-sm">Table Records</h3>
												<p className="mt-1 max-w-[220px] text-muted-foreground text-xs">
													Browse and manage data in{" "}
													<span className="font-mono text-foreground/80">
														{selectedTable}
													</span>
												</p>
											</>
										)}
									</div>
								</div>
							</div>
						</ScrollArea>
					</>
				) : (
					/* Empty state: no table selected */
					<div className="flex flex-1 items-center justify-center">
						<div className="flex flex-col items-center text-center">
							<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border bg-muted/50">
								<Table2 className="h-5 w-5 text-muted-foreground/50" />
							</div>
							<h3 className="font-medium text-sm">Select a table</h3>
							<p className="mt-1 max-w-[220px] text-muted-foreground text-xs">
								Choose a table from the sidebar to view its schema and data.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function AIModule() {
	return (
		<div className="flex h-full w-full">
			{/* Left: Chat Interface */}
			<div className="flex w-[380px] shrink-0 flex-col border-r bg-background">
				<div className="flex items-center gap-2 border-b px-4 py-3">
					<MessageSquare className="h-4 w-4 text-muted-foreground" />
					<h3 className="font-medium text-sm">Chat</h3>
				</div>
				<ScrollArea className="flex-1 p-4">
					<div className="space-y-5">
						<div className="flex flex-col gap-1.5">
							<div className="mb-1 flex items-center gap-2">
								<div className="flex h-5 w-5 items-center justify-center rounded bg-foreground">
									<Sparkles className="h-3 w-3 text-background" />
								</div>
								<span className="font-medium text-[11px] text-muted-foreground">
									Synth AI
								</span>
							</div>
							<div className="rounded-xl rounded-tl-sm border bg-muted/40 px-4 py-3 text-sm leading-relaxed">
								What would you like to build? I can generate UI components
								customized to your schema and data.
							</div>
						</div>
					</div>
				</ScrollArea>

				{/* Input Area */}
				<div className="border-t p-3">
					<form
						className="flex flex-col overflow-hidden rounded-xl border bg-muted/30 transition-all focus-within:border-foreground/20"
						onSubmit={(e) => e.preventDefault()}
					>
						<textarea
							placeholder="Describe your UI..."
							className="min-h-[56px] w-full resize-none bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none"
							rows={2}
						/>
						<div className="flex items-center justify-between border-border/50 border-t px-3 py-2">
							<span className="font-medium text-[10px] text-muted-foreground/60 uppercase tracking-wider">
								Enter to send
							</span>
							<Button
								type="submit"
								size="icon"
								className="h-7 w-7 rounded-full"
							>
								<Send className="-ml-0.5 h-3 w-3" />
							</Button>
						</div>
					</form>
				</div>
			</div>

			{/* Right: Preview */}
			<div className="flex flex-1 flex-col">
				<div className="flex items-center justify-between border-b px-4 py-3">
					<span className="text-muted-foreground text-sm">Preview</span>
					<Button
						variant="outline"
						size="sm"
						className="h-7 gap-1.5 rounded-lg border-dashed px-3 text-[11px]"
					>
						<Code className="h-3 w-3" />
						React / Tailwind
					</Button>
				</div>
				<div className="flex flex-1 items-center justify-center p-6">
					<div className="relative flex w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-xl border p-16">
						{/* Dot grid background */}
						<div className="absolute inset-0 bg-[radial-gradient(oklch(0.3_0_0)_1px,transparent_1px)] opacity-20 [background-size:20px_20px]" />
						<div className="relative z-10 flex flex-col items-center">
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border bg-muted/30">
								<Sparkles className="h-4 w-4 text-muted-foreground/50" />
							</div>
							<p className="font-medium text-sm">Canvas is empty</p>
							<p className="mt-1 text-muted-foreground text-xs">
								Describe a UI to generate it
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
