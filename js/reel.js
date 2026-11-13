"use strict";

/* Reel vòng quay mở hòm: phân bổ đều tỷ lệ, chống trùng lặp, hiệu ứng đỉnh cao */
const IW = 200, G = 12;
let busy = false, audio, soundOn = true, lastWinId = null;

const pool = () => dishes.filter(d => d.price <= +$("bud").value && (!$("veg").checked || d.veg));
const cardW = () => {
  const card = document.querySelector(".card");
  if (card && card.offsetWidth) {
    return card.offsetWidth;
  }
  if (innerWidth <= 480) return 140;
  if (innerWidth <= 768) return 160;
  return 200;
};

const cardHTML = (d, w) => {
  if (!d) {
    return `<div class="card mys">
      <div class="mys-glow"></div>
      <div class="q">?</div>
      <div class="nm">★ MÓN BÍ ẨN</div>
    </div>`;
  }
  const [color, tierName, glow] = rar(d.price);
  return `<div class="card" style="--c:${color};--glow:${glow}">
    ${media(d)}
    <span class="card-tier">${tierName}</span>
    <div class="nm">${d.name}</div>
  </div>`;
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* Thuật toán tạo dải thẻ: phân bổ đều tỷ lệ từng món, triệt tiêu đoạn lặp */
function buildReelStrip(p, N, W, win) {
  const M = p.length;
  if (M <= 1) return Array(N).fill(p[0] || null);

  const base = Math.floor(N / M);
  const rem = N % M;
  const quota = {};
  p.forEach(d => { quota[d.id] = base; });
  const shuffledPool = shuffle(p);
  for (let i = 0; i < rem; i++) {
    quota[shuffledPool[i].id]++;
  }

  quota[win.id]--;

  function attempt() {
    const bag = Object.assign({}, quota);
    const arr = Array(N).fill(null);
    arr[W] = win;

    const windowSlots = [W - 1, W + 1, W - 2, W + 2].filter(pos => pos >= 0 && pos < N);
    const usedInWindow = new Set([win.id]);

    for (const pos of windowSlots) {
      let choices = p.filter(d => !usedInWindow.has(d.id) && bag[d.id] > 0);
      if (!choices.length) choices = p.filter(d => bag[d.id] > 0 && d.id !== win.id);
      if (!choices.length) choices = p.filter(d => bag[d.id] > 0);
      if (!choices.length) return null;
      choices = shuffle(choices);
      choices.sort((a, b) => bag[b.id] - bag[a.id]);
      const chosen = choices[0];
      arr[pos] = chosen;
      bag[chosen.id]--;
      usedInWindow.add(chosen.id);
    }

    for (let i = 0; i < N; i++) {
      if (arr[i] !== null) continue;
      const prevId = (i > 0 && arr[i - 1]) ? arr[i - 1].id : null;
      const nextId = (i < N - 1 && arr[i + 1]) ? arr[i + 1].id : null;

      let candidates = p.filter(d => bag[d.id] > 0 && d.id !== prevId && d.id !== nextId);
      if (!candidates.length) candidates = p.filter(d => bag[d.id] > 0 && d.id !== prevId);
      if (!candidates.length) candidates = p.filter(d => bag[d.id] > 0);
      if (!candidates.length) return null;

      candidates = shuffle(candidates);
      candidates.sort((a, b) => bag[b.id] - bag[a.id]);
      const chosen = candidates[0];
      arr[i] = chosen;
      bag[chosen.id]--;
    }

    for (let i = 1; i < N; i++) {
      if (arr[i] && arr[i - 1] && arr[i].id === arr[i - 1].id) {
        return null;
      }
    }
    return arr;
  }

  for (let t = 0; t < 60; t++) {
    const res = attempt();
    if (res) return res;
  }

  const fallback = [];
  while (fallback.length < N) {
    const deck = shuffle(p);
    if (fallback.length && deck[0].id === fallback[fallback.length - 1].id && deck.length > 1) {
      const tmp = deck[0]; deck[0] = deck[1]; deck[1] = tmp;
    }
    fallback.push(...deck);
  }
  fallback[W] = win;
  return fallback.slice(0, N);
}

function idleStrip() {
  const s = $("strip");
  s.style.transition = "none";
  const p = pool();
  const source = p.length ? p : dishes;
  const shuffled = shuffle(source);
  const a = [];

  let idx = 0;
  for (let i = 0; i < 9; i++) {
    if (i === 4) {
      a.push(null);
    } else {
      let dish = shuffled[idx % shuffled.length];
      if (a.length > 0 && a[a.length - 1] && a[a.length - 1].id === dish.id && shuffled.length > 1) {
        dish = shuffled[(idx + 1) % shuffled.length];
        idx++;
      }
      a.push(dish);
      idx++;
    }
  }

  s.innerHTML = a.map(d => cardHTML(d)).join("");
  const w = cardW() + G;
  s.style.transform = `translateX(${-(4 * w + cardW() / 2 - $("reel").clientWidth / 2)}px)`;
}

function tick() {
  if (!soundOn) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = "sine";
    o.frequency.value = 850 + Math.random() * 100;
    g.gain.setValueAtTime(.06, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + .04);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + .04);
  } catch (e) {}
}

