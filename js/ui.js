"use strict";

/* Quản lý bộ lọc & trạng thái hiển thị lưới */
let currentFilter = "all";

function filterDishes() {
  return dishes.filter(d => {
    if (currentFilter === "u35") return d.price <= 35000;
    if (currentFilter === "u50") return d.price <= 50000;
    if (currentFilter === "u70") return d.price <= 70000;
    if (currentFilter === "veg") return d.veg;
    return true;
  });
}

function renderGrid() {
  const filtered = filterDishes();
  const isAdmin = Auth.isAdmin();
  const itemCountEl = $("itemCount");
  if (itemCountEl) {
    itemCountEl.textContent = `${filtered.length} / ${dishes.length} món`;
  }

  $("grid").innerHTML = filtered.map(d => {
    const [color, tierName, glow] = rar(d.price);
    const adminHint = isAdmin ? `<div class="admin-edit-badge" title="Quản trị viên: Bấm để sửa">✏️</div>` : "";
    return `<div class="it" tabindex="0" role="button" data-id="${d.id}" style="--c:${color};--glow:${glow}">
      ${media(d)}
      <span class="pr">${fmt(d.price)}</span>
      <span class="rar-tag">${tierName}</span>
      ${adminHint}
      <div class="nm">${d.veg ? "🌿 " : ""}${d.name}</div>
    </div>`;
  }).join("");
}

/* Xử lý tương tác lưới: Admin thì sửa, Khách thì xem chi tiết */
function handleCardClick(id) {
  if (Auth.isAdmin()) {
    edit(id);
  } else {
    viewDetail(id);
  }
}

$("grid").onclick = e => {
  const t = e.target.closest(".it");
  if (t) handleCardClick(t.dataset.id);
};

$("grid").onkeydown = e => {
  if (e.key === "Enter" || e.key === " ") {
    const t = e.target.closest(".it");
    if (t) {
      e.preventDefault();
      handleCardClick(t.dataset.id);
    }
  }
};

/* Bộ lọc danh mục nhanh (Filter chips) */
document.querySelectorAll(".chip").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderGrid();
  };
});

/* Dialog Chi tiết món ăn dành cho Khách (Chỉ xem) */
function viewDetail(id) {
  const d = dishes.find(x => x.id === id);
  if (!d) return;
  const [color, tierName] = rar(d.price);
  $("viewPv").innerHTML = media(d);
  $("viewName").textContent = d.name;
  $("viewPrice").textContent = fmt(d.price);
  $("viewBadge").textContent = tierName;
  $("viewBadge").style.borderColor = color;
  $("viewBadge").style.color = color;
  $("viewVeg").style.display = d.veg ? "inline-flex" : "none";
  $("viewDlg").showModal();
}

$("viewClose").onclick = () => $("viewDlg").close();
$("viewOk").onclick = () => $("viewDlg").close();

/* Dialog Sửa / Thêm món dành cho Quản trị viên */
let cur = null, pend = null, pendUrl = null;

function cleanupPend() {
  if (pendUrl) {
    URL.revokeObjectURL(pendUrl);
    pendUrl = null;
  }
  pend = null;
}

function pvShow() {
  if (!cur) return;
  const src = pendUrl || (cur.id && imgs[cur.id]) || cur.img;
  const fitRow = $("fitRow");
  if (src) {
    if (fitRow) fitRow.style.display = "flex";
    $("pv").innerHTML = media({ id: cur.id, fit: cur.fit, emoji: cur.emoji, img: src });
  } else {
    if (fitRow) fitRow.style.display = "none";
    $("pv").innerHTML = `<div class="em">${cur.emoji || "🍽️"}</div>`;
  }
}

function edit(id) {
  if (!Auth.isAdmin()) {
    alert("Chỉ Quản trị viên mới có quyền thêm/chỉnh sửa món ăn!");
    return;
  }
  const isNew = !id;
  cleanupPend();
  cur = isNew ? { id: "d" + Date.now(), name: "", price: 40000, emoji: "🍽️", veg: false, fit: "contain", _new: 1 } : dishes.find(x => x.id === id);
  if (!cur.fit) cur.fit = "contain";
  $("dlgTitle").textContent = isNew ? "Thêm món ăn mới" : "Chỉnh sửa món ăn";
  $("fn").value = cur.name;
  $("fp").value = cur.price;
  $("fe").value = cur.emoji || "";
  $("fv").checked = cur.veg;
  $("file").value = "";
  $("fd").style.display = isNew ? "none" : "";
  const fitRadio = document.querySelector(`input[name="fit"][value="${cur.fit}"]`);
  if (fitRadio) fitRadio.checked = true;
  pvShow();
  $("dlg").showModal();
}

