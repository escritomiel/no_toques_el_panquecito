/* ==========================================================================
   1. WEB AUDIO API SYNTHESIZER (Zero external sound files required)
   ========================================================================== */
let audioCtx = null;
let soundMuted = false;

function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Play procedural cute retro sounds
function playSound(type) {
    if (soundMuted || !audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'hit') {
            // Quick high bounce sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(850, now + 0.08);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'fail') {
            // Absurd squishy failure slide
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.25);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'milestone') {
            // Happy chime arpeggio
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = 'triangle';
                subOsc.frequency.setValueAtTime(freq, now + idx * 0.05);
                subGain.gain.setValueAtTime(0.2, now + idx * 0.05);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);
                subOsc.connect(subGain);
                subGain.connect(audioCtx.destination);
                subOsc.start(now + idx * 0.05);
                subOsc.stop(now + idx * 0.05 + 0.15);
            });
        } else if (type === 'record') {
            // Fanfare victory note
            osc.type = 'square';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.setValueAtTime(880, now + 0.1);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch (e) {
        console.warn('Audio playback error:', e);
    }
}

/* ==========================================================================
   2. GAME PHRASES DATABASE (25+ Absurd & Funny Comments)
   ========================================================================== */
const ABSURD_MESSAGES = {
    5: "Bien.",
    10: "Panquecito empieza a sospechar.",
    15: "¿Por qué eres tan rápido?",
    20: "El jarabe de maple está sudando.",
    25: "Esto se está poniendo serio.",
    30: "¡Deja en paz a la mantequilla!",
    35: "Panquecito está llamando a sus abogados.",
    40: "PANQUECITO ESTÁ HUYENDO.",
    45: "Iniciando protocolo de evasión...",
    50: "Nivel de velocidad: Peligroso.",
    55: "¿Acaso usas dos manos?",
    60: "¿No tienes nada mejor que hacer?",
    65: "Tus reflejos rozan lo ilegal.",
    70: "Panquecito ha activado el super-turbo.",
    75: "¡Alguien detenga a este usuario!",
    80: "Los chefs del mundo están consternados.",
    85: "Error 404: Panquecito ilocalizable.",
    90: "Sientes el olor a mantequilla quemada...",
    95: "Panquecito ha alcanzado la velocidad de la luz.",
    100: "¿CÓMO SIGUES AQUÍ?",
    110: "¿Esa pantalla aguantará tanto toque?",
    120: "Matrix de la repostería activada.",
    135: "Leyenda urbana del desayuno.",
    150: "Panquecito se plantea cambiar de profesión.",
    200: "DIOS DEL JARABE DETECTADO."
};

const HIT_FLOATERS = [
    "+1", "+1", "¡BIEN!", "¡TOMA!", "¡RÁPIDO!", "¡FLUFFY!", 
    "¡DELICIOSO!", "¡ZAP!", "¡OTRO!", "¡BOOM!", "¡SWISH!", "¡ZAZ!"
];

const FAIL_REASONS = [
    "Panquecito ha escapado.",
    "Tocaste el aire con demasiada pasión.",
    "Demasiado lento para la repostería.",
    "Panquecito esquivó tu movimiento.",
    "El jarabe te cegó momentáneamente.",
    "¿Ese era tu mejor intento?",
    "Panquecito se retiró a descansar.",
    "Tus dedos dudaron un milisegundo."
];

/* ==========================================================================
   3. GAME STATE & VARIABLES
   ========================================================================== */
let score = 0;
let highScore = parseInt(localStorage.getItem('panquecito_highscore') || '0', 10);
let gamesPlayed = parseInt(localStorage.getItem('panquecito_gamesplayed') || '0', 10);
let gameHistory = JSON.parse(localStorage.getItem('panquecito_history') || '[]');
let activeTab = 'records'; // 'records' | 'history'

// User profile configuration
window.playerProfile = JSON.parse(localStorage.getItem('panquecito_profile') || '{"name":"Panquecito Fan", "avatar":"🥞"}');
let selectedAvatar = window.playerProfile.avatar;

let gameActive = false;
let pancakeTimer = null;
let timerInterval = null;
let currentTimeoutMs = 2800;
let goldenMode = false;
let titleClicks = 0;

