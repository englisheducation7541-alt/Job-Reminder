import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Command,
  Copy,
  ExternalLink,
  Globe,
  HelpCircle,
  Mic,
  MicOff,
  Radio,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AiVoiceCommandResult } from '../../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SupportedVoiceLang = 'hi-IN' | 'en-US' | 'mr-IN' | 'gu-IN' | 'bn-IN';

const LANGUAGE_CONFIGS: { code: SupportedVoiceLang; name: string; nativeName: string; shortCode: string }[] = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', shortCode: 'hi' },
  { code: 'en-US', name: 'English', nativeName: 'English', shortCode: 'en' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', shortCode: 'mr' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', shortCode: 'gu' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', shortCode: 'bn' },
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({ isOpen, onClose }) => {
  const {
    executeAiAction,
    lastAiResult,
    clearLastAiResult,
    setSelectedJobId,
    setActiveTab,
    currentUser,
    users,
    jobs,
    customers,
  } = useApp();

  const [selectedLang, setSelectedLang] = useState<SupportedVoiceLang>('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AiVoiceCommandResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');

  const recognitionRef = useRef<any>(null);

  // Setup Web Speech Recognition when language changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, [selectedLang]);

  // When modal opens, reset state
  useEffect(() => {
    if (isOpen) {
      setCurrentResult(lastAiResult);
      setTranscript('');
      setTypedInput('');
      setLastSpokenText(lastAiResult?.speechResponse || '');
    } else {
      stopListening();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      setTranscript('');
      recognitionRef.current.lang = selectedLang;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // already active
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {}
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Speaks out ChatGPT's voice response using Text-to-Speech
  const speakText = (text: string) => {
    if (!soundEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
      setLastSpokenText(text);
    } catch (e) {
      console.warn('TTS voice playback error:', e);
    }
  };

  const handleProcess = async (textToProcess?: string) => {
    const query = (textToProcess || typedInput || transcript).trim();
    if (!query) return;

    stopListening();
    setIsProcessing(true);
    setCurrentResult(null);

    const langObj = LANGUAGE_CONFIGS.find((l) => l.code === selectedLang);
    const shortCode = langObj ? langObj.shortCode : 'hi';

    try {
      const result = await executeAiAction(query, shortCode);
      setCurrentResult(result);

      if (result.speechResponse) {
        speakText(result.speechResponse);
      }
    } catch (err: any) {
      console.error('ChatGPT Voice Assistant error:', err);
      setCurrentResult({
        action: 'UNKNOWN',
        confidence: 0,
        explanation: 'ChatGPT could not connect to server. Please try again.',
        speechResponse: 'Kuch takneeki samasya aayi. Kripya punah prayas karein.',
        success: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = (text: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  // Curated prompts dynamically based on active language and role
  const quickPromptsByLang: Record<SupportedVoiceLang, { label: string; cmd: string; category: string }[]> = {
    'hi-IN': [
      { label: 'राहुल को जॉब असाइन करो', cmd: 'राहुल शर्मा को अपोलो हॉस्पिटल का जॉब असाइन करो', category: 'action' },
      { label: 'ओवरड्यू कार्य दिखाएं', cmd: 'सभी ओवरड्यू और लेट जॉब्स दिखाओ', category: 'action' },
      { label: 'रैंकिंग व लीडरबोर्ड', cmd: 'सर्वश्रेष्ठ कर्मचारी रैंकिंग और लीडरबोर्ड दिखाओ', category: 'action' },
      { label: 'नाइट्रोजन प्लांट कैसे काम करता है?', cmd: 'PSA नाइट्रोजन गैस जनरेशन प्लांट कैसे काम करता है?', category: 'qa' },
      { label: 'ऑक्सीजन प्लांट में प्रेशर ड्रॉप?', cmd: 'ऑक्सीजन प्लांट में प्रेशर ड्रॉप होने के मुख्य कारण क्या हैं?', category: 'qa' },
      { label: 'पेमेंट फॉलो-अप मैसेज', cmd: 'क्लाइंट को पेंडिंग पेमेंट रिमाइंडर भेजने का तरीका बताओ', category: 'qa' },
    ],
    'en-US': [
      { label: 'Assign Job to Rahul', cmd: 'Assign job JR-2026-0101 to Rahul Sharma', category: 'action' },
      { label: 'Show Overdue Tasks', cmd: 'Show all overdue and late jobs', category: 'action' },
      { label: 'Employee Rankings', cmd: 'Show top employee rankings and leaderboard', category: 'action' },
      { label: 'PSA Oxygen Plant Checklist', cmd: 'What is the daily checklist for hospital PSA oxygen plant inspection?', category: 'qa' },
      { label: 'Preventive Maintenance SOP', cmd: 'Explain standard operating procedure for preventive maintenance of air compressors', category: 'qa' },
      { label: 'Payment Reminder Tips', cmd: 'How to write a professional payment reminder email to clients?', category: 'qa' },
    ],
    'mr-IN': [
      { label: 'राहुलला जॉब द्या', cmd: 'राहुल शर्माला नवीन काम असाइन करा', category: 'action' },
      { label: 'प्रलंबित कामे दाखवा', cmd: 'सर्व प्रलंबित आणि लेट कामे दाखवा', category: 'action' },
      { label: 'कर्मचारी रँकिंग', cmd: 'कर्मचारी कामगिरी आणि रँकिंग दाखवा', category: 'action' },
      { label: 'ऑक्सिजन प्लांट देखभाल', cmd: 'हॉस्पिटल ऑक्सिजन जनरेशन प्लांटची नियमित देखभाल कशी करावी?', category: 'qa' },
      { label: 'एअर कॉम्प्रेसर समस्या', cmd: 'इंडस्ट्रियल एअर कॉम्प्रेसर जास्त गरम होण्याची कारणे कोणती?', category: 'qa' },
    ],
    'gu-IN': [
      { label: 'રાહુલને જોબ સોંપો', cmd: 'રાહુલ શર્માને નવી જોબ સોંપો', category: 'action' },
      { label: 'બાકી રહેલા કામો બતાવો', cmd: 'બધા ઓવરડ્યુ અને પેન્ડિંગ જોબ્સ બતાવો', category: 'action' },
      { label: 'કર્મચારી રેન્કિંગ', cmd: 'સૌથી સારા કર્મચારીઓનું રેન્કિંગ બતાવો', category: 'action' },
      { label: 'ઓક્સિજન પ્લાન્ટ તપાસ', cmd: 'મેડિકલ ગેસ પાઇપલાઇન સિસ્ટમની સુરક્ષા તપાસ કેવી રીતે કરવી?', category: 'qa' },
      { label: 'પેમેન્ટ રિમાઇન્ડર સલાહ', cmd: 'ગ્રાહક પાસેથી બાકી પેમેન્ટ મેળવવા માટે શ્રેષ્ઠ રીત કઈ છે?', category: 'qa' },
    ],
    'bn-IN': [
      { label: 'রাহুলকে কাজ দিন', cmd: 'রাহুল শর্মাকে নতুন কাজের দায়িত্ব দিন', category: 'action' },
      { label: 'বকেয়া কাজ দেখুন', cmd: 'সব বকেয়া এবং ওভারডিউ কাজ দেখাও', category: 'action' },
      { label: 'কর্মচারী র্যাঙ্কিং', cmd: 'কর্মচারীদের কর্মক্ষমতা এবং র্যাঙ্কিং দেখাও', category: 'action' },
      { label: 'অক্সিজেন প্ল্যান্ট রক্ষণাবেক্ষণ', cmd: 'হাসপাতালের পিএসএ অক্সিজেন প্ল্যান্টের রক্ষণাবেক্ষণের নিয়ম কী?', category: 'qa' },
      { label: 'পেমেন্ট রিমাইন্ডার পরামর্শ', cmd: 'ক্লায়েন্টকে বকেয়া পেমেন্টের অনুরোধ জানানোর পেশাদার উপায় কী?', category: 'qa' },
    ],
  };

  const currentPrompts = quickPromptsByLang[selectedLang] || quickPromptsByLang['hi-IN'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header with ChatGPT Branding & Language Switcher */}
        <div className="px-5 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Bot className="w-6 h-6 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                  <span>ChatGPT 4o Voice Assistant</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-emerald-950 tracking-wider">
                    ChatGPT
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-0.5">
                Mic par click karke kuch bhi puchiye — ChatGPT text aur voice dono me answer dega!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1 bg-white/15 border border-white/25 rounded-xl px-2.5 py-1.5 text-xs text-white">
              <Globe className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <select
                value={selectedLang}
                onChange={(e) => {
                  const newLang = e.target.value as SupportedVoiceLang;
                  setSelectedLang(newLang);
                  stopListening();
                }}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
                title="Change Voice Assistant Language"
              >
                {LANGUAGE_CONFIGS.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-stone-900 bg-white font-semibold">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Voice Audio Speaker Toggle */}
            <button
              onClick={() => {
                const nextState = !soundEnabled;
                setSoundEnabled(nextState);
                if (!nextState && typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white cursor-pointer transition-colors"
              title={soundEnabled ? 'Voice Audio: ON (Click to Mute)' : 'Voice Audio: MUTED (Click to Unmute)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-200" /> : <VolumeX className="w-4 h-4 text-amber-200" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Microphone Interactive Zone */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-stone-50 via-emerald-50/20 to-teal-50/30 border border-emerald-200/60 text-center relative overflow-hidden shadow-inner">
            {/* Animated Soundwave Rings when Listening */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="w-40 h-40 rounded-full bg-emerald-400/25 animate-ping" />
                <span className="w-56 h-56 rounded-full bg-teal-300/15 animate-pulse" />
              </div>
            )}

            {/* Mic Big Button */}
            <button
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl cursor-pointer transition-all duration-300 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 ring-8 ring-red-200 scale-105 animate-pulse'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 ring-4 ring-emerald-100 shadow-emerald-700/25'
              }`}
              title={isListening ? 'Stop Listening' : 'Click to Speak with ChatGPT'}
            >
              {isListening ? <Mic className="w-8 h-8 animate-bounce text-white" /> : <Mic className="w-8 h-8 text-white" />}
            </button>

            {/* Status & Language Badge */}
            <div className="mt-4 text-center">
              <div className="text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5">
                {isListening ? (
                  <>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-red-600 font-bold uppercase tracking-wider">
                      Listening in {LANGUAGE_CONFIGS.find((l) => l.code === selectedLang)?.nativeName}...
                    </span>
                  </>
                ) : isProcessing ? (
                  <>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-emerald-700 font-bold">
                      ChatGPT is reasoning &amp; generating voice answer...
                    </span>
                  </>
                ) : (
                  <span className="text-stone-600">
                    Mic par tap karein aur bolna shuru karein (Language:{' '}
                    <strong className="text-emerald-700">
                      {LANGUAGE_CONFIGS.find((l) => l.code === selectedLang)?.nativeName}
                    </strong>
                    )
                  </span>
                )}
              </div>

              {/* Transcript Display */}
              {(transcript || isListening) && (
                <div className="mt-2.5 text-sm font-semibold text-stone-900 bg-white/95 px-4 py-2.5 rounded-2xl border border-emerald-200 max-w-lg shadow-xs min-h-[38px] flex items-center justify-center mx-auto">
                  "{transcript || 'Listening to your speech...'}"
                </div>
              )}
            </div>

            {/* Action button if transcript captured */}
            {transcript && isListening && (
              <button
                onClick={() => handleProcess(transcript)}
                className="mt-3.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Ask ChatGPT Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Text Input Option for Typing */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcess();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  selectedLang === 'en-US'
                    ? "Type any question or command for ChatGPT (e.g., 'What is an air compressor?', 'Assign job to Rahul')..."
                    : "ChatGPT se kuch bhi puchiye ya command type karein (e.g. 'Rahul ko job assign karo', 'Oxygen plant checklist')..."
                }
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!typedInput.trim() || isProcessing}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer disabled:opacity-40"
                title="Send query to ChatGPT"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* ChatGPT Response Card (Voice & Text Display) */}
          {currentResult && (
            <div
              className={`p-4 sm:p-5 rounded-2xl border transition-all animate-in fade-in duration-200 ${
                currentResult.success !== false
                  ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-white border-emerald-300 text-emerald-950 shadow-sm'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                        ChatGPT Answer
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900 font-mono">
                        Voice + Text
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Replay Voice Audio Button */}
                  {currentResult.speechResponse && (
                    <button
                      type="button"
                      onClick={() => speakText(currentResult.speechResponse)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      title="Replay Voice Speech"
                    >
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      <span>Replay Voice</span>
                    </button>
                  )}

                  {/* Copy Answer Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyText(currentResult.explanation || currentResult.speechResponse)}
                    className="p-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 cursor-pointer transition-colors"
                    title="Copy Answer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  </button>
                </div>
              </div>

              {/* Spoken Voice Highlight */}
              {currentResult.speechResponse && (
                <div className="p-3 rounded-xl bg-emerald-100/60 border border-emerald-200 mb-2 flex items-start gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-emerald-950 leading-relaxed">
                    "{currentResult.speechResponse}"
                  </p>
                </div>
              )}

              {/* Detailed Formatted Text Response */}
              {currentResult.explanation && (
                <div className="text-xs text-stone-800 leading-relaxed font-normal whitespace-pre-line mt-2 bg-white/70 p-3 rounded-xl border border-emerald-100">
                  {currentResult.explanation}
                </div>
              )}

              {/* Action buttons if operational command executed */}
              {currentResult.payload && (currentResult.payload.jobId || currentResult.payload.tab) && (
                <div className="mt-3 pt-2.5 border-t border-emerald-200/80 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Action: {currentResult.action.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentResult.payload.jobId && (
                      <button
                        onClick={() => {
                          setSelectedJobId(currentResult.payload?.jobId);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>View Job Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {currentResult.payload.tab && (
                      <button
                        onClick={() => {
                          setActiveTab(currentResult.payload?.tab);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>Open Section</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Voice / Text Suggestions in Selected Language */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Suggested Queries for ChatGPT ({LANGUAGE_CONFIGS.find((l) => l.code === selectedLang)?.nativeName}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTypedInput(p.cmd);
                    handleProcess(p.cmd);
                  }}
                  className={`text-[11px] px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-left flex items-center gap-1 shadow-2xs ${
                    p.category === 'qa'
                      ? 'border-teal-200 bg-teal-50/60 hover:bg-teal-100 hover:border-teal-300 text-teal-900'
                      : 'border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-stone-700 hover:text-emerald-900'
                  }`}
                >
                  <span>{p.category === 'qa' ? '💡' : '🎙️'}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Bot className="w-3.5 h-3.5 text-emerald-600" />
            <span>ChatGPT 4o Speech Engine • Multi-Language Voice Q&amp;A Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
