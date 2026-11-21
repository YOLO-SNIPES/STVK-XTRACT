#!/usr/bin/env python3
"""Build STAK-XTRACT.html (Official v1.0.0) from the Poe preview.

Replaces the preview's fake Poe/Claude analysis with the real engine
bridge, makes export real audio, adds the CREATE side, and fixes the
docs to describe what the app actually does. No new UI framework.
"""
import re

SRC = "/home/hatch/workspace/user/files/poe-preview_2_8pb6.html"
OUT = "/home/hatch/workspace/STAK-XTRACT-official/STAK-XTRACT.html"

html = open(SRC).read()
orig_len = len(html)

# ---------- 1. Title + header: official version, engine status pill ----------
html = html.replace(
    "<title>STAK-XTRACT by YOLO SNIPES</title>",
    "<title>STAK-XTRACT 1.0.0 Official by YOLO SNIPES</title>")
html = html.replace(
    '<p class="text-sm" style="color: #ff6600; text-shadow: 0 0 10px currentColor;">// AI-POWERED SAMPLE EXTRACTION PROTOCOL //</p>',
    '<p class="text-sm" style="color: #ff6600; text-shadow: 0 0 10px currentColor;">// AI-POWERED SAMPLE EXTRACTION PROTOCOL // OFFICIAL v1.0.0 //</p>'
    '\n            <div class="mt-2"><span id="engineStatus" class="text-xs font-mono px-2 py-1 rounded" style="background:#1a1a1a;color:#ffcc00;border:1px solid #ffcc00;">ENGINE: CHECKING...</span>'
    ' <span id="engineInfo" class="text-xs font-mono text-gray-400"></span></div>')

# ---------- 2. BPM/key readout under the waveform header ----------
html = html.replace(
    '<h3 class="text-xl font-bold neon-text" style="color: #ff6600;">// WAVEFORM_ANALYSIS //</h3>',
    '<h3 class="text-xl font-bold neon-text" style="color: #ff6600;">// WAVEFORM_ANALYSIS //</h3>\n                <div id="trackInfo" class="text-xs font-mono text-accent"></div>')

# ---------- 3. Track the uploaded file so the bridge can analyze it ----------
html = html.replace(
    """                const arrayBuffer = await file.arrayBuffer();
                
                const context = initAudioContext();""",
    """                currentFile = file;
                const arrayBuffer = await file.arrayBuffer();
                
                const context = initAudioContext();""")
html = html.replace(
    "        let audioContext;\n        let audioBuffer;",
    "        let audioContext;\n        let audioBuffer;\n        let currentFile = null;\n        const ENGINE_URL = 'http://127.0.0.1:8777';")

