const version = '0.1.1'
const newbookname = 'NewBook'; 
const compressionlevel = 9;

let ebook = {
  media: {},
  section: {},
  cover: {},
  bookinfo: {}
};

window.onbeforeunload = ()=>{return ''};

window.onload = ()=>{
  let data = atob(template);
  ebook.media = {};
  ebook.section = {};
  ebook.cover = {};
  ebook.bookinfo = {};
  ebook.bookinfo.filename = newbookname; 
  openbook(data);
};

newbook.onclick = ()=>{
  dispatchEvent(new Event('load'));
};

openfile.onclick = (e)=>{
  $('#epubfile')[0].click();
};

epubfile.onchange = (file)=>{
  let filename = file.target.files[0].name; 
  let extension = filename.split('.').pop();
  if(extension != 'epub'){
    alert('ไฟล์ที่เลือกไม่ใช่ไฟล์ epub');
    return;
  }
  ebook.media = {};
  ebook.section = {};
  ebook.cover = {};
  ebook.bookinfo = {};
  ebook.bookinfo.filename = filename.slice(0, -5); 
  openbook(file.target.files[0]);
};

let openbook = (data)=>{
  let zip = new JSZip();
  zip.loadAsync(data).then(async(zip)=>{
    let metainfxml = await zip.files['META-INF/container.xml'].async('text');
    setstatus('กำลังอ่านแฟ้ม packaging...', false);
    let metainf = $($.parseXML(metainfxml))
    let opffile = metainf.find('rootfile').attr('full-path');
    let opfpath = opffile.substring(0, opffile.lastIndexOf('/') + 1) || '';
    let opfxml = await zip.files[opffile].async('text');

    setstatus('กำลังอ่านแฟ้ม metadata...', false);
    let opf = $($.parseXML(opfxml));
    ebook.bookinfo.title = opf.find('dc\\:title').text();
    ebook.bookinfo.creator = opf.find('dc\\:creator').text();
    ebook.bookinfo.description = opf.find('dc\\:description').text();
    ebook.bookinfo.publisher = opf.find('dc\\:publisher').text();
    ebook.bookinfo.identifier = opf.find('dc\\:identifier').text();
    if(ebook.bookinfo.identifier.indexOf('urn:uuid:') == -1
      || ebook.bookinfo.identifier == 'urn:uuid:b16a9417-9ff8-4e1e-82e5-c591a1eae2e0'){
      let uudi = generateUUID();
      opf.find('dc\\:identifier').text(uudi);
      ebook.bookinfo.identifier = uudi;
    };
    let info = ebook.bookinfo;
    $('#filename').text(info.filename);
    $('#title').text(info.title == '' ? '-' : info.title);
    $('#creator').text(info.creator == '' ? ' - ' : info.creator);
    $('#description').text(info.description == '' ? '-' : info.description);
    $('#publisher').text(info.publisher == '' ? '-' : info.publisher);

    setstatus('กำลังอ่านรายการหนังสือ...', false);
    let tocid = opf.find('spine').attr('toc');
    let tochref = decodeURI(opf.find('item[id="' + tocid + '"]').attr('href'));
    let tocxml = await zip.files[opfpath + tochref].async('text');
    let toc = $($.parseXML(tocxml));
    let toclist = {};
    let navpoint = toc.find('navPoint');
    navpoint.each((idx, node)=>{
      let src = node.querySelector('content').attributes.src.value;
      toclist[filename(src)] = node.querySelector('navLabel text').textContent;
    });
    let spine = opf.find('itemref');
    spine.each(async(idx, node)=>{
      let idref = node.attributes.idref.value;
      let item = opf.find('item[id="' + idref + '"]');
      ebook.section[idx] = {
        id: idref,
        href: filename(decodeURI(item.attr('href'))),
        title: toclist[filename(item.attr('href'))] || ''
      };
    });

    setstatus('กำลังอ่านปกหนังสือ...', false);
    ebook.cover.imageid = opf.find('meta[name="cover"]').attr('content');
    ebook.cover.imagehref = opf.find('item[id="' + ebook.cover.imageid + '"]').attr('href');
    let coverhtml = opf.find('reference[type="cover"]').attr('href');
    ebook.cover.htmlid = opf.find('item[href="' + coverhtml + '"]').attr('id');
    ebook.cover.htmlhref = filename(coverhtml);
    let content = await zip.files[opfpath + ebook.cover.imagehref] || false;
    if(content == false){
      console.log('Cover file not found: ' + ebook.cover.imagehref);
      setstatus('ไม่พบไฟล์ปก ' + ebook.cover.imagehref);
      ebook.cover.imagehref = 'cover.jpg';
      // ถ้าไม่มีปกจะ error เพิ่มใหม่ก็ไม่ได้
    }else{
      content.async('arraybuffer').then((data)=>{
        let blob = new Blob([data]);
        let img = new Image;
        img.onload = (e)=>{
          ebook.cover.imagewidth = e.target.naturalWidth;
          ebook.cover.imageheight = e.target.naturalHeight;
        };
        img.src = URL.createObjectURL(blob);
        $('#cover').html(img);
      });
    };

    setstatus('กำลังอ่านแฟ้มมีเดีย...', false);
    let manifest = opf.find('item');
    manifest.each(async(idx, node)=>{
      let mediatype = node.attributes['media-type'].value;
      let href = decodeURI(node.attributes.href.value);
      if(node.id == tocid) return;
      let type = (mediatype == 'text/css' || mediatype == 'application/xhtml+xml'
        || mediatype == 'text/plain') ? 'text' : 'arraybuffer';
      let content = await zip.files[opfpath + href] || false;
      if(content == false){
        console.log('File not found: ' + href);
        setstatus('ไม่พบไฟล์ ' + href);
        return;
      };
      content.async(type).then((data)=>{
        data = (type == 'text') ? data.replace(/&#13;/ig, '') : data; //แก้ปัญหาตาบอย
        ebook.media[node.id] = {
          href: filename(href),
          mediatype: mediatype,
          content: data
        };
      });
    });
    createlist();
    setstatus('อ่านหนังสือแล้ว...');
    console.log(ebook);
    return ebook;
  })
  .catch((e)=>{
    console.log(e);
    alert('ไฟล์ที่เลือกไม่ใช่ไฟล์ epub หรือรูปแบบไฟล์ไม่ถูกต้อง');
  });
};

let createlist = ()=>{
  let sectionlist = '';
  let row = -1;
  $.each(ebook.section, (idx, node)=>{
    sectionlist += '<tr data-id="' + idx + '"><td>' + ((row < 0) ? '#': row) + '</td>';
    sectionlist += '<td class="sectionhref" data-id="' + ebook.section[idx].id + '" data-href="' + ebook.section[idx].href + '" contentEditable="true">' + ebook.section[idx].href + '</td>';
    sectionlist += '<td class="sectiontitle" contentEditable="true">' + ebook.section[idx].title + '</td>';
    let tools = (idx == 0) ? '' : '<i class="sectiondelete delete icon"></i>';
    sectionlist += '<td class="sectiontool"><i class="sectionedit file code icon"></i>' + tools + '</td><tr>';
      row++;
    });
  $('#sectionlist').html(sectionlist);
  //$('.sectionedit').popup({content: 'แก้ไข', position: 'top center'});
  //$('.sectiondelete').popup({content: 'ลบ', position: 'top center'});
  $('#sectionlist .sectionhref').each((idx, node)=>{
    node.addEventListener('focusout', (e)=>{
      let sectionid = e.target.parentNode.dataset.id;
      let newname = e.target.textContent;
      let oldid = e.target.dataset.id;
      let newid = 'x' + newname;
      if(oldid == newid) return;
      if(ebook.media.hasOwnProperty(newid)){
        e.target.textContent = e.target.dataset.href;
        alert('ไฟล์ชื่อ' + newname + 'มีอยู่แล้ว');
        return;
      };
      ebook.section[sectionid].href = newname;
      ebook.media[ebook.section[sectionid].id].href = newname;
      ebook.section[sectionid].id = newid;
      e.target.dataset.id = newid;
      delete Object.assign(ebook.media, {[newid]: ebook.media[oldid]})[oldid];
      if(sectionid == 0){
        ebook.cover.htmlhref = newname;
        ebook.cover.htmlid = newid;
      };
    });
  });
  $('#sectionlist .sectiontitle').each((idx, node)=>{
    node.addEventListener('focusout', (e)=>{
      let sectionid = e.target.parentNode.dataset.id;
      let mediaid = ebook.section[sectionid].id;
      let newtitle = e.target.textContent.replace(/<[^>]*>?/gm, '');
      ebook.section[sectionid].title = newtitle;
      ebook.media[mediaid].content = ebook.media[mediaid].content.replace(
        /<(h[1-6]).class="(.*)">.*<\/h[1-6]>/i,
        '<$1 class="$2">' + newtitle + '</$1>');
    });
  });
  $('#sectionlist .sectionedit').each((idx, node)=>{
    node.addEventListener('click', (e)=>{
      let sectionid = e.target.parentNode.parentNode.dataset.id;
      let mediaid = ebook.section[sectionid].id;
      let section = ebook.media[mediaid].content;
      let title = (ebook.section[sectionid].title == '') ? 'ไม่มีหัวเรื่อง' : ebook.section[sectionid].title;
      $('.overlay').dimmer('show');
      $('#editertitle').text(title);
      $('#editercontent')[0].value = section;
      $('#editercontent').attr('data-mediaid', ebook.section[sectionid].id);
      $('#editercontent').attr('data-sectionid', sectionid);
    });
  });
  $('#sectionlist .sectiondelete').each((idx, node)=>{
    node.addEventListener('click', (e)=>{
      //let deletesection = confirm('แน่ใจว่าจะลบ?');
      //if(deletesection){
        let sectionid = e.target.parentNode.parentNode.dataset.id;
        let mediaid = ebook.section[sectionid].id;
        delete ebook.section[sectionid];
        delete ebook.media[mediaid];
        createlist();
      //}
    });
  });
};

$('#filename, #title, #creator, #description, #publisher').each((idx, node)=>{
  node.addEventListener('focusout', (e)=>{
    let str = e.target.textContent.replace(/<[^>]*>?/gm, '');
    ebook.bookinfo[e.target.id] = str.replace(/^\s+|\s+$/gm,'');;
    if(str == ''){
      e.target.textContent = '-';
    };
  });
});

editercancle.onclick = (e)=>{
  $('.overlay').dimmer('hide');
};

editersave.onclick = (e)=>{
  let editer = $('#editercontent');
  let newtitle = /<h[1-6].class=".*">(.*)<\/h[1-6]>/i.exec(editer[0].value);
  newtitle = (newtitle) ? newtitle[1] : '***ไม่พบชื่อตอน***';
  ebook.media[editer.attr('data-mediaid')].content = editer[0].value;
  ebook.section[editer.attr('data-sectionid')].title = newtitle;
  createlist();
  $('.overlay').dimmer('hide');
};

savefile.onclick = async(e)=>{
  setstatus('กำลังสร้างไฟล์หนังสือ...', false);
  let book = new JSZip();
  await book.file('mimetype', 'application/epub+zip');
  await book.file('META-INF/container.xml', container);
  await book.file('OEBPS/content.opf', generateopf());
  await book.file('OEBPS/toc.ncx', generatencx());
  $.each(ebook.media, async(idx, e)=>{
    switch (e.mediatype) {
      case 'application/xhtml+xml':
      case 'text/html':
        await book.file('OEBPS/Text/' + e.href, e.content);
      break;
      case 'text/css':
        await book.file('OEBPS/Styles/' + e.href, e.content);
      break;
      break;        
      case 'application/vnd.ms-opentype':
      case 'application/x-font-ttf':
      case 'font/otf':
      case 'font/ttf':
        await book.file('OEBPS/Fonts/' + e.href, e.content, {binary: true});
      break;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        await book.file('OEBPS/Images/' + e.href, e.content, {binary: true});        
      break;
      case 'application/x-javascript':
      default:
        await book.file('OEBPS/Misc/' + e.href, e.content);
      break;
    };
  });
  await book.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: {level: compressionlevel}
  }, (e)=>{
    let file = e.currentFile ? filename(e.currentFile) : '';
    setstatus('กำลังสร้างไฟล์...' + e.percent.toFixed(2) + '% -> ' + file, false);
  }).then((blob)=>{
    setstatus('สร้างไฟล์หนังสือแล้ว...');
    saveAs(blob, ebook.bookinfo.filename + '.epub');
  });
};

