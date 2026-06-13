// Game variables
let currentLevelIndex = 0;
let score = 0;
let lives = 3;
let streak = 0;
let selectedOption = null;
let isMuted = false;

// Selection states for Interactive Marking Phase
let gameState = 'marking'; // 'marking' or 'quiz'
let selectedT1Element = null; // { type, key, element }
let selectedT2Element = null; // { type, key, element }
let matchedPairs = []; // Array of matched t1 keys
let activeTimeouts = []; // Track active animation timeouts to clear them

// DOM Elements
const screenSplash = document.getElementById("screen-splash");
const screenGame = document.getElementById("screen-game");
const screenEnd = document.getElementById("screen-end");

const btnStart = document.getElementById("btn-start");
const btnRestart = document.getElementById("btn-restart");
const btnNextLevel = document.getElementById("btn-next-level");
const btnToggleMute = document.getElementById("btn-toggle-mute");

const levelTag = document.getElementById("level-tag");
const questionText = document.getElementById("question-text");
const svgContainer = document.getElementById("svg-container");
const optionsContainer = document.getElementById("options-container");
const feedbackBox = document.getElementById("feedback-box");
const feedbackTitle = document.getElementById("feedback-title");
const feedbackExplanation = document.getElementById("feedback-explanation");

const progressFill = document.getElementById("progress-fill");
const livesContainer = document.getElementById("lives-container");
const scoreVal = document.getElementById("score-val");

const hintBtn = document.getElementById("hint-btn");
const hintBox = document.getElementById("hint-box");

// Stats elements
const statAccuracy = document.getElementById("stat-accuracy");
const statScore = document.getElementById("stat-score");
const statStreak = document.getElementById("stat-streak");
const endTitle = document.getElementById("end-title");
const medalContainer = document.getElementById("medal-container");

// Initialize Game
function init() {
  btnStart.addEventListener("click", startGame);
  btnRestart.addEventListener("click", restartGame);
  btnNextLevel.addEventListener("click", nextLevel);
  btnToggleMute.addEventListener("click", toggleMute);
  hintBtn.addEventListener("click", toggleHint);

  // Setup QR code for mobile sharing if IP parameter is present
  setupQRSharing();
}

function setupQRSharing() {
  const urlParams = new URLSearchParams(window.location.search);
  const ip = urlParams.get('ip');
  if (ip) {
    const qrCard = document.createElement("div");
    qrCard.className = "qr-card";
    qrCard.innerHTML = `
      <div class="qr-title">📱 סרוק לשיתוף מהיר לטלפון של עמית:</div>
      <img class="qr-code-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://${ip}:8000" alt="קוד QR">
      <div class="qr-instructions">ודא שהטלפון מחובר לאותו Wi-Fi, וסרוק את הקוד עם המצלמה להתחלת המשחק בנייד</div>
    `;
    // Insert in splash screen before the start button
    btnStart.parentNode.insertBefore(qrCard, btnStart);
  }
}

function startGame() {
  currentLevelIndex = 0;
  score = 0;
  lives = 3;
  streak = 0;
  
  screenSplash.classList.remove("active");
  screenEnd.classList.remove("active");
  screenGame.classList.add("active");
  
  loadLevel(currentLevelIndex);
}

function restartGame() {
  startGame();
}

function toggleMute() {
  isMuted = !isMuted;
  btnToggleMute.textContent = isMuted ? "🔈 סאונד כבוי" : "🔊 סאונד פעיל";
  btnToggleMute.classList.toggle("btn-secondary", isMuted);
  btnToggleMute.classList.toggle("btn-primary", !isMuted);
}

function toggleHint() {
  if (hintBox.style.display === "block") {
    hintBox.style.display = "none";
    hintBtn.textContent = "💡 הצג רמז";
  } else {
    hintBox.style.display = "block";
    hintBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    hintBtn.textContent = "💡 הסתר רמז";
    
    // Trigger visual explanation animation as a hint!
    triggerExplanationAnimation(true);
  }
}

function updateHeader() {
  // Update progress
  const progressPercent = (currentLevelIndex / QUESTIONS.length) * 100;
  progressFill.style.width = `${progressPercent}%`;
  
  // Update score
  scoreVal.textContent = score;
  
  // Update lives
  livesContainer.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.innerHTML = "❤️";
    if (i >= lives) {
      heart.classList.add("lost");
    }
    livesContainer.appendChild(heart);
  }
}

function loadLevel(index) {
  // Clear any running explanation timeouts
  activeTimeouts.forEach(clearTimeout);
  activeTimeouts = [];
  
  if (index >= QUESTIONS.length) {
    endGame(true);
    return;
  }
  
  const questionData = QUESTIONS[index];
  selectedOption = null;
  gameState = 'marking';
  selectedT1Element = null;
  selectedT2Element = null;
  matchedPairs = [];
  
  // Hide feedback & hint
  feedbackBox.style.display = "none";
  hintBox.style.display = "none";
  hintBtn.textContent = "💡 הצג רמז";
  hintBox.textContent = questionData.hint;
  
  levelTag.textContent = questionData.title;
  questionText.textContent = questionData.question;
  
  updateHeader();
  
  // Render Instruction Banner
  renderInstructionBanner(questionData.instruction);
  
  // Render SVG triangles (with overlay layers for clicks)
  renderSVG(questionData.triangleData);
  
  // Options container remains empty during marking phase
  optionsContainer.innerHTML = "";
}

