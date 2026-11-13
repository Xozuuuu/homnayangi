"use strict";
/* ảnh: IndexedDB, nén về ~480px */
const imgs={};let db;
const idb=new Promise(r=>{try{const q=indexedDB.open("hnag",1);q.onupgradeneeded=()=>q.result.createObjectStore("img");q.onsuccess=()=>{db=q.result;r()};q.onerror=()=>r()}catch(e){r()}});
const tx=(m)=>db.transaction("img",m).objectStore("img");
async function loadImgs(){await idb;if(!db)return;await new Promise(r=>{const c=tx("readonly").openCursor();c.onsuccess=()=>{const k=c.result;if(k){imgs[k.key]=URL.createObjectURL(k.value);k.continue()}else r()};c.onerror=r})}
function shrink(file){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),i=new Image();i.onload=()=>{const W=480,H=480,c=document.createElement("canvas");c.width=W;c.height=H;
 const s=Math.max(W/i.width,H/i.height),w=i.width*s,h=i.height*s;c.getContext("2d").drawImage(i,(W-w)/2,(H-h)/2,w,h);URL.revokeObjectURL(u);c.toBlob(b=>b?ok(b):no(),"image/jpeg",.82)};i.onerror=no;i.src=u})}
const media=d=>imgs[d.id]?`<img src="${imgs[d.id]}" alt="" loading="lazy" decoding="async">`:`<div class="em">${d.emoji||"🍽️"}</div>`;
