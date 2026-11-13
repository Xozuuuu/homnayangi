"use strict";
$("cnt").textContent=(14985+(+localStorage.getItem("hnag.n")||0)).toLocaleString("vi-VN");
loadImgs().then(()=>{renderGrid();idleStrip()});renderGrid();idleStrip();