function renderInstructionBanner(text) {
  let banner = document.getElementById("instruction-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "instruction-banner";
    banner.className = "instruction-banner";
    svgContainer.parentNode.insertBefore(banner, svgContainer);
  }
  banner.style.display = "block";
  banner.textContent = text;
}

function renderSVG(data) {
  svgContainer.innerHTML = "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 320 170");
  svg.setAttribute("class", "triangle-svg");
  
  if (data.type === "side-by-side") {
    const g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g1.setAttribute("id", "g-t1");
    g1.setAttribute("class", "svg-group");
    drawSingleTriangle(g1, data.t1, "t1-style", "t1-point", "t1");
    svg.appendChild(g1);
    
    const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g2.setAttribute("id", "g-t2");
    g2.setAttribute("class", "svg-group");
    drawSingleTriangle(g2, data.t2, "t2-style", "t2-point", "t2");
    svg.appendChild(g2);
    
    calculateAndSetCentroidCSS(svg, data);
  } else if (data.type === "shared-side") {
    drawSharedTriangles(svg, data);
    
    // For shared-side level 8, ABD and CBD split vertically
    svg.style.setProperty('--t1-tx', '0px');
    svg.style.setProperty('--t1-ty', '-22px');
    svg.style.setProperty('--t2-tx', '0px');
    svg.style.setProperty('--t2-ty', '22px');
  }
  
  svgContainer.appendChild(svg);
}

function calculateAndSetCentroidCSS(svg, data) {
  const points1 = data.t1.points;
  const points2 = data.t2.points;
  
  const c1 = [
    (points1[0][0] + points1[1][0] + points1[2][0]) / 3,
    (points1[0][1] + points1[1][1] + points1[2][1]) / 3
  ];
  const c2 = [
    (points2[0][0] + points2[1][0] + points2[2][0]) / 3,
    (points2[0][1] + points2[1][1] + points2[2][1]) / 3
  ];
  
  const center = [160, 85];
  
  const tx1 = center[0] - c1[0];
  const ty1 = center[1] - c1[1];
  const tx2 = center[0] - c2[0];
  const ty2 = center[1] - c2[1];
  
  svg.style.setProperty('--t1-tx', `${tx1}px`);
  svg.style.setProperty('--t1-ty', `${ty1}px`);
  svg.style.setProperty('--t2-tx', `${tx2}px`);
  svg.style.setProperty('--t2-ty', `${ty2}px`);
  svg.style.setProperty('--t2-cx', `${c2[0]}px`);
  svg.style.setProperty('--t2-cy', `${c2[1]}px`);
  
  // For Level 5 (reflected):
  if (currentLevelIndex === 4) {
    svg.style.setProperty('--t2-extra-transform', 'scaleX(-1)');
  }
}

