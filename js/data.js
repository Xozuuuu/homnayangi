"use strict";
const DEF=[
["Bánh mì",25000,"🥖"],["Bún chả",50000,"🍜"],["Phở bò",55000,"🍜"],["Bún đậu mắm tôm",50000,"🍢"],
["Cơm rang dưa bò",45000,"🍚"],["Cơm tấm sườn",50000,"🍛"],["Bún riêu cua",45000,"🍲"],["Bánh cuốn",35000,"🥟"],
["Xôi gà",30000,"🍙"],["Cháo sườn",30000,"🥣"],["Bún bò Huế",55000,"🍜"],["Miến lươn",55000,"🍲"],
["Gà rán",70000,"🍗"],["Pizza",99000,"🍕"],["Cơm trộn Hàn Quốc",70000,"🍱"],["Lẩu mini",120000,"🍲"],
["Cơm chay đậu sốt cà",40000,"🍛",1],["Gỏi cuốn chay",30000,"🥗",1],["Bún chay",40000,"🍜",1],["Xôi đậu xanh",20000,"🍙",1]
].map((d,i)=>({id:"d"+i,name:d[0],price:d[1],emoji:d[2],veg:!!d[3]}));
let dishes; try{dishes=JSON.parse(localStorage.getItem("hnag.dishes"))}catch(e){}
if(!Array.isArray(dishes)||!dishes.length)dishes=DEF;
const save=()=>{try{localStorage.setItem("hnag.dishes",JSON.stringify(dishes))}catch(e){}};
const rar=p=>p<35000?["#6b7a90"]:p<50000?["#4b69ff"]:p<70000?["#8847ff"]:p<100000?["#d32ee6"]:["#eb4b4b"];