function playVictorySound() {
  if (!soundOn) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const startTime = audio.currentTime + idx * 0.11;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  } catch (e) {}
}

function launchConfetti() {
  const c = $("confettiCanvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  c.width = c.offsetWidth || 500;
  c.height = c.offsetHeight || 550;
  const colors = ["#f59e0b", "#ec4899", "#3b82f6", "#10b981", "#8b5cf6", "#f43f5e", "#ffd700"];
  const pieces = [];
  for (let i = 0; i < 75; i++) {
    pieces.push({
      x: c.width / 2,
      y: c.height / 2 - 20,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.85) * 15,
      size: Math.random() * 8 + 4,
      color: colors[Math.random() * colors.length | 0],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      opacity: 1
    });
  }
  const start = performance.now();
  function draw(now) {
    ctx.clearRect(0, 0, c.width, c.height);
    const elapsed = now - start;
    let alive = false;
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.38; // trọng lực
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;
      if (elapsed > 1100) p.opacity -= 0.025;
      if (p.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.75);
        ctx.restore();
      }
    });
    if (alive && elapsed < 2500) {
      requestAnimationFrame(draw);
    }
  }
  requestAnimationFrame(draw);
}

function spin() {
  if (busy) return;
  const p = pool();
  if (!p.length) {
    alert("Không có món nào hợp ngân sách/chế độ ăn này. Hãy tăng mức chi hoặc thêm món.");
    return;
  }
  busy = true;
  $("go").disabled = true;
  $("go").classList.add("is-spinning");
  $("go").querySelector(".go-text").textContent = "ĐANG MỞ HÒM...";
  if (audio && audio.state === "suspended") audio.resume();

  // Chọn món thắng ngẫu nhiên công bằng, hạn chế trùng ván vừa rồi
  let winPool = (p.length > 1 && lastWinId) ? p.filter(d => d.id !== lastWinId) : p;
  if (!winPool.length) winPool = p;
  const win = winPool[Math.random() * winPool.length | 0];
  lastWinId = win.id;

  const N = 60, W = 52, cw = cardW(), w = cw + G;
  const a = buildReelStrip(p, N, W, win);

  const s = $("strip");
  s.style.transition = "none";
  s.style.transform = "translateX(0)";
  s.innerHTML = a.map(d => cardHTML(d)).join("");
  s.offsetWidth;

  const rw = $("reel").clientWidth;
  const jit = (Math.random() - .5) * cw * .7;
  const end = -(W * w + cw / 2 - rw / 2 + jit);
  const T = 6500;

  s.style.transition = `transform ${T}ms cubic-bezier(.08,.6,.08,1)`;
  s.style.transform = `translateX(${end}px)`;

  let last = -1;
  const t0 = performance.now();
  (function loop() {
    const x = new DOMMatrix(getComputedStyle(s).transform).m41;
    const i = Math.floor((-x + rw / 2) / w);
    if (i !== last) {
      last = i;
      tick();
    }
    if (performance.now() - t0 < T + 100) requestAnimationFrame(loop);
  })();

  setTimeout(() => {
    if (s.children[W]) s.children[W].classList.add("win");
    finish(win);
  }, T + 120);
}

function finish(d) {
  let n = +(localStorage.getItem("hnag.n") || 0) + 1;
  try {
    localStorage.setItem("hnag.n", n);
  } catch (e) {}
  $("cnt").textContent = fmt(14985 + n).replace("đ", "");
  
  const [color, tierName] = rar(d.price);
  $("rpv").innerHTML = media(d);
  $("rpv").style.borderColor = color;
  $("rn").textContent = d.name;
  $("rp").textContent = "~ " + fmt(d.price) + " / suất";

  $("res").showModal();
  playVictorySound();
  launchConfetti();

  busy = false;
  $("go").disabled = false;
  $("go").classList.remove("is-spinning");
  $("go").querySelector(".go-text").textContent = "MỞ HÒM NGAY";
}

$("rc").onclick = () => { $("res").close(); idleStrip(); };
$("spinAgainBtn").onclick = () => {
  $("res").close();
  spin();
};
$("go").onclick = spin;
$("bud").onchange = $("veg").onchange = () => { if (!busy) idleStrip(); };
$("snd").onclick = e => {
  soundOn = !soundOn;
  e.currentTarget.setAttribute("aria-pressed", soundOn);
  const icon = e.currentTarget.querySelector(".snd-icon");
  const text = e.currentTarget.querySelector(".snd-text");
  if (icon) icon.textContent = soundOn ? "🔊" : "🔇";
  if (text) text.textContent = soundOn ? " Âm thanh bật" : " Âm thanh tắt";
  if (!icon && !text) e.currentTarget.textContent = soundOn ? "🔊 Âm thanh bật" : "🔇 Âm thanh tắt";
};
addEventListener("resize", () => { if (!busy) idleStrip(); });
