'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { fetcher } from '@/lib/fetcher';

/**
 * Renders an email preview and handles the final 'Send' action.
 * @param {{previewData: {to: string, subject: string, html: string, message: string}, onSendSuccess: (message: string) => void}} props
 */
export const EmailPreviewWidget = ({ previewData, onSendSuccess }) => {
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();
    const { to, subject, html, message } = previewData;

    const handleSendEmail = async () => {
        setIsSending(true);
        try {
            const response = await fetcher('/api/agent/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ to, subject, html }),
            });

            if (response.success) {
                toast({
                    title: 'Email Sent!',
                    description: `Successfully sent offer letter to ${to}.`,
                    variant: 'default',
                });
                onSendSuccess(response.message || `Offer letter sent to ${to}.`);
            } else {
                 throw new Error(response.message || 'Failed to send email.');
            }

        } catch (error) {
            console.error('Send email error:', error);
            toast({
                title: 'Email Send Failed',
                description: `Error: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className="mt-4 shadow-xl border-primary">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Mail className="w-5 h-5 text-primary" /> Offer Letter Draft
                </CardTitle>
                <CardDescription>
                    {message}
                </CardDescription>
                <div className="text-sm text-muted-foreground pt-2">
                    **To:** {to} | **Subject:** {subject}
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-white dark:bg-black overflow-y-auto">
                    {/* Render the HTML content inside an iframe or div for better isolation/preview */}
                    <div 
                        className="prose dark:prose-invert max-w-none" 
                        dangerouslySetInnerHTML={{ __html: html }} 
                    />
                </ScrollArea>
                
                <Button 
                    onClick={handleSendEmail} 
                    disabled={isSending} 
                    className="mt-4 w-full"
                >
                    {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Mail className="mr-2 h-4 w-4" />
                    )}
                    {isSending ? 'Sending...' : 'Send Email'}
                </Button>
            </CardContent>
        </Card>
    );
};