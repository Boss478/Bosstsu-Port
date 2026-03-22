importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js");

let pyodide = null;
let inputCounter = 0;

async function initPyodide() {
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
  });

  pyodide.setStdout({
    batched: (msg) => self.postMessage({ type: "stdout", text: msg }),
  });

  pyodide.setStderr({
    batched: (msg) => self.postMessage({ type: "stderr", text: msg }),
  });

  await pyodide.runPythonAsync(`
import builtins
import js

def _console_input(prompt_text=""):
    input_id = str(js._nextInputId())
    js.postMessage(type="input-request", prompt=prompt_text, id=input_id)

    xhr = js.XMLHttpRequest.new()
    xhr.open("GET", "/api/pyodide-input?id=" + input_id, False)
    xhr.send(None)

    import json
    result = json.loads(xhr.responseText)
    if result.get("cancelled"):
        raise EOFError("User cancelled input")
    return result["value"]

builtins.input = _console_input
  `);

  self.postMessage({ type: "ready" });
}

function buildExecutionWrapper(userCode) {
  const escapedCode = userCode.replace(/\\/g, "\\\\").replace(/"""/g, '\\"\\"\\"');

  return `
import sys
import time

for _k in list(globals().keys()):
    if _k not in ['__name__','__doc__','__package__','__loader__','__spec__','__annotations__','__builtins__','_console_input','js','sys','time','builtins','json']:
        del globals()[_k]

class _OutputLimiter:
    def __init__(self, original):
        self._original = original
        self._count = 0
    def write(self, s):
        self._count += len(s)
        if self._count > 10000:
            raise OverflowError("❌ โค้ดหยุดการทำงาน: พิมพ์ผลลัพธ์ยาวกว่า 10,000 ตัวอักษร (อาจติด Infinite Loop)")
        self._original.write(s)
    def flush(self):
        self._original.flush()

sys.stdout = _OutputLimiter(sys.__stdout__)

_step = 0
_t0 = time.time()
def _tracer(frame, event, arg):
    global _step, _t0
    if event == 'line':
        _step += 1
        if _step > 100000:
            raise TimeoutError("❌ โค้ดหยุดการทำงาน: ทำงานมากกว่า 100,000 คำสั่ง (อาจติด Infinite Loop)")
        if time.time() - _t0 > 5.0:
            raise TimeoutError("❌ โค้ดหยุดการทำงาน: ใช้เวลารันนานเกิน 5 วินาที (อาจติด Infinite Loop)")
    return _tracer

sys.settrace(_tracer)
exec("""${escapedCode}""")
sys.settrace(None)
  `;
}

self._nextInputId = () => ++inputCounter;

self.onmessage = async (e) => {
  const { type } = e.data;

  if (type === "init") {
    await initPyodide();
    return;
  }

  if (type === "run") {
    const startTime = performance.now();
    try {
      await pyodide.runPythonAsync(buildExecutionWrapper(e.data.code));
    } catch (err) {
      const lines = String(err.message || err)
        .split("\\n")
        .filter((l) => !l.includes('File "<exec>"') && !l.includes("_console_input"));
      self.postMessage({ type: "stderr", text: "❌ Error: " + lines.join("\\n") });
    } finally {
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);
      self.postMessage({ type: "done", execTime: Number(elapsed) });
    }
    return;
  }
};
