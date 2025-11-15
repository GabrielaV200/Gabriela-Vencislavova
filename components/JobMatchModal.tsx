import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { findMatchingJobs } from '../services/geminiService';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import MarkdownRenderer from './MarkdownRenderer';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ArrowUpTrayIcon } from './icons/ArrowUpTrayIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { XCircleIcon } from './icons/XCircleIcon';

// Add declarations for third-party libraries loaded via script tags
declare global {
    interface Window {
        pdfjsLib: any;
        mammoth: any;
    }
}

interface JobMatchModalProps {
    onClose: () => void;
    onSelectJob: (data: { jobDescription: string; resume: string }) => void;
}

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
    });
};

const JobMatchModal: React.FC<JobMatchModalProps> = ({ onClose, onSelectJob }) => {
    const [resume, setResume] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [preferences, setPreferences] = useState('');
    const [matchedJobs, setMatchedJobs] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'form' | 'result'>('form');

    // State for file handling
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parsingError, setParsingError] = useState<string | null>(null);


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

    const parsePdf = async (file: File): Promise<string> => {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.min.mjs');
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return textContent;
    };

    const parseDocx = async (file: File): Promise<string> => {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.7.1/mammoth.browser.min.js');
        const mammoth = window.mammoth;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };


    const handleFileChange = useCallback(async (file: File | null) => {
        if (!file) return;

        setParsingError(null);
        setIsParsing(true);
        setSelectedFile(file);
        setResume('');

        try {
            let text = '';
            if (file.type === 'application/pdf') {
                text = await parsePdf(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                text = await parseDocx(file);
            } else {
                throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
            }
            setResume(text);
        } catch (err: any) {
            console.error("File parsing error:", err);
            setParsingError(err.message || 'Failed to read file.');
            setSelectedFile(null);
        } finally {
            setIsParsing(false);
        }
    }, []);

    const handleFileDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
            handleFileChange(event.dataTransfer.files[0]);
        }
    };
    
    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            handleFileChange(event.target.files[0]);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setResume('');
        setParsingError(null);
        // Reset the file input value
        const fileInput = document.getElementById('resume-file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleFindJobs = async () => {
        if (!resume.trim() || !jobTitle.trim()) return;

        setIsLoading(true);
        setError(null);
        try {
            const result = await findMatchingJobs(resume, jobTitle, preferences);
            setMatchedJobs(result);
            setView('result');
        } catch (e: any) {
            console.error(e);
            setError('Sorry, something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartOver = () => {
        setMatchedJobs('');
        setError(null);
        setView('form');
    };

    const handlePrepareApplication = (jobDescription: string) => {
        onSelectJob({ jobDescription, resume });
        onClose();
    };

    const parsedJobs = useMemo(() => {
        if (!matchedJobs) return [];
        const jobBlocks = matchedJobs.split(/\n(?=###\s)/).map(s => s.trim()).filter(Boolean);
        return jobBlocks.map(block => {
            const lines = block.split('\n');
            const title = lines[0]?.replace('###', '').trim() || 'Unknown Title';
            return { title, fullText: block };
        });
    }, [matchedJobs]);


    const renderFileUpload = () => (
        <div>
            <label htmlFor="your-resume" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Resume</label>
            {selectedFile && !isParsing && !parsingError ? (
                <div className="flex items-center justify-between p-3 border border-green-500 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <div className="flex items-center gap-3">
                        <DocumentIcon className="w-6 h-6 text-green-700 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">{selectedFile.name}</span>
                    </div>
                    <button onClick={handleRemoveFile} title="Remove file" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
            ) : (
                <label
                    htmlFor="resume-file-upload"
                    className="relative block w-full h-32 px-6 py-4 text-center border-2 border-gray-300 border-dashed dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleFileDrop}
                >
                    <div className="flex flex-col items-center justify-center h-full">
                        {isParsing ? (
                            <>
                                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Parsing file...</p>
                            </>
                        ) : (
                            <>
                                <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500" />
                                <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    Upload a file or drag and drop
                                </span>
                                <span className="block text-xs text-gray-500 dark:text-gray-400">PDF, DOCX up to 10MB</span>
                                <input id="resume-file-upload" type="file" className="sr-only" accept=".pdf,.docx,.doc" onChange={handleFileInputChange} />
                             </>
                        )}
                    </div>
                </label>
            )}
             {parsingError && <p className="text-red-500 text-sm mt-2">{parsingError}</p>}
        </div>
    );

    const renderForm = () => (
        <>
            <div className="flex items-center gap-3 mb-6">
                <BriefcaseIcon className="w-8 h-8 text-indigo-500" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Job Matchmaker</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Provide your resume and job preferences, and I'll find matching opportunities for you.</p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="job-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Desired Job Title</label>
                    <input
                        id="job-title"
                        type="text"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Senior Frontend Engineer"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                    />
                </div>
                 <div>
                    <label htmlFor="preferences" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Other Preferences</label>
                    <input
                        id="preferences"
                        type="text"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Remote, USA, fintech industry"
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                    />
                </div>
                {renderFileUpload()}
            </div>
             {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleFindJobs}
                    disabled={isLoading || isParsing || !resume.trim() || !jobTitle.trim()}
                    className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[150px]"
                >
                    {isLoading ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Finding Jobs...
                        </>
                    ) : 'Find Matching Jobs'}
                </button>
            </div>
        </>
    );

    const renderResult = () => (
         <>
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <BriefcaseIcon className="w-8 h-8 text-indigo-500" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Your Matched Jobs</h2>
                </div>
                <button onClick={handleStartOver} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Start Over</button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {parsedJobs.map((job, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                        <MarkdownRenderer content={job.fullText} />
                        <div className="flex justify-end mt-3">
                             <button 
                                onClick={() => handlePrepareApplication(job.fullText)}
                                className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold py-2 px-4 rounded-lg flex items-center gap-2 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                            >
                                <DocumentTextIcon className="w-5 h-5" />
                                Prepare Application
                            </button>
                        </div>
                    </div>
                ))}
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

export default JobMatchModal;