let generateopf = ()=>{
  let info = ebook.bookinfo;
  let metadata = [];
  let manifest = [];
  let spine = [];
  metadata.push('<dc:title>' + info.title + '</dc:title>');
  metadata.push('<dc:creator>' + info.creator + '</dc:creator>');
  metadata.push('<dc:description>' + info.description + '</dc:description>');
  metadata.push('<dc:publisher>' + info.publisher + '</dc:publisher>');
  metadata.push('<dc:language>th</dc:language>');
  metadata.push('<dc:date opf:event="modification">' + new Date().toISOString() + '</dc:date>');
  metadata.push('<dc:identifier id="BookId" opf:scheme="UUID">' + info.identifier + '</dc:identifier>');
  metadata.push('<meta name="Generator" content="nekoEPUB v.' + version + '"/>');
  metadata.push('<meta name="Template" content="Ann"/>');
  metadata.push('<meta name="cover" content="' + ebook.cover.imageid + '"/>');
  manifest.push('<item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');
  $.each(ebook.media, (idx, media)=>{
    let href;
    switch (media.mediatype) {
      case 'application/xhtml+xml':
      case 'text/html':
        href = 'Text/' + media.href;
      break;
      case 'text/css':
        href = 'Styles/' + media.href;
      break;
      case 'application/vnd.ms-opentype':
      case 'application/x-font-ttf':
      case 'font/otf':
      case 'font/ttf':
        href = 'Fonts/' + media.href;
      break;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        href = 'Images/' + media.href;
      break;
      default:
        href = 'Misc/' + media.href;
      break;
    };
    manifest.push('<item id="' + idx + '" href="' + href + '" media-type="' + media.mediatype +'"/>');
  });
  $.each(ebook.section, (idx, section)=>{
    spine.push('<itemref idref="' + section.id + '"' +((idx == 0) ? ' linear="no"' : '') +'/>');
  });
  let guide = '<reference type="cover" title="หน้าปก" href="Text/' + ebook.cover.htmlhref + '"/>';
  return opftemplate.replace('{metadata}', metadata.join('\n')).replace('{manifest}', manifest.join('\n'))
    .replace('{spine}', spine.join('\n')).replace('{guide}', guide);
};