// DOM Element References
const gameField = document.getElementById('game-field');
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const scoreDisplay = document.getElementById('score-display');
const hudHighScore = document.getElementById('hud-high-score');
const startHighScore = document.getElementById('start-high-score');
const startGamesPlayed = document.getElementById('start-games-played');
const finalScore = document.getElementById('final-score');
const finalHighScore = document.getElementById('final-high-score');
const newRecordBanner = document.getElementById('new-record-banner');
const timerBar = document.getElementById('timer-bar');
const timerBarContainer = document.getElementById('timer-bar-container');
const hud = document.getElementById('hud');
const soundBtn = document.getElementById('sound-btn');
const failReasonTxt = document.getElementById('fail-reason');
const titleContainer = document.getElementById('title-container');
const easterMsg = document.getElementById('easter-msg');

// Profile UI References
const profileModal = document.getElementById('profile-modal');
const editProfileBtn = document.getElementById('edit-profile-btn');
const closeProfileX = document.getElementById('close-profile-x');
const saveProfileBtn = document.getElementById('save-profile-btn');
const nicknameInput = document.getElementById('nickname-input');
const playerNameDisplay = document.getElementById('player-name-display');
const playerAvatarDisplay = document.getElementById('player-avatar-display');

// Modal Elements
const recordsModal = document.getElementById('records-modal');
const viewRecordsBtn = document.getElementById('view-records-btn');
const gameoverRecordsBtn = document.getElementById('gameover-records-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const closeModalX = document.getElementById('close-modal-x');
const tabRecordsBtn = document.getElementById('tab-records-btn');
const tabHistoryBtn = document.getElementById('tab-history-btn');
const recordsListContainer = document.getElementById('records-list-container');


// SVG Vector Template for Pancake Target
function getPancakeSVG(size, isGolden = false) {
    const butterColor = isGolden ? "#fef08a" : "#fef08a";
    const syrupColor = isGolden ? "#b45309" : "#d97706";
    const pancakeBase = isGolden ? "#f59e0b" : "#f59e0b";
    const pancakeTop = isGolden ? "#fde047" : "#fbbf24";

    return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" class="drop-shadow-lg select-none pointer-events-none">
        <!-- Bottom Pancake Layer -->
        <ellipse cx="50" cy="75" rx="42" ry="16" fill="#b45309" />
        <ellipse cx="50" cy="72" rx="42" ry="16" fill="${pancakeBase}" />
        
        <!-- Middle Pancake Layer -->
        <ellipse cx="50" cy="60" rx="40" ry="15" fill="#b45309" />
        <ellipse cx="50" cy="57" rx="40" ry="15" fill="${pancakeBase}" />
        
        <!-- Top Pancake Layer -->
        <ellipse cx="50" cy="45" rx="38" ry="15" fill="#b45309" />
        <ellipse cx="50" cy="42" rx="38" ry="15" fill="${pancakeTop}" />

        <!-- Dripping Maple Syrup -->
        <path d="M 20 42 C 20 52, 25 65, 30 65 C 33 65, 32 50, 42 52 C 50 54, 48 70, 56 68 C 62 66, 60 52, 68 50 C 76 48, 80 42, 80 42 C 80 42, 50 48, 20 42 Z" fill="${syrupColor}" class="syrup-drip" />

        <!-- Pat of Melting Butter -->
        <polygon points="42,30 58,26 62,34 46,38" fill="${butterColor}" stroke="#ca8a04" stroke-width="1.5" />

        <!-- Cute Cartoon Face -->
        <circle cx="40" cy="41" r="3" fill="#451a03" />
        <circle cx="60" cy="41" r="3" fill="#451a03" />
        <!-- Blushing cheeks -->
        <ellipse cx="34" cy="43" rx="3" ry="1.5" fill="#f43f5e" opacity="0.6" />
        <ellipse cx="66" cy="43" rx="3" ry="1.5" fill="#f43f5e" opacity="0.6" />
        <!-- Smile -->
        <path d="M 46 44 Q 50 48 54 44" stroke="#451a03" stroke-width="2" fill="none" stroke-linecap="round" />
    </svg>
    `;
}

/* ==========================================================================
   4. CORE GAMEPLAY MECHANICS
   ========================================================================== */

// Update high score display on screens
function updateStatsUI() {
    startHighScore.textContent = highScore;
    startGamesPlayed.textContent = gamesPlayed;
    hudHighScore.textContent = highScore;
}

// Calculate difficulty parameters based on score
function getDifficultySettings(currentScore) {
    let size = 110;          // Base size in pixels
    let timeout = 2800;      // Base display time in ms (+1 segundo extra de tiempo inicial)

    if (currentScore <= 10) {
        size = 110 - currentScore * 1.5;
        timeout = 2800 - currentScore * 60; // 2800ms -> 2200ms
    } else if (currentScore <= 25) {
        size = 95 - (currentScore - 10) * 1;
        timeout = 2200 - (currentScore - 10) * 25; // 2200ms -> 1825ms
    } else if (currentScore <= 50) {
        size = 80 - (currentScore - 25) * 0.6;
        timeout = 1825 - (currentScore - 25) * 13; // 1825ms -> 1500ms
    } else if (currentScore <= 100) {
        size = 65 - (currentScore - 50) * 0.2;
        timeout = 1500 - (currentScore - 50) * 6; // 1500ms -> 1200ms
    } else {
        size = Math.max(48, 55 - (currentScore - 100) * 0.05);
        timeout = Math.max(1000, 1200 - (currentScore - 100) * 2); // Mínimo garantizado de 1 segundo completo
    }

    // Adjust size slightly for mobile screens
    if (window.innerWidth < 640) {
        size = Math.max(54, size * 0.95);
    }

    return { size: Math.round(size), timeout: Math.round(timeout) };
}

// Spawn Pancake target at safe random position
function spawnPancake() {
    if (!gameActive) return;

    // Remove existing pancake target
    const existing = document.getElementById('pancake-target');
    if (existing) existing.remove();

    const { size, timeout } = getDifficultySettings(score);
    currentTimeoutMs = timeout;

    // Compute safe boundaries
    const hudHeight = 90;
    const padding = 20;
    const maxX = window.innerWidth - size - padding * 2;
    const maxY = window.innerHeight - size - padding * 2 - hudHeight;

    const randomX = Math.max(padding, Math.floor(Math.random() * maxX));
    const randomY = Math.max(hudHeight + padding, Math.floor(Math.random() * maxY));

    // Create target wrapper element
    const pancakeEl = document.createElement('div');
    pancakeEl.id = 'pancake-target';
    pancakeEl.className = 'absolute cursor-pointer pancake-appear flex items-center justify-center p-2 rounded-full touch-none';
    pancakeEl.style.left = `${randomX}px`;
    pancakeEl.style.top = `${randomY}px`;
    pancakeEl.style.width = `${size + 16}px`; // Generous hit box padding
    pancakeEl.style.height = `${size + 16}px`;
    pancakeEl.innerHTML = getPancakeSVG(size, goldenMode);

    // Handle successful hit via Pointer Down (Instant response for touch/mouse)
    pancakeEl.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); // Prevents background fail trigger
        onPancakeHit(e.clientX, e.clientY);
    });

    gameField.appendChild(pancakeEl);

    // Start HUD countdown timer bar
    resetTimerBar(timeout);

    // Set timeout for missing/fleeing pancake
    clearTimeout(pancakeTimer);
    pancakeTimer = setTimeout(() => {
        if (gameActive) {
            triggerGameOver("Panquecito escapó demasiado rápido.");
        }
    }, timeout);
}

// Animate timer bar
function resetTimerBar(durationMs) {
    clearInterval(timerInterval);
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    
    // Force browser reflow
    void timerBar.offsetWidth;

    timerBar.style.transition = `width ${durationMs}ms linear`;
    timerBar.style.width = '0%';
}

// Called when user hits the pancake successfully
function onPancakeHit(clientX, clientY) {
    if (!gameActive) return;

    clearTimeout(pancakeTimer);
    clearInterval(timerInterval);

    score++;
    scoreDisplay.textContent = score;

    playSound('hit');

    // Visual hit feedback
    spawnFloatingText(clientX, clientY);
    spawnParticles(clientX, clientY);

    // Check absurd message milestones
    if (ABSURD_MESSAGES[score]) {
        showAbsurdBanner(ABSURD_MESSAGES[score]);
        playSound('milestone');
    }

    // Check new high score during live match
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('panquecito_highscore', highScore.toString());
        hudHighScore.textContent = highScore;
    }

    // Target hit animation before respawn
    const target = document.getElementById('pancake-target');
    if (target) {
        target.classList.remove('pancake-appear');
        target.classList.add('pancake-hit');
    }

    // Immediately spawn next pancake target
    setTimeout(() => {
        spawnPancake();
    }, 60);
}

// Create popup floating hit phrases (+1, ¡DELICIOSO!)
function spawnFloatingText(x, y) {
    const txt = document.createElement('div');
    txt.className = 'floating-txt text-amber-500 text-2xl font-black';
    txt.style.left = `${x - 20}px`;
    txt.style.top = `${y - 30}px`;
    
    const phrase = HIT_FLOATERS[Math.floor(Math.random() * HIT_FLOATERS.length)];
    txt.textContent = phrase;

    document.body.appendChild(txt);
    setTimeout(() => txt.remove(), 850);
}

// Create syrup/butter particle explosion on hit
function spawnParticles(x, y) {
    const colors = ['#f59e0b', '#fbbf24', '#d97706', '#fef08a'];
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const pSize = Math.floor(Math.random() * 8) + 6;
        particle.style.width = `${pSize}px`;
        particle.style.height = `${pSize}px`;
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        document.body.appendChild(particle);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 60 + 20;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${vx}px, ${vy}px) scale(0)`, opacity: 0 }
        ], {
            duration: 500,
            easing: 'cubic-bezier(0,0,0.2,1)'
        }).onfinish = () => particle.remove();
    }
}

