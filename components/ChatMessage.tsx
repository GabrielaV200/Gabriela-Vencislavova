
import React from 'react';
import { type Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isModel = message.role === 'model';

    if (!message.content.trim()) return null;

    return (
        <div className={`flex items-start gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}>
            {isModel && (
                <div className="w-8 h-8 flex-shrink-0 bg-indigo-500 rounded-full flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-white" />
                </div>
            )}
            
            <div className={`max-w-lg xl:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${isModel ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none' : 'bg-indigo-500 text-white rounded-br-none'}`}>
                <MarkdownRenderer content={message.content} />
            </div>

            {!isModel && (
                 <div className="w-8 h-8 flex-shrink-0 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
            )}
        </div>
    );
};

export default ChatMessage;
