import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }
};

function Home() {
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    await navigator.clipboard.writeText('npx -y @quark.clip/quark install-service');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-32">
      {/* problem */}
      <motion.section initial="hidden" animate="visible" exit="exit" variants={fadeIn} className="space-y-8">
        <h1 className="text-2xl font-medium tracking-tight text-black">
          the clipboard is broken.
        </h1>
        <div className="space-y-6 text-lg text-zinc-500 leading-relaxed tracking-tight">
          <p>you copy text from a pdf. the line breaks shatter.</p>
          <p>you copy a link. tracking tags follow you.</p>
          <p>you copy a table. the formatting vanishes.</p>
          <p>you switch to your laptop. your clipboard is empty.</p>
          <p>it is a fundamental tool, yet it remains fundamentally flawed.</p>
        </div>
      </motion.section>

      {/* solution */}
      <motion.section initial="hidden" animate="visible" exit="exit" variants={fadeIn} transition={{ delay: 0.1 }} className="space-y-8">
        <h2 className="text-2xl font-medium tracking-tight text-black">
          enter quark.
        </h2>
        <div className="space-y-6 text-lg text-zinc-500 leading-relaxed tracking-tight">
          <p>a silent, zero-configuration daemon that lives in your background. it requires no interface. it simply fixes what is broken.</p>
          <ul className="space-y-4 list-none p-0">
            <li className="flex gap-4"><span className="text-zinc-300">—</span> heals broken pdf text automatically.</li>
            <li className="flex gap-4"><span className="text-zinc-300">—</span> strips tracking parameters from urls.</li>
            <li className="flex gap-4"><span className="text-zinc-300">—</span> transforms raw excel data into clean html tables.</li>
            <li className="flex gap-4"><span className="text-zinc-300">—</span> converts markdown tables and latex formulas into rich html.</li>
            <li className="flex gap-4"><span className="text-zinc-300">—</span> applies smart typographic quotes and normalizes shouted all-caps text.</li>
            <li className="flex gap-4"><span className="text-zinc-300">—</span> syncs across your mac, windows, and linux machines instantly via p2p.</li>
            <li className="flex gap-4"><span className="text-zinc-300">—</span> exposes your clipboard to local ai models via mcp.</li>
          </ul>
        </div>
      </motion.section>

      {/* installation */}
      <motion.section initial="hidden" animate="visible" exit="exit" variants={fadeIn} transition={{ delay: 0.2 }} className="space-y-8">
        <h2 className="text-2xl font-medium tracking-tight text-black">
          installation.
        </h2>
        <div className="bg-[#fafafa] rounded-2xl p-8 md:p-12 border border-zinc-100">
          <pre className="font-mono text-xs text-zinc-300 mb-12 leading-tight tracking-widest select-none">
            {`      o-------o
      | \\   / |
      |   o   |
      | /   \\ |
      o-------o`}
          </pre>
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <code className="font-mono text-sm text-zinc-800 bg-white px-3 py-1.5 rounded-md border border-zinc-200 shadow-sm">
              npx -y @quark.clip/quark install-service
            </code>
            <button
              onClick={copyCommand}
              className="text-sm font-medium text-zinc-400 hover:text-black transition-colors"
            >
              {copied ? 'copied.' : 'copy command.'}
            </button>
          </div>
        </div>
        <p className="text-sm text-zinc-400 tracking-tight">
          requires node.js. runs silently on mac, windows, and linux. open source. <Link to="/docs" className="text-black hover:underline">read the docs.</Link>
        </p>
      </motion.section>
    </div>
  );
}