# ---------- 4. Engine status check + real analysis ----------
old_analyze = html[html.index("        // Analyze audio with AI"):html.index("        // Parse AI analysis response")]
new_analyze = '''        // Engine status: is the real music-utility bridge running?
        async function checkEngine() {
            const el = document.getElementById('engineStatus');
            const info = document.getElementById('engineInfo');
            try {
                const r = await fetch(ENGINE_URL + '/status', {signal: AbortSignal.timeout(2000)});
                const s = await r.json();
                el.textContent = 'ENGINE: ONLINE';
                el.style.color = '#00ff88'; el.style.borderColor = '#00ff88';
                info.textContent = 'yolo-music-utility v' + s.version + ' (librosa ' + (s.librosa ? 'ok' : 'missing') + ') — analysis is real, local, no upload';
            } catch (e) {
                el.textContent = 'ENGINE: OFFLINE';
                el.style.color = '#ff3366'; el.style.borderColor = '#ff3366';
                info.textContent = 'run launch.sh to start the real engine — waveform + manual work still available';
            }
        }

        // Analyze audio with the REAL engine (librosa via the local bridge).
        // No LLM, no invented samples: BPM, key, beats and segments come
        // from the audio itself. If the engine is offline, say so honestly.
        async function analyzeAudio() {
            if (!audioBuffer || !currentFile) {
                alert('Please load an audio file first');
                return;
            }

            const analysisType = document.getElementById('analysisType').value;
            const sensitivity = document.getElementById('sensitivity').value;

            showLoading(true);
            document.getElementById('analyzeBtn').disabled = true;

            try {
                const fd = new FormData();
                fd.append('audio', currentFile);
                fd.append('sensitivity', sensitivity);
                fd.append('analysis_type', analysisType);
                const r = await fetch(ENGINE_URL + '/analyze', {method: 'POST', body: fd});
                if (!r.ok) {
                    const err = await r.json().catch(() => ({}));
                    throw new Error(err.error || ('engine HTTP ' + r.status));
                }
                const analysis = await r.json();
                extractedSamples = analysis.samples || [];
                drawWaveform();
                updateSamplesContainer();
                const keyTxt = analysis.key ? (analysis.key.key + ' (' + Math.round(analysis.key.confidence * 100) + '% conf)') : 'unknown';
                document.getElementById('trackInfo').textContent =
                    'BPM ' + (analysis.bpm ?? '?') + '  //  KEY ' + keyTxt +
                    '  //  DURATION ' + (analysis.duration_s ?? '?') + 's  //  ' + extractedSamples.length + ' samples (real, from librosa)';
                console.log('Real analysis completed:', analysis);
            } catch (error) {
                console.error('Error running real analysis:', error);
                alert('Real engine not reachable: ' + error.message +
                      '\\n\\nStart it with launch.sh (engine/server.py on port 8777), then analyze again. ' +
                      'No fake analysis will be substituted.');
            }
            showLoading(false);
            document.getElementById('analyzeBtn').disabled = false;
        }

'''
html = html.replace(old_analyze, new_analyze)

# parseAIAnalysis is now dead code — remove the whole function.
# NOTE: "// Update samples container" also appears INSIDE parseAIAnalysis,
# so anchor on the function definition that follows it.
old_parse = html[html.index("        // Parse AI analysis response"):html.index("        // Update samples container\n        function updateSamplesContainer")]
html = html.replace(old_parse, "")

# ---------- 5. Arrangement: real energy-arc ordering, no LLM ----------
old_gen = html[html.index("        // Generate AI arrangement"):html.index("        // Export samples")]
new_gen = '''        // Generate arrangement: real logic, no LLM.
        // Order by energy arc — build up, peak, release — using the real
        // energy values the engine measured. Lowest first, peak in the
        // middle, taper at the end.
        function generateAIArrangement() {
            if (extractedSamples.length === 0) {
                alert('No samples to arrange. Please analyze audio first.');
                return;
            }
            const sorted = extractedSamples
                .map((s, i) => ({...s, sampleIndex: i}))
                .sort((a, b) => a.energy - b.energy);
            const peak = sorted.pop();
            const arranged = [];
            const half = Math.ceil(sorted.length / 2);
            for (let i = 0; i < sorted.length; i++) {
                if (i === half) arranged.push(peak);
                arranged.push(sorted[i]);
            }
            if (sorted.length < 2) arranged.push(peak);
            arrangementSamples = arranged;
            updateArrangementDisplay();
            console.log('Arrangement generated (energy arc):', arranged.map(s => s.sampleIndex));
        }

'''
html = html.replace(old_gen, new_gen)