// Draw single triangle with labels, ticks, arcs AND interactive overlays
function drawSingleTriangle(svg, t, triClass, pointClass, triId) {
  const points = t.points;
  
  // Calculate centroid
  const centroid = [
    (points[0][0] + points[1][0] + points[2][0]) / 3,
    (points[0][1] + points[1][1] + points[2][1]) / 3
  ];
  
  // 1. Draw polygon (triangle fill & stroke)
  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  polygon.setAttribute("points", points.map(p => p.join(",")).join(" "));
  polygon.setAttribute("class", `svg-triangle ${triClass}`);
  polygon.setAttribute("id", `poly-${triId}`);
  svg.appendChild(polygon);
  
  // 2. Draw side marks (ticks/text)
  if (t.marks && t.marks.sides) {
    for (const key in t.marks.sides) {
      const val = t.marks.sides[key];
      const indices = key.split("-").map(Number);
      const p1 = points[indices[0]];
      const p2 = points[indices[1]];
      
      const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      
      // Normal vector pointing outward
      const px = -uy;
      const py = ux;
      let ox = mid[0] - centroid[0];
      let oy = mid[1] - centroid[1];
      const olen = Math.hypot(ox, oy);
      ox /= olen;
      oy /= olen;
      
      let nx = px;
      let ny = py;
      if (nx * ox + ny * oy < 0) {
        nx = -nx;
        ny = -ny;
      }
      
      if (typeof val === "number") {
        // Draw tick marks (hidden initially, shown when matched)
        const tickHalfLen = 5;
        const tickSpacing = 4;
        for (let k = 0; k < val; k++) {
          const shift = (k - (val - 1) / 2) * tickSpacing;
          const cx = mid[0] + shift * ux;
          const cy = mid[1] + shift * uy;
          
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", cx - tickHalfLen * nx);
          line.setAttribute("y1", cy - tickHalfLen * ny);
          line.setAttribute("x2", cx + tickHalfLen * nx);
          line.setAttribute("y2", cy + tickHalfLen * ny);
          line.setAttribute("class", "svg-side-mark");
          line.setAttribute("id", `mark-${triId}-side-${key}`);
          line.style.opacity = "0.55"; // Muted visible state
          svg.appendChild(line);
        }
      } else if (typeof val === "string") {
        // Draw side text label (hidden initially)
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", mid[0] + 15 * nx);
        text.setAttribute("y", mid[1] + 15 * ny);
        text.setAttribute("class", "svg-side-text");
        text.setAttribute("id", `text-${triId}-side-${key}`);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.textContent = val;
        text.style.opacity = "0.55";
        svg.appendChild(text);
      }
    }
  }
  
  // 3. Draw angle arcs & text
  if (t.marks && t.marks.angles) {
    for (const idxStr in t.marks.angles) {
      const idx = Number(idxStr);
      const V = points[idx];
      const prev = (idx + 2) % 3;
      const next = (idx + 1) % 3;
      
      const v1 = [points[prev][0] - V[0], points[prev][1] - V[1]];
      const v2 = [points[next][0] - V[0], points[next][1] - V[1]];
      
      const len1 = Math.hypot(v1[0], v1[1]);
      const len2 = Math.hypot(v2[0], v2[1]);
      const u1 = [v1[0] / len1, v1[1] / len1];
      const u2 = [v2[0] / len2, v2[1] / len2];
      
      let inwardX = centroid[0] - V[0];
      let inwardY = centroid[1] - V[1];
      const inwardLen = Math.hypot(inwardX, inwardY);
      inwardX /= inwardLen;
      inwardY /= inwardLen;
      
      const angleInfo = t.marks.angles[idxStr];
      
      if (angleInfo.arcs) {
        const cp = u1[0] * u2[1] - u1[1] * u2[0];
        const sweepFlag = cp > 0 ? 1 : 0;
        
        for (let k = 0; k < angleInfo.arcs; k++) {
          const r = 14 + k * 4;
          const start = [V[0] + r * u1[0], V[1] + r * u1[1]];
          const end = [V[0] + r * u2[0], V[1] + r * u2[1]];
          
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", `M ${start[0]} ${start[1]} A ${r} ${r} 0 0 ${sweepFlag} ${end[0]} ${end[1]}`);
          path.setAttribute("class", "svg-angle-arc");
          path.setAttribute("id", `mark-${triId}-angle-${idx}`);
          path.style.opacity = "0.55";
          svg.appendChild(path);
        }
      }
      
      if (angleInfo.text) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", V[0] + 28 * inwardX);
        text.setAttribute("y", V[1] + 28 * inwardY);
        text.setAttribute("class", "svg-angle-text");
        text.setAttribute("id", `text-${triId}-angle-${idx}`);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.textContent = angleInfo.text;
        text.style.opacity = "0.55";
        svg.appendChild(text);
      }
    }
  }
  
  // 4. Draw vertices points and labels
  points.forEach((p, i) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p[0]);
    circle.setAttribute("cy", p[1]);
    circle.setAttribute("class", `svg-vertex-point ${pointClass}`);
    svg.appendChild(circle);
    
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const offset = t.labelOffsets ? t.labelOffsets[i] : [0, 0];
    label.setAttribute("x", p[0] + offset[0]);
    label.setAttribute("y", p[1] + offset[1]);
    label.setAttribute("class", "svg-vertex-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.textContent = t.labels[i];
    svg.appendChild(label);
  });

  // 5. Draw transparent clickable overlay layers
  // Overlays for sides
  points.forEach((p, i) => {
    const next = (i + 1) % 3;
    const p1 = points[i];
    const p2 = points[next];
    
    const sideKey = `side-${i}-${next}`;
    
    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "line");
    overlay.setAttribute("x1", p1[0]);
    overlay.setAttribute("y1", p1[1]);
    overlay.setAttribute("x2", p2[0]);
    overlay.setAttribute("y2", p2[1]);
    overlay.setAttribute("class", "svg-overlay-line");
    overlay.setAttribute("id", `overlay-${triId}-${sideKey}`);
    overlay.addEventListener("click", () => handleInteractiveClick(triId, "side", sideKey, overlay));
    svg.appendChild(overlay);
  });

  // Overlays for angles
  points.forEach((p, i) => {
    const angleKey = `angle-${i}`;
    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    overlay.setAttribute("cx", p[0]);
    overlay.setAttribute("cy", p[1]);
    overlay.setAttribute("r", "20");
    overlay.setAttribute("class", "svg-overlay-angle");
    overlay.setAttribute("id", `overlay-${triId}-${angleKey}`);
    overlay.addEventListener("click", () => handleInteractiveClick(triId, "angle", angleKey, overlay));
    svg.appendChild(overlay);
  });
}