let generatencx = ()=>{
  let meta = [];
  let title = '<text>' + ebook.bookinfo.title + '</text>';
  let navmap = [];
  let playorder = 1;
  meta.push('<meta content="' + ebook.bookinfo.identifier + '" name="dtb:uid"/>');
  meta.push('<meta name="dtb:depth" content="3"/>');
	meta.push('<meta name="dtb:totalPageCount" content="0"/>');
	meta.push('<meta name="dtb:maxPageNumber" content="0"/>');
  $.each(ebook.section, (idx, point)=>{
    point.title = (point.title == '' && idx == 0) ? 'หน้าปก' : point.title;
    navmap.push('<navPoint id="navPoint-' + playorder + '" playOrder="' + playorder + '">');
    navmap.push('<navLabel>');
    navmap.push('<text>' + point.title.replace(/^\s+|\s+$/gm,'') + '</text>');
    navmap.push('</navLabel>');
    navmap.push('<content src="Text/' + point.href + '"/>');
    navmap.push('</navPoint>');
    playorder++;
  });
  return ncxtemplate.replace('{meta}', meta.join('\n')).replace('{title}', title)
    .replace('{navmap}', navmap.join('\n'));
};

$('#cover, #addcover').each((idx, node)=>{
  node.addEventListener('click', (e)=>{
    $('#coverfile')[0].click();
  });
});

