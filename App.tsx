import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { IdeaGenerator } from './components/IdeaGenerator';
import { ContentWriter } from './components/ContentWriter';
import { SearchOverlay } from './components/SearchOverlay';
import { Idea, GeneratedContent } from './types';

function App() {
  const [currentView, setCurrentView] = useState('generate');
  const [ideaQueue, setIdeaQueue] = useState<Idea[]>([]);
  const [generatedHistory, setGeneratedHistory] = useState<GeneratedContent[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Persistent storage for "Used Ideas" to prevent duplicates in suggestions
  const [pastTopics, setPastTopics] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('contentForge_pastTopics');
    if (saved) {
      setPastTopics(JSON.parse(saved));
    }

    // Load history from localStorage
    const savedHistory = localStorage.getItem('contentForge_history');
    if (savedHistory) {
      setGeneratedHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (generatedHistory.length > 0) {
      localStorage.setItem('contentForge_history', JSON.stringify(generatedHistory));
    }
  }, [generatedHistory]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const savePastTopic = (title: string) => {
    setPastTopics(prev => {
      if (prev.includes(title)) return prev;
      const updated = [...prev, title];
      localStorage.setItem('contentForge_pastTopics', JSON.stringify(updated));
      return updated;
    });
  };

  const handleIdeasSelected = (ideas: Idea[]) => {
    setIdeaQueue(ideas);
    setCurrentView('writer');
  };

  const handleContentComplete = (contents: GeneratedContent[]) => {
    setGeneratedHistory(prev => [...prev, ...contents]);
  };

  const handleArchiveIdea = (ideaId: string) => {
    const idea = ideaQueue.find(i => i.id === ideaId);
    if (idea) {
      savePastTopic(idea.title);
    }
  };

  const handleSearchResultSelect = (content: GeneratedContent) => {
    setCurrentView('history');
    // Could scroll to the specific content in the future
  };

  return (
    <div className="min-h-screen text-slate-900">

      {/* Liquid Background */}
      <div className="liquid-bg">
        <div className="liquid-blob" style={{
          width: '500px',
          height: '500px',
          top: '-100px',
          right: '-100px',
        }}></div>
        <div className="liquid-blob" style={{
          width: '400px',
          height: '400px',
          bottom: '10%',
          left: '-50px',
          animationDelay: '-4s',
        }}></div>
        <div className="liquid-blob" style={{
          width: '300px',
          height: '300px',
          top: '40%',
          right: '20%',
          animationDelay: '-2s',
        }}></div>
      </div>

      {/* Top Floating Navigation */}
      <Navbar
        currentView={currentView}
        setView={setCurrentView}
        queueCount={ideaQueue.length}
        onSearchClick={() => setIsSearchOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 pb-20 mt-4 relative z-10">

        {currentView === 'generate' && (
          <div className="animate-liquid-in">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-slate-700">
                ContentForge AI
              </h1>
              <p className="text-slate-500 mt-4 text-lg max-w-xl mx-auto">
                Generate actionable content ideas with numbered formats, step-by-step guides, and direct-action writing.
              </p>
            </div>
            <IdeaGenerator
              onIdeasSelected={handleIdeasSelected}
              pastTopics={pastTopics}
            />
          </div>
        )}

        {currentView === 'writer' && (
          <div className="animate-liquid-in">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Writer's Room</h1>
              <p className="text-slate-500 mt-3 max-w-lg mx-auto">
                Configure your format and style. AI will write content that jumps straight into actionable information.
              </p>
            </div>
            <ContentWriter
              queue={ideaQueue}
              onComplete={handleContentComplete}
              onArchive={handleArchiveIdea}
            />
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-liquid-in max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Content Archive</h1>
              <p className="text-slate-500 mt-3">
                Your library of {generatedHistory.length} generated articles.
              </p>
            </div>
            <div className="grid gap-6">
              {generatedHistory.length === 0 ? (
                <div className="liquid-glass liquid-panel text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mx-auto flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-slate-400 font-medium">No history yet</p>
                  <p className="text-sm text-slate-400 mt-1">Generated content will appear here</p>
                </div>
              ) : (
                generatedHistory.slice().reverse().map((content) => (
                  <div key={content.id} className="liquid-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-slate-900">{content.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="liquid-badge liquid-badge-primary">
                            {content.platform}
                          </span>
                          {content.format && (
                            <span className="liquid-badge liquid-badge-neutral">
                              {content.format.split(' (')[0]}
                            </span>
                          )}
                          <span className="liquid-badge liquid-badge-success">
                            {content.wordCount} words
                          </span>
                          {content.quality && (
                            <span className={`liquid-badge ${content.quality.readabilityScore >= 70
                                ? 'liquid-badge-success'
                                : content.quality.readabilityScore >= 50
                                  ? 'liquid-badge-warning'
                                  : 'liquid-badge-danger'
                              }`}>
                              Score: {content.quality.readabilityScore}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                        {new Date(content.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed line-clamp-3 mb-6">
                      {content.content.replace(/[#*`]/g, '').substring(0, 300)}...
                    </p>

                    {/* Social Snippets Preview in History */}
                    {content.socialSnippets && (
                      <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                          <strong className="block text-slate-800 mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            Twitter/X
                          </strong>
                          <p className="line-clamp-2">{content.socialSnippets.twitter}</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600">
                          <strong className="block text-slate-800 mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                            LinkedIn
                          </strong>
                          <p className="line-clamp-2">{content.socialSnippets.linkedin}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        contentHistory={generatedHistory}
        onSelectResult={handleSearchResultSelect}
      />
    </div>
  );
}

export default App;