// Draw shared-side figure with interactive overlays (grouped for split animations)
function drawSharedTriangles(svg, data) {
  const points = data.points;
  
  const g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g1.setAttribute("id", "g-t1");
  g1.setAttribute("class", "svg-group");
  svg.appendChild(g1);
  
  const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g2.setAttribute("id", "g-t2");
  g2.setAttribute("class", "svg-group");
  svg.appendChild(g2);
  
  // ABD (0, 1, 3) and CBD (2, 1, 3)
  const t1Points = [points[0], points[1], points[3]];
  const t2Points = [points[2], points[1], points[3]];
  
  const c1 = [
    (points[0][0] + points[1][0] + points[3][0]) / 3,
    (points[0][1] + points[1][1] + points[3][1]) / 3
  ];
  const c2 = [
    (points[2][0] + points[1][0] + points[3][0]) / 3,
    (points[2][1] + points[1][1] + points[3][1]) / 3
  ];
  
  // Polygons
  const poly1 = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  poly1.setAttribute("points", t1Points.map(p => p.join(",")).join(" "));
  poly1.setAttribute("class", "svg-triangle t1-style");
  poly1.setAttribute("id", "poly-t1");
  g1.appendChild(poly1);
  
  const poly2 = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  poly2.setAttribute("points", t2Points.map(p => p.join(",")).join(" "));
  poly2.setAttribute("class", "svg-triangle t2-style");
  poly2.setAttribute("id", "poly-t2");
  g2.appendChild(poly2);
  
  // Ticks
  if (data.marks && data.marks.sides) {
    for (const key in data.marks.sides) {
      const val = data.marks.sides[key];
      const indices = key.split("-").map(Number);
      const p1 = points[indices[0]];
      const p2 = points[indices[1]];
      
      const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      
      const centroid = (indices.includes(0)) ? c1 : c2;
      const targetGroup = (indices.includes(0)) ? g1 : g2;
      const triId = (indices.includes(0)) ? "t1" : "t2";
      
      const px = -uy;
      const py = ux;
      let ox = mid[0] - centroid[0];
      let oy = mid[1] - centroid[1];
      const olen = Math.hypot(ox, oy);
      ox /= olen;
      oy /= olen;
      
      let nx = px;
      let ny = py;
      if (nx * ox + ny * oy < 0) {
        nx = -nx;
        ny = -ny;
      }
      
      const tickSpacing = 4;
      for (let k = 0; k < val; k++) {
        const shift = (k - (val - 1) / 2) * tickSpacing;
        const cx = mid[0] + shift * ux;
        const cy = mid[1] + shift * uy;
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", cx - 5 * nx);
        line.setAttribute("y1", cy - 5 * ny);
        line.setAttribute("x2", cx + 5 * nx);
        line.setAttribute("y2", cy + 5 * ny);
        line.setAttribute("class", "svg-side-mark");
        line.setAttribute("id", `mark-${triId}-side-${key}`);
        line.style.opacity = "0.55";
        targetGroup.appendChild(line);
      }
    }
  }
  
  // Vertices helper
  const drawVertex = (idx, labelText, targetGroup, pointClass) => {
    const p = points[idx];
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p[0]);
    circle.setAttribute("cy", p[1]);
    circle.setAttribute("class", `svg-vertex-point ${pointClass}`);
    targetGroup.appendChild(circle);
    
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const offset = data.labelOffsets ? data.labelOffsets[idx] : [0, 0];
    label.setAttribute("x", p[0] + offset[0]);
    label.setAttribute("y", p[1] + offset[1]);
    label.setAttribute("class", "svg-vertex-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.textContent = labelText;
    targetGroup.appendChild(label);
  };
  
  // Draw T1 vertices in g1
  drawVertex(0, data.labels[0], g1, "t1-point");
  drawVertex(1, data.labels[1], g1, "t1-point");
  drawVertex(3, data.labels[3], g1, "t1-point");
  
  // Draw T2 vertices in g2
  drawVertex(2, data.labels[2], g2, "t2-point");
  drawVertex(1, data.labels[1], g2, "t2-point");
  drawVertex(3, data.labels[3], g2, "t2-point");

  // Interactive Overlays
  const addSideOverlay = (p1Idx, p2Idx, key, triId, targetGroup) => {
    const p1 = points[p1Idx];
    const p2 = points[p2Idx];
    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "line");
    overlay.setAttribute("x1", p1[0]);
    overlay.setAttribute("y1", p1[1]);
    overlay.setAttribute("x2", p2[0]);
    overlay.setAttribute("y2", p2[1]);
    overlay.setAttribute("class", "svg-overlay-line");
    overlay.setAttribute("id", `overlay-${triId}-${key}`);
    overlay.addEventListener("click", () => handleInteractiveClick(triId, "side", key, overlay));
    targetGroup.appendChild(overlay);
  };

  // T1: ABD -> sides: AB(0-1), BD(1-3), AD(0-3)
  addSideOverlay(0, 1, "side-0-1", "t1", g1);
  addSideOverlay(0, 3, "side-0-3", "t1", g1);
  addSideOverlay(1, 3, "side-1-3", "t1", g1); // Shared side in T1

  // T2: CBD -> sides: CB(1-2), BD(1-3), CD(2-3)
  addSideOverlay(1, 2, "side-1-2", "t2", g2);
  addSideOverlay(2, 3, "side-2-3", "t2", g2);
  addSideOverlay(1, 3, "side-1-3", "t2", g2); // Shared side in T2
}