# ---------- 6. Export: REAL audio (WAV slices), not JSON placeholders ----------
old_export = html[html.index("        // Export samples"):html.index("        // Navigation functions")]
new_export = '''        // WAV encoder (16-bit PCM, mono/stereo preserved)
        function audioBufferToWav(buffer) {
            const numCh = Math.min(buffer.numberOfChannels, 2);
            const sr = buffer.sampleRate;
            const len = buffer.length * numCh * 2 + 44;
            const out = new DataView(new ArrayBuffer(len));
            const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) out.setUint8(off + i, s.charCodeAt(i)); };
            writeStr(0, 'RIFF'); out.setUint32(4, len - 8, true); writeStr(8, 'WAVE');
            writeStr(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
            out.setUint16(22, numCh, true); out.setUint32(24, sr, true);
            out.setUint32(28, sr * numCh * 2, true); out.setUint16(32, numCh * 2, true);
            out.setUint16(34, 16, true); writeStr(36, 'data'); out.setUint32(40, len - 44, true);
            let off = 44;
            for (let i = 0; i < buffer.length; i++) {
                for (let ch = 0; ch < numCh; ch++) {
                    const v = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
                    out.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
                    off += 2;
                }
            }
            return new Blob([out.buffer], {type: 'audio/wav'});
        }

        function sliceBuffer(buffer, start, end) {
            const sr = buffer.sampleRate;
            const s0 = Math.max(0, Math.floor(start * sr));
            const s1 = Math.min(buffer.length, Math.ceil(end * sr));
            const out = audioContext.createBuffer(buffer.numberOfChannels, s1 - s0, sr);
            for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
                out.getChannelData(ch).set(buffer.getChannelData(ch).subarray(s0, s1));
            }
            return out;
        }

        // Export samples as REAL audio: each sample sliced from the loaded
        // buffer and written as a .wav, plus metadata + arrangement JSON.
        async function exportSamples() {
            if (extractedSamples.length === 0) {
                alert('No samples to export. Please analyze audio first.');
                return;
            }
            const format = document.getElementById('exportFormat').value;
            const quality = document.getElementById('exportQuality').value;
            const sampleRate = document.getElementById('sampleRate').value;

            try {
                const zip = new JSZip();
                const folder = zip.folder("extracted_samples");
                const meta = [];
                for (let i = 0; i < extractedSamples.length; i++) {
                    const sample = extractedSamples[i];
                    const filename = `${sample.type || 'sample'}_${i + 1}.wav`;
                    const sliced = sliceBuffer(audioBuffer, sample.start, sample.end);
                    folder.file(filename, audioBufferToWav(sliced));
                    meta.push({name: filename, start: sample.start, end: sample.end,
                               duration: sample.end - sample.start, type: sample.type,
                               energy: sample.energy, pitch: sample.pitch,
                               format: 'wav', quality, sampleRate});
                }
                folder.file('samples.json', JSON.stringify(meta, null, 2));
                if (arrangementSamples.length > 0) {
                    const arrangementInfo = {
                        samples: arrangementSamples,
                        totalDuration: arrangementSamples.reduce((sum, s) => sum + (s.end - s.start), 0),
                        format: 'wav', quality, sampleRate
                    };
                    folder.file('arrangement.json', JSON.stringify(arrangementInfo, null, 2));
                }
                const content = await zip.generateAsync({type: "blob"});
                const url = URL.createObjectURL(content);
                const a = document.createElement('a');
                a.href = url;
                a.download = `stak-xtract-samples_${Date.now()}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                console.log('Export completed: real .wav slices');
            } catch (error) {
                console.error('Error exporting samples:', error);
                alert('Error exporting samples');
            }
        }

'''
html = html.replace(old_export, new_export)

# ---------- 7. Sample pack: synthesize a demo offline (no Poe CDN) ----------
old_load = html[html.index("        // Load provided audio file"):html.index("        // Handle file upload")]
new_load = '''        // Load the built-in demo: a short synthesized loop rendered
        // offline (kick / hat / bass, 140 BPM), so the app works with no
        // network and no Poe CDN. Also becomes the file the engine analyzes.
        async function loadProvidedAudio() {
            try {
                showLoading(true);
                const sr = 44100, bpm = 140, beats = 16, dur = beats * 60 / bpm;
                const ctx = new OfflineAudioContext(2, Math.floor(sr * dur), sr);
                const kick = (t) => {
                    const o = ctx.createOscillator(), g = ctx.createGain();
                    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.18);
                    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.25);
                };
                const hat = (t) => {
                    const len = Math.floor(sr * 0.05), buf = ctx.createBuffer(1, len, sr);
                    const d = buf.getChannelData(0);
                    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
                    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
                    f.type = 'highpass'; f.frequency.value = 7000; g.gain.value = 0.25;
                    s.buffer = buf; s.connect(f).connect(g).connect(ctx.destination); s.start(t);
                };
                const bass = (t, f0) => {
                    const o = ctx.createOscillator(), g = ctx.createGain();
                    o.type = 'sawtooth'; o.frequency.value = f0;
                    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.45);
                };
                const beat = 60 / bpm, roots = [55, 55, 65.41, 49];
                for (let i = 0; i < beats; i++) {
                    const t = i * beat;
                    if (i % 4 === 0) kick(t);
                    if (i % 2 === 1) hat(t);
                    if (i % 4 === 2) bass(t, roots[Math.floor(i / 4) % 4]);
                }
                audioBuffer = await ctx.startRendering();
                currentFile = new File([audioBufferToWav(audioBuffer)], 'stak-demo.wav', {type: 'audio/wav'});
                audioContext = initAudioContext();
                const audioPlayer = document.getElementById('audioPlayer');
                audioPlayer.src = URL.createObjectURL(currentFile);
                audioPlayer.classList.remove('hidden');
                drawWaveform();
                showLoading(false);
                console.log('Demo loop loaded (synthesized, offline)');
            } catch (error) {
                console.error('Error loading demo audio:', error);
                alert('Error loading demo audio');
                showLoading(false);
            }
        }

'''
html = html.replace(old_load, new_load)