// Show banner notification with funny commentary
function showAbsurdBanner(msg) {
    const oldBanner = document.querySelector('.absurd-banner');
    if (oldBanner) oldBanner.remove();

    const banner = document.createElement('div');
    banner.className = 'absurd-banner bg-amber-900/90 text-amber-100 font-bold text-sm sm:text-base px-6 py-2 rounded-2xl border-2 border-amber-400 shadow-xl text-center max-w-xs sm:max-w-md';
    banner.textContent = msg;

    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2200);
}

/* ==========================================================================
   5. GAME OVER & FLOW CONTROL
   ========================================================================== */

function startGame() {
    initAudio();
    score = 0;
    gameActive = true;

    if (goldenMode) {
        score = 10;
    }

    scoreDisplay.textContent = score;
    gamesPlayed++;
    localStorage.setItem('panquecito_gamesplayed', gamesPlayed.toString());
    updateStatsUI();

    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    timerBarContainer.classList.remove('hidden');

    const existing = document.getElementById('pancake-target');
    if (existing) existing.remove();

    spawnPancake();
}

function triggerGameOver(reason) {
    if (!gameActive) return;
    gameActive = false;

    clearTimeout(pancakeTimer);
    clearInterval(timerInterval);

    playSound('fail');

    const target = document.getElementById('pancake-target');
    if (target) target.remove();

    hud.classList.add('hidden');
    timerBarContainer.classList.add('hidden');

    finalScore.textContent = score;
    finalHighScore.textContent = highScore;

    if (score > 0 && score >= highScore) {
        newRecordBanner.classList.remove('hidden');
        playSound('record');
    } else {
        newRecordBanner.classList.add('hidden');
    }

    failReasonTxt.textContent = reason || FAIL_REASONS[Math.floor(Math.random() * FAIL_REASONS.length)];

    saveGameRecord(score);

    gameoverScreen.classList.remove('hidden');
}

