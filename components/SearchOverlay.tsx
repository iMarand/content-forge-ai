import React, { useState, useRef, useEffect } from 'react';
import { Search, X, FileText, Clock, ArrowRight } from 'lucide-react';
import { GeneratedContent } from '../types';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    contentHistory: GeneratedContent[];
    onSelectResult: (content: GeneratedContent) => void;
}

interface SearchResult {
    content: GeneratedContent;
    matchedText: string;
    matchType: 'title' | 'content' | 'keyword';
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, contentHistory, onSelectResult }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
        const searchQuery = query.toLowerCase();
        const matchedResults: SearchResult[] = [];

        contentHistory.forEach(content => {
            if (content.title.toLowerCase().includes(searchQuery)) {
                matchedResults.push({ content, matchedText: content.title, matchType: 'title' });
                return;
            }
            const matchedKeyword = content.keywords?.find(k => k.toLowerCase().includes(searchQuery));
            if (matchedKeyword) {
                matchedResults.push({ content, matchedText: matchedKeyword, matchType: 'keyword' });
                return;
            }
            const contentLower = content.content.toLowerCase();
            const matchIndex = contentLower.indexOf(searchQuery);
            if (matchIndex !== -1) {
                const start = Math.max(0, matchIndex - 40);
                const end = Math.min(content.content.length, matchIndex + searchQuery.length + 60);
                let snippet = content.content.substring(start, end);
                if (start > 0) snippet = '...' + snippet;
                if (end < content.content.length) snippet = snippet + '...';
                matchedResults.push({ content, matchedText: snippet, matchType: 'content' });
            }
        });
        setResults(matchedResults);
    }, [query, contentHistory]);

    const highlightMatch = (text: string, q: string): React.ReactNode => {
        if (!q.trim()) return text;
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) => regex.test(part) ? <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">{part}</mark> : part);
    };

    if (!isOpen) return null;

    return (
        <div className="liquid-search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="liquid-search-modal" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
                <div className="relative">
                    <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your content..." className="liquid-search-input pl-14 pr-12" />
                    <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={20} /></button>
                </div>

                <div className="liquid-search-results">
                    {query && results.length === 0 && (
                        <div className="py-12 text-center text-slate-400">
                            <FileText size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No results found</p>
                        </div>
                    )}

                    {results.map((result, index) => (
                        <div key={`${result.content.id}-${index}`} className="liquid-search-result" onClick={() => { onSelectResult(result.content); onClose(); }}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${result.matchType === 'title' ? 'bg-blue-100 text-blue-700' : result.matchType === 'keyword' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>{result.matchType}</span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{new Date(result.content.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-semibold text-slate-800 truncate">{highlightMatch(result.content.title, query)}</h4>
                                    {result.matchType === 'content' && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{highlightMatch(result.matchedText.replace(/[#*`]/g, ''), query)}</p>}
                                    {result.matchType === 'keyword' && <p className="text-sm text-slate-500 mt-1">Keyword: {highlightMatch(result.matchedText, query)}</p>}
                                </div>
                                <ArrowRight size={16} className="text-slate-300 flex-shrink-0 mt-2" />
                            </div>
                        </div>
                    ))}

                    {!query && (
                        <div className="py-12 text-center text-slate-400">
                            <Search size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="font-medium">Search your content</p>
                            <p className="text-sm mt-1">Find by title, keywords, or content</p>
                        </div>
                    )}
                </div>

                {contentHistory.length > 0 && !query && (
                    <div className="border-t border-slate-100 p-4">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Content</div>
                        <div className="flex flex-wrap gap-2">
                            {contentHistory.slice(0, 5).map(content => (
                                <button key={content.id} onClick={() => { onSelectResult(content); onClose(); }} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors truncate max-w-[200px]">{content.title}</button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
                    <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono">Esc</kbd> to close</span>
                    <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                </div>
            </div>
        </div>
    );
};