// Handle tactile marking clicks/taps
function handleInteractiveClick(tri, type, key, element) {
  if (gameState !== 'marking') return;
  
  // Check if this specific item is already matched
  if (element.classList.contains("matched")) return;

  const currentQuestion = QUESTIONS[currentLevelIndex];

  // Web Audio click feedback
  playClickSynth();

  if (tri === 't1') {
    // Select T1 element
    const container = svgContainer.querySelector(".triangle-svg");
    const allT1 = container.querySelectorAll(`[id^="overlay-t1-"]`);
    allT1.forEach(el => el.classList.remove("selected"));
    
    selectedT1Element = { type, key, element };
    element.classList.add("selected");
  } else {
    // Select T2 element
    const container = svgContainer.querySelector(".triangle-svg");
    const allT2 = container.querySelectorAll(`[id^="overlay-t2-"]`);
    allT2.forEach(el => el.classList.remove("selected"));
    
    selectedT2Element = { type, key, element };
    element.classList.add("selected");
  }

  // Special handler for shared side (e.g. BD in level 8)
  if (currentQuestion.triangleData.type === 'shared-side' && key === 'side-1-3') {
    // The shared side BD can be selected directly as a match!
    const partnerKey = 'side-1-3';
    const partnerTri = tri === 't1' ? 't2' : 't1';
    
    const pair = currentQuestion.markingPairs.find(p => p.t1 === 'side-1-3' && p.t2 === 'side-1-3');
    if (pair) {
      // Direct match!
      markPairAsMatched(pair, selectedT1Element || selectedT2Element, selectedT1Element || selectedT2Element);
      
      // Select overlays for both and mark matched
      const overlayT1 = document.getElementById("overlay-t1-side-1-3");
      const overlayT2 = document.getElementById("overlay-t2-side-1-3");
      if (overlayT1) overlayT1.className.baseVal = "svg-overlay-line matched";
      if (overlayT2) overlayT2.className.baseVal = "svg-overlay-line matched";
      
      selectedT1Element = null;
      selectedT2Element = null;
      return;
    }
  }

  // If BOTH sides are selected, check for a match
  if (selectedT1Element && selectedT2Element) {
    // Verify if type matches (e.g. side with side, angle with angle)
    if (selectedT1Element.type !== selectedT2Element.type) {
      triggerSelectionMismatch();
      return;
    }

    // Find the pair in markingPairs
    const pair = currentQuestion.markingPairs.find(p => 
      (p.t1 === selectedT1Element.key && p.t2 === selectedT2Element.key)
    );

    if (pair) {
      // Match found!
      markPairAsMatched(pair, selectedT1Element, selectedT2Element);
    } else {
      // Incorrect match!
      triggerSelectionMismatch();
    }
  }
}