// Title Rank Evaluator based on score achieved
function getRankTitle(pts) {
    if (pts >= 100) return { title: "👑 LEYENDA DEL PANQUÉ", color: "text-amber-600 bg-amber-100" };
    if (pts >= 50) return { title: "⚡ CAZADOR VOLADOR", color: "text-yellow-700 bg-yellow-100" };
    if (pts >= 25) return { title: "🔥 EXPERTO REPOSTERO", color: "text-orange-600 bg-orange-100" };
    if (pts >= 10) return { title: "🥞 COMEDOR RÁPIDO", color: "text-amber-800 bg-amber-100" };
    return { title: "👶 NOVATO DEL JARABE", color: "text-stone-600 bg-stone-100" };
}

// Save game attempt to local history & cloud storage
function saveGameRecord(finalPts) {
    const dateStr = new Date().toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    const rankInfo = getRankTitle(finalPts);
    const recordEntry = {
        score: finalPts,
        date: dateStr,
        rank: rankInfo.title,
        name: window.playerProfile.name,
        avatar: window.playerProfile.avatar,
        timestamp: Date.now()
    };

    // Save to Local History
    gameHistory.unshift(recordEntry);
    if (gameHistory.length > 20) gameHistory.pop(); // Keep last 20 games
    localStorage.setItem('panquecito_history', JSON.stringify(gameHistory));

    // Save to Cloud Storage if available
    if (window.db && window.currentUser) {
        try {
            const leaderboardRef = collection(window.db, 'artifacts', window.appId, 'public', 'data', 'leaderboard');
            addDoc(leaderboardRef, {
                score: finalPts,
                date: dateStr,
                rank: rankInfo.title,
                name: window.playerProfile.name,
                avatar: window.playerProfile.avatar,
                userId: window.currentUser.uid,
                createdAt: Date.now()
            }).catch(e => console.warn("Cloud record save notice:", e));

            // Save private user stats
            const userStatsRef = doc(window.db, 'artifacts', window.appId, 'users', window.currentUser.uid, 'stats', 'game_stats');
            setDoc(userStatsRef, {
                highScore: highScore,
                gamesPlayed: gamesPlayed,
                lastScore: finalPts,
                updatedAt: Date.now()
            }, { merge: true }).catch(e => console.warn("User stats save notice:", e));
        } catch(e) {
            console.warn("Cloud save error:", e);
        }
    }
}

