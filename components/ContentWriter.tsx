import React, { useState, useEffect } from 'react';
import { Idea, GeneratedContent, ContentType, ContentTone, ContentFormat } from '../types';
import { writeContent } from '../services/geminiService';
import { ContentQualityPanel } from './ContentQualityPanel';
import { ContentEditor } from './ContentEditor';
import {
  Loader2,
  Copy,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Image as ImageIcon,
  Search,
  Settings2,
  Check,
  Twitter,
  Linkedin,
  Hash,
  ListOrdered,
  Layout,
  Zap,
  ChevronDown,
  ChevronUp,
  Link2
} from 'lucide-react';

interface ContentWriterProps {
  queue: Idea[];
  onComplete: (contents: GeneratedContent[]) => void;
  onArchive: (ideaId: string) => void;
}

const STORAGE_KEY = 'contentForge_writer_results';

export const ContentWriter: React.FC<ContentWriterProps> = ({ queue, onComplete, onArchive }) => {
  // Config State
  const [activePlatform, setActivePlatform] = useState<ContentType>(ContentType.BLOG);
  const [activeTone, setActiveTone] = useState<ContentTone>(ContentTone.INFORMATIONAL);
  const [activeFormat, setActiveFormat] = useState<ContentFormat>(ContentFormat.NUMBERED_LIST);
  const [minWordCount, setMinWordCount] = useState<number>(800);
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Processing State
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<GeneratedContent[]>([]);
  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // View State
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [showQualityPanel, setShowQualityPanel] = useState<string | null>(null);

  // Load cached results
  useEffect(() => {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setResults(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached writer results", e);
      }
    }
  }, []);

  // Save results to cache
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }, [results]);

  const handleProcessQueue = async () => {
    setProcessing(true);
    setError(null);

    // Filter ideas that haven't been generated yet
    const pendingIdeas = queue.filter(idea => !results.some(r => r.id === idea.id));

    if (pendingIdeas.length === 0) {
      setError("All selected ideas have already been generated.");
      setProcessing(false);
      return;
    }

    // Process sequentially to avoid rate limits and allow user to see progress
    for (const idea of pendingIdeas) {
      setCurrentProcessingId(idea.id);
      try {
        const content = await writeContent(
          idea,
          activePlatform,
          activeTone,
          activeFormat,
          minWordCount,
          customInstructions
        );

        setResults(prev => {
          const newResults = [...prev, content];
          // Notify parent immediately so history is updated
          onComplete([content]);
          return newResults;
        });

        // Auto-expand the newest result
        setExpandedResults(prev => new Set([...prev, content.id]));
        setShowQualityPanel(content.id);

        // Mark as "used" in parent so it isn't suggested again
        onArchive(idea.id);

      } catch (err) {
        console.error(`Failed to generate content for ${idea.title}`, err);
        setError(`Stopped at "${idea.title}". Please try again.`);
        break; // Stop on error
      }
    }

    setCurrentProcessingId(null);
    setProcessing(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleContentUpdate = (id: string, newContent: string) => {
    setResults(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, content: newContent };
      }
      return r;
    }));
  };

  const toggleExpanded = (id: string) => {
    setExpandedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const pendingCount = queue.filter(idea => !results.some(r => r.id === idea.id)).length;

  const formatDescriptions: Record<ContentFormat, string> = {
    [ContentFormat.STANDARD]: 'Traditional article structure with introduction, body, and conclusion',
    [ContentFormat.NUMBERED_LIST]: 'Numbered points like "10 Steps to..." or "7 Ways to..."',
    [ContentFormat.STEP_BY_STEP]: 'Sequential guide with clear steps to follow',
    [ContentFormat.PROBLEM_SOLUTION]: 'Identify problem, explain causes, provide solution',
    [ContentFormat.FAQ_STYLE]: 'Question and answer format for common queries',
    [ContentFormat.TIPS_TRICKS]: 'Collection of practical tips and expert advice'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Configuration Panel */}
      <div className="liquid-glass liquid-panel shadow-lg">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Left: Settings */}
          <div className="flex-1 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Settings2 size={20} className="text-blue-500" />
              Content Configuration
            </h2>

            {/* Format Selector - Prominent */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
              <label className="block text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ListOrdered size={14} />
                Content Format
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.values(ContentFormat).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFormat(f)}
                    className={`
                      p-3 rounded-xl text-left text-sm font-medium transition-all
                      ${activeFormat === f
                        ? 'bg-white shadow-md border-2 border-blue-500 text-blue-700'
                        : 'bg-white/50 border border-transparent hover:border-blue-200 text-slate-600'
                      }
                    `}
                  >
                    {f.split(' (')[0]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-600/70 mt-3">
                {formatDescriptions[activeFormat]}
              </p>
            </div>

            {/* Platform & Tone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Layout size={12} />
                  Platform
                </label>
                <select
                  value={activePlatform}
                  onChange={(e) => setActivePlatform(e.target.value as ContentType)}
                  className="liquid-input liquid-select"
                >
                  {Object.values(ContentType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Zap size={12} />
                  Tone
                </label>
                <select
                  value={activeTone}
                  onChange={(e) => setActiveTone(e.target.value as ContentTone)}
                  className="liquid-input liquid-select"
                >
                  {Object.values(ContentTone).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced Settings'}
            </button>

            {showAdvanced && (
              <div className="pt-4 border-t border-slate-100 space-y-4 animate-liquid-in">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Min Word Count
                    </label>
                    <input
                      type="number"
                      value={minWordCount}
                      onChange={(e) => setMinWordCount(Number(e.target.value))}
                      className="liquid-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Custom Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 'Focus on beginners', 'Use metaphors'"
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="liquid-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Action Panel */}
          <div className="lg:w-64 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="text-4xl font-bold text-blue-900 mb-1">{pendingCount}</div>
            <div className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-6">
              Pending Articles
            </div>

            <button
              onClick={handleProcessQueue}
              disabled={processing || pendingCount === 0}
              className="w-full liquid-button liquid-button-primary flex items-center justify-center gap-2 animate-pulse-glow disabled:animate-none"
            >
              {processing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              {processing ? 'Writing...' : 'Start Writing'}
            </button>

            <p className="text-xs text-blue-500/70 mt-4 text-center">
              Content will be generated with direct-action style
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 border border-red-100">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {/* Results Feed */}
      <div className="space-y-8">
        {results.slice().reverse().map((item) => (
          <div
            key={item.id}
            className="liquid-card overflow-hidden shadow-lg animate-liquid-in"
          >

            {/* Header / Meta */}
            <div className="bg-gradient-to-r from-white to-slate-50 border-b border-slate-100 p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="liquid-badge liquid-badge-primary">
                      {item.platform}
                    </span>
                    {item.format && (
                      <span className="liquid-badge liquid-badge-neutral">
                        {item.format.split(' (')[0]}
                      </span>
                    )}
                    <span className="liquid-badge liquid-badge-success">
                      {item.wordCount} words
                    </span>
                    {item.quality && (
                      <span className={`liquid-badge ${item.quality.readabilityScore >= 70
                          ? 'liquid-badge-success'
                          : item.quality.readabilityScore >= 50
                            ? 'liquid-badge-warning'
                            : 'liquid-badge-danger'
                        }`}>
                        Score: {item.quality.readabilityScore}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                    {item.title}
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(item.content, item.id)}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                    title="Copy Markdown"
                  >
                    {copiedId === item.id ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
                  </button>
                  <button
                    onClick={() => toggleExpanded(item.id)}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                    title={expandedResults.has(item.id) ? 'Collapse' : 'Expand'}
                  >
                    {expandedResults.has(item.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* SEO Keywords */}
              {item.keywords && item.keywords.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mr-2">
                    <Hash size={12} />
                    KEYWORDS
                  </div>
                  {item.keywords.map((kw, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-blue-300 cursor-pointer transition-colors">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {expandedResults.has(item.id) && (
              <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                {/* Main Content */}
                <div className="lg:col-span-2 p-6 md:p-8">
                  <ContentEditor
                    content={item.content}
                    onContentChange={(newContent) => handleContentUpdate(item.id, newContent)}
                  />

                  {/* Sources */}
                  {item.sources && item.sources.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Link2 size={14} />
                        Sources & References
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {item.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <ExternalLink size={10} />
                            <span className="truncate max-w-[150px]">{source.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar: Quality, Social & Image */}
                <div className="bg-slate-50/50 p-6 space-y-8">

                  {/* Quality Panel */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap size={14} />
                      Content Quality
                    </h4>
                    <ContentQualityPanel quality={item.quality} />
                  </div>

                  {/* Image Card */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ImageIcon size={14} />
                      Featured Image
                    </h4>
                    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white group">
                      <div className="aspect-video bg-slate-100 relative overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.imageSearchTerm}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-3 text-xs text-slate-500 bg-white border-t border-slate-100">
                        <span className="font-semibold text-slate-700">Search Term:</span> {item.imageSearchTerm}
                      </div>
                    </div>
                  </div>

                  {/* Social Snippets */}
                  {item.socialSnippets && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Twitter size={14} />
                          Twitter / X
                        </h4>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed shadow-sm">
                          {item.socialSnippets.twitter}
                        </div>
                        <button
                          onClick={() => copyToClipboard(item.socialSnippets?.twitter || '', `tw-${item.id}`)}
                          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {copiedId === `tw-${item.id}` ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === `tw-${item.id}` ? 'Copied' : 'Copy Tweet'}
                        </button>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Linkedin size={14} />
                          LinkedIn
                        </h4>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed shadow-sm">
                          {item.socialSnippets.linkedin}
                        </div>
                        <button
                          onClick={() => copyToClipboard(item.socialSnippets?.linkedin || '', `li-${item.id}`)}
                          className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          {copiedId === `li-${item.id}` ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === `li-${item.id}` ? 'Copied' : 'Copy Post'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collapsed Preview */}
            {!expandedResults.has(item.id) && (
              <div className="p-6 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleExpanded(item.id)}>
                <p className="text-slate-600 leading-relaxed line-clamp-2">
                  {item.content.replace(/[#*`]/g, '').substring(0, 250)}...
                </p>
                <p className="text-sm text-blue-600 font-medium mt-3">Click to expand →</p>
              </div>
            )}
          </div>
        ))}

        {/* Processing Loading State Card */}
        {processing && (
          <div className="liquid-glass liquid-panel p-12 flex flex-col items-center justify-center text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
              <Loader2 size={32} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mt-6">Forging Your Content...</h3>
            <p className="text-slate-500 mt-2 max-w-md">
              Writing direct-action content with no fluff. Each section will jump straight into actionable information.
            </p>
          </div>
        )}

        {/* Empty State */}
        {results.length === 0 && !processing && (
          <div className="liquid-glass liquid-panel p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mx-auto flex items-center justify-center mb-4">
              <ListOrdered size={32} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No Content Yet</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Select ideas from the Generator and configure your format above, then click "Start Writing" to create actionable content.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};