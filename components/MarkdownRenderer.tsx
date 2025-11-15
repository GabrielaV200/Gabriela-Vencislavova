
import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // Process inline formatting: bold, italic, code
    const processInlineFormatting = (line: string) => {
        return line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-gray-200 dark:bg-gray-600 rounded px-1 py-0.5 text-sm font-mono">$1</code>');
    };
    
    const lines = content.split('\n');
    // FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
    const elements: React.ReactElement[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul className="list-disc list-inside space-y-1 my-2 pl-4" key={`list-${elements.length}`}>
                    {listItems.map((item, index) => (
                        <li key={index} dangerouslySetInnerHTML={{ __html: processInlineFormatting(item) }} />
                    ))}
                </ul>
            );
            listItems = [];
        }
        inList = false;
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            if (!inList) {
                inList = true;
            }
            listItems.push(trimmedLine.substring(2));
        } else {
            if (inList) {
                flushList();
            }
            if (trimmedLine) {
                 elements.push(<p key={index} dangerouslySetInnerHTML={{ __html: processInlineFormatting(line) }} />);
            } else {
                 // Represents a line break between paragraphs
                 if (elements.length > 0 && elements[elements.length -1].type === 'p') {
                    elements.push(<br key={`br-${index}`} />);
                 }
            }
        }
    });

    if (inList) {
        flushList();
    }

    return <div className="prose prose-sm dark:prose-invert max-w-none break-words">{elements}</div>;
};

export default MarkdownRenderer;