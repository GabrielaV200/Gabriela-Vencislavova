import React, { useState, useEffect, useCallback } from 'react';
import { extractSkillsFromJD } from '../services/geminiService';
import { ListBulletIcon } from './icons/ListBulletIcon';
import MarkdownRenderer from './MarkdownRenderer';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface SkillsExtractorModalProps {
    onClose: () => void;
    initialData?: { jobDescription?: string; } | null;
}

const SkillsExtractorModal: React.FC<SkillsExtractorModalProps> = ({ onClose, initialData }) => {
    const [jobDescription, setJobDescription] = useState(initialData?.jobDescription || '');
    const [extractedSkills, setExtractedSkills] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [view, setView] = useState<'form' | 'result'>('form');

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown as any);
        return () => {
            window.removeEventListener('keydown', handleKeyDown as any);
        };
    }, [onClose]);

    const handleExtract = async () => {
        if (!jobDescription.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await extractSkillsFromJD(jobDescription);
            setExtractedSkills(result);
            setView('result');
        } catch (e: any) {
            console.error(e);
            setError('Sorry, something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(extractedSkills).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    }, [extractedSkills]);
    
    const handleStartOver = () => {
        setJobDescription(initialData?.jobDescription || '');
        setExtractedSkills('');
        setError(null);
        setView('form');
    }

    const renderForm = () => (
        <>
            <div className="flex items-center gap-3 mb-6">
                <ListBulletIcon className="w-8 h-8 text-indigo-500" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Extract Key Skills</h2>
            </div>
            <div className="space-y-4">
                <div>
                    <label htmlFor="job-description-skills" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Description</label>
                    <textarea
                        id="job-description-skills"
                        rows={16}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Paste the full job description here to extract skills and requirements..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                    />
                </div>
            </div>
             {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleExtract}
                    disabled={isLoading || !jobDescription.trim()}
                    className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Extracting...
                        </>
                    ) : 'Extract Skills'}
                </button>
            </div>
        </>
    );

    const renderResult = () => (
         <>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <ListBulletIcon className="w-8 h-8 text-indigo-500" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Extracted Skills & Requirements</h2>
                </div>
                <div className="flex items-center gap-2">
                     <button onClick={handleStartOver} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Start Over</button>
                     <button onClick={handleCopy} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                        {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 max-h-[60vh] overflow-y-auto">
                <MarkdownRenderer content={extractedSkills} />
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                {view === 'form' ? renderForm() : renderResult()}
            </div>
        </div>
    );
};

export default SkillsExtractorModal;