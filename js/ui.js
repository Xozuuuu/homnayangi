"use strict";
/* lưới vật phẩm */
function renderGrid(){$("grid").innerHTML=dishes.map(d=>`<div class="it" tabindex="0" role="button" data-id="${d.id}" style="--c:${rar(d.price)[0]}">${media(d)}<span class="pr">${fmt(d.price)}</span><div class="nm">${d.veg?"🌿 ":""}${d.name}</div></div>`).join("")}
$("grid").onclick=e=>{const t=e.target.closest(".it");if(t)edit(t.dataset.id)};
$("grid").onkeydown=e=>{if(e.key==="Enter"||e.key===" "){const t=e.target.closest(".it");if(t){e.preventDefault();edit(t.dataset.id)}}};

/* dialog sửa/thêm */
let cur=null,pend=null;
function pvShow(){const d=cur;$("pv").innerHTML=pend?`<img src="${URL.createObjectURL(pend)}" alt="">`:(imgs[d.id]?`<img src="${imgs[d.id]}" alt="">`:(d.emoji||"🍽️"))}
function edit(id){const isNew=!id;cur=isNew?{id:"d"+Date.now(),name:"",price:40000,emoji:"🍽️",veg:false,_new:1}:dishes.find(x=>x.id===id);pend=null;
 $("fn").value=cur.name;$("fp").value=cur.price;$("fe").value=cur.emoji||"";$("fv").checked=cur.veg;$("file").value="";$("fd").style.display=isNew?"none":"";pvShow();$("dlg").showModal()}
$("add").onclick=()=>edit();$("fc").onclick=()=>$("dlg").close();
$("file").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{pend=await shrink(f);pvShow()}catch(x){alert("Không đọc được ảnh này.")}};
$("frm").onsubmit=async()=>{Object.assign(cur,{name:$("fn").value.trim(),price:+$("fp").value||0,emoji:$("fe").value||"🍽️",veg:$("fv").checked});
 if(cur._new){delete cur._new;dishes.push(cur)}
 if(pend){await idb;if(db){await new Promise(r=>{const q=tx("readwrite").put(pend,cur.id);q.onsuccess=q.onerror=r});if(imgs[cur.id])URL.revokeObjectURL(imgs[cur.id]);imgs[cur.id]=URL.createObjectURL(pend)}}
 save();renderGrid();idleStrip()};
$("fd").onclick=async()=>{if(!confirm("Xóa món này?"))return;dishes=dishes.filter(x=>x.id!==cur.id);if(db)tx("readwrite").delete(cur.id);delete imgs[cur.id];save();renderGrid();idleStrip();$("dlg").close()};
