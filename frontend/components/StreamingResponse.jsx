'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Component to stream and display text with a typewriter effect, supporting markdown.
 * @param {{text: string, isStreaming: boolean}} props
 */
export const StreamingResponse = ({ text, isStreaming = false }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [animationComplete, setAnimationComplete] = useState(!isStreaming);
    const containerRef = useRef(null);
    const inView = useInView(containerRef);
    
    // The delay for the typewriter effect (in ms)
    const TYPE_DELAY = 10; 

    // Typewriter effect logic
    useEffect(() => {
        if (!isStreaming || animationComplete) {
            setDisplayedText(text); // Ensure the full text is shown if streaming stops or is initially false
            return;
        }

        let i = displayedText.length;
        const fullText = text;
        
        // This effect runs whenever 'text' updates while streaming.
        const typeChar = () => {
            if (i < fullText.length) {
                // Only animate the new characters
                const newChar = fullText.charAt(i);
                setDisplayedText(prev => prev + newChar);
                i++;
                setTimeout(typeChar, TYPE_DELAY);
            } else {
                // If the stream is still going, we wait for the next text update
                // If isStreaming becomes false, the state will be updated via the cleanup function or the dependency array change.
                if (!isStreaming) {
                    setAnimationComplete(true);
                }
            }
        };
        
        // Start typing from the point where the last update left off
        const timeout = setTimeout(typeChar, TYPE_DELAY);

        // Cleanup: clear timeout
        return () => {
            clearTimeout(timeout);
            // If the component unmounts or streaming stops, ensure full text is shown
            if (!isStreaming) {
                setDisplayedText(text);
                setAnimationComplete(true);
            }
        };
    }, [text, isStreaming, animationComplete]);
    
    // Convert the displayed text to HTML using marked for markdown rendering
    const rawMarkup = marked.parse(displayedText);
    const cleanHtml = DOMPurify.sanitize(rawMarkup);

    return (
        <div ref={containerRef} className="markdown-content">
            <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
        </div>
    );
};