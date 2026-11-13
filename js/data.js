"use strict";

const IMG_MAP = {
  "bánh mì": "img/banhmithit.webp",
  "bánh mì thịt": "img/banhmithit.webp",
  "bún chả": "img/buncha.jpg",
  "phở bò": "img/phobo.jpg",
  "bún đậu mắm tôm": "img/bundaumamtom.jpg",
  "cơm rang dưa bò": "img/comrangduabo.jpg",
  "cơm tấm sườn": "img/comtamsuon.png",
  "bún riêu cua": "img/bunrieucua.webp",
  "bánh cuốn": "img/banhcuon.jpg",
  "xôi gà": "img/xoiga.jpg",
  "cháo sườn": "img/chaosuon.jpg",
  "bún bò huế": "img/bunbohue.jpg",
  "miến lươn": "img/mienluon.jpg",
  "gà rán": "img/garan.jpg",
  "pizza": "img/pizza.avif",
  "bánh đa cua": "img/banhdacua.jpg",
  "gỏi cuốn tôm thịt": "img/goicuontomthit.jpg",
  "nem nướng nha trang": "img/nemnuongnhatrang.jpg"
};

const DEF = [
  ["Bánh mì thịt", 25000, "🥖", 0, "img/banhmithit.webp"],
  ["Bún chả", 50000, "🍜", 0, "img/buncha.jpg"],
  ["Phở bò", 55000, "🍜", 0, "img/phobo.jpg"],
  ["Bún đậu mắm tôm", 50000, "🍢", 0, "img/bundaumamtom.jpg"],
  ["Cơm rang dưa bò", 45000, "🍚", 0, "img/comrangduabo.jpg"],
  ["Cơm tấm sườn", 50000, "🍛", 0, "img/comtamsuon.png"],
  ["Bún riêu cua", 45000, "🍲", 0, "img/bunrieucua.webp"],
  ["Bánh cuốn", 35000, "🥟", 0, "img/banhcuon.jpg"],
  ["Xôi gà", 30000, "🍙", 0, "img/xoiga.jpg"],
  ["Cháo sườn", 30000, "🥣", 0, "img/chaosuon.jpg"],
  ["Bún bò Huế", 55000, "🍜", 0, "img/bunbohue.jpg"],
  ["Miến lươn", 55000, "🍲", 0, "img/mienluon.jpg"],
  ["Bánh đa cua", 45000, "🍲", 0, "img/banhdacua.jpg"],
  ["Gà rán", 70000, "🍗", 0, "img/garan.jpg"],
  ["Pizza", 99000, "🍕", 0, "img/pizza.avif"],
  ["Nem nướng Nha Trang", 60000, "🍢", 0, "img/nemnuongnhatrang.jpg"],
  ["Gỏi cuốn tôm thịt", 35000, "🥗", 0, "img/goicuontomthit.jpg"],
].map((d, i) => ({
  id: "d" + i,
  name: d[0],
  price: d[1],
  emoji: d[2],
  veg: !!d[3],
  img: d[4] || IMG_MAP[d[0].toLowerCase()] || "",
  fit: "contain"
}));

const REMOVED_NAMES = new Set([
  "cơm trộn hàn quốc",
  "lẩu mini",
  "cơm chay đậu sốt cà",
  "gỏi cuốn chay",
  "bún chay",
  "xôi đậu xanh"
]);

const DATA_VER = "2026.11.13.17";
let dishes;
try {
  dishes = JSON.parse(localStorage.getItem("hnag.dishes"));
} catch (e) { }

// Dọn dẹp triệt để các món đã xóa khỏi localStorage của trình duyệt
if (!Array.isArray(dishes) || !dishes.length || localStorage.getItem("hnag.ver") !== DATA_VER) {
  if (Array.isArray(dishes) && dishes.length) {
    dishes = dishes.filter(d => !REMOVED_NAMES.has((d.name || "").trim().toLowerCase()));
    if (!dishes.length) dishes = DEF;
  } else {
    dishes = DEF;
  }
  try {
    localStorage.setItem("hnag.ver", DATA_VER);
    localStorage.setItem("hnag.dishes", JSON.stringify(dishes));
  } catch (e) { }
}

// Tự động đồng bộ ảnh có sẵn từ thư mục img nếu món chưa có ảnh
dishes.forEach(d => {
  if (!d.img && IMG_MAP[(d.name || "").toLowerCase()]) {
    d.img = IMG_MAP[(d.name || "").toLowerCase()];
  }
  if (!d.fit) d.fit = "contain";
});

const save = () => {
  try {
    localStorage.setItem("hnag.dishes", JSON.stringify(dishes));
  } catch (e) { }
};

/* Phân loại độ hiếm & phân khúc giá (Gaming Rarity Tiers) */
const rar = p => {
  if (p < 35000) return ["#6b7a90", "Phổ thông", "rgba(107,122,144,0.3)"];
  if (p < 50000) return ["#3b82f6", "Đặc biệt", "rgba(59,130,246,0.3)"];
  if (p < 70000) return ["#a855f7", "Hiếm", "rgba(168,85,247,0.3)"];
  if (p < 100000) return ["#ec4899", "Thần thoại", "rgba(236,72,153,0.3)"];
  return ["#ef4444", "Huyền thoại", "rgba(239,68,68,0.3)"];
};
