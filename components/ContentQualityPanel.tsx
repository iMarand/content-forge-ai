import React from 'react';
import { ContentQuality } from '../types';
import {
    BookOpen,
    Clock,
    FileText,
    CheckCircle,
    AlertCircle,
    Lightbulb,
    TrendingUp,
    Zap
} from 'lucide-react';

interface ContentQualityPanelProps {
    quality: ContentQuality | undefined;
    isLoading?: boolean;
}

export const ContentQualityPanel: React.FC<ContentQualityPanelProps> = ({ quality, isLoading }) => {

    if (isLoading) {
        return (
            <div className="liquid-quality-panel space-y-4 animate-shimmer">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-20 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (!quality) {
        return (
            <div className="liquid-quality-panel text-center py-8 text-slate-400">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Quality metrics will appear after content is generated</p>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-600';
        if (score >= 50) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Fair';
        if (score >= 50) return 'Needs Work';
        return 'Difficult';
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return 'from-emerald-500 to-teal-500';
        if (score >= 50) return 'from-amber-500 to-orange-500';
        return 'from-red-500 to-rose-500';
    };

    return (
        <div className="space-y-6">

            {/* Readability Score - Hero */}
            <div className="liquid-quality-panel relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>

                <div className="relative">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                        <Zap size={14} />
                        Readability Score
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Score Circle */}
                        <div
                            className="liquid-score-circle flex-shrink-0"
                            style={{ '--score': quality.readabilityScore } as React.CSSProperties}
                        >
                            <span className={`font-bold ${getScoreColor(quality.readabilityScore)}`}>
                                {quality.readabilityScore}
                            </span>
                        </div>

                        <div>
                            <div className={`text-lg font-bold ${getScoreColor(quality.readabilityScore)}`}>
                                {getScoreLabel(quality.readabilityScore)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {quality.readabilityScore >= 70
                                    ? 'Easy to read for most audiences'
                                    : quality.readabilityScore >= 50
                                        ? 'May be challenging for some readers'
                                        : 'Consider simplifying language'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <Clock size={14} />
                        <span className="text-xs font-medium">Read Time</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {quality.estimatedReadTime} <span className="text-sm font-normal text-slate-400">min</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <FileText size={14} />
                        <span className="text-xs font-medium">Words</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {quality.wordCount.toLocaleString()}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <BookOpen size={14} />
                        <span className="text-xs font-medium">Sentences</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {quality.sentenceCount}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <TrendingUp size={14} />
                        <span className="text-xs font-medium">Words/Sentence</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">
                        {quality.avgWordsPerSentence}
                    </div>
                </div>
            </div>

            {/* Uniqueness Indicators */}
            {quality.uniquenessIndicators.length > 0 && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-3">
                        <CheckCircle size={16} />
                        Content Strengths
                    </div>
                    <div className="space-y-2">
                        {quality.uniquenessIndicators.map((indicator, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-emerald-600">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                {indicator}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Improvement Suggestions */}
            {quality.suggestedImprovements.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-3">
                        <Lightbulb size={16} />
                        Suggestions
                    </div>
                    <div className="space-y-2">
                        {quality.suggestedImprovements.map((suggestion, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                {suggestion}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Perfect Score */}
            {quality.suggestedImprovements.length === 0 && quality.readabilityScore >= 70 && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <CheckCircle size={18} />
                        Excellent Quality!
                    </div>
                    <p className="text-sm text-white/80">
                        Your content is well-structured, readable, and ready to publish.
                    </p>
                </div>
            )}
        </div>
    );
};