function Docs() {
  return (
    <div className="flex flex-col gap-24">
      <motion.section initial="hidden" animate="visible" exit="exit" variants={fadeIn} className="space-y-8">
        <h1 className="text-2xl font-medium tracking-tight text-black">
          knowledge base.
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed tracking-tight">
          everything you need to know about how quark operates under the hood.
        </p>
      </motion.section>

      <motion.section initial="hidden" animate="visible" exit="exit" variants={fadeIn} transition={{ delay: 0.1 }} className="space-y-6">
        <h2 className="text-xl font-medium tracking-tight text-black">1. the pipeline</h2>
        <div className="space-y-4 text-zinc-500 leading-relaxed tracking-tight">
          <p>quark intercepts your clipboard and runs it through a series of smart transformers before syncing or pasting.</p>
          <ul className="space-y-4 mt-4">
            <li><strong className="text-zinc-700 font-medium">markdown & latex:</strong> detects `$$math$$` and `| tables |` and compiles them into rich html on the fly.</li>
            <li><strong className="text-zinc-700 font-medium">excel & csv:</strong> raw tab-separated or comma-separated values are instantly converted into styled html tables.</li>
            <li><strong className="text-zinc-700 font-medium">url sanitization:</strong> automatically strips `utm_source`, `igshid`, and other tracking parameters from copied links.</li>
            <li><strong className="text-zinc-700 font-medium">typography:</strong> detects language (english, french, german, spanish) and applies the correct smart quotes (« », „ “, “ ”). normalizes all-caps shouting into sentence case.</li>
            <li><strong className="text-zinc-700 font-medium">pdf healing:</strong> uses heuristics to detect and remove artificial line breaks caused by copying from pdfs.</li>
          </ul>
        </div>
      </motion.section>

      <motion.section initial="hidden" animate="visible" exit="exit" variants={fadeIn} transition={{ delay: 0.2 }} className="space-y-6">
        <h2 className="text-xl font-medium tracking-tight text-black">2. p2p sync</h2>
        <div className="space-y-4 text-zinc-500 leading-relaxed tracking-tight">
          <p>quark uses mdns (bonjour/zeroconf) to broadcast its presence on your local wi-fi network.</p>
          <p>when two devices running quark discover each other, they establish a direct websocket connection on port 41235. when you copy on one device, the payload (both plain text and rich html) is instantly pushed to the other.</p>
          <p>there are no cloud servers, no accounts, and no data leaves your local network.</p>
        </div>
      </motion.section>

      <motion.section initial="hidden" animate="visible" exit="exit" variants={fadeIn} transition={{ delay: 0.3 }} className="space-y-6">
        <h2 className="text-xl font-medium tracking-tight text-black">3. ai integration (mcp)</h2>
        <div className="space-y-4 text-zinc-500 leading-relaxed tracking-tight">
          <p>quark acts as a model context protocol (mcp) server, allowing local ai agents like claude desktop or cursor to read and write to your clipboard.</p>
          <p>to connect claude desktop, add this to your <code className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 text-sm">claude_desktop_config.json</code>:</p>
          <pre className="bg-[#fafafa] p-6 rounded-xl border border-zinc-100 text-sm font-mono text-zinc-600 overflow-x-auto">
            {`{
  "mcpServers": {
    "quark": {
      "command": "npx",
      "args": ["-y", "@quark.clip/quark", "mcp"]
    }
  }
}`}
          </pre>
        </div>
      </motion.section>

      <motion.section initial="hidden" animate="visible" exit="exit" variants={fadeIn} transition={{ delay: 0.4 }} className="space-y-6">
        <h2 className="text-xl font-medium tracking-tight text-black">4. cli reference</h2>
        <div className="space-y-4 text-zinc-500 leading-relaxed tracking-tight">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-100 pb-4">
            <code className="text-sm font-mono text-zinc-800">quark start</code>
            <span className="sm:col-span-2">runs the daemon in the current terminal session.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-100 pb-4">
            <code className="text-sm font-mono text-zinc-800">quark install</code>
            <span className="sm:col-span-2">installs quark as a native background service (launchd, systemd, or windows startup).</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-100 pb-4">
            <code className="text-sm font-mono text-zinc-800">quark stop</code>
            <span className="sm:col-span-2">stops a manually started session.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-100 pb-4">
            <code className="text-sm font-mono text-zinc-800">quark uninstall</code>
            <span className="sm:col-span-2">removes the background service from your os.</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-100 pb-4">
            <code className="text-sm font-mono text-zinc-800">quark status</code>
            <span className="sm:col-span-2">checks if the daemon is running and shows log locations.</span>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function Layout() {
  const location = useLocation();

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans lowercase selection:bg-zinc-200 selection:text-black">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-zinc-100">
        <div className="max-w-2xl mx-auto px-8 h-16 flex items-center justify-between text-sm tracking-tight">
          <Link to="/" className="font-medium text-black hover:text-zinc-500 transition-colors flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="quark logo" className="w-4 h-4" />
            quark.
          </Link>
          <div className="flex gap-6">
            <Link to="/" className={`${location.pathname === '/' ? 'text-black' : 'text-zinc-400'} hover:text-black transition-colors`}>home.</Link>
            <Link to="/docs" className={`${location.pathname === '/docs' ? 'text-black' : 'text-zinc-400'} hover:text-black transition-colors`}>docs.</Link>
            <a href="https://github.com/sir-ad/quark" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-black transition-colors">github.</a>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-8 pt-32 pb-32 md:pt-48">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<Docs />} />
          </Routes>
        </AnimatePresence>

        {/* footer */}
        <motion.footer
          initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.6 }}
          className="pt-16 mt-32 border-t border-zinc-100 text-sm text-zinc-400 tracking-tight flex justify-between"
        >
          <span>quark daemon.</span>
          <span>© 2026</span>
        </motion.footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/quark">
      <Layout />
    </BrowserRouter>
  );
}