# ---------- 8. CREATE MIDI card (the utility's create side) ----------
create_card = '''
        <!-- Create MIDI -->
        <div class="cyber-card rounded-lg p-6 mb-6">
            <h3 class="text-xl font-bold mb-4 neon-text" style="color: #10b981;">// CREATE_MIDI //</h3>
            <p class="text-sm text-gray-400 mb-4">Generate a MIDI starter from one of your analyzed tracks. The engine renders chords, bass, drums and melody from the learned template, plus an arrangement sketch. Needs the engine online.</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><label class="block text-sm font-mono mb-2 text-accent">LIKE (TEMPLATE):</label>
                    <select id="createLike" class="w-full p-3 text-base border border-primary rounded-lg bg-dark-card text-white font-mono">
                        <option>artificial_instruments</option><option>diagnostic_overload</option>
                        <option>digital_house_of_cards</option><option>how_to_love</option>
                        <option>geometry_of_belief</option><option>ghost_riots</option>
                        <option>lyrical_doom</option><option>anger_management</option>
                        <option>deceptive_perceptions</option><option>internalism_album</option>
                    </select></div>
                <div><label class="block text-sm font-mono mb-2 text-accent">BPM:</label>
                    <input id="createBpm" type="number" value="140" class="w-full p-3 text-base border border-primary rounded-lg bg-dark-card text-white font-mono"></div>
                <div><label class="block text-sm font-mono mb-2 text-accent">KEY:</label>
                    <input id="createKey" type="text" value="D min" class="w-full p-3 text-base border border-primary rounded-lg bg-dark-card text-white font-mono"></div>
                <div><label class="block text-sm font-mono mb-2 text-accent">MOOD:</label>
                    <select id="createMood" class="w-full p-3 text-base border border-primary rounded-lg bg-dark-card text-white font-mono">
                        <option>dark</option><option>driving</option><option>heavy</option><option>glitchy</option>
                        <option>rolling</option><option>trappy</option><option>open</option><option>euphoric</option>
                    </select></div>
                <div><label class="block text-sm font-mono mb-2 text-accent">LENGTH (M:SS):</label>
                    <input id="createLength" type="text" value="4:00" class="w-full p-3 text-base border border-primary rounded-lg bg-dark-card text-white font-mono"></div>
                <div><label class="block text-sm font-mono mb-2 text-accent">SEED:</label>
                    <input id="createSeed" type="number" value="42" class="w-full p-3 text-base border border-primary rounded-lg bg-dark-card text-white font-mono"></div>
            </div>
            <button onclick="createMidi()" id="createBtn" class="mt-4 w-full cyber-button text-white px-6 py-3 rounded-lg font-bold">[GENERATE_MIDI.exe]</button>
            <div id="createResult" class="text-xs font-mono text-accent mt-2"></div>
        </div>

'''
anchor = "        <!-- Documentation Pages (Hidden by default) -->"
html = html.replace(anchor, create_card + anchor)

