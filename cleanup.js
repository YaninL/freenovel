/** global NumeralsToNumber */
const cleanupRegex = {
  // แทนที่สัญลักษณ์
  '[—–]': '-',
  '、': ',',
  '？': '?',
  '！': '!',
  '。': '.',
  ' ([!\\?\\.ๆ])': '$1',

  // แทนที่ทั่วๆ ไป
  '\'([^\']*)\'': '‘$1’',
  '‘\\s?': ' ‘',
  '\\s?’': '’ ',
  '[„“”]': '"',
  '"([^"]*)"': '“$1”',
  '“\\s?': ' “',
  '\\s?”': '” ',
  //'^ “': '“',
  //'” $': '”',
  ' , ': ',',
  '\\. ': '.',
  '(\\s{2}|&amp;#160;)': ' ',
  '\\( ': '(',
  ' \\)': ')',
  '\\s+': ' ',

  // remove Zero width space
  '[\u00A0|\u200B|\u200C|\u200D|\uFEFF|\u2028|\u2060]': '',

  // แก้แบนคำหยาบของธันวลาลัย
  'เ\\*\\*(ยน|้ยม|่ยว)': 'เหี$1', // เหียน, เหี้ยม, เหี่ยว
  '\\*\\*บ': 'หีบ',
  'ปา\\*\\*': 'ปาหี่',

  // แก้อักษรที่ผิดเวลาพิมพ์
  '(\u0E4D\u0E32|\\s\u0E33)': '\u0E33', // แก้ไขสระอำ
  '([\u0E48-\u0E4B])[\u0E48-\u0E4B]{1,}': '$1', // แก้ไขวรรณยุคซ้ำ
  '([\u0E31\u0E34-\u0E39])[\u0E31\u0E34-\u0E39]{1,}': '$1', // แก้ไขสระซ้ำ
  '([\u0E47-\u0E4C])([\u0E31\u0E34-\u0E39])': '$2$1',  // แก้ไขสระสลับตำแหน่ง

  // อื่นๆ
}

const cleanupRegexTitle = {
  //'(บทที่|ตอนที่)\\s?\\d+ : (\\d+)': '$1 $2',
  '(บทที่|ตอนที่)\\s?\\d+ :?\\s?(บทที่|ตอนที่|Chapter|Ch)\\s?:?\\s?(\\d+)': '$2 $3',
  '(บทที่|ตอนที่)(\\d+)': '$1 $2',
  '\\(.*?ฟรี.*?\\)': '',
  '\\(?rewrite\\)?.*$': '',
  '\\(?รีไรท์\\)?': '',
  //'(บทที่|ตอนที่ \\d+)\\s?(-|–)': '$1'
}

const compose = (...fns) => fns
  .reduceRight((f, g) => (...args) => f(g(...args)))

const splitText = text => text
  .replace(/\r/g, '')
  .split('\n')
  .map(e => e.trim())
  .filter(String)

const joinText = text => text
  .filter(String)
  .map(e => e.trim())
  .join('\n')

const removeSourceUri = text => {
  if (text[0].indexOf('http') != -1) text.splice(0, 1)
  return text
}

const removeDupicateTitle = text => {
  const title = text.map(line => line.replace(/[\-:\s]/g, ''))
  for(let loop = 1; loop < 10; loop++) {
    if (title[0] == title[loop]) text[loop] = ''
  }
  if (title[0] == `${title[1]}${title[2]}`) text.splice(1, 2)
  return text
}

const regexTitleClean = text => {
  const regex = Object.entries(cleanupRegexTitle)
  for (let regidx in regex) {
    text[0] = text[0]
      .replace(new RegExp(regex[regidx][0], 'ig'), regex[regidx][1])
      .trim()
  }
  return text
}

const titleNumerals = text => {
  if (/[๐-๙〇-９拾-玖京-零]/g.test(text[0])) {
    text[0] = new NumeralsToNumber(text[0]).toArabicString()
  }
  return text
}

const regexClean = text => {
  const regex = Object.entries(cleanupRegex)
  for (let idx in text) {
    for (let regidx in regex) {
      text[idx] = text[idx]
        .replace(new RegExp(regex[regidx][0], 'ig'), regex[regidx][1])
        .trim()
    }
  }
  return text.filter(String)
}

const cleanup = (textContent) => {
  if (typeof textContent !== 'string') {
    throw new Error('Error: Input is not string')
  }
  if (splitText(textContent).length < 1) {
    throw new Error('Error: Minimum text input required')
  }
  return compose(
    splitText,
    removeSourceUri,
    titleNumerals,
    regexTitleClean,
    regexClean,
    removeDupicateTitle,
    joinText
  )(textContent)
}
