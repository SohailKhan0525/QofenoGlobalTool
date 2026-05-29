import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, ArrowLeft, ShieldCheck, Download, Heart, Eye, PlayCircle, HelpCircle, X, ChevronDown, Share2, Loader2, ChevronRight, Maximize, FileText, Facebook, Twitter, Linkedin, Copy, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { Query } from 'appwrite';
import { account, databases, DATABASE_ID, realtime, runBase64Encoder, runJsonFormatter, runWordCounter, trackEvent } from '../../lib/qofeno-appwrite';
import { FALLBACK_TOOLS, useToolCatalog } from '../../lib/toolCatalog';

// Shadcn imports
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { SEO } from '../../components/SEO';
import { FILE_TOOL_SLUGS, FileToolWorkspace } from './FileToolWorkspace';
import { useAuth } from '../../context/AuthContext';

export function ToolPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { tools } = useToolCatalog();
  const { user } = useAuth();
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [views, setViews] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isLoadingTool, setIsLoadingTool] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch tool data
  const toolId = localStorage.getItem('selected_tool_id') || 'json-formatter';
  const tool = tools.find(t => t.id === toolId) || FALLBACK_TOOLS.find(t => t.id === toolId) || tools[0] || FALLBACK_TOOLS[0];
  const ToolIcon = tool.icon;
  const toolSlug = tool.slug || tool.id;

  useEffect(() => {
    const syncUser = async () => {
      setCurrentUserId(user?.id || null);
    };
    void syncUser();

    // Add to recently viewed
    try {
      const rv = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      const newRv = [toolId, ...rv.filter((id: string) => id !== toolId)].slice(0, 4);
      localStorage.setItem('recently_viewed', JSON.stringify(newRv));
    } catch (e) {}

    // Simulate loading state for skeleton
    setIsLoadingTool(true);
    const timer = setTimeout(() => {
      setIsLoadingTool(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [toolId, user?.id]);

  useEffect(() => {
    let cancelled = false;

    const syncStats = async () => {
      try {
        const viewsResp = await databases.listDocuments(DATABASE_ID, 'tool_views', [Query.equal('tool_slug', toolSlug), Query.limit(1)]);
        const viewsDoc = viewsResp.documents?.[0] as any;

        if (cancelled) return;
        setViews(Number(viewsDoc?.count || 0));
        setLikes(Number(viewsDoc?.likes || 0));

        if (currentUserId) {
          const userLikes = await databases.listDocuments(DATABASE_ID, 'tool_likes', [
            Query.equal('tool_slug', toolSlug),
            Query.equal('user_id', currentUserId),
          ]);
          if (!cancelled) {
            setHasLiked(userLikes.total > 0);
          }
        } else if (!cancelled) {
          const likedTools = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
          setHasLiked(Array.isArray(likedTools) && likedTools.includes(toolSlug));
        }
      } catch {
        if (!cancelled) {
          setViews(0);
          setLikes(0);
          setHasLiked(false);
        }
      }
    };

    void syncStats();

    return () => {
      cancelled = true;
    };
  }, [toolSlug, currentUserId]);

  useEffect(() => {
    const channel = `databases.${DATABASE_ID}.collections.tool_views.documents`;
    let subscription: any = null;
    void realtime.subscribe(channel, (event: any) => {
      const doc = event?.payload;
      if (!doc || doc.tool_slug !== toolSlug) return;
      setViews(Number(doc.count || 0));
      setLikes(Number(doc.likes || 0));
    }).then((sub: any) => {
      subscription = sub;
    }).catch(() => {});
    return () => {
      try { subscription?.close?.(); } catch {}
    };
  }, [toolSlug]);

  useEffect(() => {
    let cancelled = false;
    const sendView = async () => {
      try {
        await trackEvent('view', toolSlug, currentUserId || undefined);
        if (cancelled) return;
        if (currentUserId) {
          // mark recently viewed for logged-in users
          await trackEvent('recent', toolSlug, currentUserId);
        } else {
          // localStorage fallback for anonymous users
          try {
            const rv = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
            const newRv = [toolId, ...rv.filter((id: string) => id !== toolId)].slice(0, 4);
            localStorage.setItem('recently_viewed', JSON.stringify(newRv));
          } catch {}
        }
      } catch {}
    };

    void sendView();

    return () => { cancelled = true };
  }, [toolSlug, currentUserId]);

  const toggleLike = () => {
    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    setLikes((prev) => Math.max(0, prev + (hasLiked ? -1 : 1)));

    if (!currentUserId) {
      const likedTools = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
      const asArray = Array.isArray(likedTools) ? likedTools : [];
      const updated = nextLiked
        ? Array.from(new Set([...asArray, toolSlug]))
        : asArray.filter((slug: string) => slug !== toolSlug);
      localStorage.setItem('qofeno_likes', JSON.stringify(updated));
    }

    const eventType = hasLiked ? 'unlike' : 'like';
    void trackEvent(eventType, toolSlug, currentUserId || undefined).catch(() => {
      // Revert optimistic update only on request failure.
      setHasLiked(hasLiked);
      setLikes((prev) => Math.max(0, prev + (hasLiked ? 1 : -1)));
    });
  };

  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statsObj, setStatsObj] = useState<any>({ words: 0, chars: 0, readingTime: 0 });
  const [actionMode, setActionMode] = useState<'encode' | 'decode'>('encode');
  
  const [downloadState, setDownloadState] = useState<{ isBatch: boolean; currentCount: number; totalCount: number; progress: number } | null>(null);

  const handleDownload = () => {
    const lines = outputText.trim().split('\n').length;
    const isBatch = lines > 1;
    const totalCount = isBatch ? lines : 1;
    
    setDownloadState({ isBatch, currentCount: 0, totalCount, progress: 0 });
    
    // Simulate reading stream progress
    const interval = setInterval(() => {
      setDownloadState(prev => {
        if (!prev) return prev;
        let newProgress = prev.progress + (100 / totalCount / 10);
        let newCount = Math.floor((newProgress / 100) * totalCount);
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadState(null);
            
            // Actual file download
            const blob = new Blob([outputText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qofeno_result_${toolId}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success("File downloaded!");
          }, 400);
          return { ...prev, progress: 100, currentCount: totalCount };
        }
        return { ...prev, progress: newProgress, currentCount: newCount };
      });
    }, 100);
  };

  // Real-time processing
  useEffect(() => {
    let cancelled = false;

    if (!inputText) {
      setOutputText('');
      setStatsObj({ words: 0, chars: 0, readingTime: 0 });
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    const timer = window.setTimeout(async () => {
      try {
        if (toolSlug === 'json-formatter') {
          const result = await runJsonFormatter(inputText, 'format');
          if (cancelled) return;
          if (result?.success) {
            setOutputText(result.result || '');
          } else {
            setOutputText(result?.error ? `// ${result.error}` : '// Invalid JSON');
          }
        } else if (toolSlug === 'base64-encoder') {
          try {
            const result = await runBase64Encoder(inputText, actionMode);
            if (cancelled) return;
            if (result?.success) {
              setOutputText(result.result || '');
            } else {
              setOutputText(result?.error ? `// ${result.error}` : '// Error processing input.');
            }
          } catch {
            if (cancelled) return;
            if (actionMode === 'encode') {
              setOutputText(btoa(inputText));
            } else {
              setOutputText(atob(inputText));
            }
          }
        } else if (toolSlug === 'word-counter') {
          const result = await runWordCounter(inputText);
          if (cancelled) return;
          if (result?.success !== false) {
            setStatsObj({
              words: Number(result?.words || 0),
              chars: Number(result?.characters || result?.chars || 0),
              readingTime: Number(result?.reading_time_minutes || result?.readingTime || 0),
            });
          }
        }
      } catch (e: any) {
        if (cancelled) return;
        if (toolSlug === 'json-formatter') {
          setOutputText('// Invalid JSON');
        } else if (toolSlug === 'base64-encoder' && actionMode === 'decode') {
          setOutputText('// Invalid Base64 string');
        } else if (toolSlug === 'word-counter') {
          const text = inputText.trim();
          const words = text ? text.split(/\s+/).length : 0;
          const chars = inputText.length;
          setStatsObj({ words, chars, readingTime: Math.ceil(words / 200) });
        } else {
          setOutputText('// Error processing input.');
        }
      } finally {
        if (!cancelled) {
          setIsProcessing(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputText, actionMode, toolSlug]);

  const [docSearchQuery, setDocSearchQuery] = useState('');

  const getInstructions = (id: string) => {
    if (id === 'json-formatter') {
      return [
        { q: "How to parse and format JSON data?", a: "Paste standard raw or minified JSON text into the Input text area. The parser will immediately clean, structure, validate and format indentations dynamically in real-time." },
        { q: "How to fix invalid JSON syntax errors or warnings?", a: "If the output text displays '// Invalid JSON', review your input block for issues such as missing double quotes around keys, unclosed brackets, or dangling trailing commas." },
        { q: "How to copy and download formatted JSON results?", a: "Click the 'Copy Result' button to add the formatted code directly to your clipboard, or click 'Download' to save the beautified code as a file locally." },
        { q: "How is local security policy handled for files?", a: "Your JSON data is parsed entirely locally in your browser workspace memory. Absolutely no JSON input drafts leave your computer." }
      ];
    } else if (id === 'base64-encoder') {
      return [
        { q: "How to Encode regular text characters to Base64 format?", a: "Set operations mode to 'Encode Base64', input standard plain text inside the input box, and copy the safe encoded characters instantly." },
        { q: "How to Decode a Base64 string back to human-readable text?", a: "Set status mode to 'Decode Base64', input standard Base64 string content, and standard text output is returned immediately on the flyer." },
        { q: "How does local sandboxed Base64 conversion process work?", a: "All conversion procedures are performed entirely in-memory using native browser APIs with high performance. Offline compatible and 100% private." }
      ];
    } else {
      return [
        { q: "How do I measure copywriting stats like word count?", a: "Type draft paragraphs of text inside the text input field. Calculated metrics like words index, character length, and estimated reading time are measured dynamically." },
        { q: "How is the estimated human reading session calculated?", a: "Calculations assume an average human reading index speed of 200 words-per-minute for standard accuracy." }
      ];
    }
  };

  const FAQs = [
    { q: `How do I use this ${tool.name}?`, a: "Simply paste your input text or upload the required raw file, configure any available mode options, and click to process. The result will instantly appear." },
    { q: "Is my data secure?", a: "Yes. All processing is either executed completely locally within your browser sandbox or securely transmitted and instantly deleted from our servers." },
    { q: `What formats does ${tool.name} support?`, a: "We support all standard formats required for this operation. The platform accepts valid input seamlessly." },
    { q: "Is there a usage limit?", a: "You can use this tool repeatedly. However, for extremely large datasets or files, you might need a Pro plan to bypass standard limitations." },
    { q: "Who can I contact if I face an issue?", a: "You can reach out to our support team via the Contact Page, and we'll be happy to assist you immediately." },
  ];

  const isFileTool = FILE_TOOL_SLUGS.has(toolSlug);

  if (isFileTool) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pt-28 md:pt-40 pb-24 px-4 md:px-8 select-none overflow-x-hidden relative">
        <SEO title={tool.name} description={tool.desc} />
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <nav className="flex items-center gap-2 text-sm font-bold text-neutral-500 min-w-0">
              <button onClick={() => onNavigate('home')} className="hover:text-purple-600 transition-colors cursor-pointer">Home</button>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <button onClick={() => onNavigate('tools')} className="hover:text-purple-600 transition-colors cursor-pointer">Tools</button>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[#0F0A1E] truncate max-w-[180px] md:max-w-[320px]">{tool.name}</span>
            </nav>

            <button
              onClick={() => onNavigate('tools')}
              className="inline-flex items-center gap-2 text-neutral-500 hover:text-purple-600 transition-colors font-bold text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="space-y-6">
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-5 md:items-start md:justify-between mb-6">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-14 h-14 shrink-0 bg-purple-50 rounded-2xl flex items-center justify-center">
                      <ToolIcon className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-2xl md:text-3xl font-black text-[#0F0A1E] mb-2">{tool.name}</h1>
                      <p className="text-neutral-500 text-sm leading-relaxed max-w-2xl">{tool.desc}</p>
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger
                      className="self-start p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all cursor-pointer"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: tool.name,
                            text: tool.desc,
                            url: window.location.href,
                          }).catch((err) => {
                            if (err.name !== 'AbortError') console.error(err);
                          });
                        } else {
                          setIsShareModalOpen(true);
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share this tool</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <FileToolWorkspace tool={tool} userId={currentUserId} />

                <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    Result auto-deletes in 30 mins
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" /> How it works
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-[#0F0A1E] text-sm uppercase tracking-wider mb-4">Tool Stats</h3>
                <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                  <span className="text-neutral-500 text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Views
                  </span>
                  <span className="font-bold text-[#0F0A1E]">{views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-neutral-500 text-sm font-medium flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Likes
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#0F0A1E]">{likes.toLocaleString()}</span>
                    <button
                      onClick={toggleLike}
                      className={cn(
                        "p-2 rounded-full transition-all cursor-pointer",
                        hasLiked ? "bg-pink-100 text-pink-600 shadow-sm" : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-purple-900 mb-2">Upgrade to Pro</h3>
                <p className="text-xs text-purple-700 leading-relaxed mb-4">
                  Get unlimited bulk processing, secure API access, and no file size limits.
                </p>
                <button
                  onClick={() => onNavigate('pricing')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F0A1E]/40 backdrop-blur-sm pointer-events-auto"
                onClick={() => setIsModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl relative z-10 pointer-events-auto"
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-500 transition-colors"
                >
                  <X className="w-4 h-4 cursor-pointer" />
                </button>

                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-black text-2xl text-[#0F0A1E] mb-3">Privacy & Security Assured</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                  Your data and privacy are strictly protected and never used by us.
                  Any files you upload are processed securely and deleted automatically
                  within 30 minutes from our servers.
                </p>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-[#0F0A1E] hover:bg-neutral-800 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isShareModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F0A1E]/40 backdrop-blur-sm pointer-events-auto"
                onClick={() => setIsShareModalOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl relative z-10 pointer-events-auto"
              >
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="absolute top-6 right-6 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 cursor-pointer" />
                </button>

                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <Share2 className="w-6 h-6 text-blue-600" />
                </div>

                <h2 className="font-black text-2xl text-[#0F0A1E] mb-2">Share this tool</h2>
                <p className="text-neutral-500 text-sm mb-6">Let your friends or colleagues know about this awesome tool.</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Facebook className="w-6 h-6" />
                    <span className="text-xs font-bold">Facebook</span>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(tool.desc)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-sky-50 text-sky-500 hover:bg-sky-100 transition-colors cursor-pointer"
                  >
                    <Twitter className="w-6 h-6" />
                    <span className="text-xs font-bold">Twitter</span>
                  </a>
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(tool.name)}&summary=${encodeURIComponent(tool.desc)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <Linkedin className="w-6 h-6" />
                    <span className="text-xs font-bold">LinkedIn</span>
                  </a>
                </div>

                <div className="flex items-center gap-3 w-full bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                  <div className="flex-1 overflow-hidden px-1">
                    <p className="text-xs text-neutral-500 truncate whitespace-nowrap">{window.location.href}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied to clipboard!");
                      setIsShareModalOpen(false);
                    }}
                    className="flex bg-white items-center gap-1.5 py-1.5 px-3 hover:bg-neutral-100 shadow-sm border border-neutral-200 rounded-lg text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 md:pt-40 pb-24 px-4 md:px-8 select-none overflow-x-hidden relative">
      <SEO title={tool.name} description={tool.desc} />
      {/* @ts-ignore */}
      {tool.schemaMarkup && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: tool.schemaMarkup }}
        />
      )}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm font-bold text-neutral-500">
            <button onClick={() => onNavigate('home')} className="hover:text-purple-600 transition-colors cursor-pointer">Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={() => onNavigate('tools')} className="hover:text-purple-600 transition-colors cursor-pointer">Tools</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#0F0A1E] truncate max-w-[150px] md:max-w-[300px]">{tool.name}</span>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('tools')}
              className="flex items-center gap-2 text-neutral-500 hover:text-purple-600 transition-colors font-bold text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden md:inline">Back to Tools</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Workspace */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 md:p-10 shadow-sm relative">
              <div className="absolute top-6 right-6">
                <Tooltip>
                  <TooltipTrigger 
                    className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all cursor-pointer"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: tool.name,
                          text: tool.desc,
                          url: window.location.href,
                        }).catch((err) => {
                          if (err.name !== 'AbortError') console.error(err);
                        });
                      } else {
                        setIsShareModalOpen(true);
                      }
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share this tool</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {isLoadingTool ? (
                <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <div className="space-y-3 mt-1 flex-1">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-full max-w-sm" />
                    <Skeleton className="h-4 w-5/6 max-w-sm" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-start mb-8 pr-0 md:pr-12">
                  <div className="w-16 h-16 shrink-0 bg-purple-50 rounded-2xl flex items-center justify-center">
                    <ToolIcon className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[#0F0A1E] mb-2">{tool.name}</h1>
                    <p className="text-neutral-500 max-w-md text-sm leading-relaxed">{tool.desc}</p>
                  </div>
                </div>
              )}

              {/* Tool Input & Real-time Output Zone */}
              {isLoadingTool ? (
                <div className="flex flex-col gap-6">
                  <Skeleton className="w-full h-8 max-w-[200px]" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Skeleton className="w-full h-64 rounded-xl" />
                    <Skeleton className="w-full h-64 rounded-xl" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                    {toolSlug === 'base64-encoder' && (
                    <div className="flex gap-2">
                      <button onClick={() => setActionMode('encode')} className={cn("px-4 py-2 rounded-lg text-sm font-bold border transition-colors", actionMode === 'encode' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-neutral-600 border-neutral-200')}>Encode Base64</button>
                      <button onClick={() => setActionMode('decode')} className={cn("px-4 py-2 rounded-lg text-sm font-bold border transition-colors", actionMode === 'decode' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-neutral-600 border-neutral-200')}>Decode Base64</button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-neutral-600">Input</label>
                        <button onClick={() => setInputText('')} className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors">Clear</button>
                      </div>
                      <textarea
                        className="w-full h-64 p-4 border border-neutral-200 rounded-xl focus:border-purple-500 outline-none font-mono text-sm resize-none bg-neutral-50/50"
                        placeholder="Type or paste your input here..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                    </div>

                    {toolSlug === 'word-counter' ? (
                    <motion.div 
                      key="stats"
                      layout
                      variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                      }}
                      initial="hidden"
                      animate="show"
                      className="flex flex-col gap-4"
                    >
                       <label className="text-sm font-bold text-neutral-600">Live Statistics</label>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-64">
                         {[
                           { val: statsObj.words, label: "Words" },
                           { val: statsObj.chars, label: "Characters" },
                           { val: statsObj.readingTime + 'm', label: "Read Time" }
                         ].map((stat, idx) => (
                           <motion.div 
                             key={idx}
                             layout
                             variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                             className="bg-white border border-neutral-200 rounded-xl p-4 text-center flex flex-col items-center justify-center"
                           >
                              <p className="text-3xl lg:text-4xl font-black text-[#0F0A1E] mb-1">{stat.val}</p>
                              <p className="text-xs uppercase tracking-widest text-neutral-400 font-bold">{stat.label}</p>
                           </motion.div>
                         ))}
                       </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-neutral-600">Output</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(outputText); toast.success("Copied!"); }} className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 px-3 py-1 rounded-full">Copy Result</button>
                          {outputText && (
                            <button onClick={handleDownload} className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer">
                              <Download className="w-3 h-3" /> Download
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-64 border border-neutral-200 bg-white rounded-xl overflow-hidden relative">
                        <div className="w-full h-full p-4 overflow-auto font-mono text-sm whitespace-pre-wrap break-all">
                           <AnimatePresence mode="wait">
                              {isProcessing ? (
                                 <motion.div
                                   key="processing"
                                   initial={{ opacity: 0, scale: 0.98 }}
                                   animate={{ opacity: 0.75, scale: 1 }}
                                   exit={{ opacity: 0, scale: 0.98 }}
                                   transition={{ duration: 0.15 }}
                                   className="flex items-center gap-2 text-neutral-400 font-sans italic"
                                 >
                                   <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
                                   Computing formatted output...
                                 </motion.div>
                              ) : outputText ? (
                                 <motion.div
                                   key={outputText}
                                   initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
                                   animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                   exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
                                   transition={{ duration: 0.25, ease: "easeOut" }}
                                 >
                                    {outputText}
                                 </motion.div>
                              ) : (
                                 <motion.span
                                   key="empty"
                                   initial={{ opacity: 0 }}
                                   animate={{ opacity: 1 }}
                                   exit={{ opacity: 0 }}
                                   className="text-neutral-400 italic flex"
                                 >
                                   Result will appear here...
                                 </motion.span>
                              )}
                           </AnimatePresence>
                        </div>
                        
                        <AnimatePresence>
                          {downloadState && (
                             <motion.div 
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               exit={{ opacity: 0 }}
                               className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10"
                             >
                                <div className="w-full max-w-xs space-y-4">
                                  <div className="flex justify-between text-sm font-bold text-[#0F0A1E]">
                                    <span>{downloadState.isBatch ? "Batch Downloading..." : "Downloading Stream..."}</span>
                                    <span>{Math.round(downloadState.progress)}%</span>
                                  </div>
                                  <Progress value={downloadState.progress} className="h-3 bg-neutral-200 [&>div]:bg-purple-600" />
                                  {downloadState.isBatch && (
                                    <div className="text-xs text-neutral-500 text-center font-medium">
                                      Processing File {downloadState.currentCount} of {downloadState.totalCount}
                                    </div>
                                  )}
                                </div>
                             </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  Result auto-deletes in 30 mins
                </div>
                <Tooltip>
                  <TooltipTrigger
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1 cursor-pointer relative"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <PlayCircle className="w-4 h-4" /> How it works
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Read about our security & processing</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-[#0F0A1E] text-sm uppercase tracking-wider mb-4">Tool Stats</h3>
              {isLoadingTool ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="text-neutral-500 text-sm font-medium flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Views
                    </span>
                    <span className="font-bold text-[#0F0A1E]">{views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-neutral-500 text-sm font-medium flex items-center gap-2">
                      <Heart className="w-4 h-4" /> Likes
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#0F0A1E]">{likes.toLocaleString()}</span>
                      <button 
                        onClick={toggleLike}
                        className={cn(
                          "p-2 rounded-full transition-all cursor-pointer",
                          hasLiked ? "bg-pink-100 text-pink-600 shadow-sm" : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", hasLiked && "fill-current")} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-purple-900 mb-2">Upgrade to Pro</h3>
              <p className="text-xs text-purple-700 leading-relaxed mb-4">
                Get unlimited bulk processing, secure API access, and no file size limits.
              </p>
              <button 
                onClick={() => onNavigate('pricing')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>

        {/* Documentation & FAQs with Live Filtering Search Input */}
        <div className="mt-16 bg-white border border-neutral-200/80 rounded-3xl p-5 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-[#0F0A1E]" />
              <div>
                <h2 className="text-xl md:text-2xl font-black text-[#0F0A1E]">Documentation & FAQ</h2>
                <p className="text-neutral-500 text-xs mt-0.5">Explore search-guided instructions and answers for {tool.name}</p>
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-80 shrink-0">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-neutral-400">
                <Search className="w-4 h-4 text-purple-600" />
              </span>
              <input
                type="text"
                placeholder="Search instructions or FAQs..."
                value={docSearchQuery}
                onChange={(e) => {
                  setDocSearchQuery(e.target.value);
                  // Reset accordion when user types to avoid conflicting states
                  setActiveFaq(null);
                }}
                className="w-full bg-[#FAFAFA] hover:bg-neutral-50 focus:bg-white text-sm font-semibold text-[#0F0A1E] outline-none border border-neutral-200 focus:border-purple-500 rounded-xl py-2.5 pl-10 pr-10 transition-all placeholder:text-neutral-400"
              />
              {docSearchQuery && (
                <button
                  onClick={() => setDocSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                >
                  <X className="w-4 h-4 cursor-pointer" />
                </button>
              )}
            </div>
          </div>

          {(() => {
            const combinedDocs = [
              ...getInstructions(toolId).map((item, idx) => ({ ...item, uniqueKey: `inst-${idx}`, category: "Instructions" })),
              ...FAQs.map((item, idx) => ({ ...item, uniqueKey: `faq-${idx}`, category: "FAQ" }))
            ];
            
            const filteredDocs = combinedDocs.filter(doc => {
              const q = doc.q.toLowerCase();
              const a = doc.a.toLowerCase();
              const query = docSearchQuery.toLowerCase().trim();
              return q.includes(query) || a.includes(query);
            });

            if (filteredDocs.length > 0) {
              return (
                <div className="space-y-4">
                  {filteredDocs.map((doc, idx) => {
                    const isSearching = docSearchQuery.trim().length > 0;
                    const isOpen = isSearching || activeFaq === idx;

                    // Light highlighting element
                    const highlightText = (text: string, highlight: string) => {
                      if (!highlight.trim()) return text;
                      const parts = text.split(new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
                      return (
                        <span>
                          {parts.map((part, i) => 
                            part.toLowerCase() === highlight.toLowerCase() ? (
                              <mark key={i} className="bg-purple-100 text-purple-900 px-1 rounded font-black font-sans">
                                {part}
                              </mark>
                            ) : (
                              part
                            )
                          )}
                        </span>
                      );
                    };

                    return (
                      <div key={doc.uniqueKey} className="border border-neutral-200/50 bg-[#FAFAFA] rounded-2xl overflow-hidden transition-all duration-300">
                        <button
                          onClick={() => {
                            if (!isSearching) {
                              setActiveFaq(activeFaq === idx ? null : idx);
                            }
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-4 sm:p-6 text-left font-bold text-[#0F0A1E] transition-colors gap-4 text-sm sm:text-base",
                            isSearching ? "cursor-default" : "hover:bg-neutral-100 cursor-pointer"
                          )}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[9px] uppercase font-black tracking-wider w-fit shrink-0",
                              doc.category === "Instructions" ? "bg-purple-100 text-purple-700" : "bg-neutral-200 text-neutral-700"
                            )}>
                              {doc.category}
                            </span>
                            <span className="text-[#0F0A1E] font-extrabold">{highlightText(doc.q, docSearchQuery)}</span>
                          </div>
                          {!isSearching && (
                            <ChevronDown className={cn("w-5 h-5 text-purple-600 transition-transform duration-300 shrink-0", isOpen ? "rotate-180" : "")} />
                          )}
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={isSearching ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="p-4 sm:p-6 pt-0 text-xs sm:text-sm text-neutral-500 leading-relaxed bg-white border-t border-neutral-200/50">
                                {highlightText(doc.a, docSearchQuery)}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              );
            }

            return (
              <div className="text-center py-12 px-4 bg-[#FAFAFA] rounded-2xl border border-dashed border-neutral-200">
                <Search className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-neutral-800 mb-1">No matches found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  No instructions or FAQs matched your query "{docSearchQuery}". Try general keywords like "format", "locally", or "secure".
                </p>
                <button
                  onClick={() => setDocSearchQuery('')}
                  className="bg-[#0F0A1E] hover:bg-neutral-850 text-white font-bold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F0A1E]/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl relative z-10 pointer-events-auto"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-500 transition-colors"
              >
                <X className="w-4 h-4 cursor-pointer" />
              </button>
              
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-black text-2xl text-[#0F0A1E] mb-3">Privacy & Security Assured</h3>
              <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                Your data and privacy are strictly protected and never used by us. 
                Any files you upload are processed securely and deleted automatically 
                within 30 minutes from our servers.
              </p>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-[#0F0A1E] hover:bg-neutral-800 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#0F0A1E]/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => setIsShareModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl relative z-10 pointer-events-auto"
            >
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 cursor-pointer" />
              </button>
              
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6 text-blue-600" />
              </div>
              
              <h2 className="font-black text-2xl text-[#0F0A1E] mb-2">Share this tool</h2>
              <p className="text-neutral-500 text-sm mb-6">Let your friends or colleagues know about this awesome tool.</p>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Facebook className="w-6 h-6" />
                  <span className="text-xs font-bold">Facebook</span>
                </a>
                <a 
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(tool.desc)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-sky-50 text-sky-500 hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  <Twitter className="w-6 h-6" />
                  <span className="text-xs font-bold">Twitter</span>
                </a>
                <a 
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(tool.name)}&summary=${encodeURIComponent(tool.desc)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Linkedin className="w-6 h-6" />
                  <span className="text-xs font-bold">LinkedIn</span>
                </a>
              </div>

              <div className="flex items-center gap-3 w-full bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <div className="flex-1 overflow-hidden px-1">
                  <p className="text-xs text-neutral-500 truncate whitespace-nowrap">{window.location.href}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                    setIsShareModalOpen(false);
                  }}
                  className="flex bg-white items-center gap-1.5 py-1.5 px-3 hover:bg-neutral-100 shadow-sm border border-neutral-200 rounded-lg text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
