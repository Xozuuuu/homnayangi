"use strict";
/* Xử lý ảnh: IndexedDB, tự động khớp khung, khử răng cưa và chống mờ */
const imgs = {};
let db;
const idb = new Promise(r => {
  try {
    const q = indexedDB.open("hnag", 1);
    q.onupgradeneeded = () => q.result.createObjectStore("img");
    q.onsuccess = () => { db = q.result; r(); };
    q.onerror = () => r();
  } catch (e) {
    r();
  }
});

const tx = m => db.transaction("img", m).objectStore("img");

async function loadImgs() {
  await idb;
  if (!db) return;
  await new Promise(r => {
    const c = tx("readonly").openCursor();
    c.onsuccess = () => {
      const k = c.result;
      if (k) {
        imgs[k.key] = URL.createObjectURL(k.value);
        k.continue();
      } else {
        r();
      }
    };
    c.onerror = r;
  });
}

function shrink(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      reject(new Error("Tệp không phải là ảnh hợp lệ"));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        if (!origW || !origH) {
          URL.revokeObjectURL(url);
          reject(new Error("Không lấy được kích thước ảnh"));
          return;
        }

        // Độ phân giải tối đa 1200px: sắc nét hoàn hảo trên màn hình Retina / 4K mà vẫn nhẹ
        const MAX_DIM = 1200;
        let targetW = origW;
        let targetH = origH;

        if (targetW > MAX_DIM || targetH > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / targetW, MAX_DIM / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        // Tạo canvas nguồn
        let curCanvas = document.createElement("canvas");
        curCanvas.width = origW;
        curCanvas.height = origH;
        let curCtx = curCanvas.getContext("2d");
        curCtx.drawImage(img, 0, 0);

        let curW = origW;
        let curH = origH;

        // Kỹ thuật step-down (chia đôi kích thước nhiều lần) để khử răng cưa và giữ nét khi thu nhỏ
        while (curW / 2 >= targetW && curH / 2 >= targetH) {
          const nextW = Math.floor(curW / 2);
          const nextH = Math.floor(curH / 2);
          const nextCanvas = document.createElement("canvas");
          nextCanvas.width = nextW;
          nextCanvas.height = nextH;
          const nextCtx = nextCanvas.getContext("2d");
          nextCtx.imageSmoothingEnabled = true;
          nextCtx.imageSmoothingQuality = "high";
          nextCtx.drawImage(curCanvas, 0, 0, nextW, nextH);
          curCanvas = nextCanvas;
          curW = nextW;
          curH = nextH;
        }

        // Vẽ vào canvas đích với tỷ lệ nguyên bản (KHÔNG crop xén góc ảnh)
        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = targetW;
        finalCanvas.height = targetH;
        const finalCtx = finalCanvas.getContext("2d");
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = "high";
        finalCtx.drawImage(curCanvas, 0, 0, targetW, targetH);

        URL.revokeObjectURL(url);

        // Xuất ra WebP chất lượng 0.92 (sắc nét, dung lượng thấp), fallback sang JPEG 0.92
        finalCanvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            finalCanvas.toBlob(b2 => b2 ? resolve(b2) : reject(new Error("Lỗi nén ảnh")), "image/jpeg", 0.92);
          }
        }, "image/webp", 0.92);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể đọc tệp ảnh"));
    };
    img.src = url;
  });
}

function media(d) {
  const src = (d && d.id && imgs[d.id]) || (d && d.img);
  if (!src) return `<div class="em">${(d && d.emoji) || "🍽️"}</div>`;
  const fitClass = (d && d.fit === "cover") ? "is-cover" : "is-contain";
  return `<div class="media-box ${fitClass}">
    <img class="img-bg" src="${src}" alt="" aria-hidden="true">
    <img class="img-fg" src="${src}" alt="" loading="lazy" decoding="async">
  </div>`;
}