function playClickSynth() {
  if (isMuted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

function markPairAsMatched(pair, t1Object, t2Object) {
  // Visual glow and locked state
  t1Object.element.className.baseVal = `${t1Object.element.className.baseVal.split(" ")[0]} matched`;
  t2Object.element.className.baseVal = `${t2Object.element.className.baseVal.split(" ")[0]} matched`;

  t1Object.element.classList.remove("selected");
  t2Object.element.classList.remove("selected");

  // Highlight the actual SVG geometry markings (ticks, texts, arcs)
  highlightSVGMarkings(t1Object.key, t2Object.key, pair.type);

  matchedPairs.push(pair);

  // Play match sound
  playMatchSynth();

  // Reset selection
  selectedT1Element = null;
  selectedT2Element = null;

  const currentQuestion = QUESTIONS[currentLevelIndex];
  const remaining = currentQuestion.markingPairs.length - matchedPairs.length;

  const banner = document.getElementById("instruction-banner");

  if (remaining > 0) {
    banner.textContent = `מעולה! סומן: ${pair.label}. נשאר עוד ${remaining} זוגות לסמן.`;
  } else {
    // All marked! Play victory success sound and transition to quiz state
    banner.style.display = "none";
    gameState = 'quiz';
    playSound('success');
    
    // Render the quiz question/options
    renderOptions(currentQuestion);
  }
}

function playMatchSynth() {
  if (isMuted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Uplifting second note
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.2);
  } catch (e) {}
}

function highlightSVGMarkings(t1Key, t2Key, type) {
  const container = svgContainer.querySelector(".triangle-svg");
  
  if (type === "side") {
    // Highlight marks
    const sideId1 = t1Key.replace("side-", "");
    const sideId2 = t2Key.replace("side-", "");
    const marksT1 = container.querySelectorAll(`[id="mark-t1-side-${sideId1}"]`);
    const marksT2 = container.querySelectorAll(`[id="mark-t2-side-${sideId2}"]`);
    marksT1.forEach(m => { m.style.opacity = "1"; m.style.stroke = "var(--primary)"; m.style.strokeWidth = "3.5"; });
    marksT2.forEach(m => { m.style.opacity = "1"; m.style.stroke = "var(--secondary)"; m.style.strokeWidth = "3.5"; });

    // Highlight text labels if exist
    const textT1 = container.getElementById(`text-t1-side-${sideId1}`);
    const textT2 = container.getElementById(`text-t2-side-${sideId2}`);
    if (textT1) { textT1.style.opacity = "1"; textT1.classList.add("matched"); }
    if (textT2) { textT2.style.opacity = "1"; textT2.classList.add("matched"); }

  } else if (type === "angle") {
    // Highlight arcs
    const arcsT1 = container.querySelectorAll(`[id="mark-t1-angle-${t1Key.split("-")[1]}"]`);
    const arcsT2 = container.querySelectorAll(`[id="mark-t2-angle-${t2Key.split("-")[1]}"]`);
    arcsT1.forEach(a => { a.style.opacity = "1"; a.style.stroke = "var(--primary)"; a.style.strokeWidth = "2.5"; });
    arcsT2.forEach(a => { a.style.opacity = "1"; a.style.stroke = "var(--secondary)"; a.style.strokeWidth = "2.5"; });

    // Highlight angle texts if exist
    const textT1 = container.getElementById(`text-t1-angle-${t1Key.split("-")[1]}`);
    const textT2 = container.getElementById(`text-t2-angle-${t2Key.split("-")[1]}`);
    if (textT1) { textT1.style.opacity = "1"; textT1.classList.add("matched"); }
    if (textT2) { textT2.style.opacity = "1"; textT2.classList.add("matched"); }
  }
}

function triggerSelectionMismatch() {
  playSound('fail');
  
  // Shake container
  const app = document.querySelector(".app-container");
  app.classList.add("shake");
  setTimeout(() => app.classList.remove("shake"), 350);

  // Briefly color red
  if (selectedT1Element) selectedT1Element.element.classList.remove("selected");
  if (selectedT2Element) selectedT2Element.element.classList.remove("selected");

  selectedT1Element = null;
  selectedT2Element = null;

  const banner = document.getElementById("instruction-banner");
  banner.textContent = "אופס! הנתונים הללו אינם תואמים. נסה למצוא את הזוג המתאים.";
}

function renderOptions(questionData) {
  optionsContainer.innerHTML = "";
  
  if (questionData.type === "multiple-choice") {
    // Normal Multiple Choice
    questionData.options.forEach(option => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = option;
      btn.addEventListener("click", () => handleSelectOption(btn, option, questionData.answer));
      optionsContainer.appendChild(btn);
    });
  } else if (questionData.type === "proof-drag") {
    // Level 8 Proof Completion
    const table = document.createElement("table");
    table.className = "proof-table";
    
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th style="width: 15%">שלב</th>
        <th style="width: 40%">טענה</th>
        <th style="width: 45%">נימוק</th>
      </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement("tbody");
    questionData.proofSteps.forEach(step => {
      const tr = document.createElement("tr");
      
      const tdStep = document.createElement("td");
      tdStep.textContent = step.step;
      tr.appendChild(tdStep);
      
      const tdStatement = document.createElement("td");
      tdStatement.textContent = step.statement;
      tr.appendChild(tdStatement);
      
      const tdReason = document.createElement("td");
      if (step.reason === "???") {
        const dropzone = document.createElement("div");
        dropzone.className = "proof-dropzone";
        dropzone.id = "proof-dropzone";
        dropzone.textContent = "לחץ כאן לבחירת נימוק";
        dropzone.addEventListener("click", handleDropzoneClick);
        tdReason.appendChild(dropzone);
      } else {
        tdReason.textContent = step.reason;
      }
      tr.appendChild(tdReason);
      
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    optionsContainer.appendChild(table);
    
    // Choices Title
    const choicesTitle = document.createElement("div");
    choicesTitle.style.fontSize = "0.9rem";
    choicesTitle.style.fontWeight = "600";
    choicesTitle.style.marginTop = "8px";
    choicesTitle.textContent = "בחר את הנימוק המתאים ביותר למבחן:";
    optionsContainer.appendChild(choicesTitle);
    
    // Draggable Choices Container
    const choicesContainer = document.createElement("div");
    choicesContainer.className = "proof-choices-container";
    
    questionData.options.forEach(opt => {
      const choice = document.createElement("div");
      choice.className = "proof-draggable-choice";
      choice.textContent = opt;
      choice.addEventListener("click", () => handleChoiceClick(choice, opt, questionData.answer));
      choicesContainer.appendChild(choice);
    });
    
    optionsContainer.appendChild(choicesContainer);
  }
}

function handleSelectOption(btn, selected, answer) {
  if (feedbackBox.style.display === "block") return;
  
  const allBtns = optionsContainer.querySelectorAll(".option-btn");
  allBtns.forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  
  selectedOption = selected;
  checkAnswer(selectedOption, answer, btn);
}

function handleDropzoneClick(e) {
  if (feedbackBox.style.display === "block") return;
  e.target.classList.add("dragover");
}

function handleChoiceClick(choiceBtn, text, answer) {
  if (feedbackBox.style.display === "block") return;
  
  const dropzone = document.getElementById("proof-dropzone");
  if (!dropzone) return;
  
  const allChoices = optionsContainer.querySelectorAll(".proof-draggable-choice");
  allChoices.forEach(c => c.classList.remove("used"));
  
  choiceBtn.classList.add("used");
  
  dropzone.textContent = text;
  dropzone.classList.remove("dragover");
  dropzone.classList.add("filled");
  
  checkAnswer(text, answer, dropzone);
}

function checkAnswer(selected, answer, element) {
  const isCorrect = selected === answer;
  const currentQuestion = QUESTIONS[currentLevelIndex];
  
  if (isCorrect) {
    streak++;
    score += (currentLevelIndex + 1) * 100 + streak * 20;
    playSound('success');
    
    if (element) {
      element.classList.add("correct");
    }
    
    feedbackTitle.className = "feedback-title correct-text";
    feedbackTitle.textContent = "🏆 כל הכבוד! תשובה נכונה!";
    feedbackExplanation.textContent = currentQuestion.explanation;
  } else {
    streak = 0;
    lives--;
    playSound('fail');
    
    const app = document.querySelector(".app-container");
    app.classList.add("shake");
    setTimeout(() => app.classList.remove("shake"), 350);
    
    if (element) {
      element.classList.add("wrong");
    }
    
    if (currentQuestion.type === "multiple-choice") {
      const allBtns = optionsContainer.querySelectorAll(".option-btn");
      allBtns.forEach(b => {
        if (b.textContent === answer) {
          b.classList.add("correct");
        }
      });
    }
    
    feedbackTitle.className = "feedback-title wrong-text";
    feedbackTitle.textContent = "❌ אופס! לא בדיוק...";

    // Get specific wrong-answer feedback if available, else use generic explanation
    const specFeedback = currentQuestion.wrongFeedback ? currentQuestion.wrongFeedback[selected] : null;
    if (specFeedback) {
      feedbackExplanation.innerHTML = `הקלקת על: <em>"${selected}"</em>.<br><br><span style="color: #fda4af;">💡 שיעור מהיר: ${specFeedback}</span><br><br>התשובה הנכונה היא: <strong>${answer}</strong>.`;
    } else {
      feedbackExplanation.innerHTML = `התשובה הנכונה היא: <strong>${answer}</strong>.<br><br>${currentQuestion.explanation}`;
    }
  }
  
  // Show feedback drawer
  feedbackBox.style.display = "block";
  feedbackBox.scrollIntoView({ behavior: 'smooth', block: 'end' });
  
  // Trigger geometric explanation animation
  triggerExplanationAnimation(isCorrect);
  
  // Disable options/interaction
  if (currentQuestion.type === "multiple-choice") {
    const allBtns = optionsContainer.querySelectorAll(".option-btn");
    allBtns.forEach(b => b.setAttribute("disabled", "true"));
  } else {
    const allChoices = optionsContainer.querySelectorAll(".proof-draggable-choice");
    allChoices.forEach(c => c.style.pointerEvents = "none");
    const dropzone = document.getElementById("proof-dropzone");
    if (dropzone) dropzone.style.pointerEvents = "none";
  }
  
  updateHeader();
  
  if (lives <= 0) {
    btnNextLevel.textContent = "ראה תוצאות";
  } else if (currentLevelIndex === QUESTIONS.length - 1) {
    btnNextLevel.textContent = "סיים משחק בהצלחה!";
  } else {
    btnNextLevel.textContent = "המשך לשער הבא ➔";
  }
}

function toggleMarkingHighlight(t1Key, t2Key, type, addClass) {
  const container = svgContainer.querySelector(".triangle-svg");
  if (!container) return;
  
  // Highlight the overlays
  const overlayT1 = container.getElementById(`overlay-t1-${t1Key}`);
  const overlayT2 = container.getElementById(`overlay-t2-${t2Key}`);
  if (overlayT1) overlayT1.classList.toggle("anim-highlight", addClass);
  if (overlayT2) overlayT2.classList.toggle("anim-highlight", addClass);
  
  const sideId1 = t1Key.replace("side-", "");
  const sideId2 = t2Key.replace("side-", "");
  
  if (type === "side") {
    // Highlight ticks
    const marksT1 = container.querySelectorAll(`[id="mark-t1-side-${sideId1}"]`);
    const marksT2 = container.querySelectorAll(`[id="mark-t2-side-${sideId2}"]`);
    marksT1.forEach(m => m.classList.toggle("anim-highlight-mark", addClass));
    marksT2.forEach(m => m.classList.toggle("anim-highlight-mark", addClass));
    
    // Highlight side texts
    const textT1 = container.getElementById(`text-t1-side-${sideId1}`);
    const textT2 = container.getElementById(`text-t2-side-${sideId2}`);
    if (textT1) textT1.classList.toggle("anim-highlight-mark", addClass);
    if (textT2) textT2.classList.toggle("anim-highlight-mark", addClass);
  } else if (type === "angle") {
    const idx1 = t1Key.split("-")[1];
    const idx2 = t2Key.split("-")[1];
    
    // Highlight arcs
    const arcsT1 = container.querySelectorAll(`[id="mark-t1-angle-${idx1}"]`);
    const arcsT2 = container.querySelectorAll(`[id="mark-t2-angle-${idx2}"]`);
    arcsT1.forEach(a => a.classList.toggle("anim-highlight-mark", addClass));
    arcsT2.forEach(a => a.classList.toggle("anim-highlight-mark", addClass));
    
    // Highlight angle texts
    const textT1 = container.getElementById(`text-t1-angle-${idx1}`);
    const textT2 = container.getElementById(`text-t2-angle-${idx2}`);
    if (textT1) textT1.classList.toggle("anim-highlight-mark", addClass);
    if (textT2) textT2.classList.toggle("anim-highlight-mark", addClass);
  }
}

function triggerExplanationAnimation(isCorrect) {
  const container = svgContainer.querySelector(".triangle-svg");
  if (!container) return;
  
  // Clear any existing explanation timeouts
  activeTimeouts.forEach(clearTimeout);
  activeTimeouts = [];
  
  // Reset any active animation classes
  container.classList.remove("congruence-active", "congruence-merged", "similarity-active");
  const allHighlights = container.querySelectorAll(".anim-highlight, .anim-highlight-mark");
  allHighlights.forEach(el => el.classList.remove("anim-highlight", "anim-highlight-mark"));
  
  // Force a reflow to restart CSS animations
  void container.offsetWidth;
  
  const currentQuestion = QUESTIONS[currentLevelIndex];
  const pairs = currentQuestion.markingPairs;
  
  // 1. Highlight each pair sequentially
  pairs.forEach((pair, idx) => {
    // Schedule start of highlight
    const startTimeout = setTimeout(() => {
      toggleMarkingHighlight(pair.t1, pair.t2, pair.type, true);
    }, idx * 1000);
    activeTimeouts.push(startTimeout);
    
    // Schedule end of highlight
    const endTimeout = setTimeout(() => {
      toggleMarkingHighlight(pair.t1, pair.t2, pair.type, false);
    }, idx * 1000 + 850);
    activeTimeouts.push(endTimeout);
  });
  
  // 2. Start the transition (merge or scale) after all pairs finished highlighting
  const transitionStartDelay = pairs.length * 1000;
  
  const transitionTimeout = setTimeout(() => {
    if (currentLevelIndex === 3) {
      // Gate 4: Similarity scaling animation (decoy)
      container.classList.add("similarity-active");
    } else {
      // Other gates: Congruence slide and merge animation
      container.classList.add("congruence-active");
      
      // Merge into green glowing shape after glide completes (1.2s)
      const subMergeTimeout = setTimeout(() => {
        if (container.classList.contains("congruence-active")) {
          container.classList.add("congruence-merged");
        }
      }, 1200);
      activeTimeouts.push(subMergeTimeout);
    }
  }, transitionStartDelay);
  activeTimeouts.push(transitionTimeout);
  
  // 3. Return to original layout after some time
  const totalDuration = transitionStartDelay + (currentLevelIndex === 3 ? 5500 : 3800);
  const resetTimeout = setTimeout(() => {
    container.classList.remove("congruence-merged", "congruence-active", "similarity-active");
  }, totalDuration);
  activeTimeouts.push(resetTimeout);
}

function nextLevel() {
  if (lives <= 0) {
    endGame(false);
  } else {
    currentLevelIndex++;
    if (currentLevelIndex >= QUESTIONS.length) {
      endGame(true);
    } else {
      loadLevel(currentLevelIndex);
    }
  }
}

function endGame(completed) {
  screenGame.classList.remove("active");
  screenEnd.classList.add("active");

  const banner = document.getElementById("instruction-banner");
  if (banner) banner.style.display = "none";
  
  const totalQuestions = QUESTIONS.length;
  const questionsAttempted = completed ? totalQuestions : currentLevelIndex + 1;
  const correctCount = completed ? totalQuestions - (3 - lives) : currentLevelIndex;
  
  const accuracy = questionsAttempted > 0 ? Math.round((correctCount / questionsAttempted) * 100) : 0;
  
  statAccuracy.textContent = `${accuracy}%`;
  statScore.textContent = score;
  statStreak.textContent = streak;
  
  if (completed) {
    playSound('victory');
    endTitle.textContent = "🎉 כל הכבוד! השלמת את האתגר!";
    
    if (lives === 3) {
      medalContainer.textContent = "👑";
      endTitle.innerHTML += "<br><span style='font-size: 1.1rem; color: var(--secondary); font-weight: normal;'>ציון מושלם! עמית, אתה גאון גאומטריה!</span>";
    } else if (lives === 2) {
      medalContainer.textContent = "🥇";
      endTitle.innerHTML += "<br><span style='font-size: 1.1rem; color: var(--secondary); font-weight: normal;'>ביצוע מצוין! כמעט מושלם!</span>";
    } else {
      medalContainer.textContent = "🥈";
      endTitle.innerHTML += "<br><span style='font-size: 1.1rem; color: var(--secondary); font-weight: normal;'>עבודה יפה! הצלחת לעבור את כל השערים!</span>";
    }
  } else {
    playSound('gameover');
    medalContainer.textContent = "❤️‍🩹";
    endTitle.textContent = "המשחק הסתיים! לא נשארו חיים";
    endTitle.innerHTML += `<br><span style='font-size: 1.1rem; color: var(--text-muted); font-weight: normal;'>עברת ${currentLevelIndex} שערים מתוך ${totalQuestions}. לא נורא, נסה שוב ותצליח!</span>`;
  }
}

// Audio Synthesizer via Web Audio API
function playSound(type) {
  if (isMuted) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    
    if (type === 'success') {
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.08);
        
        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.18);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } else if (type === 'fail') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.35);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'victory') {
      const now = ctx.currentTime;
      const freqs = [261.63, 261.63, 261.63, 392.00, 329.63, 523.25];
      const durs = [0.08, 0.08, 0.08, 0.15, 0.15, 0.4];
      const offsets = [0, 0.1, 0.2, 0.3, 0.48, 0.65];
      
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + offsets[i]);
        
        gain.gain.setValueAtTime(0.15, now + offsets[i]);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offsets[i] + durs[i]);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + offsets[i]);
        osc.stop(now + offsets[i] + durs[i]);
      });
    } else if (type === 'gameover') {
      const now = ctx.currentTime;
      const freqs = [329.63, 311.13, 293.66, 220.00];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.22);
        
        gain.gain.setValueAtTime(0.08, now + i * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 0.28);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.22);
        osc.stop(now + i * 0.22 + 0.3);
      });
    }
  } catch (e) {}
}

document.addEventListener("DOMContentLoaded", init);