# createMidi() + engine check on load — insert before the init listener
html = html.replace(
    """        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            console.log('AI Audio Sample Editor initialized');
            showMainApp(); // Show main app by default
        });""",
    """        // Create MIDI starter via the real engine
        async function createMidi() {
            const btn = document.getElementById('createBtn');
            const out = document.getElementById('createResult');
            btn.disabled = true; out.textContent = 'Generating...';
            try {
                const r = await fetch(ENGINE_URL + '/create', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        like: document.getElementById('createLike').value,
                        bpm: document.getElementById('createBpm').value,
                        key: document.getElementById('createKey').value,
                        mood: document.getElementById('createMood').value,
                        length: document.getElementById('createLength').value,
                        seed: document.getElementById('createSeed').value
                    })});
                if (!r.ok) {
                    const err = await r.json().catch(() => ({}));
                    throw new Error(err.detail || err.error || ('engine HTTP ' + r.status));
                }
                const blob = await r.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'stak-xtract-midi.zip';
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
                out.textContent = 'MIDI zip downloaded: chords, bass, drums, melody + arrangement.txt';
            } catch (error) {
                console.error('Create failed:', error);
                out.textContent = 'Engine not reachable: ' + error.message + ' — start it with launch.sh.';
            }
            btn.disabled = false;
        }

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            console.log('STAK-XTRACT 1.0.0 Official initialized');
            checkEngine();
            showMainApp(); // Show main app by default
        });""")

# ---------- 9. Docs: honest engine description, no Claude claims ----------
html = html.replace(
    "The analysis requires an internet connection to access AI services. Audio processing and waveform visualization work offline once the audio is loaded.",
    "Analysis runs on your own machine through the local engine bridge (engine/server.py, port 8777), which uses the YOLO music utility — librosa feature extraction, honest numbers, no invented samples. Audio never leaves your device. Waveform visualization works offline once audio is loaded.")
html = html.replace(
    "A: The current version exports sample metadata as JSON files for development purposes. A future update will include actual audio file extraction capabilities.",
    "A: The official version exports real audio: each sample is sliced from your file and written as a .wav, plus samples.json metadata and arrangement.json. The old preview exported JSON only.")
html = html.replace(
    "<li>Audio analysis is performed by Claude AI (Anthropic)</li>",
    "<li>Audio analysis is performed locally by the YOLO music utility engine (librosa) via the engine bridge</li>")
html = html.replace(
    "<li>Services process audio metadata, not the audio content itself</li>",
    "<li>The engine processes your audio on your own machine; nothing is uploaded</li>")
html = html.replace("Last Updated: December 2024",
                    "STAK-XTRACT 1.0.0 Official — November 2026 — by YOLO SNIPES")
# Guide: add the engine + create steps at the top of GETTING STARTED
html = html.replace(
    "<li><strong>Upload Audio:</strong> Click [UPLOAD_AUDIO.exe] to select an audio file from your device (supports MP3, WAV, OGG, FLAC, M4A)</li>",
    "<li><strong>Start the engine (for real analysis):</strong> Run launch.sh — it starts engine/server.py on port 8777. The ENGINE pill in the header turns green when it is online. Without it, the app still shows waveforms but will not invent analysis.</li>\n                            <li><strong>Upload Audio:</strong> Click [UPLOAD_AUDIO.exe] to select an audio file from your device (supports MP3, WAV, OGG, FLAC, M4A)</li>")
html = html.replace(
    "<li><strong>Export:</strong> Download your samples and arrangements as a ZIP file</li>",
    "<li><strong>Export:</strong> Download your samples as real .wav files in a ZIP file</li>\n                            <li><strong>Create MIDI:</strong> Use CREATE_MIDI to generate a MIDI starter (chords, bass, drums, melody + arrangement sketch) from one of your analyzed tracks</li>")

open(OUT, "w").write(html)
print(f"wrote {OUT}: {orig_len} -> {len(html)} bytes")
print("Poe references left:", html.count("window.Poe"), "| Claude references left:", html.count("Claude"))
