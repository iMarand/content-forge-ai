import React, { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Tag,
  ArrowRight,
  ListOrdered,
  Footprints,
  HelpCircle,
  Lightbulb,
  Filter,
  X,
  ExternalLink,
  Zap
} from 'lucide-react';
import { generateIdeas } from '../services/geminiService';
import { Idea, IdeaStatus, ContentFormat } from '../types';

interface IdeaGeneratorProps {
  onIdeasSelected: (ideas: Idea[]) => void;
  pastTopics: string[];
}

const STORAGE_KEY = 'contentForge_ideas_cache';

// Format icons mapping
const formatIcons: Record<string, React.ElementType> = {
  'NUMBERED_LIST': ListOrdered,
  'STEP_BY_STEP': Footprints,
  'PROBLEM_SOLUTION': Lightbulb,
  'FAQ_STYLE': HelpCircle,
  'STANDARD': Tag,
  'TIPS_TRICKS': Zap
};

// Format colors
const formatColors: Record<string, string> = {
  'NUMBERED_LIST': 'bg-blue-100 text-blue-700 border-blue-200',
  'STEP_BY_STEP': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'PROBLEM_SOLUTION': 'bg-amber-100 text-amber-700 border-amber-200',
  'FAQ_STYLE': 'bg-purple-100 text-purple-700 border-purple-200',
  'STANDARD': 'bg-slate-100 text-slate-700 border-slate-200',
  'TIPS_TRICKS': 'bg-rose-100 text-rose-700 border-rose-200'
};