document.querySelectorAll('input[name="fit"]').forEach(r => {
  r.onchange = () => {
    if (cur) {
      cur.fit = r.value;
      pvShow();
    }
  };
});

$("add").onclick = () => edit();
$("fc").onclick = () => { cleanupPend(); $("dlg").close(); };
$("dlgClose").onclick = () => { cleanupPend(); $("dlg").close(); };
$("dlg").onclose = () => { cleanupPend(); };

$("file").onchange = async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const blob = await shrink(f);
    if (pendUrl) URL.revokeObjectURL(pendUrl);
    pend = blob;
    pendUrl = URL.createObjectURL(blob);
    pvShow();
  } catch (x) {
    alert("Không đọc được ảnh này: " + (x.message || "Định dạng không hỗ trợ"));
  }
};

$("frm").onsubmit = async () => {
  if (!Auth.isAdmin()) {
    alert("Bạn không có quyền thực hiện thao tác này!");
    return;
  }
  const fitRadio = document.querySelector('input[name="fit"]:checked');
  Object.assign(cur, {
    name: $("fn").value.trim(),
    price: +$("fp").value || 0,
    emoji: $("fe").value || "🍽️",
    veg: $("fv").checked,
    fit: fitRadio ? fitRadio.value : (cur.fit || "contain")
  });
  if (cur._new) {
    delete cur._new;
    dishes.push(cur);
  }
  if (pend) {
    await idb;
    if (db) {
      await new Promise(r => {
        const q = tx("readwrite").put(pend, cur.id);
        q.onsuccess = q.onerror = r;
      });
      if (imgs[cur.id]) URL.revokeObjectURL(imgs[cur.id]);
      imgs[cur.id] = URL.createObjectURL(pend);
    }
    cleanupPend();
  }
  save();
  renderGrid();
  idleStrip();
  $("dlg").close();
};

$("fd").onclick = async () => {
  if (!Auth.isAdmin()) return;
  if (!confirm(`Bạn có chắc chắn muốn xóa món "${cur.name}"?`)) return;
  dishes = dishes.filter(x => x.id !== cur.id);
  if (db) tx("readwrite").delete(cur.id);
  if (imgs[cur.id]) {
    URL.revokeObjectURL(imgs[cur.id]);
    delete imgs[cur.id];
  }
  cleanupPend();
  save();
  renderGrid();
  idleStrip();
  $("dlg").close();
};

/* Quản lý Dialog Đăng nhập & Quyền Quản trị viên */
function openAdminDialog() {
  const isAdmin = Auth.isAdmin();
  $("pinError").style.display = "none";
  $("adminPinInput").value = "";
  if (isAdmin) {
    $("adminLoginSection").style.display = "none";
    $("adminManageSection").style.display = "block";
    $("newPinInput").value = "";
  } else {
    $("adminLoginSection").style.display = "block";
    $("adminManageSection").style.display = "none";
  }
  $("adminDlg").showModal();
}

$("roleBtn").onclick = openAdminDialog;
$("adminClose").onclick = () => $("adminDlg").close();
$("adminLoginCancel").onclick = () => $("adminDlg").close();
$("adminManageClose").onclick = () => $("adminDlg").close();

$("adminLoginSubmit").onclick = () => {
  const pin = $("adminPinInput").value.trim();
  if (Auth.login(pin)) {
    $("adminDlg").close();
    alert("🎉 Đăng nhập quyền Quản trị viên thành công!");
  } else {
    $("pinError").style.display = "block";
    $("adminPinInput").focus();
  }
};

$("adminPinInput").onkeydown = e => {
  if (e.key === "Enter") {
    e.preventDefault();
    $("adminLoginSubmit").click();
  }
};

$("adminLogoutBtn").onclick = () => {
  Auth.logout();
  $("adminDlg").close();
  alert("🔒 Đã chuyển về chế độ Khách.");
};

$("savePinBtn").onclick = () => {
  const newPin = $("newPinInput").value.trim();
  try {
    Auth.setPin(newPin);
    alert("✅ Đã đổi mã PIN thành công! Hãy ghi nhớ mã PIN mới này.");
    $("newPinInput").value = "";
  } catch (err) {
    alert(err.message);
  }
};
