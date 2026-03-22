"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import { PYTHON_EXAMPLES } from "./examples";

export default function PythonCompilerClient() {
  const [code, setCode] = useState('print("Hello world")');
  const [output, setOutput] = useState<string>("");
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [isEasyMode, setIsEasyMode] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [inputPromptText, setInputPromptText] = useState("");
  const [pendingInputId, setPendingInputId] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLPreElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);
  const consoleInputRef = useRef<HTMLInputElement>(null);

  const appendOutput = useCallback((msg: string, isError = false) => {
    setOutput((prev) => {
      if (prev.length > 15000) return prev;
      return prev + (isError ? `<span class="text-red-400">${msg}</span>\n` : `${msg}\n`);
    });
  }, []);

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

    return () => { worker.terminate(); };
  }, [appendOutput]);

  useEffect(() => {
    if (output) {
      setTimeout(() => outputEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [output]);

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

    if (e.key === "Enter" && isEasyMode) {
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

  const handleEditorScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const highlightSyntax = (text: string) => {
    if (!isEasyMode) return text;
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const syntaxRegex = /(&quot;.*?&quot;|'.*?')|(#.*)|(&[a-zA-Z]+;)|\b(def|class|if|elif|else|while|for|in|try|except|finally|import|from|return|pass|break|continue|and|or|not|is|True|False|None|lambda|global|nonlocal|with|as|yield|async|await)\b|\b(\d+(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)\b(?=\s*\()|\b([a-zA-Z_]\w*)\b/g;
    html = html.replace(syntaxRegex, (match, str, comment, ent, kw, num, func, variable) => {
      if (str) return `<span class="text-[#ce9178]">${str}</span>`;
      if (comment) return `<span class="text-[#6a9955]">${comment}</span>`;
      if (ent) return ent;
      if (kw) return `<span class="text-[#c586c0] font-bold">${kw}</span>`;
      if (num) return `<span class="text-[#b5cea8]">${num}</span>`;
      if (func) return `<span class="text-[#dcdcaa]">${func}</span>`;
      if (variable) return `<span class="text-[#9cdcfe]">${variable}</span>`;
      return match;
    });
    return html;
  };

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(10, lineCount) }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 flex flex-col">
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

      <section className="px-4 pb-20 flex-1 flex flex-col">
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
              <button
                onClick={() => setIsEasyMode(!isEasyMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                  isEasyMode
                    ? "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/60 dark:hover:bg-green-900/80 dark:text-green-300"
                    : "bg-transparent hover:bg-zinc-100 text-zinc-500 dark:text-zinc-400 dark:hover:bg-slate-800"
                }`}
              >
                <i className="fi fi-sr-star"></i>
                Easy Mode
              </button>

              <span className="hidden md:inline-block text-xs text-zinc-400 dark:text-zinc-500 mr-2">
                <span className="bg-zinc-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-slate-700">Ctrl</span> + <span className="bg-zinc-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-slate-700">Enter</span> เพื่อรัน
              </span>

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

                {isEasyMode && (
                  <pre
                    ref={overlayRef}
                    className="absolute top-0 bottom-0 right-0 left-12 w-[calc(100%-3rem)] font-mono text-sm p-4 leading-relaxed whitespace-pre overflow-hidden pointer-events-none z-0 m-0"
                    style={{ tabSize: 4 }}
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: highlightSyntax(code) || " " }}
                  />
                )}

                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onScroll={handleEditorScroll}
                  spellCheck={false}
                  className={`flex-1 w-full font-mono text-sm p-4 leading-relaxed resize-none focus:outline-hidden whitespace-pre overflow-auto z-10 ${isEasyMode ? "text-transparent bg-transparent caret-white" : "text-[#d4d4d4] bg-transparent"}`}
                  style={{ tabSize: 4 }}
                />
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
