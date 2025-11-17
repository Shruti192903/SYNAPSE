// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { useSearchParams } from 'next/navigation';
// import { Send, Loader2, FileText, ArrowRight } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Textarea } from '@/components/ui/textarea';
// import { Card, CardContent } from '@/components/ui/card';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { fetchAgentResponse } from '@/lib/streamingClient';
// import { MessageBubble } from '@/components/MessageBubble.jsx';
// import { FileUploadBox } from '@/components/FileUploadBox.jsx';
// import { ThinkingIndicator } from '@/components/ThinkingIndicator.jsx';
// import { useToast } from '@/components/ui/use-toast.js';
// import { cn } from '@/lib/utils';
// import { ThemeToggle } from '@/components/ThemeToggle.jsx';

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchAgentResponse } from '@/lib/streamingClient';
import { MessageBubble } from '@/components/MessageBubble';
import { FileUploadBox } from '@/components/FileUploadBox';
import { ThinkingIndicator } from '@/components/ThinkingIndicator';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle'; 

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState(null);
    const scrollRef = useRef(null);
    const { toast } = useToast();

    // Scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages]);

    // Dummy logic for demonstration (replace with actual fetchAgentResponse logic)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!input.trim() && !file) || isLoading) return;
        
        setIsLoading(true);
        // Simulate adding user message and agent placeholder
        const userMessageId = messages.length + 1;
        
        setMessages((prev) => [
            ...prev,
            {
                id: userMessageId,
                sender: 'user',
                content: input.trim() || `Attached: ${file?.name}`,
                file: file ? { name: file.name, type: file.type } : undefined,
            },
            {
                id: userMessageId + 1,
                sender: 'agent',
                content: '',
                status: 'thinking',
                metadata: { thought: 'Analyzing intent...' },
            },
        ]);
        
        const currentInput = input;
        const currentFile = file;
        setInput('');
        setFile(null); 
        
        // --- REAL LOGIC: Replace this placeholder block with actual streaming ---
        try {
            // NOTE: Re-implement the real streaming logic here using fetchAgentResponse
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg.id === userMessageId + 1 && msg.sender === 'agent'
                        ? { ...msg, content: `Analysis complete for: "${currentInput}". Found 5 key metrics.`, status: 'complete', metadata: {} }
                        : msg
                )
            );

        } catch (error) {
            console.error('Streaming error:', error);
            setMessages((prev) => 
                prev.map(m => m.id === userMessageId + 1 ? { ...m, content: `Error: ${error.message}`, status: 'error' } : m)
            );
        } finally {
            setIsLoading(false);
        }
        // --- END REAL LOGIC ---
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };
    
    return (
        // Full screen container for centering
        <div className="flex flex-col h-screen bg-background text-foreground font-sans">
            
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/80 backdrop-blur-sm shadow-md z-10">
                <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
                    Synapse <span className="text-xl font-medium text-muted-foreground">Agent 🧠</span>
                </h1>
                <ThemeToggle />
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative">
                <ScrollArea ref={scrollRef} className="h-full w-full">
                    
                    {messages.length === 0 ? (
                        
                        // *** CENTERED MINIMAL UI (Vercel/Notion Vibe) ***
                        <div className="flex flex-col items-center justify-center min-h-full h-full text-center px-4 md:px-8 py-16">
                            
                            <Card className="max-w-3xl w-full p-8 md:p-12 bg-card/70 shadow-2xl shadow-primary/10 rounded-2xl border border-border/50 transition-all duration-300 hover:shadow-primary/20">
                                
                                <FileText className="w-10 h-10 mb-6 text-primary mx-auto opacity-80" />
                                
                                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-4">
                                    <span className="text-primary">Synapse</span> Knowledge Workspace
                                </h2>
                                
                                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 tracking-tight leading-relaxed">
                                    Your autonomous agent for **advanced data analysis, contract drafting, and real-time claim verification** across PDFs, CSVs, and images.
                                </p>
                                
                                {/* Centralized Input/Action Area */}
                                <div className="flex flex-col items-center space-y-4">
                                    
                                    <FileUploadBox file={file} setFile={setFile} disabled={isLoading} />
                                    
                                    {/* Combined Input and Button */}
                                    <div className="flex w-full max-w-lg items-end gap-3">
                                        <Textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={file ? `Attached file: ${file.name}. Ask for analysis or drafting...` : 'Ask a general question or describe your task...'}
                                            className="min-h-[50px] resize-none border-2 shadow-inner focus:ring-2 focus:ring-primary/50"
                                            rows={1}
                                        />
                                        <Button 
                                            onClick={handleSendMessage} 
                                            disabled={isLoading || (!input.trim() && !file)} 
                                            size="icon" 
                                            className="h-[50px] w-[50px] shrink-0 text-lg transition-all duration-200"
                                        >
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                        </div>
                    ) : (
                        // *** CHAT MESSAGE RENDERING (when history exists) ***
                        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
                            {messages.map((msg, index) => (
                                <MessageBubble key={index} message={msg} setMessages={setMessages} />
                            ))}
                            {isLoading && <ThinkingIndicator text={messages.slice(-1)[0]?.metadata?.thought || "Thinking..."} />}
                        </div>
                    )}
                </ScrollArea>
            </main>

            {/* Sticky Input Area (Only shown when chat history is present) */}
            {messages.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-background border-t border-border/50 shadow-2xl z-10">
                    <div className="max-w-3xl mx-auto flex items-end gap-3">
                        
                        {/* Compact File Indicator/Remover */}
                        {file && (
                            <Card className="absolute -top-14 left-1/2 -translate-x-1/2 bg-card p-2 text-sm flex items-center gap-2 rounded-lg border-primary/50 shadow-md">
                                <FileText className="w-4 h-4 text-primary" />
                                <span>{file.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="h-auto p-1 opacity-70 hover:opacity-100">
                                    <X className="w-3 h-3" />
                                </Button>
                            </Card>
                        )}
                        
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Continue the conversation..."
                            className="min-h-[50px] resize-none pr-10"
                            rows={1}
                        />
                        <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} size="icon" className="h-[50px] w-[50px] shrink-0">
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}