const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const cpuScoreEl = document.getElementById('cpuScore');
const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const cpuLabel = document.getElementById('cpuLabel');
const controlHint = document.getElementById('controlHint');
const statusText = document.getElementById('statusText');
 /* dashboard overlay elements */
const dashboardOverlay = document.getElementById('dashboardOverlay');
const dashboardStartBtn = document.getElementById('dashboardStartBtn');
const modeOverlay = document.getElementById('modeOverlay');
    /* match start overlay elements */
const matchStartOverlay = document.getElementById('matchStartOverlay');
const matchStartText = document.getElementById('matchStartText');
const resultOverlay = document.getElementById('resultOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const countdownText = document.getElementById('countdownText');
const replayBtn = document.getElementById('replayBtn');
const resultBackBtn = document.getElementById('resultBackBtn');
const modeButtons = document.querySelectorAll('.mode-btn');
const pvpInstructions = document.getElementById('pvpInstructions');

const winScore = 5;
const field = {
    width: canvas.width,
    height: canvas.height
};

const paddleWidth = 18;
const paddleHeight = 110;
const player = {
    x: 40,
    y: field.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 8.4
};

const cpu = {
    x: field.width - 40 - paddleWidth,
    y: field.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5.4
};

const shuttle = {
    x: field.width / 2,
    y: field.height / 2,
    radius: 9,
    dx: 5,
    dy: 3,
    speed: 7
};

const keys = {
    up: false,
    down: false
};

let pointerY = field.height / 2;
let playerScore = 0;
let cpuScore = 0;
let running = false;
let gameOver = false;
let mouseControlActive = false;
let gameMode = 'bot';
let postMatchCountdown = 10;
let countdownTimer = null;
    /* timers for match start and next round */
let matchStartTimer = null;
let matchLaunchTimer = null;
let nextRoundTimer = null;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function setStatus(message) {
    statusText.textContent = message;
}

function updateModeLabels() {
    if (gameMode === 'pvp') {
        cpuLabel.textContent = 'P2';
        controlHint.textContent = 'P1: W / S | P2: ↑ / ↓';
    } else {
        cpuLabel.textContent = 'CPU';
        controlHint.textContent = 'Gerakkan raket dengan mouse atau tombol W / S';
    }
}

function hideModeOverlay() {
    modeOverlay.classList.add('hidden');
}

function showDashboard() {
    clearInterval(countdownTimer);
    clearInterval(matchStartTimer);
    clearTimeout(matchLaunchTimer);
    clearTimeout(nextRoundTimer);
    dashboardOverlay.classList.remove('hidden');
    modeOverlay.classList.add('hidden');
    matchStartOverlay.classList.add('hidden');
    resultOverlay.classList.add('hidden');
    startBtn.classList.add('hidden');
    backBtn.classList.add('hidden');
}

function showModeOverlay() {
    clearInterval(matchStartTimer);
    clearTimeout(matchLaunchTimer);
    modeOverlay.classList.remove('hidden');
    matchStartOverlay.classList.add('hidden');
    resultOverlay.classList.add('hidden');
    startBtn.classList.remove('hidden');
    backBtn.classList.add('hidden');
    pvpInstructions.classList.add('hidden');
}

function showPlayingButtons() {
    startBtn.classList.add('hidden');
    backBtn.classList.remove('hidden');
}

function setCountdownText(value) {
    countdownText.textContent = `Kembali ke menu dalam ${value}`;
}

function startPostMatchCountdown() {
    clearInterval(countdownTimer);
    postMatchCountdown = 10;
    setCountdownText(postMatchCountdown);

    countdownTimer = setInterval(() => {
        postMatchCountdown -= 1;
        setCountdownText(postMatchCountdown);

        if (postMatchCountdown <= 0) {
            clearInterval(countdownTimer);
            showModeOverlay();
            resultOverlay.classList.add('hidden');
        }
    }, 1000);
}

function showResult(winner) {
    const isPlayerWin = winner === 'player';
    resultTitle.textContent = isPlayerWin ? 'Kamu Menang!' : 'Kamu Kalah!';
    resultTitle.style.color = isPlayerWin ? '#79ff9a' : '#ff87d9';
    resultText.textContent = `Skor akhir ${playerScore} - ${cpuScore}`;
    showPlayingButtons();
    resultOverlay.classList.remove('hidden');
    startPostMatchCountdown();
}

function hideResult() {
    clearInterval(countdownTimer);
    resultOverlay.classList.add('hidden');
}

function startMatchCountdown() {
    clearInterval(matchStartTimer);
    clearTimeout(matchLaunchTimer);
    let seconds = 5;
    running = false;
    matchStartOverlay.classList.remove('hidden');
    matchStartText.textContent = String(seconds);
    setStatus('Pertandingan dimulai dalam 5 detik');

    matchStartTimer = setInterval(() => {
        seconds -= 1;

        if (seconds > 0) {
            matchStartText.textContent = String(seconds);
            setStatus(`Pertandingan dimulai dalam ${seconds} detik`);
            return;
        }

        clearInterval(matchStartTimer);
        matchStartText.textContent = 'MULAI!';
        setStatus(`Target skor: ${winScore} poin`);
        matchLaunchTimer = setTimeout(() => {
            matchStartOverlay.classList.add('hidden');
            startRound(Math.random() < 0.5 ? -1 : 1);
        }, 350);
    }, 1000);
}

function scheduleNextRound() {
    clearTimeout(nextRoundTimer);
    nextRoundTimer = setTimeout(() => {
        if (!gameOver && !running) {
            startRound(Math.random() < 0.5 ? -1 : 1);
        }
    }, 900);
}

function updateScore() {
    playerScoreEl.textContent = String(playerScore);
    cpuScoreEl.textContent = String(cpuScore);
}

function animateScore(winner) {
    const target = winner === 'player' ? playerScoreEl : cpuScoreEl;
    target.classList.remove('score-pop');
    void target.offsetWidth;
    target.classList.add('score-pop');

    setTimeout(() => {
        target.classList.remove('score-pop');
    }, 450);
}

function resetPositions() {
    player.y = field.height / 2 - player.height / 2;
    cpu.y = field.height / 2 - cpu.height / 2;
    shuttle.x = field.width / 2;
    shuttle.y = field.height / 2;
    shuttle.dx = 0;
    shuttle.dy = 0;
}

function startRound(direction = Math.random() < 0.5 ? -1 : 1) {
    if (gameOver) return;

    running = true;
    showPlayingButtons();
    hideResult();
    resetPositions();

    const angle = (Math.random() * 1.1) - 0.55;
    shuttle.speed = 5.4 + Math.random() * 1.6;
    shuttle.dx = direction * shuttle.speed * (0.7 + Math.random() * 0.15);
    shuttle.dy = angle * shuttle.speed;
    setStatus(`Target skor: ${winScore} poin`);
}

function endRound(winner) {
    if (winner === 'player') {
        playerScore += 1;
    } else {
        cpuScore += 1;
    }

    updateScore();
    animateScore(winner);

    if (playerScore >= winScore || cpuScore >= winScore) {
        gameOver = true;
        running = false;
        const winnerLabel = playerScore >= winScore ? 'player' : 'cpu';
        setStatus(`${winnerLabel === 'player' ? 'Kamu menang!' : (gameMode === 'pvp' ? 'P2 menang!' : 'CPU menang!')} Skor akhir ${playerScore} - ${cpuScore}`);
        showResult(winnerLabel);
        resetPositions();
        return;
    }

    running = false;
    setStatus(`Skor ${playerScore} - ${cpuScore}. Target: ${winScore} poin`);
    resetPositions();
    scheduleNextRound();
}

function handlePlayerInput() {
    if (keys.up) {
        mouseControlActive = false;
        player.y -= player.speed;
    }

    if (keys.down) {
        mouseControlActive = false;
        player.y += player.speed;
    }

    if (mouseControlActive) {
        player.y = clamp(pointerY - player.height / 2, 0, field.height - player.height);
    }

    if (gameMode === 'pvp') {
        if (keys.p2Up) {
            cpu.y -= cpu.speed;
        }
        if (keys.p2Down) {
            cpu.y += cpu.speed;
        }
        cpu.y = clamp(cpu.y, 0, field.height - cpu.height);
    }

    player.y = clamp(player.y, 0, field.height - player.height);
}

function updateCpu() {
    if (gameMode === 'pvp') {
        return;
    }

    const target = shuttle.y - cpu.height / 2;
    cpu.y += (target - cpu.y) * 0.08;
    cpu.y = clamp(cpu.y, 0, field.height - cpu.height);
}

function checkPaddleCollision() {
    const playerHit =
        shuttle.x - shuttle.radius <= player.x + player.width &&
        shuttle.x + shuttle.radius >= player.x &&
        shuttle.y >= player.y &&
        shuttle.y <= player.y + player.height &&
        shuttle.dx < 0;

    const cpuHit =
        shuttle.x + shuttle.radius >= cpu.x &&
        shuttle.x - shuttle.radius <= cpu.x + cpu.width &&
        shuttle.y >= cpu.y &&
        shuttle.y <= cpu.y + cpu.height &&
        shuttle.dx > 0;

    if (playerHit) {
        shuttle.x = player.x + player.width + shuttle.radius;
        const impact = (shuttle.y - (player.y + player.height / 2)) / (player.height / 2);
        shuttle.dx = Math.abs(shuttle.dx) + 0.7;
        shuttle.dy = impact * 5.6;
    }

    if (cpuHit) {
        shuttle.x = cpu.x - shuttle.radius;
        const impact = (shuttle.y - (cpu.y + cpu.height / 2)) / (cpu.height / 2);
        shuttle.dx = -Math.abs(shuttle.dx) - 0.7;
        shuttle.dy = impact * 5.6;
    }
}

function updateShuttle() {
    if (!running) {
        return;
    }

    shuttle.x += shuttle.dx;
    shuttle.y += shuttle.dy;

    if (shuttle.y - shuttle.radius <= 0 || shuttle.y + shuttle.radius >= field.height) {
        shuttle.dy *= -1;
        shuttle.y = clamp(shuttle.y, shuttle.radius, field.height - shuttle.radius);
    }

    checkPaddleCollision();

    if (shuttle.x < -30) {
        endRound('cpu');
    } else if (shuttle.x > field.width + 30) {
        endRound('player');
    }
}

function drawField() {
    ctx.clearRect(0, 0, field.width, field.height);

    ctx.fillStyle = '#0f5d3a';
    ctx.fillRect(0, 0, field.width, field.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 18, field.width - 36, field.height - 36);

    ctx.beginPath();
    ctx.moveTo(field.width / 2, 20);
    ctx.lineTo(field.width / 2, field.height - 20);
    ctx.stroke();

    ctx.setLineDash([12, 12]);
    ctx.beginPath();
    ctx.moveTo(20, field.height / 2);
    ctx.lineTo(field.width - 20, field.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 10; i += 1) {
        ctx.fillRect(0, i * 52, field.width, 2);
    }
}

function drawPaddle(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeRect(x, y, width, height);
}

function drawShuttle() {
    ctx.beginPath();
    ctx.fillStyle = '#ffe082';
    ctx.arc(shuttle.x, shuttle.y, shuttle.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = '#f4d35e';
    ctx.lineWidth = 2;
    ctx.moveTo(shuttle.x - 6, shuttle.y);
    ctx.lineTo(shuttle.x + 6, shuttle.y);
    ctx.moveTo(shuttle.x, shuttle.y - 6);
    ctx.lineTo(shuttle.x, shuttle.y + 6);
    ctx.stroke();
}

function draw() {
    drawField();
    drawPaddle(player.x, player.y, player.width, player.height, '#79ff9a');
    drawPaddle(cpu.x, cpu.y, cpu.width, cpu.height, '#ff87d9');
    drawShuttle();
}

function gameLoop() {
    handlePlayerInput();
    updateCpu();
    updateShuttle();
    draw();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / rect.height) * field.height;
    pointerY = clamp(y, 0, field.height);
    mouseControlActive = true;
});

