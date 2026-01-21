// ======================
// 🎨 Canvas Setup
// ======================
const canvas = document.getElementById("sphere");
const ctx = canvas.getContext("2d");
canvas.width = 350;
canvas.height = 350;

const center = { x: 175, y: 175 };
const fov = 400;

// ======================
// 🌐 Sphere Data
// ======================
let particles = [];
let speaking = false;
let glowPower = 0;
let hudRotation = 0;
let radarAngle = 0;

// ======================
// 🎧 Audio Analysis
// ======================
let audioCtx, analyser, dataArray;

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

// ======================
// Create Sphere
// ======================
for (let i = 0; i < 600; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 120;

    particles.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
    });
}

// ======================
// 🔄 3D Math
// ======================
function project(p) {
    const scale = fov / (fov + p.z);
    return {
        x: p.x * scale + center.x,
        y: p.y * scale + center.y,
        scale
    };
}

function rotateY(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const x = p.x * c - p.z * s;
    const z = p.x * s + p.z * c;
    p.x = x; p.z = z;
}

function rotateX(p, a) {
    const c = Math.cos(a), s = Math.sin(a);
    const y = p.y * c - p.z * s;
    const z = p.y * s + p.z * c;
    p.y = y; p.z = z;
}

// ======================
// 🧿 Iron-Man HUD Rings
// ======================
function drawHUD() {
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(hudRotation);

    ctx.strokeStyle = "rgba(0,234,255,0.5)";
    ctx.lineWidth = 2.4;

    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, 140 + i * 14, 0, Math.PI * 1.6);
        ctx.stroke();
    }

    ctx.restore();
    hudRotation += 0.003;
}

// ======================
// 🧿 Radar Sweep Ring
// ======================
function drawRadar() {
    ctx.save();
    ctx.translate(center.x, center.y);

    ctx.strokeStyle = "rgba(0,234,255,0.35)";
    ctx.lineWidth = 5;

    ctx.beginPath();
    ctx.arc(0, 0, 155, radarAngle, radarAngle + 0.4);
    ctx.stroke();

    ctx.restore();
    radarAngle += 0.02;
}

// ======================
// 🎥 Render Loop
// ======================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        rotateY(p, 0.003);
        rotateX(p, 0.002);

        const proj = project(p);
        const size = 2.2 * proj.scale;

        ctx.fillStyle = `rgba(0,234,255,${0.5 + glowPower})`;
        ctx.fillRect(proj.x, proj.y, size, size);
    });

    drawHUD();
    drawRadar();
    requestAnimationFrame(draw);
}
draw();

// ======================
// 🎙️ Google Male Voice
// ======================
let googleMaleVoice = null;

function loadGoogleMaleVoice() {
    const voices = speechSynthesis.getVoices();
    googleMaleVoice =
        voices.find(v => v.name === "Google UK English Male") ||
        voices.find(v => v.name === "Google US English") ||
        voices.find(v => v.lang.startsWith("en"));
}
speechSynthesis.onvoiceschanged = loadGoogleMaleVoice;

// ======================
// 🤖 Speak (Jarvis Style)
// ======================
function speak(text) {
    speechSynthesis.cancel();

    if (!googleMaleVoice) loadGoogleMaleVoice();
    if (!audioCtx) initAudio();

    const utter = new SpeechSynthesisUtterance(text);

    // 🎙️ Forced male voice settings
    utter.voice = googleMaleVoice;
    utter.pitch = 0.55;   // deep male
    utter.rate = 0.95;    // natural pace
    utter.volume = 1.0;

    speaking = true;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const glowLoop = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        glowPower = (avg / 255) * 0.8;
    }, 50);

    utter.onend = () => {
        speaking = false;
        glowPower = 0;
        clearInterval(glowLoop);
    };

    speechSynthesis.speak(utter);
}

// ======================
// 💬 Chat
// ======================
function logMessage(text) {
    const log = document.getElementById("log");
    log.innerHTML += `<div>${text}</div>`;
    log.scrollTop = log.scrollHeight;
}

function sendMessage(msgOverride) {
    const input = document.getElementById("userInput");
    const msg = msgOverride || input.value.trim();
    if (!msg) return;

    logMessage("You: " + msg);

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
    })
    .then(r => r.json())
    .then(d => {
        logMessage("Shadow: " + d.reply);
        speak(d.reply);
    });

    input.value = "";
}
