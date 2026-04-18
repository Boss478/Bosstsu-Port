"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { PYTHON_EXAMPLES } from "./examples";
import { PYTHON_METADATA } from "./data";



type EditorMode = "default" | "easy" | "study";

export default function PythonCompilerClient() {
  const [code, setCode] = useState('print("Hello world")');
  const [output, setOutput] = useState<string>("");
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [mode, setMode] = useState<EditorMode>("default");
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [inputPromptText, setInputPromptText] = useState("");
  const [pendingInputId, setPendingInputId] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });
  const [validationState, setValidationState] = useState<{ errors: number[]; unused: string[] }>({ errors: [], unused: [] });
  const [textareaWidth, setTextareaWidth] = useState(0);


  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLPreElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const consoleInputRef = useRef<HTMLInputElement>(null);

  const appendOutput = useCallback((msg: string, isError = false) => {
    let internalMsg = msg;
    if (isError && mode === "study") {
      internalMsg = internalMsg.replace(/line (\d+)/gi, (match, lineNum) => {
        return `<span class="cursor-pointer text-red-500 underline font-bold" onclick="window.dispatchEvent(new CustomEvent('jump-to-line', { detail: ${lineNum} }))">${match}</span>`;
      });
    }

    setOutput((prev: string) => {
      if (prev.length > 15000) return prev;
      return prev + (isError ? `<span class="text-red-400">${internalMsg}</span>\n` : `${internalMsg}\n`);
    });
  }, [mode]);

  useEffect(() => {
    const handleJump = (e: any) => {
      const lineNum = e.detail;
      if (textareaRef.current) {
        const lines = code.split("\n");
        let charPos = 0;
        for (let i = 0; i < lineNum - 1 && i < lines.length; i++) {
          charPos += lines[i].length + 1;
        }
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(charPos, charPos + (lines[lineNum - 1]?.length || 0));
        setTimeout(() => textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      }
    };
    window.addEventListener("jump-to-line", handleJump);
    return () => window.removeEventListener("jump-to-line", handleJump);
  }, [code]);

  useEffect(() => {
    const worker = new Worker("/pyodide-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type } = e.data;
      if (type === "ready") { setIsEngineReady(true); return; }
      if (type === "stdout") { appendOutput(e.data.text); return; }
      if (type === "stderr") { appendOutput(e.data.text, true); return; }
      if (type === "input-request") {
        setInputPromptText(e.data.prompt || "");
        setPendingInputId(e.data.id);
        setIsWaitingForInput(true);
        setTimeout(() => consoleInputRef.current?.focus(), 50);
        return;
      }
      if (type === "done") {
        setExecTime(e.data.execTime);
        setIsRunning(false);
        setIsWaitingForInput(false);
        return;
      }
    };

    worker.postMessage({ type: "init" });

    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get("code");
    if (sharedCode) {
      try {
        setCode(window.atob(sharedCode));
      } catch (e) {
        console.error("Failed to decode shared code", e);
      }
    }

    return () => { worker.terminate(); };
  }, [appendOutput]);

  useEffect(() => {
    if (output) {
      setTimeout(() => outputEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [output]);

  useEffect(() => {
    const updateWidth = () => {
      if (textareaRef.current) {
        setTextareaWidth(textareaRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (mode !== "study") {
      setValidationState({ errors: [], unused: [] });
      return;
    }

    const timer = setTimeout(() => {
      const definedVars = new Set<string>();
      const usedVars = new Set<string>();
      const errors: number[] = [];

      const lines = code.split("\n");
      lines.forEach((line: string, i: number) => {
        if (/^\s*(if|elif|else|def|while|for|class)\b/.test(line) && !line.trim().endsWith(":")) {
          errors.push(i);
        }

        const assignMatch = line.match(/\b([a-zA-Z_]\w*)\s*=/);
        if (assignMatch) definedVars.add(assignMatch[1]);

        const defMatch = line.match(/^\s*(?:def|class)\s+([a-zA-Z_]\w*)/);
        if (defMatch) definedVars.add(defMatch[1]);

        const forMatch = line.match(/^\s*for\s+([a-zA-Z_]\w*)/);
        if (forMatch) definedVars.add(forMatch[1]);

        const words = line.match(/\b([a-zA-Z_]\w*)\b/g);
        if (words) {
          words.forEach((w: string) => {
            if (definedVars.has(w) && !line.includes(`${w} =`) && !line.trim().startsWith("def ") && !line.trim().startsWith("class ")) {
              usedVars.add(w);
            }
          });
        }
      });

      const unused = Array.from(definedVars).filter(v => !usedVars.has(v));
      setValidationState({ errors, unused });
    }, 150);

    return () => clearTimeout(timer);
  }, [code, mode]);

  const runCode = () => {
    if (!workerRef.current || !isEngineReady) return;
    setIsRunning(true);
    setOutput("");
    setExecTime(null);
    setIsWaitingForInput(false);
    workerRef.current.postMessage({ type: "run", code });
  };

  const submitConsoleInput = (value: string) => {
    appendOutput(`<span class="text-sky-300">${inputPromptText}${value}</span>`);
    setIsWaitingForInput(false);
    fetch("/api/pyodide-input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pendingInputId, value, cancelled: false }),
    });
  };

  const handleConsoleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitConsoleInput(e.currentTarget.value);
      e.currentTarget.value = "";
    }
  };

  const loadExample = (exampleCode: string) => {
    setCode(exampleCode);
    setOutput("");
    setExecTime(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCode();
      return;
    }

    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySuggestion(suggestions[activeSuggestionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        return;
      }
    }

    if (e.key === "Enter" && mode !== "default") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const currentLine = code.substring(0, start).split("\n").pop() || "";
      const match = currentLine.match(/^(\s*)/);
      let indent = match ? match[1] : "";
      if (currentLine.trim().endsWith(":")) indent += "    ";
      const newValue = code.substring(0, start) + "\n" + indent + code.substring(end);
      setCode(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1 + indent.length;
        }
      }, 0);
      return;
    }

    if (mode === "study") {
      const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
      if (pairs[e.key]) {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const newValue = code.substring(0, start) + e.key + pairs[e.key] + code.substring(end);
        setCode(newValue);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
          }
        }, 0);
        return;
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = code.substring(0, start) + "    " + code.substring(end);
      setCode(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const getCursorXY = useCallback(() => {
    if (!textareaRef.current) return { top: 0, left: 0 };
    const el = textareaRef.current;
    const pos = el.selectionStart;
    const textBefore = el.value.substring(0, pos);
    const lines = textBefore.split("\n");
    const lineIndex = lines.length - 1;
    const charIndex = lines[lineIndex].length;
    
    // Estimates based on text-sm leading-relaxed
    const lineHeight = 22.75; 
    const charWidth = 8.43;
    const padding = 16;
    
    return {
      top: padding + (lineIndex * lineHeight) - el.scrollTop,
      left: padding + (charIndex * charWidth) - el.scrollLeft
    };
  }, []);

  const handleEditorScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
      if (suggestions.length > 0) setCursorPos(getCursorXY());
    }
  };

  const handleEditorClick = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    setCursorPos(getCursorXY());
    
    const textBefore = code.substring(0, pos);

    const textAfter = code.substring(pos);
    const wordBefore = textBefore.match(/\b([a-zA-Z_]\w*)$/)?.[1] || "";
    const wordAfter = textAfter.match(/^([a-zA-Z_]\w*)\b/)?.[1] || "";
    const word = wordBefore + wordAfter;

    setActiveHint(PYTHON_METADATA[word] ? word : null);

    if (mode === "easy" && wordBefore.length >= 2) {
      const allWords = Array.from(new Set([...Object.keys(PYTHON_METADATA), "print", "len", "input", "range", "def", "if", "else", "elif", "for", "while", "import", "from", "class", "try", "except", "finally", "with", "as", "return", "pass", "break", "continue", "True", "False", "None"]));
      const filtered = allWords.filter(w => w.startsWith(wordBefore) && w !== wordBefore);
      setSuggestions(filtered.slice(0, 5));
      setActiveSuggestionIndex(0);
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, pos);
    const textAfter = code.substring(pos);
    const wordBefore = textBefore.match(/\b([a-zA-Z_]\w*)$/)?.[1] || "";
    const newValue = textBefore.substring(0, textBefore.length - wordBefore.length) + suggestion + textAfter;
    setCode(newValue);
    setSuggestions([]);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = pos - wordBefore.length + suggestion.length;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const highlightSyntax = (text: string) => {
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const syntaxRegex = /([frbu]?&quot;.*?&quot;|[frbu]?'.*?')|(#.*)|(&[a-zA-Z]+;)|\b(def|class|if|elif|else|while|for|in|try|except|finally|import|from|return|pass|break|continue|and|or|not|is|True|False|None|lambda|global|nonlocal|with|as|yield|async|await)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)\b(?=\s*\()|\b([a-zA-Z_]\w*)\b/g;
    html = html.replace(syntaxRegex, (match, str, comment, ent, kw, num, func, variable) => {
      const isUnused = mode === "study" && validationState.unused.includes(variable || "");
      const baseClass = isUnused ? "opacity-30 line-through transition-all" : "transition-all";

      if (str) return `<span class="text-[#ce9178]">${str}</span>`;
      if (comment) return `<span class="text-[#6a9955]">${comment}</span>`;
      if (ent) return ent;
      if (kw) return `<span class="text-[#c586c0] font-bold">${kw}</span>`;
      if (num) return `<span class="text-[#b5cea8]">${num}</span>`;
      if (func) return `<span class="text-[#dcdcaa] ${baseClass}">${func}</span>`;
      if (variable) return `<span class="text-[#9cdcfe] ${baseClass}">${variable}</span>`;
      return match;
    });

    if (mode === "study" && validationState.errors.length > 0) {
      const lines = html.split("\n");
      validationState.errors.forEach((i: number) => {
        if (lines[i]) {
          lines[i] = `<span class="bg-red-500/10 border-b border-red-500/50 transition-all">${lines[i]}</span>`;
        }
      });
      html = lines.join("\n");
    }

    return html;
  };

  const downloadFile = (format: "py" | "txt") => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `main.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareCode = () => {
    const encoded = window.btoa(code);
    const url = `${window.location.origin}${window.location.pathname}?code=${encoded}`;
    navigator.clipboard.writeText(url);
    alert("คัดลอกลิงก์แชร์แล้ว!");
  };

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setIsFullscreen(next);
    if (next) {
      document.body.classList.add("python-fullscreen");
    } else {
      document.body.classList.remove("python-fullscreen");
    }
  };

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(10, lineCount) }, (_, i) => i + 1);

  return (
    <div className={`min-h-screen bg-sky-50 dark:bg-slate-950 flex flex-col ${isFullscreen ? "fixed inset-0 z-100 overflow-auto" : ""}`}>
      {!isFullscreen && (
        <section className="pt-28 pb-8 px-4 shrink-0">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: "สื่อการเรียนรู้", href: "/resources" },
              { label: "Python Compiler" }
            ]} />

            <div className="flex items-center gap-3 mt-4">
              <h1 className="text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-400">
                Python Compiler
              </h1>
              <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs animate-pulse">
                BETA
              </span>
            </div>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              เครื่องมือจำลองการเขียนโปรแกรมภาษา Python ออนไลน์
            </p>
          </div>
        </section>
      )}

      <section className={`px-4 pb-20 flex-1 flex flex-col ${isFullscreen ? "pt-4" : ""}`}>
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col gap-4">

          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-zinc-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={runCode}
                disabled={!isEngineReady || isRunning}
                className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 dark:disabled:bg-slate-700 text-white rounded-xl font-medium transition-colors shadow-xs hover:shadow-md hover:shadow-green-500/20"
              >
                {isRunning ? <i className="fi fi-sr-spinner animate-spin"></i> : <i className="fi fi-sr-play"></i>}
                {isRunning ? "RUNNING..." : "RUN"}
              </button>

              <button
                onClick={() => { setCode(""); setOutput(""); setExecTime(null); }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium transition-colors"
              >
                <i className="fi fi-sr-trash"></i>
                CLEAR
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex bg-zinc-100 dark:bg-slate-800 p-1 rounded-xl">
                {(["default", "easy", "study"] as EditorMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === m
                        ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="h-6 w-px bg-zinc-200 dark:border-slate-800 hidden md:block"></div>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleFullscreen}
                  title="Fullscreen"
                  className="p-2 text-zinc-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors"
                >
                  <i className={`fi fi-sr-${isFullscreen ? "exit" : "expand"}`}></i>
                </button>
                <button
                  onClick={shareCode}
                  title="Share Code"
                  className="p-2 text-zinc-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400 transition-colors"
                >
                  <i className="fi fi-sr-share"></i>
                </button>
                <div className="relative group/down">
                  <button className="p-2 text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors">
                    <i className="fi fi-sr-download"></i>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-zinc-100 dark:border-slate-700 hidden group-hover/down:block z-20">
                    <button onClick={() => downloadFile("py")} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-slate-700 rounded-t-lg">.py (Python)</button>
                    <button onClick={() => downloadFile("txt")} className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-slate-700 rounded-b-lg">.txt (Text)</button>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/30 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-400 rounded-xl font-medium transition-colors">
                  <i className="fi fi-sr-bulb"></i>
                  EXAMPLE
                  <i className="fi fi-sr-angle-small-down ml-1"></i>
                </button>

                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-zinc-100 dark:border-slate-700 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="p-1 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {PYTHON_EXAMPLES.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => loadExample(ex.code)}
                        className="w-full text-left px-4 py-3 hover:bg-sky-50 dark:hover:bg-slate-700 rounded-lg transition-colors group/item"
                      >
                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 group-hover/item:text-sky-600 dark:group-hover/item:text-sky-400">{ex.title}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{ex.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-150 md:h-175">

            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-zinc-200 dark:border-slate-800 shadow-xs overflow-hidden relative">
              <div className="flex items-center px-4 py-2 border-b border-zinc-100 dark:border-slate-800 bg-zinc-50 dark:bg-slate-900/50">
                <i className="fi fi-sr-document text-sm text-zinc-400 mr-2"></i>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">main.py</span>
              </div>

              {!isEngineReady && (
                <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <i className="fi fi-sr-spinner animate-spin text-4xl text-sky-500 mb-4"></i>
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">กำลังโหลด Python Engine...</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">ดาวน์โหลดครั้งแรกอาจใช้เวลา 3-5 วินาที</p>
                </div>
              )}

              <div className="flex-1 flex relative bg-[#1e1e1e] overflow-hidden">
                <div className="w-12 py-4 flex flex-col items-end px-3 text-zinc-500 bg-[#1e1e1e] border-r border-[#333] select-none font-mono text-sm leading-relaxed shrink-0">
                  {lineNumbers.map(n => <div key={n}>{n}</div>)}
                </div>

                <pre
                  ref={overlayRef}
                  className="absolute top-0 bottom-0 right-0 left-12 w-[calc(100%-3rem)] font-mono text-sm p-4 leading-relaxed whitespace-pre overflow-hidden pointer-events-none z-0 m-0"
                  style={{ tabSize: 4 }}
                  aria-hidden="true"
                  dangerouslySetInnerHTML={{ __html: highlightSyntax(code) || " " }}
                />

                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => { setCode(e.target.value); handleEditorClick(); }}
                  onClick={handleEditorClick}
                  onKeyUp={handleEditorClick}
                  onKeyDown={handleKeyDown}
                  onScroll={handleEditorScroll}
                  spellCheck={false}
                  className={`flex-1 w-full font-mono text-sm p-4 leading-relaxed resize-none focus:outline-hidden whitespace-pre overflow-auto z-10 text-transparent bg-transparent caret-white`}
                  style={{ tabSize: 4 }}
                />

                {activeHint && PYTHON_METADATA[activeHint] && (
                  <div
                    className="absolute top-4 right-4 max-w-xs bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-sky-100 dark:border-slate-700 z-50 animate-slide-down"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sky-600 font-bold font-mono">{activeHint}</span>
                      <button onClick={() => setActiveHint(null)} className="text-zinc-400 hover:text-zinc-600"><i className="fi fi-sr-cross-small"></i></button>
                    </div>
                    <div className="text-xs space-y-2">
                       <p className="text-zinc-600 dark:text-zinc-300 font-medium">{PYTHON_METADATA[activeHint].desc.en}</p>
                       <p className="text-zinc-400 dark:text-zinc-500 italic">{PYTHON_METADATA[activeHint].desc.th}</p>
                       
                       <div className="mt-2 p-2 bg-zinc-50 dark:bg-slate-900 rounded-lg text-[10px] font-mono text-violet-500 flex flex-col gap-1">
                         <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-sans">Usage</span>
                         {mode === "study" && PYTHON_METADATA[activeHint].params_study ? (
                            <span className="whitespace-pre">{PYTHON_METADATA[activeHint].params_study}</span>
                         ) : (
                            <span className="whitespace-pre">{PYTHON_METADATA[activeHint].params || activeHint}</span>
                         )}
                       </div>

                       {PYTHON_METADATA[activeHint].example && (
                        <div className="mt-2 p-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-[10px] font-mono text-sky-600 flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-sans">Example</span>
                          <span className="whitespace-pre">{PYTHON_METADATA[activeHint].example}</span>
                        </div>
                       )}
                    </div>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div 
                    className="absolute bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-zinc-100 dark:border-slate-700 overflow-hidden z-20 w-48 animate-slide-down"
                    style={{ 
                      top: cursorPos.top + 24, 
                      left: Math.min(cursorPos.left + 48, textareaWidth - 180) 
                    }}
                  >
                    <div className="p-1">
                      {suggestions.map((s, i) => (
                        <button
                          key={s}
                          onClick={() => applySuggestion(s)}
                          onMouseEnter={() => setActiveSuggestionIndex(i)}
                          className={`w-full text-left px-4 py-2 text-sm font-mono transition-colors rounded-lg ${i === activeSuggestionIndex ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="flex flex-col bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950">
                <div className="flex items-center">
                  <i className="fi fi-sr-terminal text-sm text-zinc-400 mr-2"></i>
                  <span className="text-sm font-medium text-zinc-300">Console</span>
                </div>
                {execTime !== null && (
                  <span className="text-xs text-zinc-500">เวลาทำงาน: {execTime} วินาที</span>
                )}
              </div>

              <div className="flex-1 p-4 font-mono text-sm text-zinc-300 overflow-y-auto whitespace-pre-wrap">
                {output ? (
                  <div dangerouslySetInnerHTML={{ __html: output }} />
                ) : (
                  <span className="text-zinc-600 italic">ผลลัพธ์จะแสดงที่นี่...</span>
                )}

                {isWaitingForInput && (
                  <div className="flex items-center mt-1">
                    <span className="text-sky-300">{inputPromptText}</span>
                    <input
                      ref={consoleInputRef}
                      type="text"
                      onKeyDown={handleConsoleInputKeyDown}
                      autoFocus
                      className="flex-1 bg-transparent text-green-300 font-mono text-sm focus:outline-hidden caret-green-400 border-none p-0 ml-0"
                      spellCheck={false}
                    />
                  </div>
                )}

                <div ref={outputEndRef} />
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
