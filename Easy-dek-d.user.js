// ==UserScript==
// @name           Easy dek-d
// @version         0.2
// @description    ก๊อบเด็กดีแบบง่ายๆ
// @author          Sunsettia
// @namespace    http://buymeacoffee.com/sunsettia
// @require          https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @icon              https://writer.dek-d.com/favicon.ico
// @match           *writer.dek-d.com/*
// ==/UserScript==

/*global saveAs*/

const container = document.querySelector('#story-content') || false
if(container) {
  let novelcontent = container.innerHTML
  for (let i = 'ก'.charCodeAt() ; i <= 'ต'.charCodeAt() ; i++) {
    novelcontent = novelcontent.replace(new RegExp(String.fromCharCode(i + 100), 'g'), String.fromCharCode(i))
  }
  container.innerHTML = novelcontent
  const name = document.querySelector('.header-story-name') || false
  const title = document.querySelector('.chaptername') || false
  const content = document.querySelectorAll('#story-content p') || false
  const text = title.textContent.trim() + '\n\n' + [].slice.call(content).map(e => e.textContent.trim()).filter(String).join('\n\n')
  let filename = name.textContent.trim() + ' - ' + title.textContent.trim() + '.txt'
  let blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, filename)
}