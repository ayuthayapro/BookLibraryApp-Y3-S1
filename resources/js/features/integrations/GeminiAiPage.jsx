import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, 
    Send, 
    BookOpen, 
    Brain, 
    Lightbulb, 
    Bot, 
    User, 
    ArrowRight,
    RefreshCw,
    MessageSquare,
    Bookmark
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { integrationsService } from '../../services/integrationsService';
import { booksService } from '../../services/booksService';
import { useToast } from '../../app/ToastContext';

export default function GeminiAiPage({ initialBookForSummary = null }) {
    const { showToast } = useToast();
    const chatEndRef = useRef(null);

    const [activeMode, setActiveMode] = useState(initialBookForSummary ? 'summarize' : 'chat');

    // Chat state
    const [messages, setMessages] = useState([
        { 
            role: 'assistant', 
            content: 'Hello! I am your Gemini AI Library Assistant. Ask me anything about books in the collection, reading recommendations, or catalog research.' 
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // Recommendations state
    const [prefInput, setPrefInput] = useState('');
    const [recommendations, setRecommendations] = useState(null);
    const [recLoading, setRecLoading] = useState(false);

    // Summarizer state
    const [booksList, setBooksList] = useState([]);
    const [selectedBookId, setSelectedBookId] = useState(initialBookForSummary ? initialBookForSummary.id : '');
    const [summaryResult, setSummaryResult] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Load books for summarizer
    useEffect(() => {
        booksService.getBooks({ per_page: 50 }).then((res) => {
            setBooksList(res.data || []);
        }).catch(() => {});
    }, []);

    // Scroll chat to bottom
    useEffect(() => {
        if (activeMode === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeMode]);

    // Send Chat
    const handleSendChat = async (e) => {
        e.preventDefault();
        const msg = chatInput.trim();
        if (!msg || chatLoading) return;

        const newHistory = [...messages, { role: 'user', content: msg }];
        setMessages(newHistory);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await integrationsService.geminiChat(msg, messages);
            const aiReply = res.reply || res.data?.reply || res.message || 'I processed your request.';
            setMessages([...newHistory, { role: 'assistant', content: aiReply }]);
        } catch (err) {
            showToast(err.message || 'Gemini AI chat failed', 'error');
            setMessages([...newHistory, { role: 'assistant', content: 'Sorry, I encountered an error communicating with Gemini AI. Please check your API key configuration.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Get Recommendations
    const handleGetRecommendations = async (e) => {
        e.preventDefault();
        if (!prefInput.trim() || recLoading) return;

        try {
            setRecLoading(true);
            const res = await integrationsService.geminiRecommendations(prefInput.trim());
            setRecommendations(res.recommendations || res.data?.recommendations || res);
        } catch (err) {
            showToast(err.message || 'Failed to generate recommendations', 'error');
        } finally {
            setRecLoading(false);
        }
    };

    // Summarize Book
    const handleSummarizeBook = async () => {
        if (!selectedBookId || summaryLoading) return;

        try {
            setSummaryLoading(true);
            const res = await integrationsService.geminiSummarize(selectedBookId);
            setSummaryResult(res.summary || res.data?.summary || res);
        } catch (err) {
            showToast(err.message || 'Failed to summarize book', 'error');
        } finally {
            setSummaryLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-7 h-7 text-purple-600" />
                    Gemini AI Intelligent Tools
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Harness Google Gemini's generative intelligence for patron inquiries, personalized reading suggestions, and automated book summaries.
                </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
                {[
                    { id: 'chat', label: 'AI Library Assistant', icon: MessageSquare },
                    { id: 'recommend', label: 'Smart Recommendations', icon: Lightbulb },
                    { id: 'summarize', label: 'Book Summarizer', icon: BookOpen },
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeMode === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveMode(tab.id)}
                            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${
                                isActive
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Mode 1: Chat Assistant */}
            {activeMode === 'chat' && (
                <Card className="flex flex-col h-[600px] overflow-hidden">
                    {/* Chat Messages Log */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-3 max-w-2xl ${
                                    m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${
                                        m.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-purple-600 text-white'
                                    }`}
                                >
                                    {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div
                                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                        m.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                                            : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs shadow-xs'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{m.content}</p>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex gap-3 max-w-xl">
                                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
                                    <span>Gemini is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-4 bg-white border-t border-slate-200">
                        <form onSubmit={handleSendChat} className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ask Gemini AI about books, authors, or reading lists..."
                                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                            />
                            <Button
                                type="submit"
                                variant="purple"
                                icon={Send}
                                loading={chatLoading}
                                disabled={!chatInput.trim()}
                            >
                                Send
                            </Button>
                        </form>
                    </div>
                </Card>
            )}

            {/* Mode 2: Recommendations Engine */}
            {activeMode === 'recommend' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <form onSubmit={handleGetRecommendations} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Describe Reader Preferences or Topics
                                </label>
                                <textarea
                                    rows="3"
                                    value={prefInput}
                                    onChange={(e) => setPrefInput(e.target.value)}
                                    placeholder="e.g. I enjoyed Dune and Foundation. I am looking for philosophical sci-fi with intricate world-building and political intrigue..."
                                    className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-2 text-xs">
                                    {['Mystery Thrillers', 'Clean Architecture', 'History of Rome'].map((sample) => (
                                        <button
                                            key={sample}
                                            type="button"
                                            onClick={() => setPrefInput(sample)}
                                            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-purple-50 hover:text-purple-600 text-slate-700 text-xs font-medium"
                                        >
                                            {sample}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    type="submit"
                                    variant="purple"
                                    icon={Sparkles}
                                    loading={recLoading}
                                    disabled={!prefInput.trim()}
                                >
                                    Generate Recommendations
                                </Button>
                            </div>
                        </form>
                    </Card>

                    {/* Recommendations Output */}
                    {recommendations && (
                        <Card className="p-6">
                            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                                <Bookmark className="w-5 h-5 text-purple-600" />
                                Recommended Titles from Gemini AI
                            </h3>
                            <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {typeof recommendations === 'string'
                                    ? recommendations
                                    : JSON.stringify(recommendations, null, 2)}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Mode 3: Book Summarizer */}
            {activeMode === 'summarize' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Select Book from Catalog to Summarize
                                </label>
                                <div className="flex gap-3">
                                    <select
                                        value={selectedBookId}
                                        onChange={(e) => setSelectedBookId(e.target.value)}
                                        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">-- Choose Book from Library --</option>
                                        {booksList.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.title} (by {b.authors || 'Unknown'})
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        variant="purple"
                                        icon={Sparkles}
                                        loading={summaryLoading}
                                        disabled={!selectedBookId}
                                        onClick={handleSummarizeBook}
                                    >
                                        Generate Synopsis
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {summaryResult && (
                        <Card className="p-6">
                            <h3 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-purple-600" />
                                Executive Synopsis & Takeaways
                            </h3>
                            <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {typeof summaryResult === 'string'
                                    ? summaryResult
                                    : JSON.stringify(summaryResult, null, 2)}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