// Modal & Records Render Logic
function renderRecordsUI() {
    recordsListContainer.innerHTML = '';

    if (activeTab === 'records') {
        // Combine Cloud & Local records for Top Leaderboard
        let allScores = [...gameHistory];
        if (window.cloudRecords && window.cloudRecords.length > 0) {
            allScores = [...allScores, ...window.cloudRecords];
        }

        // Sort descending by score
        allScores.sort((a, b) => b.score - a.score);

        // Deduplicate & take top 10
        const topScores = allScores.slice(0, 10);

        if (topScores.length === 0) {
            recordsListContainer.innerHTML = `
                <div class="text-center py-8 text-amber-800/60 font-bold">
                    <div class="text-4xl mb-2">🥞</div>
                    <p>¡Aún no hay partidas registradas!</p>
                    <p class="text-xs mt-1">Juega tu primera partida para inaugurar los récords.</p>
                </div>`;
            return;
        }

        topScores.forEach((item, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
            const rank = getRankTitle(item.score);
            const playerName = item.name || "Panquecito Fan";
            const playerAvatar = item.avatar || "🥞";
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm';
            row.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-lg font-black text-amber-900 w-6 text-center">${medal}</span>
                    <span class="text-2xl">${playerAvatar}</span>
                    <div>
                        <div class="text-sm font-extrabold text-amber-950">${playerName} <span class="text-xs text-amber-600">(${item.score} pts)</span></div>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${rank.color}">${rank.title}</span>
                    </div>
                </div>
                <span class="text-[11px] font-semibold text-amber-800/60">${item.date || 'Reciente'}</span>
            `;
            recordsListContainer.appendChild(row);
        });
    } else {
        // Render Recent Games History
        if (gameHistory.length === 0) {
            recordsListContainer.innerHTML = `
                <div class="text-center py-8 text-amber-800/60 font-bold">
                    <div class="text-4xl mb-2">📜</div>
                    <p>No tienes partidas recientes.</p>
                </div>`;
            return;
        }

        gameHistory.forEach((item, index) => {
            const rank = getRankTitle(item.score);
            const playerAvatar = item.avatar || "🥞";
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between p-3 bg-stone-50 rounded-2xl border border-stone-200';
            row.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-xl">${playerAvatar}</span>
                    <div>
                        <div class="text-sm font-black text-amber-900">${item.score} <span class="text-xs font-bold text-amber-600">puntos</span></div>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${rank.color}">${rank.title}</span>
                    </div>
                </div>
                <span class="text-[11px] font-semibold text-stone-500">${item.date}</span>
            `;
            recordsListContainer.appendChild(row);
        });
    }
}

function updateProfileUI() {
    playerNameDisplay.textContent = window.playerProfile.name;
    playerAvatarDisplay.textContent = window.playerProfile.avatar;
    nicknameInput.value = window.playerProfile.name;
    selectedAvatar = window.playerProfile.avatar;
    highlightSelectedAvatar();
}
window.updateProfileUI = updateProfileUI;

