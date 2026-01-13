import React, { useState, useRef, useEffect } from 'react';
import {
    Edit3,
    RefreshCw,
    Check,
    X,
    Wand2,
    Loader2,
    Copy,
    Type,
    AlignLeft
} from 'lucide-react';
import { marked } from 'marked';
import { regenerateSection } from '../services/geminiService';

interface ContentEditorProps {
    content: string;
    onContentChange: (newContent: string) => void;
    isEditable?: boolean;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
    content,
    onContentChange,
    isEditable = true
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(content);
    const [selectedText, setSelectedText] = useState('');
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [regenerateInstruction, setRegenerateInstruction] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [copied, setCopied] = useState<'md' | 'text' | 'html' | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setEditedContent(content);
    }, [content]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            setSelectedText(selection.toString());
        }
    };

    const handleSaveEdit = () => {
        onContentChange(editedContent);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditedContent(content);
        setIsEditing(false);
    };

    const handleRegenerate = async () => {
        if (!selectedText || !regenerateInstruction) return;

        setIsRegenerating(true);
        try {
            const newSection = await regenerateSection(
                selectedText,
                content.substring(0, 500), // Context
                regenerateInstruction
            );

            // Replace the selected text with the new content
            const newContent = content.replace(selectedText, newSection);
            onContentChange(newContent);
            setShowRegenerateModal(false);
            setSelectedText('');
            setRegenerateInstruction('');
        } catch (error) {
            console.error('Failed to regenerate:', error);
        } finally {
            setIsRegenerating(false);
        }
    };

    const copyAs = async (format: 'md' | 'text' | 'html') => {
        let textToCopy = content;

        if (format === 'text') {
            // Strip markdown
            textToCopy = content
                .replace(/#{1,6}\s/g, '')
                .replace(/\*\*|__/g, '')
                .replace(/\*|_/g, '')
                .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                .replace(/```[\s\S]*?```/g, '')
                .replace(/`[^`]+`/g, '');
        } else if (format === 'html') {
            textToCopy = marked.parse(content) as string;
        }

        await navigator.clipboard.writeText(textToCopy);
        setCopied(format);
        setTimeout(() => setCopied(null), 2000);
    };

    const quickActions = [
        { label: 'Make it simpler', instruction: 'Rewrite in simpler, clearer language' },
        { label: 'Add more detail', instruction: 'Expand with more specific details and examples' },
        { label: 'Make it shorter', instruction: 'Condense to the key points only' },
        { label: 'Fix errors', instruction: 'Fix any grammar or spelling errors' },
    ];

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    {isEditable && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="liquid-button liquid-button-secondary text-sm flex items-center gap-2"
                        >
                            <Edit3 size={14} />
                            Edit
                        </button>
                    )}

                    {isEditing && (
                        <>
                            <button
                                onClick={handleSaveEdit}
                                className="liquid-button liquid-button-primary text-sm flex items-center gap-2"
                            >
                                <Check size={14} />
                                Save
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="liquid-button liquid-button-ghost text-sm flex items-center gap-2"
                            >
                                <X size={14} />
                                Cancel
                            </button>
                        </>
                    )}

                    {selectedText && !isEditing && (
                        <button
                            onClick={() => setShowRegenerateModal(true)}
                            className="liquid-button bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm flex items-center gap-2"
                        >
                            <Wand2 size={14} />
                            Regenerate Selection
                        </button>
                    )}
                </div>

                {/* Copy Options */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 mr-2">Copy as:</span>
                    <button
                        onClick={() => copyAs('md')}
                        className={`p-2 rounded-lg transition-colors ${copied === 'md'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        title="Copy as Markdown"
                    >
                        {copied === 'md' ? <Check size={14} /> : <Type size={14} />}
                    </button>
                    <button
                        onClick={() => copyAs('text')}
                        className={`p-2 rounded-lg transition-colors ${copied === 'text'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        title="Copy as Plain Text"
                    >
                        {copied === 'text' ? <Check size={14} /> : <AlignLeft size={14} />}
                    </button>
                    <button
                        onClick={() => copyAs('html')}
                        className={`p-2 rounded-lg transition-colors ${copied === 'html'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        title="Copy as HTML"
                    >
                        {copied === 'html' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>
            </div>

            {/* Content Display/Editor */}
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="liquid-editor w-full min-h-[500px] font-mono text-sm"
                    placeholder="Edit your content here..."
                />
            ) : (
                <div
                    ref={editorRef}
                    onMouseUp={handleTextSelection}
                    className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-800 prose-p:text-slate-600 prose-a:text-blue-600 cursor-text"
                >
                    <div dangerouslySetInnerHTML={{ __html: marked.parse(content) }} />
                </div>
            )}

            {/* Selection Hint */}
            {!isEditing && isEditable && (
                <p className="text-xs text-slate-400 text-center mt-4">
                    💡 Tip: Select any text to regenerate or improve it with AI
                </p>
            )}

            {/* Regenerate Modal */}
            {showRegenerateModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-liquid-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Wand2 size={20} className="text-purple-500" />
                                Regenerate Section
                            </h3>
                            <button
                                onClick={() => setShowRegenerateModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Selected Text Preview */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-4 max-h-32 overflow-y-auto">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Selected Text
                            </p>
                            <p className="text-sm text-slate-600 italic">"{selectedText}"</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Quick Actions
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setRegenerateInstruction(action.instruction)}
                                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${regenerateInstruction === action.instruction
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Instruction */}
                        <div className="mb-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Custom Instruction
                            </p>
                            <input
                                type="text"
                                value={regenerateInstruction}
                                onChange={(e) => setRegenerateInstruction(e.target.value)}
                                placeholder="e.g., 'Make it more engaging' or 'Add an example'"
                                className="liquid-input"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleRegenerate}
                                disabled={!regenerateInstruction || isRegenerating}
                                className="flex-1 liquid-button liquid-button-primary flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isRegenerating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={16} />
                                        Regenerate
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowRegenerateModal(false)}
                                className="liquid-button liquid-button-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
