import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { SendIcon } from './icons/SendIcon';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex-1 flex items-end gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl p-2">
            <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste a job description or ask a question..."
                className="flex-1 bg-transparent focus:outline-none resize-none max-h-48 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 px-2"
                rows={1}
                disabled={isLoading}
            />
            <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-indigo-500 text-white rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label="Send message"
            >
                <SendIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ChatInput;
