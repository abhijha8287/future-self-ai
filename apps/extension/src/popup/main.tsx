import React from "react";
import { createRoot } from "react-dom/client";
import { BarChart3, Power, ShieldCheck } from "lucide-react";
import "./popup.css";

function Popup() {
  const [enabled, setEnabled] = React.useState(true);
  const [demoMode, setDemoMode] = React.useState(true);
  const [apiUrl, setApiUrl] = React.useState("http://localhost:3000");

  React.useEffect(() => {
    chrome.storage.sync.get(["enabled", "demoMode", "apiUrl"]).then((settings) => {
      setEnabled(settings.enabled !== false);
      setDemoMode(settings.demoMode !== false);
      setApiUrl(settings.apiUrl || "http://localhost:3000");
    });
  }, []);

  const persist = (patch: Record<string, unknown>) => chrome.storage.sync.set(patch);

  return (
    <main className="w-[360px] bg-[#0A0D12] p-4 text-white">
      <header className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-[#70E1C8]/15 text-[#70E1C8]">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="text-base font-semibold">FutureSelf AI</h1>
          <p className="text-xs text-white/55">Decision Intelligence Layer</p>
        </div>
      </header>

      <section className="mt-4 grid gap-3">
        <Toggle
          icon={<Power size={18} />}
          label="Protection"
          checked={enabled}
          onChange={(value) => {
            setEnabled(value);
            persist({ enabled: value });
          }}
        />
        <Toggle
          icon={<BarChart3 size={18} />}
          label="Demo Mode"
          checked={demoMode}
          onChange={(value) => {
            setDemoMode(value);
            persist({ demoMode: value });
          }}
        />
      </section>

      <label className="mt-4 block text-xs font-medium text-white/60" htmlFor="api-url">Backend API</label>
      <input
        id="api-url"
        className="mt-2 w-full rounded-[8px] border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#70E1C8]"
        value={apiUrl}
        onChange={(event) => {
          setApiUrl(event.target.value);
          persist({ apiUrl: event.target.value });
        }}
      />

      <a className="mt-4 block rounded-[8px] bg-white px-4 py-2 text-center text-sm font-semibold text-black hover:bg-white/85" href={`${apiUrl}/dashboard`} target="_blank" rel="noreferrer">
        Open Dashboard
      </a>
    </main>
  );
}

function Toggle({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.04] p-3" onClick={() => onChange(!checked)}>
      <span className="flex items-center gap-2 text-sm font-medium text-white/85">{icon}{label}</span>
      <span className={`h-6 w-11 rounded-full p-1 transition ${checked ? "bg-[#70E1C8]" : "bg-white/20"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

createRoot(document.getElementById("root")!).render(<Popup />);
