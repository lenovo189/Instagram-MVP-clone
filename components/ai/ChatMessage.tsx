'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
    const isUser = role === 'user';

    return (
        <div className={`flex gap-3 p-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                </div>
            )}
            <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-card-foreground'
                    }`}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap break-words">{content}</p>
                ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-card-foreground prose-a:text-primary prose-code:text-primary prose-pre:bg-muted prose-pre:border prose-pre:border-border">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const isInline = !match;

                                    if (isInline) {
                                        return (
                                            <code
                                                className="px-1.5 py-0.5 rounded bg-muted text-primary font-mono text-sm"
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        );
                                    }

                                    return (
                                        <div className="relative group">
                                            <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                {match[1]}
                                            </div>
                                            <pre className="!bg-muted !border !border-border rounded-lg overflow-x-auto">
                                                <code className={`${className} block p-4 font-mono text-sm`} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        </div>
                                    );
                                },
                                ul({ children }) {
                                    return <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>;
                                },
                                ol({ children }) {
                                    return <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>;
                                },
                                blockquote({ children }) {
                                    return (
                                        <blockquote className="border-l-4 border-primary pl-4 italic my-2 text-muted-foreground">
                                            {children}
                                        </blockquote>
                                    );
                                },
                                table({ children }) {
                                    return (
                                        <div className="overflow-x-auto my-2">
                                            <table className="min-w-full border border-border rounded-lg">
                                                {children}
                                            </table>
                                        </div>
                                    );
                                },
                                th({ children }) {
                                    return (
                                        <th className="px-4 py-2 bg-muted border-b border-border text-left font-semibold">
                                            {children}
                                        </th>
                                    );
                                },
                                td({ children }) {
                                    return <td className="px-4 py-2 border-b border-border">{children}</td>;
                                },
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                        {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                        )}
                    </div>
                )}
            </div>
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <svg className="w-5 h-5 text-secondary-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
            )}
        </div>
    );
}
