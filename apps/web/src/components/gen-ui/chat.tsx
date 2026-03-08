'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendIcon, SparklesIcon, DatabaseIcon } from "lucide-react";
import { GenUIDataTable } from "./tools/data-table";
import { GenUIMetricCard } from "./tools/metric-card";
import { GenUIChart } from "./tools/chart";
import { GenUIUserForm } from "./tools/user-form";

interface GenerativeUIChatProps {
    schema: any;  
}

export function GenerativeUIChat({ schema }: GenerativeUIChatProps) {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/gen-ui',
            body: {
                schema,
            },
        }),
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isLoading) return;

        sendMessage({ role: 'user', parts: [{ type: 'text', text }] });
        setInput('');
    };

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto bg-background/50 backdrop-blur-xl border-x overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center space-x-2">
                    <div className="p-2 bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight uppercase">Synth Generative UI</h2>
                        <div className="flex items-center text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                            <DatabaseIcon className="w-3 h-3 mr-1" />
                            Connected to Schema
                        </div>
                    </div>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full border border-emerald-500/20 uppercase tracking-tighter">
                    {status}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth"
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                        <div className="p-4 bg-muted rounded-full">
                            <SparklesIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">How should I build your dashboard today?</p>
                            <p className="text-xs text-muted-foreground mt-1">Try: "Show me a table of recent orders with total revenue metrics"</p>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] space-y-2 ${message.role === 'user' ? 'bg-primary text-primary-foreground px-4 py-2 rounded-2xl shadow-lg shadow-primary/10' : 'w-full'}`}>
                            {message.role === 'user' ? (
                                <p className="text-sm leading-relaxed">{message.parts?.[0]?.type === 'text' ? message.parts[0].text : ''}</p>
                            ) : (
                                <div className="space-y-6">
                                    {message.parts?.map((part, index) => {
                                        if (part.type === 'text') {
                                            return <p key={index} className="text-sm text-foreground/80 leading-relaxed font-medium">{part.text}</p>;
                                        }

                                        // AI SDK 5.0 Typed Tool Parts Rendering: tool-${toolName}
                                        if (part.type.startsWith('tool-')) {
                                            const toolName = part.type.replace('tool-', '');
                                            const state = (part as any).state;
                                            const output = (part as any).output;

                                            return (
                                                <div key={index} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    {(state === 'input-available' || state === 'input-streaming') && (
                                                        <div className="flex items-center space-x-2 text-xs text-muted-foreground py-2">
                                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                            <span>Gathering data for {toolName}...</span>
                                                        </div>
                                                    )}

                                                    {state === 'output-available' && (
                                                        <div className="my-4">
                                                            {toolName === 'renderDataTable' && <GenUIDataTable {...output} />}
                                                            {toolName === 'renderMetricCard' && <GenUIMetricCard {...output} />}
                                                            {toolName === 'renderChart' && <GenUIChart {...output} />}
                                                            {toolName === 'renderUserForm' && <GenUIUserForm {...output} />}
                                                        </div>
                                                    )}

                                                    {state === 'output-error' && (
                                                        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 my-2">
                                                            Error rendering {toolName}: {(part as any).errorText || 'Unknown error'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t bg-muted/5">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center space-x-3 bg-background border p-1 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your dashboard features..."
                        className="flex-1 border-none focus-visible:ring-0 h-11 bg-transparent text-sm font-medium placeholder:text-muted-foreground/50"
                        disabled={isLoading}
                        autoComplete="off"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className={`rounded-xl w-10 h-10 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 ${isLoading ? 'opacity-50' : ''}`}
                        disabled={isLoading || !input.trim()}
                    >
                        <SendIcon className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
