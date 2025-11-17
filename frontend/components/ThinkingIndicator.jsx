'use client';

import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MessageBubble } from './MessageBubble'; // Import for styling consistency

/**
 * Animated "Thinking..." indicator for the agent.
 * @param {{text: string}} props
 */
export const ThinkingIndicator = ({ text = "Thinking..." }) => {
    return (
        <div className="flex justify-start">
            <motion.div 
                className="bg-muted p-3 rounded-xl rounded-bl-none max-w-xs flex items-center shadow-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-primary" />
                <p className="text-sm font-medium text-primary">
                    {text.replace('**', '').replace('**', '')}
                </p>
            </motion.div>
        </div>
    );
};