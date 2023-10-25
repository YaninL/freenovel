const fastNovel={initialize(){null!=document.body&&(this.setUiInterface(),this.setEventListener(),this.getNovelList(),this.getLastSelect())},cleanup:{'"?[!-/:-@\\[-`]{4,10}"?':"","[\\.`]{1,10}$":"","เล่มที่\\s?\\d+":""},digiName:!0,chapterList:[],currentUri:location.href,setEventListener(){const e=this,t=document.getElementById("chSidenav");document.querySelector(".closebtn").addEventListener("click",(e=>{t.style.width="0px"})),document.querySelector(".openbtn").addEventListener("click",(e=>{t.style.width="500px"})),document.getElementById("novellist").addEventListener("change",(t=>{e.loadChapterList(t.target.value)})),document.querySelector(".deletebtn").addEventListener("click",(t=>{const n=e.getValue("novellist"),a=document.getElementById("novellist").value;if(""==a)return;confirm("คุณแน่ใจว่าจะลบ?")&&(delete n[a],e.setValue("novellist",n),document.getElementById("chapterlist").innerHTML="",e.getNovelList())})),document.addEventListener("DOMNodeInserted",(()=>{const n=document.querySelector(".content h4.line-clamp-1")||!1,a=document.querySelector(".flex.items-start.gap-2")||!1,i=document.getElementById("addNovel")||!1,l=/novel\/(.*)/.exec(location.href),s=null!=l&&decodeURI(l[1]);n&&a&&0==i&&0!=s&&(a.insertAdjacentHTML("beforeend",`\n <a id="addNovel" href="javascript:void(0)" data-id="${s}">\n <div class="px-4 py-2 bg-yellow-300 rounded-md text-gray-800 font-medium" data-id="${s}">เพิ่มลงรายการโหลด</div></a>`),document.getElementById("addNovel").addEventListener("click",(function(){let a=e.getValue("novellist");1!=a.hasOwnProperty(s)&&(a=Object.assign({},a,{[s]:n.innerText})),e.setValue("novellist",a),e.getNovelList(),t.style.width="500px",document.getElementById("novellist").value=s,e.loadChapterList(s)})))})),document.querySelectorAll("#chapterlist").forEach((t=>{t.addEventListener("click",(async t=>{t.preventDefault();const n=t.target.dataset;if(void 0===n.chapterid)return;e.setStatus(n.title,!1);location.href;const a=await e.getContent(n.chapterid,n.title);if(0==a)return void e.setStatus("เกิดข้อผิดพลาดบางอย่าง");window.history.pushState({},null,t.target.href);const i=new Blob([a.text],{type:"text/plain;charset=utf-8"});saveAs(i,a.filename+".txt"),e.setStatus("สำเร็จ"),window.history.pushState({},null,e.currentUri)}))})),document.querySelector(".downallbtn").addEventListener("click",(async t=>{t.preventDefault();let n=prompt("เริ่มต้นดาวน์โหลดจากลำดับที่?",1);if(null==n)return;if(n=e.getNumber(n)-1,-1==n||n>e.chapterList.length)return;let a=prompt("สิ้นสุดดาวน์โหลดที่ลำดับที่?",e.chapterList.length);if(null==a)return;a=e.getNumber(a);const i=new zip.ZipWriter(new zip.BlobWriter("application/zip")),l=[];location.href;for(;n<a;n++){const t=e.chapterList[n];e.setStatus(t.title,!1);const a=await e.getContent(t.chapterid,t.title);if(0==a){e.setStatus("เกิดข้อผิดพลาดบางอย่าง");break}window.history.pushState({},null,t.uri),a.filename=-1==l.findIndex((e=>e==a.filename))?a.filename:`${a.filename}(${n})`,l.push(a.filename),await i.add(a.filename+".txt",new zip.TextReader(a.text)),await e.sleep(e.randomNumber(100,50)),window.history.pushState({},null,e.currentUri)}const s=this.getValue("novellist")[document.getElementById("novellist").value],o=await i.close(),r=`${filenamify(s,{replacement:"-"}).trim()} ${l[0]}-${l[l.length-1]}.zip`;saveAs(o,r),e.setStatus("สำเร็จ")}))},async getChapter(e,t){const n=await fetch(`//api.jinovel.com/v1/l/books/${e}/chapters?page=${t}`);return await n.json()},getNovelList(){const e=document.getElementById("novellist");e.innerHTML='<option value="">----</option>';const t=this.getValue("novellist");Object.entries(t).sort(((e,t)=>e[1].localeCompare(t[1]))).forEach((t=>{e.insertAdjacentHTML("beforeend",`<option value="${t[0]}">${t[1]}</option>`)}))},async loadChapterList(e){const t=document.getElementById("chapterlist");if(""==e||null==e)return;document.querySelector(".gotobtn").href="/novel/"+e,t.innerHTML="",this.setStatus("กำลังโหลดรายชื่อตอน",!1);let n=1,a=await this.getChapter(e,n),i=a.meta,l=a.data;for(;i.pages>n;)n++,a=await this.getChapter(e,n),i=a.meta,l=l.concat(a.data);this.chapterList=[];const s=l.length;l.reverse().forEach(((t,n)=>{this.chapterList.push({uri:`/novel/chapter/${t.id}`,title:t.name,novelid:e,chapterid:t.id,isfree:t.isFree,time:t.publishedAtText})}));const o=[];for(let e=0;e<s;e++){const n=this.chapterList[e],a=`<li><span class="nomor">${s-e}</span>\n <span class="namez"><a\n href="/novel/chapter/${n.chapterid}"\n data-idx="${s-e}" data-novelid="${n.novelid}" data-chapterid="${n.chapterid}"\n data-title="${n.title}">${0==n.isfree?"🪙":""} ${n.title}</a>\n </span>\n <span class="datez">${n.time}</span></li>`;e<20?t.insertAdjacentHTML("beforeend",a):o.push(a)}if(s>=20){t.insertAdjacentHTML("beforeend",'\n <li class="showall">แสดงทั้งหมด</li>');const e=document.querySelector(".showall");e.addEventListener("click",(n=>{e.style.display="none",t.insertAdjacentHTML("beforeend",o.join(""))}))}this.chapterList.reverse(),this.setValue("lastselect",e),this.setStatus("สำเร็จ")},async getContent(e,t){const n=!!localStorage.jinovel&&JSON.parse(localStorage.jinovel),a=n.auth&&null!=n.auth.accessToken?"Bearer "+n.auth.accessToken:"",i=await fetch(`//api.jinovel.com/v1/l/chapters/${e}/content`,{method:"GET",headers:{Accept:"application/json, text/plain, */*","Content-Type":"application/json",Authorization:a}});if(0==i.ok)return!1;const l=await i.json(),s=l.data.temporaryKey,o=sha256(null==s?n.auth.profile.core.id:s),r=o.substr(o.length-32,o.length-1),d=aesjs.utils.utf8.toBytes(r),c=new aesjs.ModeOfOperation.ecb(d).decrypt(this.base64ArrayBuffer(l.data.content)),p=aesjs.utils.utf8.fromBytes(c);document.getElementById("clipboard").innerHTML=p.replace(/[\u{0001}-\u{0010}]/gu,"");const h=document.querySelector("#clipboard").innerText;return{filename:this.digiName?this.getFilename(this.cleanupContent(t)):filenamify(t,{replacement:"-"}).trim(),text:this.cleanupContent(cleanup(t+"\n"+h)).replace(/\n/g,"\r\n\r\n")}},base64ArrayBuffer:e=>Uint8Array.from(atob(e),(e=>e.charCodeAt(0))),getLastSelect(){const e=this.getValue("lastselect");document.getElementById("novellist").value=e,this.loadChapterList(e)},getFilename(e){let t=(e,t)=>{let n=t.exec(e);return!!n&&(n[2]||n[1])},n=/ตอนพิเศษ/.test(e)?"ex":"",a=t(e=e.replace(/(ที่|พิเศษ|,)/g,""),/(ตอน|บท|ภารกิจ|chapter|ch|ep|arc|^)\s?(\d+)/i),i=t(e,/(เล่ม|ภาค|volume|vol)\s?(\d+)/i),l=t(e,/[\(\[]\s?(\d+)[\)\]/]|\d+[\.\-](\d+)/i);return a?(i=i?i+"-":"",l=l?"-"+l:"",n+i+this.padLeft(a)+l):/\d+/.test(e)?this.padLeft(e.match(/\d+/)):""==e?"filename":e.trim()},cleanupContent(e){let t=Object.entries(this.cleanup),n=e.replace(/\r/g,"").split("\n").filter(String),a=[];return n.forEach(((e,n)=>{e=e.trim(),t.forEach((t=>{e=e.replace(new RegExp(t[0],"g"),t[1])})),a.push(e.trim())})),a=a.filter(String),a[0]==a[1]&&a.splice(1,1),a.join("\n")},setStatus(e,t=!0){const n=document.querySelector(".statusz");e=" 📢 <span>"+e+"</span>",n.style.display="block",n.innerHTML=e,t&&setTimeout((()=>{n.style.display="none"}),1e3)},sleep:(e=500)=>new Promise((t=>setTimeout(t,e))),randomNumber:(e=1e3,t=0)=>parseInt(Math.random()*(e-t)+t),getNumber:e=>isNaN(parseInt(e.replace(/[^0-9. ]/g,"")))?0:parseInt(e.replace(/[^0-9. ]/g,"")),padLeft:(e,t=4)=>e.toString().padStart(t,"0"),setValue(e,t){GM_setValue(e,t)},getValue(e){return null==GM_getValue(e)&&this.setValue(e,""),GM_getValue(e)},setUiInterface(){document.body.insertAdjacentHTML("beforeend",'\n <div class="nav-chapter"><a href="javascript:void(0)" class="openbtn">🎐</a></div>\n <div id="chSidenav" class="sidenav chaplist" style="width: 0px;">\n <div class="toolbar">\n <a href="javascript:void(0)" class="sidenavbtn deletebtn" title="ลบนิยายเรื่องนี้ออก">🗑️</a>\n <a href="javascript:void(0)" class="sidenavbtn gotobtn" title="ไปยังหน้าเพจนิยายเรื่องนี้">🔗</a>\n <a href="javascript:void(0)" class="sidenavbtn downallbtn" title="โหลดนิยายรวมตอน">📦</a>\n <a href="javascript:void(0)" class="sidenavbtn closebtn" title="ปิดเมนูนี้">❌</a>\n <span class="sidenavbtn statusz"></span>\n </div>\n <select id="novellist" title="เลือกนิยาย"></select>\n <div class="chList">\n <ul id="chapterlist" class="chapx"></ul>\n </div>\n </div>\n <div id="clipboard" style="width:1px;height:1px;overflow:hidden"></div>'),GM_addStyle("\n .sidenav {\n background: #3b3c4c;\n box-shadow: 0 5px 20px rgba(0,0,0,.5);\n height: 100%;\n width: 0;\n position: fixed;\n z-index: 10000;\n top: 0;\n left: 0;\n overflow-x: hidden;\n display: block;\n transition: .1s;\n line-height: 22px;\n font-family: nunito;\n font-size: 16px;\n }\n .nav-chapter {\n background: none;\n box-shadow: none;\n z-index: 10000;\n position: fixed;\n bottom: 0;\n left: 0;\n font-size: 28px;\n color: #ddd;\n border-radius: 10px;\n margin: 10px;\n padding: 1px;\n display: inline-flex;\n overflow: hidden;\n text-shadow: 0 0 3px #517af5, 0 0 10px #9a9ae2\n }\n .toolbar {\n padding: 5px;\n position: relative;\n }\n .statusz {\n display: inline-block;\n text-overflow: ellipsis;\n width: 360px;\n white-space: nowrap;\n overflow: hidden;\n dispaly: none;\n }\n .chList {\n overflow-y: scroll;\n height: calc(100% - 75px);\n }\n .sidenav .sidenavbtn {\n font-size: 16px;\n padding: 4px;\n border-radius: 5px;\n background: #3b3c4cbd;\n color: #fff;\n float: left;\n }\n .sidenav .closebtn {\n float: right;\n }\n .sidenav select, input {\n width: 100%;\n height: 40px;\n font-family: nunito;\n font-size: 16px;\n outline: 0px none rgb(6, 147, 227);\n background: rgba(0, 0, 0, 0);\n margin: 0px;\n border-color: rgba(45, 45, 45, 0.3);\n border-style: solid;\n color: rgb(6, 147, 227);\n appearance: auto;\n }\n .sidenav #chapterlist a {\n color: #0693e3;\n }\n .sidenav #chapterlist a:hover {\n color: #af7be3;\n }\n .sidenav #chapterlist a:visited {\n color: #f77191;\n }\n .sidenav .chapx {\n padding: 0;\n list-style: none;\n margin: 1px;\n padding-inline-start: 5px;\n box-sizing: border-box;\n }\n .sidenav .chapx li {\n padding: 5px;\n border-bottom: dashed 2px #2f303e\n }\n .sidenav .chapx li .nomor {\n float: left;\n border-right: solid 2px #2f303e;\n padding-right: 5px;\n color: #ddd;\n }\n .sidenav .chapx li .namez {\n margin-left: 5px;\n display: inline-block;\n text-overflow: ellipsis;\n width: 350px;\n white-space: nowrap;\n overflow: hidden;\n }\n .sidenav .showall {\n text-align: center;\n cursor: pointer;\n color: rgb(6, 147, 227);\n }\n .sidenav .chapx li .datez {\n display: block;\n color: #888;\n float: right;\n font-size: 12px;\n }")}};fastNovel.initialize();