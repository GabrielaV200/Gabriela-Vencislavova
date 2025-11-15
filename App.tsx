import React, { useState, useEffect, useRef, useCallback } from 'react';
import { type Message } from './types';
import { type Chat, type GenerateContentResponse } from '@google/genai';
import { initChat } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { SparklesIcon } from './components/icons/SparklesIcon';
import ResumeTailorModal from './components/ResumeTailorModal';
import SkillsExtractorModal from './components/SkillsExtractorModal';
import CoverLetterModal from './components/CoverLetterModal';
import JobMatchModal from './components/JobMatchModal';
import { DocumentTextIcon } from './components/icons/DocumentTextIcon';
import { ListBulletIcon } from './components/icons/ListBulletIcon';
import { EnvelopeIcon } from './components/icons/EnvelopeIcon';
import { PlusIcon } from './components/icons/PlusIcon';
import { BriefcaseIcon } from './components/icons/BriefcaseIcon';

const CHAT_HISTORY_KEY = 'ai-job-search-assistant-chat';

const welcomeMessage: Message = {
    role: 'model',
    content: "Hello! I'm your AI Job Search Assistant. How can I help you land your dream job today? You can start by pasting a job description.",
};

interface ModalData {
    jobDescription: string;
    resume: string;
}

const App: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
    const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false);
    const [isJobMatchModalOpen, setIsJobMatchModalOpen] = useState(false);
    const [modalData, setModalData] = useState<ModalData | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        try {
            const savedHistoryJSON = localStorage.getItem(CHAT_HISTORY_KEY);
            let initialMessages: Message[] = [welcomeMessage];

            if (savedHistoryJSON) {
                const savedHistory = JSON.parse(savedHistoryJSON);
                if (Array.isArray(savedHistory) && savedHistory.length > 0) {
                    initialMessages = savedHistory;
                }
            }
            setMessages(initialMessages);

            const historyForApi = initialMessages.length > 1 ? initialMessages.slice(1) : [];
            const chatSession = initChat(historyForApi);
            setChat(chatSession);
        } catch (e: any) {
            setError('Failed to initialize chat session. Please check your API key.');
            console.error(e);
        }
    }, []);

    useEffect(() => {
        // Don't save if it's just the initial welcome message
        if (messages.length > 1) {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    const handleNewChat = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setMessages([welcomeMessage]);
        localStorage.removeItem(CHAT_HISTORY_KEY);
        setChat(initChat());
    }, []);

    const handleSendMessage = useCallback(async (userInput: string) => {
        if (isLoading || !userInput.trim() || !chat) return;

        setIsLoading(true);
        setError(null);
        
        const userMessage: Message = { role: 'user', content: userInput };
        const modelMessage: Message = { role: 'model', content: '' };
        
        setMessages(prevMessages => [...prevMessages, userMessage, modelMessage]);

        try {
            const result = await chat.sendMessageStream({ message: userInput });

            for await (const chunk of result) {
                const chunkText = (chunk as GenerateContentResponse).text;
                setMessages(prev =>
                    prev.map((msg, index) =>
                        index === prev.length - 1 ? { ...msg, content: msg.content + chunkText } : msg
                    )
                );
            }
        } catch (e: any) {
            console.error(e);
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            setError(errorMessage);
            setMessages(prev =>
                prev.map((msg, index) =>
                    index === prev.length - 1 ? { ...msg, content: errorMessage } : msg
                )
            );
        } finally {
            setIsLoading(false);
        }
    }, [chat, isLoading]);
    
    const openModalWithData = (setter: React.Dispatch<React.SetStateAction<boolean>>, data: ModalData) => {
        setModalData(data);
        setter(true);
    };

    const closeModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter(false);
        setModalData(null); // Clear data when any modal is closed
    };


    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-sans">
            <header className="bg-white dark:bg-gray-900 shadow-md p-4 flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <SparklesIcon className="w-8 h-8 text-indigo-500" />
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">AI Job Search Assistant</h1>
                </div>
                <button
                    onClick={handleNewChat}
                    title="New Chat"
                    className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    aria-label="Start a new chat"
                >
                    <PlusIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                ))}
                {isLoading && messages[messages.length-1].role === 'model' && (
                     <div className="flex justify-start items-start gap-3">
                        <div className="w-8 h-8 flex-shrink-0 bg-indigo-500 rounded-full flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 max-w-lg shadow-sm">
                           <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            <footer className="bg-white dark:bg-gray-900/80 backdrop-blur-sm p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
                {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-end gap-2">
                        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                        <button
                            onClick={() => setIsJobMatchModalOpen(true)}
                            title="Job Matchmaker"
                            className="p-2 h-10 flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                            aria-label="Open job matchmaker tool"
                            disabled={isLoading}
                        >
                            <BriefcaseIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={() => setIsSkillsModalOpen(true)}
                            title="Extract Skills"
                            className="p-2 h-10 flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                            aria-label="Open skills extractor tool"
                            disabled={isLoading}
                        >
                            <ListBulletIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                         <button
                            onClick={() => setIsResumeModalOpen(true)}
                            title="Tailor Resume"
                            className="p-2 h-10 flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                            aria-label="Open resume tailor tool"
                            disabled={isLoading}
                        >
                            <DocumentTextIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={() => setIsCoverLetterModalOpen(true)}
                            title="Generate Cover Letter"
                            className="p-2 h-10 flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                            aria-label="Open cover letter generator tool"
                            disabled={isLoading}
                        >
                            <EnvelopeIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>
            </footer>
            {isResumeModalOpen && <ResumeTailorModal onClose={() => closeModal(setIsResumeModalOpen)} initialData={modalData} />}
            {isSkillsModalOpen && <SkillsExtractorModal onClose={() => closeModal(setIsSkillsModalOpen)} initialData={modalData} />}
            {isCoverLetterModalOpen && <CoverLetterModal onClose={() => closeModal(setIsCoverLetterModalOpen)} initialData={modalData} />}
            {isJobMatchModalOpen && <JobMatchModal 
                onClose={() => setIsJobMatchModalOpen(false)} 
                onSelectJob={(data) => {
                    // This is an example of how you could chain modals
                    // For now, let's just log it. A more complex implementation could open another modal.
                    console.log("Selected job:", data);
                    // Example: open Resume Tailor with pre-filled data
                    openModalWithData(setIsResumeModalOpen, data);
                }}
            />}
        </div>
    );
};

export default App;