const keyboardState = {
    up: false,
    down: false,
    p2Up: false,
    p2Down: false
};

Object.assign(keys, keyboardState);

window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyW') {
        keys.up = true;
    }
    if (event.code === 'KeyS') {
        keys.down = true;
    }
    if (event.code === 'ArrowUp') {
        keys.p2Up = true;
    }
    if (event.code === 'ArrowDown') {
        keys.p2Down = true;
    }
    if (event.code === 'Space') {
        event.preventDefault();
        if (!running && !gameOver && (!modeOverlay.classList.contains('hidden') || !matchStartOverlay.classList.contains('hidden'))) {
            return;
        }
        if (!running && !gameOver) {
            startRound();
        }
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'KeyW') {
        keys.up = false;
    }
    if (event.code === 'KeyS') {
        keys.down = false;
    }
    if (event.code === 'ArrowUp') {
        keys.p2Up = false;
    }
    if (event.code === 'ArrowDown') {
        keys.p2Down = false;
    }
});

startBtn.addEventListener('click', () => {
    hideResult();
    showDashboard();
});

dashboardStartBtn.addEventListener('click', () => {
    dashboardOverlay.classList.add('hidden');
    showModeOverlay();
});

backBtn.addEventListener('click', () => {
    clearInterval(countdownTimer);
    clearInterval(matchStartTimer);
    clearTimeout(matchLaunchTimer);
    clearTimeout(nextRoundTimer);
    playerScore = 0;
    cpuScore = 0;
    updateScore();
    gameOver = false;
    running = false;
    resetPositions();
    matchStartOverlay.classList.add('hidden');
    setStatus('Target skor: 5 poin');
    showModeOverlay();
});

modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        gameMode = button.dataset.mode;
        updateModeLabels();

        if (gameMode === 'pvp') {
            pvpInstructions.classList.remove('hidden');
        } else {
            pvpInstructions.classList.add('hidden');
        }

        hideModeOverlay();
        playerScore = 0;
        cpuScore = 0;
        gameOver = false;
        running = false;
        updateScore();
        resetPositions();
        showPlayingButtons();
        startMatchCountdown();
    });
});

replayBtn.addEventListener('click', () => {
    hideResult();
    playerScore = 0;
    cpuScore = 0;
    gameOver = false;
    running = false;
    updateScore();
    resetPositions();
    showPlayingButtons();
    startRound(Math.random() < 0.5 ? -1 : 1);
});

resultBackBtn.addEventListener('click', () => {
    clearTimeout(nextRoundTimer);
    playerScore = 0;
    cpuScore = 0;
    gameOver = false;
    running = false;
    updateScore();
    resetPositions();
    setStatus('Target skor: 5 poin');
    showModeOverlay();
});

updateModeLabels();
updateScore();
setStatus('Target skor: 5 poin');
resetPositions();
showDashboard();
requestAnimationFrame(gameLoop);