export const IdeaGenerator: React.FC<IdeaGeneratorProps> = ({ onIdeasSelected, pastTopics }) => {
  const [category, setCategory] = useState('');
  const [isNews, setIsNews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [activeFormatFilter, setActiveFormatFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load from Session Storage on Mount
  useEffect(() => {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setGeneratedIdeas(data.ideas || []);
        setCategory(data.category || '');
        setIsNews(data.isNews || false);
      } catch (e) {
        console.error("Failed to parse cached ideas", e);
      }
    }
  }, []);

  const handleGenerate = async (e?: React.FormEvent, manualCategory?: string) => {
    if (e) e.preventDefault();
    const categoryToUse = manualCategory !== undefined ? manualCategory : category;

    setLoading(true);
    setError(null);
    setGeneratedIdeas([]);
    setSelectedIds(new Set());
    setActiveFormatFilter(null);
    sessionStorage.removeItem(STORAGE_KEY);

    try {
      const ideas = await generateIdeas(categoryToUse, pastTopics, isNews);
      setGeneratedIdeas(ideas);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        ideas,
        category: categoryToUse,
        isNews
      }));
    } catch (err) {
      setError("Failed to generate ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDiscover = () => {
    setCategory('');
    handleGenerate(undefined, '');
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirmSelection = () => {
    const selectedIdeas = generatedIdeas.filter(idea => selectedIds.has(idea.id));
    onIdeasSelected(selectedIdeas);
  };

  const selectAllOfFormat = (format: string) => {
    const formatted = generatedIdeas.filter((idea: any) => idea.suggestedFormat === format);
    const newSelected = new Set(selectedIds);
    formatted.forEach(idea => newSelected.add(idea.id));
    setSelectedIds(newSelected);
  };

  // Filter ideas by format
  const filteredIdeas = activeFormatFilter
    ? generatedIdeas.filter((idea: any) => idea.suggestedFormat === activeFormatFilter)
    : generatedIdeas;

  // Group by category
  const groupedIdeas = filteredIdeas.reduce((acc, idea) => {
    if (!acc[idea.category]) acc[idea.category] = [];
    acc[idea.category].push(idea);
    return acc;
  }, {} as Record<string, Idea[]>);

  // Get unique formats from generated ideas
  const availableFormats = [...new Set(generatedIdeas.map((idea: any) => idea.suggestedFormat || 'STANDARD'))];

  // Count ideas by format
  const formatCounts = generatedIdeas.reduce((acc: Record<string, number>, idea: any) => {
    const format = idea.suggestedFormat || 'STANDARD';
    acc[format] = (acc[format] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-10">

      {/* Input Section */}
      <div className="liquid-glass liquid-panel shadow-lg">

        {/* Toggle Pills */}
        <div className="bg-slate-100/80 p-1 rounded-full flex mb-8 w-full md:w-fit mx-auto">
          <button
            type="button"
            onClick={() => setIsNews(false)}
            className={`flex-1 md:flex-none py-2.5 px-6 rounded-full text-sm font-semibold transition-all ${!isNews ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Evergreen Content
          </button>
          <button
            type="button"
            onClick={() => setIsNews(true)}
            className={`flex-1 md:flex-none py-2.5 px-6 rounded-full text-sm font-semibold transition-all ${isNews ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Trending News
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Enter a niche (e.g. 'Gardening', 'AI Tools')..."
              className="liquid-input text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>

          <button
            onClick={(e) => handleGenerate(e)}
            disabled={loading || !category}
            className="liquid-button liquid-button-primary flex items-center justify-center gap-2 text-lg"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            <span>Search</span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="h-px bg-slate-200 w-24"></div>
          <span className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
          <div className="h-px bg-slate-200 w-24"></div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleAutoDiscover}
            disabled={loading}
            className="w-full group bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100 text-blue-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles size={18} className="text-blue-500 group-hover:scale-110 transition-transform" />
            Auto-Discover Viral Opportunities
          </button>
        </div>

        {/* Format Examples */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
            AI Will Suggest Formats Like
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['10 Steps to...', '7 Common Mistakes...', '5 Ways to...', 'How to Fix...'].map((example, idx) => (
              <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {example}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-2 border border-red-100">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Results */}
      {generatedIdeas.length > 0 && (
        <div className="space-y-8 animate-liquid-in">

          {/* Header with Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Suggestions for You
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {generatedIdeas.length} ideas generated • {selectedIds.size} selected
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`liquid-button ${showFilters ? 'liquid-button-primary' : 'liquid-button-secondary'} text-sm flex items-center gap-2`}
              >
                <Filter size={14} />
                Filter by Format
              </button>

              <span className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold">
                {selectedIds.size} Selected
              </span>
            </div>
          </div>

          {/* Format Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 px-2 animate-liquid-in">
              <button
                onClick={() => setActiveFormatFilter(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!activeFormatFilter
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
              >
                All ({generatedIdeas.length})
              </button>

              {availableFormats.map(format => {
                const Icon = formatIcons[format] || Tag;
                const colorClass = formatColors[format] || formatColors['STANDARD'];
                return (
                  <button
                    key={format}
                    onClick={() => setActiveFormatFilter(activeFormatFilter === format ? null : format)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeFormatFilter === format
                        ? 'bg-slate-900 text-white'
                        : `${colorClass} hover:shadow-md`
                      }`}
                  >
                    <Icon size={14} />
                    {format.replace('_', ' ')} ({formatCounts[format]})
                  </button>
                );
              })}

              {activeFormatFilter && (
                <button
                  onClick={() => selectAllOfFormat(activeFormatFilter)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg transition-all"
                >
                  Select All {formatCounts[activeFormatFilter]}
                </button>
              )}
            </div>
          )}

          {/* Ideas Grid */}
          <div className="grid gap-8">
            {Object.entries(groupedIdeas).map(([catName, ideas]) => (
              <div key={catName} className="space-y-4">
                <h4 className="flex items-center gap-2 font-bold text-slate-400 text-sm tracking-widest uppercase pl-2">
                  <Tag size={14} />
                  {catName}
                </h4>
                <div className="grid md:grid-cols-2 gap-4 liquid-stagger">
                  {ideas.map((idea: any) => {
                    const formatType = idea.suggestedFormat || 'STANDARD';
                    const FormatIcon = formatIcons[formatType] || Tag;
                    const colorClass = formatColors[formatType] || formatColors['STANDARD'];

                    return (
                      <div
                        key={idea.id}
                        onClick={() => toggleSelection(idea.id)}
                        className={`
                          liquid-card relative p-6 border-2 cursor-pointer transition-all duration-300 group
                          ${selectedIds.has(idea.id)
                            ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-500/10'
                            : 'border-white bg-white/80 hover:border-blue-200 hover:shadow-md'
                          }
                        `}
                      >
                        {/* Format & Trend Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${colorClass}`}>
                            <FormatIcon size={10} />
                            {formatType.replace('_', ' ')}
                          </span>

                          {idea.searchTrendContext && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <TrendingUp size={10} />
                              Trending
                            </span>
                          )}
                        </div>

                        {/* Selection Indicator */}
                        <div className={`
                          absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                          ${selectedIds.has(idea.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-200 bg-white'}
                        `}>
                          {selectedIds.has(idea.id) && <CheckCircle size={14} className="text-white" />}
                        </div>

                        <h4 className={`font-bold text-lg mb-2 pr-8 transition-colors ${selectedIds.has(idea.id) ? 'text-blue-900' : 'text-slate-800'}`}>
                          {idea.title}
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed mb-3">{idea.brief}</p>

                        {/* Trend Context */}
                        {idea.searchTrendContext && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                              <span className="font-bold">Why this works:</span> {idea.searchTrendContext}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Floating Action Button */}
          <div className="sticky bottom-8 flex justify-center pt-4 z-40 pointer-events-none">
            <button
              onClick={handleConfirmSelection}
              disabled={selectedIds.size === 0}
              className="pointer-events-auto liquid-button liquid-button-primary pl-8 pr-6 py-4 rounded-full shadow-xl hover:scale-105 disabled:opacity-0 disabled:translate-y-10 transition-all duration-300 flex items-center gap-2"
            >
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm mr-1">
                {selectedIds.size}
              </span>
              Launch Writer
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="liquid-glass liquid-panel p-12 flex flex-col items-center justify-center text-center animate-pulse">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
            <Sparkles size={24} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mt-6">Discovering Viral Ideas...</h3>
          <p className="text-slate-500 mt-2 max-w-md">
            Searching for trending topics and generating numbered content formats that drive engagement.
          </p>
        </div>
      )}
    </div>
  );
};