(()=>{var o="กขคฆงจฉชซฑฒณดตถทธนบผพภมยรลวศษสหอ",c=(t,n,r)=>{for(let e=0;e<n.length;e++)t=t.replace(new RegExp(n[e],"g"),r[e]);return t};document.addEventListener("DOMNodeInserted",()=>{var e=document.querySelector(".text-gray-800.nuxt-link-active.cursor-default")||!1;const t=document.querySelector(".content:not(.flex)")||!1;var n=document.querySelector("#isdecode")||!1,r=/novel\/chapter\/.*/.test(window.location.pathname);console.log(r,5<t.childElementCount,n),r&&5<t.childElementCount&&0==n&&(t.insertAdjacentHTML("beforeend",'<em id="isdecode"></em>'),document.querySelectorAll(".content [class*=csprajad2]").forEach(e=>{e.innerHTML=c(e.innerHTML,"๠๳๦๫๹๽๯๰๢๴๧๸๪๻๭๿๡๲๤๶๨๺๬๾๱๣๥๷๩๼๮๵",o)}),document.querySelectorAll(".content [class*=csprajad1]").forEach(e=>{e.innerHTML=c(e.innerHTML,"๷๠๳๦๫๯๬๰๤๸๜๟๨๻๝๡๴๞๢๵๩๥๣๶๹๧๭๲๺๱๮๪",o)}),GM_setClipboard(e.innerText+"\r\n"+t.innerText),GM_notification({title:"แจ้งเตือน",text:"คัดลอก "+e.innerText+" แล้ว",timeout:1}))})})();
