const canvas = document.getElementById("water");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const feedBtn = document.getElementById("feedBtn");

// --------------------
// 画像
// --------------------
const duckImgs = [
  new Image(),
  new Image(),
  new Image(),
  new Image()
];

duckImgs[0].src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/イラスト104%204.png";
duckImgs[1].src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/イラスト104%203.png";
duckImgs[2].src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/イラスト104%202.png";
duckImgs[3].src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/イラスト105.png";

const duckOpenImg = new Image(); // 5枚目（口あけ）
duckOpenImg.src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/イラスト104.png";

const cookieImgs = [
  new Image(),
  new Image(),
  new Image(),
  new Image()
];

cookieImgs[0].src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/IMG_8342.png";
cookieImgs[1].src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/IMG_8339.png";
cookieImgs[2].src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/IMG_8341.png";
cookieImgs[3].src = "https://raw.githubusercontent.com/not404nekodesu040-ctrl/on-same-images/refs/heads/main/IMG_8340.png";

// --------------------
let w, h;
function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// --------------------
// 波
// --------------------
let wavePower = 0;
let waveDirection = 0;
let lastDragX = null;
let lastTime = null;

let baseTilt = 0;
let surfacePhase = 0;
let deepPhase = 0;

// --------------------
// アヒル
// --------------------
let duckX = 0;
let duckVX = 0;
let duckFloatPhase = 0;

let duckSize = 160;
const baseDuckSize = 160;
const maxDuckSize = 300;

// 表情制御
let frameIndex = 0;
let frameTimer = 0;
let mouthOpen = false;

// --------------------
// クッキー
// --------------------
const cookies = [];
let feeding = false;

// --------------------
// 傾き許可
// --------------------
function requestOrientationPermission() {
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    DeviceOrientationEvent.requestPermission().then((state) => {
      if (state === "granted") {
        window.addEventListener("deviceorientation", handleOrientation);
      }
    });
  } else {
    window.addEventListener("deviceorientation", handleOrientation);
  }

  startBtn.style.display = "none";
}

function handleOrientation(e) {
  baseTilt = (e.gamma || 0) / 45;

  // 強く左右に振るとリセット
  if (Math.abs(e.gamma) > 35) {
    duckSize -= 1.5;
    duckSize = Math.max(baseDuckSize, duckSize);
  }
}

startBtn.addEventListener("click", requestOrientationPermission);

// --------------------
// 餌ボタン
// --------------------
feedBtn.addEventListener("click", () => {
  feeding = true;
  mouthOpen = true;

  for (let i = 0; i < 5; i++) {
    cookies.push({
      x: Math.random() * w,
      y: -Math.random() * 200,
      vy: 2 + Math.random() * 2,
      imgIndex: Math.floor(Math.random() * cookieImgs.length)
    });
  }
});

// --------------------
// ドラッグ
// --------------------
canvas.addEventListener("pointerdown", (e) => {
  lastDragX = e.clientX;
  lastTime = performance.now();
});

canvas.addEventListener("pointermove", (e) => {
  if (lastDragX === null) return;

  const now = performance.now();
  const dx = e.clientX - lastDragX;
  const dt = now - lastTime || 1;

  const speed = Math.min(Math.abs(dx / dt), 1);
  wavePower += speed * 25;
  wavePower = Math.min(wavePower, 60);

  waveDirection = Math.sign(dx);

  lastDragX = e.clientX;
  lastTime = now;
});

canvas.addEventListener("pointerup", resetDrag);
canvas.addEventListener("pointerleave", resetDrag);

function resetDrag() {
  lastDragX = null;
  lastTime = null;
}

// --------------------
// 波描画
// --------------------
function drawWave({
  color,
  baseY,
  amplitude,
  frequency,
  phase,
  thickness,
  tiltStrength
}) {
  ctx.beginPath();

  for (let x = 0; x <= w; x++) {
    const slope = -baseTilt * tiltStrength * (x - w / 2);
    const y =
      baseY +
      slope +
      Math.sin(x * frequency + phase + waveDirection * 0.8) *
        amplitude *
        wavePower;

    if (x === 0) ctx.moveTo(x, y - thickness);
    ctx.lineTo(x, y - thickness);
  }

  ctx.lineTo(w, h);
  ctx.lineTo(0, h);

  ctx.closePath();
 
  
  const grad = ctx.createLinearGradient(0, baseY, 0, h);
  grad.addColorStop(0, "rgba(150,210,255,0.9)"); // 少し明るめ
  grad.addColorStop(1, "#4C77DB"); // 画面下ほど濃い青
  
  ctx.fillStyle = (phase === surfacePhase) ? grad : color;
  ctx.fill();
}

// --------------------
// アヒル描画
// --------------------
function drawDuck(surfaceBaseY) {
  duckVX += baseTilt * 0.6;
  duckVX *= 0.92;
  duckX += duckVX;

  duckX = Math.max(-w / 4, Math.min(w / 4, duckX));

  duckFloatPhase += 0.08 + wavePower * 0.01;
  const floatY = Math.sin(duckFloatPhase) * 6;

  frameTimer++;
  if (frameTimer > 12) {
    if (wavePower < 2) {
      // 🌊 波がほぼ無い → 1枚目と4枚目だけ
      frameIndex = frameIndex === 0 ? 3 : 0;
    } else {
      // 🌊 波がある → 1〜4枚目を順番
      frameIndex = (frameIndex + 1) % duckImgs.length;
    }
    frameTimer = 0;
  }

  const img = mouthOpen ? duckOpenImg : duckImgs[frameIndex];

  const x = w / 2 + duckX;
  const y = surfaceBaseY - 100 + floatY;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(duckVX * 0.01);
  ctx.drawImage(img, -duckSize / 2, -duckSize / 2, duckSize, duckSize);
  ctx.restore();
}

// --------------------
// クッキー描画
// --------------------
function drawCookies(surfaceBaseY) {
  for (let i = cookies.length - 1; i >= 0; i--) {
    const c = cookies[i];
    c.y += c.vy;

    const img = cookieImgs[c.imgIndex];
    ctx.drawImage(img, c.x - 20, c.y - 20, 40, 40);

    const duckY = surfaceBaseY + 25;

    if (
      Math.abs(c.x - (w / 2 + duckX)) < duckSize / 2 &&
      Math.abs(c.y - duckY) < duckSize / 2
    ) {
      duckSize = Math.min(maxDuckSize, duckSize + 8);
      cookies.splice(i, 1);
    }

    if (c.y > h + 50) {
      cookies.splice(i, 1);
    }
  }

  if (cookies.length === 0) {
    feeding = false;
    mouthOpen = false;
  }
}

// --------------------
// アニメーション
// --------------------
function animate() {
  ctx.clearRect(0, 0, w, h);

  const deepBaseY = h * 0.7;
  const surfaceBaseY = h * 0.6;

  drawWave({
    color: "#1e6fd9",
    baseY: deepBaseY,
    amplitude: 0.15,
    frequency: 0.015,
    phase: deepPhase,
    thickness: 80,
    tiltStrength: 0.15
  });

  drawWave({
    color: "rgba(150,210,255,0.9)",
    baseY: surfaceBaseY,
    amplitude: 0.25,
    frequency: 0.025,
    phase: surfacePhase,
    thickness: 140,
    tiltStrength: 0.25
  });

  drawDuck(surfaceBaseY);
  drawCookies(surfaceBaseY);

  surfacePhase += 0.05 + wavePower * 0.01;
  deepPhase += 0.02 + wavePower * 0.005;
  wavePower *= 0.97;

  requestAnimationFrame(animate);
}

animate();