function highlightSelectedAvatar() {
    document.querySelectorAll('.avatar-option').forEach(btn => {
        if (btn.getAttribute('data-avatar') === selectedAvatar) {
            btn.className = 'avatar-option text-2xl p-2 rounded-xl border-2 border-amber-400 bg-amber-200';
        } else {
            btn.className = 'avatar-option text-2xl p-2 rounded-xl border-2 border-transparent hover:bg-amber-100';
        }
    });
}

// Start, Retry & Menu Listeners
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const menuBtn = document.getElementById('menu-btn');

if (startBtn) startBtn.addEventListener('click', startGame);
if (retryBtn) retryBtn.addEventListener('click', startGame);
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        gameoverScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        updateStatsUI();
    });
}

// Sound Toggle Button
if (soundBtn) {
    soundBtn.addEventListener('click', () => {
        soundMuted = !soundMuted;
        soundBtn.textContent = soundMuted ? '🔇' : '🔊';
    });
}

// Easter Egg Title Trigger
if (titleContainer) {
    titleContainer.addEventListener('click', () => {
        titleClicks++;
        if (titleClicks === 5) {
            goldenMode = true;
            easterMsg.classList.remove('hidden');
            initAudio();
            playSound('milestone');
        }
    });
}

// Missed Click on Game Field (Touching background instead of pancake)
if (gameField) {
    gameField.addEventListener('pointerdown', (e) => {
        if (gameActive && e.target === gameField) {
            triggerGameOver("¡Tocaste fuera del panquecito!");
        }
    });
}

// Modal Open / Close / Tab Switching Listeners
function openRecordsModal() {
    renderRecordsUI();
    recordsModal.classList.remove('hidden');
}

function closeRecordsModal() {
    recordsModal.classList.add('hidden');
}

if (viewRecordsBtn) viewRecordsBtn.addEventListener('click', openRecordsModal);
if (gameoverRecordsBtn) gameoverRecordsBtn.addEventListener('click', openRecordsModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', closeRecordsModal);
if (closeModalX) closeModalX.addEventListener('click', closeRecordsModal);

if (tabRecordsBtn && tabHistoryBtn) {
    tabRecordsBtn.addEventListener('click', () => {
        activeTab = 'records';
        tabRecordsBtn.className = 'flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-amber-500 text-white shadow-sm transition-all';
        tabHistoryBtn.className = 'flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-xl text-amber-800 hover:bg-amber-200/60 transition-all';
        renderRecordsUI();
    });

    tabHistoryBtn.addEventListener('click', () => {
        activeTab = 'history';
        tabHistoryBtn.className = 'flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-xl text-amber-800 hover:bg-amber-200/60 transition-all';
        tabRecordsBtn.className = 'flex-1 py-2 text-xs sm:text-sm font-extrabold rounded-xl bg-amber-500 text-white shadow-sm transition-all';
        renderRecordsUI();
    });
}

window.refreshRecordsUI = renderRecordsUI;

// Profile Modal Events
editProfileBtn.addEventListener('click', () => {
    updateProfileUI();
    profileModal.classList.remove('hidden');
});

closeProfileX.addEventListener('click', () => {
    profileModal.classList.add('hidden');
});

document.querySelectorAll('.avatar-option').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedAvatar = btn.getAttribute('data-avatar');
        highlightSelectedAvatar();
    });
});

saveProfileBtn.addEventListener('click', async () => {
    const inputVal = nicknameInput.value.trim();
    if (inputVal.length > 0) {
        window.playerProfile.name = inputVal;
    }
    window.playerProfile.avatar = selectedAvatar;

    localStorage.setItem('panquecito_profile', JSON.stringify(window.playerProfile));
    updateProfileUI();
    profileModal.classList.add('hidden');

    // Save to Cloud Profile if authenticated
    if (window.db && window.currentUser) {
        try {
            const userProfileRef = doc(window.db, 'artifacts', window.appId, 'users', window.currentUser.uid, 'profile', 'data');
            await setDoc(userProfileRef, {
                name: window.playerProfile.name,
                avatar: window.playerProfile.avatar,
                updatedAt: Date.now()
            }, { merge: true });
        } catch(e) { console.warn("Notice saving cloud profile:", e); }
    }
});

// Initialize UI on page load
window.onload = () => {
    updateStatsUI();
    updateProfileUI();
};

// Window resize repositioning safety
window.addEventListener('resize', () => {
    if (gameActive) {
        // Respawn target gracefully if viewport changes orientation
        spawnPancake();
    }
});