"use strict";
/* reel */
const IW=200,G=12;let busy=false,audio,soundOn=true;
const pool=()=>dishes.filter(d=>d.price<=+$("bud").value&&(!$("veg").checked||d.veg));
const cardW=()=>innerWidth<=640?150:200;
const cardHTML=(d,w)=>d?`<div class="card" style="--c:${rar(d.price)[0]}">${media(d)}<div class="nm">${d.name}</div></div>`:`<div class="card mys"><div class="q">?</div><div class="nm">★ MÓN BÍ ẨN</div></div>`;
function idleStrip(){const s=$("strip");s.style.transition="none";const p=pool(),a=[];for(let i=0;i<9;i++)a.push(i===4?null:(p.length?p[i%p.length]:dishes[i%dishes.length]));
 s.innerHTML=a.map(d=>cardHTML(d)).join("");const w=cardW()+G;s.style.transform=`translateX(${-(4*w+cardW()/2-$("reel").clientWidth/2)}px)`}
function tick(){if(!soundOn)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=900;g.gain.setValueAtTime(.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.05);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.05)}catch(e){}}
function spin(){if(busy)return;const p=pool();if(!p.length){alert("Không có món nào hợp ngân sách/chế độ ăn này. Hãy tăng mức chi hoặc thêm món.");return}
 busy=true;$("go").disabled=true;if(audio&&audio.state==="suspended")audio.resume();
 const win=p[Math.random()*p.length|0],N=60,W=52,cw=cardW(),w=cw+G,a=[];
 for(let i=0;i<N;i++)a.push(i===W?win:p[Math.random()*p.length|0]);
 const s=$("strip");s.style.transition="none";s.style.transform="translateX(0)";s.innerHTML=a.map(d=>cardHTML(d)).join("");s.offsetWidth;
 const rw=$("reel").clientWidth,jit=(Math.random()-.5)*cw*.7,end=-(W*w+cw/2-rw/2+jit),T=6500;
 s.style.transition=`transform ${T}ms cubic-bezier(.08,.6,.08,1)`;s.style.transform=`translateX(${end}px)`;
 let last=-1;const t0=performance.now();(function loop(){const x=new DOMMatrix(getComputedStyle(s).transform).m41,i=Math.floor((-x+rw/2)/w);if(i!==last){last=i;tick()}if(performance.now()-t0<T+100)requestAnimationFrame(loop)})();
 setTimeout(()=>{s.children[W].classList.add("win");finish(win)},T+120)}
function finish(d){let n=+(localStorage.getItem("hnag.n")||0)+1;try{localStorage.setItem("hnag.n",n)}catch(e){}$("cnt").textContent=fmt(14985+n).replace("đ","");
 $("rpv").innerHTML=imgs[d.id]?`<img src="${imgs[d.id]}" alt="">`:(d.emoji||"🍽️");$("rn").textContent=d.name;$("rp").textContent="~ "+fmt(d.price)+" / suất";$("res").showModal();busy=false;$("go").disabled=false}
$("rc").onclick=()=>{$("res").close();idleStrip()};$("go").onclick=spin;$("bud").onchange=$("veg").onchange=()=>{if(!busy)idleStrip()};
$("snd").onclick=e=>{soundOn=!soundOn;e.currentTarget.setAttribute("aria-pressed",soundOn);e.currentTarget.textContent=soundOn?"🔊 Âm thanh bật":"🔇 Âm thanh tắt"};
addEventListener("resize",()=>{if(!busy)idleStrip()});
