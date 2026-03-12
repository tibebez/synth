"use client";

import {
	ActionProvider,
	Renderer,
	StateProvider,
	useUIStream,
	ValidationProvider,
	VisibilityProvider,
} from "@json-render/react";
import type { FullSchemaType } from "@synth/types";
import {
	ArrowLeft,
	Code,
	MessageSquare,
	Plus,
	SendIcon,
	SparklesIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { registry } from "@/lib/json-render-registry";

interface JsonRenderChatProps {
	projectName: string;
	schema: FullSchemaType;
	conversationId?: string;
	conversations: Array<{
		id: string;
		title: string;
		messageCount: number;
		updatedAt: string;
	}>;
	onConversationChange?: (conversationId: string | undefined) => void;
	onNewMessage?: () => void;
	onLoadConversations?: () => void;
}

export function JsonRenderChat({
	projectName,
	schema,
	conversationId: propConversationId,
	conversations,
	onConversationChange,
	onNewMessage,
	onLoadConversations,
}: JsonRenderChatProps) {
	const [input, setInput] = useState("");
	const [conversationId, setConversationId] = useState(propConversationId);
	const [showList, setShowList] = useState(!propConversationId);
	const [messages, setMessages] = useState<
		Array<{ role: string; content: string }>
	>([]);
	const scrollRef = useRef<HTMLDivElement>(null);

	// CLI API URL
	const CLI_URL = "http://localhost:4000";

	const { spec, isStreaming, error, send, clear } = useUIStream({
		api: `${CLI_URL}/api/ai-json-render`,
	});

	// Scroll to bottom when messages change
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages]);

	// Sync conversationId from props
	useEffect(() => {
		setConversationId(propConversationId);
		if (propConversationId) {
			setShowList(false);
		}
	}, [propConversationId]);

	// Load conversation messages when conversationId changes
	useEffect(() => {
		if (conversationId) {
			// Load existing conversation messages
			fetch(`${CLI_URL}/api/conversations/${projectName}/${conversationId}`)
				.then((res) => res.json())
				.then((data) => {
					if (data.success && data.conversation) {
						setMessages(data.conversation.messages || []);
					}
				})
				.catch((err) =>
					console.error("Failed to load conversation messages:", err),
				);
		} else {
			// Clear messages when starting new conversation
			setMessages([]);
		}
	}, [conversationId, projectName, CLI_URL]);

	const handleBackToList = () => {
		setShowList(true);
	};

	const handleSelectConversation = (id: string) => {
		setConversationId(id);
		setShowList(false);
		onConversationChange?.(id);
	};

	const handleNewConversation = () => {
		setConversationId(undefined);
		setMessages([]);
		setShowList(false);
		onConversationChange?.(undefined);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const text = input.trim();
		if (!text || isStreaming) return;

		// Add user message to display immediately
		setMessages((prev) => [...prev, { role: "user", content: text }]);

		// Validate schema before creating conversation
		if (!schema || !schema.tables) {
			console.error("Invalid schema:", schema);
			send(text);
			setInput("");
			return;
		}

		// Create or get conversation
		let currentConversationId = conversationId;
		if (!currentConversationId) {
			try {
				const response = await fetch(
					`${CLI_URL}/api/conversations/${projectName}`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ schema }),
					},
				);
				const data = await response.json();
				if (data.success && data.conversation?.metadata?.id) {
					currentConversationId = data.conversation.metadata.id;
					setConversationId(currentConversationId);
					if (currentConversationId) {
						onConversationChange?.(currentConversationId);
					}
				}
			} catch (error) {
				console.error("Error creating conversation:", error);
			}
		}

		// Save user message to conversation
		if (currentConversationId) {
			await fetch(
				`${CLI_URL}/api/conversations/${projectName}/${currentConversationId}/messages`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ role: "user", content: text }),
				},
			);
			onNewMessage?.();
		}

		// Enhance prompt with conversation context if we have a conversation
		let enhancedPrompt = text;
		if (currentConversationId) {
			try {
				const convResponse = await fetch(
					`${CLI_URL}/api/conversations/${projectName}/${currentConversationId}`,
				);
				const convData = await convResponse.json();
				if (convData.success && convData.conversation) {
					const recentMessages = convData.conversation.messages
						.slice(-6)
						.map((m: any) => `${m.role}: ${m.content}`)
						.join("\n");
					if (recentMessages) {
						enhancedPrompt = `Previous conversation:\n${recentMessages}\n\nCurrent request: ${text}`;
					}
				}
			} catch (error) {
				console.error("Failed to load conversation context:", error);
			}
		}

		send(enhancedPrompt);
		setInput("");
	};

	return (
		<div className="flex h-full w-full">
			{/* Left Panel: Conversation List or Chat */}
			<div className="flex w-[380px] shrink-0 flex-col border-r bg-background">
				{showList ? (
					<>
						{/* List Header */}
						<div className="flex items-center justify-between border-b px-4 py-3">
							<h3 className="font-medium text-foreground text-sm">
								Conversations
							</h3>
							<Button
								size="icon"
								variant="ghost"
								className="h-7 w-7"
								onClick={handleNewConversation}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>

						{/* List Content */}
						<div className="flex-1 overflow-y-auto p-2">
							{conversations.length === 0 ? (
								<div className="flex flex-col items-center justify-center py-12 text-center">
									<MessageSquare className="mb-3 h-8 w-8 text-muted-foreground/20" />
									<p className="font-medium text-muted-foreground text-xs">
										No conversations yet
									</p>
									<Button
										variant="link"
										className="mt-1 h-auto p-0 text-[11px] text-primary"
										onClick={handleNewConversation}
									>
										Start your first one
									</Button>
								</div>
							) : (
								<div className="space-y-1">
									{conversations
										.filter((conv) => conv && conv.id)
										.map((conv) => (
											<button
												key={conv.id}
												type="button"
												onClick={() => handleSelectConversation(conv.id)}
												className={`w-full rounded-lg px-3 py-2.5 text-left transition-all ${
													conversationId === conv.id
														? "bg-accent text-foreground shadow-sm"
														: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
												}`}
											>
												<div className="truncate font-medium text-xs">
													{conv.title}
												</div>
												<div className="mt-1.5 flex items-center justify-between">
													<span className="text-[10px] opacity-50">
														{conv.messageCount} messages
													</span>
													<span className="text-[10px] opacity-50">
														{new Date(conv.updatedAt).toLocaleDateString()}
													</span>
												</div>
											</button>
										))}
								</div>
							)}
						</div>
					</>
				) : (
					<>
						{/* Chat Header */}
						<div className="flex items-center gap-2 border-b px-3 py-3">
							<Button
								variant="ghost"
								size="icon"
								className="-ml-1 h-7 w-7"
								onClick={handleBackToList}
							>
								<ArrowLeft className="h-4 w-4" />
							</Button>
							<div className="flex flex-col">
								<h3 className="font-medium text-xs leading-none">
									{conversations.find((c) => c.id === conversationId)?.title ||
										"New Chat"}
								</h3>
								<div className="mt-1 flex items-center gap-1.5">
									<div
										className={`h-1.5 w-1.5 rounded-full ${isStreaming ? "animate-pulse bg-yellow-500" : "bg-emerald-500"}`}
									/>
									<span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
										{isStreaming ? "Streaming" : "Ready"}
									</span>
								</div>
							</div>
						</div>

						{/* Chat Content */}
						<div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
							<div className="space-y-5">
								{messages.length === 0 && !spec && (
									<div className="flex flex-col gap-1.5">
										<div className="mb-1 flex items-center gap-2">
											<div className="flex h-5 w-5 items-center justify-center rounded bg-foreground">
												<SparklesIcon className="h-3 w-3 text-background" />
											</div>
											<span className="font-medium text-[11px] text-muted-foreground">
												Synth AI
											</span>
										</div>
										<div className="rounded-xl rounded-tl-sm border bg-muted/40 px-4 py-3 text-sm leading-relaxed">
											What would you like to build? I can generate UI components
											customized to your schema and data using JSON Render.
										</div>
									</div>
								)}

								{messages.map((msg, idx) => (
									<div
										key={msg.content.slice(0, 30)}
										className={`flex ${
											msg.role === "user" ? "justify-end" : "justify-start"
										}`}
									>
										<div
											className={`max-w-[85%] rounded-lg px-4 py-2 ${
												msg.role === "user"
													? "bg-primary text-primary-foreground shadow-sm"
													: "bg-muted text-foreground"
											} text-sm`}
										>
											{msg.content}
										</div>
									</div>
								))}

								{error && (
									<div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-500 text-sm">
										Error: {error.message}
									</div>
								)}

								{isStreaming && (
									<div className="flex items-center gap-2 text-muted-foreground text-xs">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
										<span>Generating UI...</span>
									</div>
								)}
							</div>
						</div>

						{/* Input Area */}
						<div className="border-t p-3">
							<form
								className="flex flex-col overflow-hidden rounded-xl border bg-muted/30 transition-all focus-within:border-foreground/20"
								onSubmit={handleSubmit}
							>
								<textarea
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="Describe your UI..."
									className="min-h-[56px] w-full resize-none bg-transparent px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none"
									rows={2}
									disabled={isStreaming}
								/>
								<div className="flex items-center justify-between border-border/50 border-t px-3 py-2">
									<span className="font-medium text-[10px] text-muted-foreground/60 uppercase tracking-wider">
										Enter to send
									</span>
									<Button
										type="submit"
										size="icon"
										className="h-7 w-7 rounded-full transition-transform active:scale-95"
										disabled={isStreaming || !input.trim()}
									>
										<SendIcon className="-ml-0.5 h-3 w-3" />
									</Button>
								</div>
							</form>
						</div>
					</>
				)}
			</div>

			{/* Right: Preview */}
			<div className="flex flex-1 flex-col">
				<div className="flex items-center justify-between border-b px-4 py-3">
					<span className="text-muted-foreground text-sm">Preview</span>
					<Button
						variant="outline"
						size="sm"
						className="h-7 gap-1.5 rounded-lg border-dashed px-3 text-[11px]"
						onClick={() => clear()}
					>
						<Code className="h-3 w-3" />
						Clear
					</Button>
				</div>
				<div className="flex flex-1 flex-col overflow-y-auto p-6">
					{spec ? (
						<div className="w-full rounded-xl border bg-card p-6 shadow-sm">
							<StateProvider initialState={{}}>
								<VisibilityProvider>
									<ActionProvider
										handlers={{
											submit: (_params) => {
												// Handle submit action
											},
											navigate: (_params) => {
												// Handle navigate action
											},
										}}
									>
										<ValidationProvider customFunctions={{}}>
											<Renderer
												spec={spec}
												registry={registry}
												loading={isStreaming}
											/>
										</ValidationProvider>
									</ActionProvider>
								</VisibilityProvider>
							</StateProvider>
						</div>
					) : (
						<div className="relative mx-auto flex w-full max-w-xl flex-col items-center justify-center overflow-hidden rounded-xl border p-16">
							{/* Dot grid background */}
							<div className="absolute inset-0 bg-[radial-gradient(oklch(0.3_0_0)_1px,transparent_1px)] opacity-20 [background-size:20px_20px]" />
							<div className="relative z-10 flex flex-col items-center">
								<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border bg-muted/30">
									<SparklesIcon className="h-4 w-4 text-muted-foreground/50" />
								</div>
								<p className="font-medium text-sm">Canvas is empty</p>
								<p className="mt-1 text-muted-foreground text-xs">
									Describe a UI to generate it using JSON Render
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
