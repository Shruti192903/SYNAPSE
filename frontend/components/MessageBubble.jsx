'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StreamingResponse } from './StreamingResponse';
import { ChartRenderer } from './ChartRenderer';
import { EmailPreviewWidget } from './EmailPreviewWidget';
import { FileText, Check, AlertTriangle, FileUp } from 'lucide-react';
// import { TableRenderer } from './TableRenderer'; // REMOVED: This component is defined below, not imported.

/**
 * MessageBubble component to render individual chat messages and dynamic widgets.
 * @param {{message: {id: number, sender: 'user' | 'agent', content: string, status?: 'streaming' | 'complete', metadata?: any, file?: any}, setMessages: (updateFn: (prev: any[]) => any[]) => void}} props
 */
export const MessageBubble = ({ message, setMessages }) => {
    const isUser = message.sender === 'user';
    const isStreaming = message.status === 'streaming';
    const widget = message.metadata?.widget;

    // Handler for a widget action that generates new output (e.g., 'Send Email')
    const handleWidgetAction = (message) => {
        setMessages((prev) => {
            // Remove the old message/widget (or update its content)
            const newMessages = prev.map(m => {
                if (m.id === message.id) {
                    // Update the existing message to show the action result
                    return { 
                        ...m, 
                        content: (m.content || "") + `\n\n**Action Complete:** ${message}`,
                        metadata: { ...m.metadata, widget: null }, // Hide the widget
                        status: 'complete'
                    };
                }
                return m;
            });
            return newMessages;
        });
    };

    const bubbleClassName = cn(
        'max-w-[80%] p-3 rounded-xl shadow-md transition-all duration-300 ease-in-out',
        isUser
            ? 'ml-auto bg-primary text-primary-foreground rounded-br-none'
            : 'mr-auto bg-muted rounded-tl-none border'
    );

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`} key={message.id}>
            <div className='flex flex-col max-w-full'>
                <Card className={bubbleClassName}>
                    <CardContent className="p-0 prose dark:prose-invert max-w-none">
                        
                        {/* File Attachment Icon */}
                        {message.file && (
                            <div className="flex items-center text-sm mb-2 p-1 rounded-md bg-background/50 text-foreground">
                                <FileUp className="w-4 h-4 mr-2" />
                                <span className="font-semibold">{message.file.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">({message.file.type.split('/')[1].toUpperCase()})</span>
                            </div>
                        )}

                        /* Agent Streaming/Static Text */
                        <div className="min-w-[100px]">
                             <StreamingResponse text={message.content} isStreaming={isStreaming} />
                        </div>
                        
                        /* Status/Thought Indicator */
                        {isStreaming && message.metadata?.thought && (
                            <div className="mt-2 text-xs text-primary/70 italic p-1 border-t border-muted-foreground/30">
                                {message.metadata.thought.replace('**', '').replace('**', '')}
                            </div>
                        )}
                        
                    </CardContent>
                </Card>
                
                /* Dynamic Widget Rendering (outside the bubble for full width) */
                {widget && (
                    <div className="max-w-full">
                        {widget.type === 'chart' && <ChartRenderer chartJson={widget.data} />}
                        {widget.type === 'email_preview' && (
                            <EmailPreviewWidget 
                                previewData={widget.data} 
                                onSendSuccess={(msg) => handleWidgetAction(msg)}
                            />
                        )}
                        {widget.type === 'table' && <TableRenderer tableData={widget.data} />}
                    </div>
                )}
            </div>
        </div>
    );
};


/**
 * Placeholder for the TableRenderer component.
 * In a full project, this would use Shadcn/UI table component.
 */
export const TableRenderer = ({ tableData }) => {
    if (!tableData || !tableData.rows || tableData.rows.length === 0) return null;
    
    const { caption, headers, rows } = tableData;
    
    return (
        <Card className="mt-4 shadow-lg border-secondary/50">
            <CardHeader>
                <CardTitle className="text-lg">Claim Verification Table</CardTitle>
                <CardDescription>{caption}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted">
                                {headers.map((header, i) => (
                                    <th key={i} className="border p-2 text-left text-sm font-semibold whitespace-nowrap">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} className="hover:bg-muted/50">
                                    {row.map((cell, j) => (
                                        <td key={j} className="border p-2 text-sm max-w-xs overflow-hidden text-ellipsis">
                                            {/* Special handling for Confidence Score column */}
                                            {headers[j].includes('Confidence') ? (
                                                <div className="flex items-center">
                                                    {cell >= 80 ? (
                                                        <Check className="w-4 h-4 mr-1 text-green-500" />
                                                    ) : cell < 50 ? (
                                                        <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                                                    ) : null}
                                                    {cell}%
                                                </div>
                                            ) : (
                                                cell
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};