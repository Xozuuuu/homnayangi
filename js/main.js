"use strict";
$("cnt").textContent = (14985 + (+localStorage.getItem("hnag.n") || 0)).toLocaleString("vi-VN");
if (typeof Auth !== "undefined") {
  Auth.updateUI();
}
loadImgs().then(() => {
  renderGrid();
  idleStrip();
});
renderGrid();
idleStrip();