coverfile.onchange = async(file)=>{
  let coverfile = file.target.files[0];
  let reader = await new Response(coverfile).arrayBuffer();
  if(coverfile.type != 'image/jpeg' && coverfile.type != 'image/png'){
    console.log(coverfile.type);
    alert('ไฟล์ปกจะต้องเป็นรูปภาพ jpg หรือ png เท่านั้น');
    return;
  }
  let blob = new Blob([reader], {type: coverfile.type});
  ebook.cover.mediatype = coverfile.type;
  ebook.media[ebook.cover.imageid].content = reader;
  let img = new Image;
  img.onload = async(e)=>{
    ebook.cover.imagewidth = e.target.naturalWidth;
    ebook.cover.imageheight = e.target.naturalHeight;
    ebook.media[ebook.cover.htmlid].content = htmlheader 
      + coverhtml.replace(/{width}/g, ebook.cover.imagewidth)
      .replace(/{height}/g, ebook.cover.imageheight)
      .replace(/{href}/g, filename(ebook.cover.imagehref))
      + htmlfooter;
  }
  img.src = URL.createObjectURL(blob);
  $('#cover').html(img);
  setstatus('เปลี่ยนปกหนังสือแล้ว...');
};

addfile.onclick = (e)=>{
  $('#mediafile').click();
};

mediafile.onchange = async(mediafiles)=>{
  setstatus('กำลังเพิ่มไฟล์...', false);
  await Object.keys(mediafiles.target.files).reduce(async(promise, idx)=>{
    await promise;
    let file = mediafiles.target.files[idx];
    let filename = file.name.replace(/\s/g, '-');
    let extension = fileextension(file.name);
    let media = {};
    let mediaid = '';
    let newsection = {};
    let addmedia = true;
    let addsection = false;
    let mediatype = (file.type == 'text/plain' && extension != 'txt') ? 'Unknow' : file.type;
    media.mediatype = file.type;
    switch(mediatype) {
      case 'text/plain':
        addsection = true;
        media.mediatype = 'application/xhtml+xml';
        media.href = filename.slice(0, -3) + 'xhtml';
        mediaid = 'x' + media.href;
        let content = await new Response(file).text();
        content = toHtmlEntities(content).replace(/\r/g, '').split('\n').filter(String);
        if(content[0].indexOf('http') != -1){
          content.splice(0, 1);
        };
        newsection = {
          id: mediaid,
          href: media.href,
          mediatype: media.mediatype,
          title: content[0].trim()
        };
        media.content = htmlheader;
        content.forEach((line, idx)=>{
          line = line.trim();
          if(line == '') return;
          if(idx == 0){
            media.content += '<h3 class="chapter_heading">' + line + '</h3>\n';
          }else{
            media.content += '<p class="p_normal">' + line + '</p>\n';
          };
        });
        media.content += htmlfooter;        
      break;
      case 'text/html':
      case 'application/xhtml+xml':
        addsection = true;
        media.href = filename;
        mediaid = 'x' + filename;
        media.content = await new Response(file).text();
        let newtitle = /<h[1-6].class=".*">(.*)<\/h[1-6]>/i.exec(media.content);
        newsection = {
          id: 'x' + filename,
          href: filename,
          mediatype: media.mediatype,
          title: newtitle[1]
        };
      break;
      case 'text/css':
      case 'application/x-javascript':
        addsection = false;
        mediaid = filename;
        media.href = filename;
        media.content = await new Response(file).text();
      break;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        mediaid = 'x' + filename;
        media.href = filename;
        media.content = await new Response(file).arrayBuffer();
      break;
      default:
        mediaid = filename;
        media.href = filename;
        media.content = await new Response(file).arrayBuffer();
        if(extension == 'ttf'){
          media.mediatype = 'application/x-font-ttf';
        }else if(extension == 'otf'){
          media.mediatype = 'application/vnd.ms-opentype';
        }else{
          addmedia = false;
          alert('ไฟล์ชื่อ ' + file.name + ' ไม่รองรับไม่สามารถเพิ่มได้');
          console.log('Unsupport filename:', filename, 'type:', mediatype);
        };
      break;
    };
    if(ebook.media.hasOwnProperty(mediaid)){
      alert('ไฟล์ชื่อ ' + file.name + ' นี้มีแล้วไม่สามารถเพิ่มได้');
    }else{
      if(addmedia){
        ebook.media[mediaid] = media;
      }
      if(addsection){
        let sectioncount = Object.keys(ebook.section).length;
        ebook.section[sectioncount] = newsection;
      }
    };
  }, Promise.resolve());
  setstatus('เพิ่มไฟล์แล้ว...');
  createlist();
};

let submenu = $('#tools .menu')[0];
let mainmenu = $('#tools')[0];
mainmenu.onmouseover = (e)=>{
  if ((mainmenu.contains(e.target))) {
    submenu.style.display = 'inline';
    submenu.style.marginTop = '0px';
  };
};

mainmenu.onmouseout = (e)=>{
  submenu.style.display = 'none';
};

let setstatus = (str, hide)=>{
  hide = (typeof hide !== 'undefined') ? hide : true;
  str = '<i class="exclamation circle icon"></i><span>' + str + '</span>';
  $('#status').show();
  $('#status').html(str);
  if(hide){
    setTimeout(()=>{
      $('#status').hide();
    }, 1000);
  }
};

let generateUUID = ()=>{
  return 'urn:uuid:' + ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
    c =>(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
};

let filename = (pathname)=>{
  return pathname.split('\\').pop().split('/').pop();
};

let fileextension = (pathname)=>{
  return pathname.split('.').pop();
};

let toHtmlEntities = (str)=>{
  return $("<textarea/>").text(str).html();
};
