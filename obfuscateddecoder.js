/*
Revision 1:
 - รุ่นแรกที่มีการถอดรหัสพื้นฐานและการแยกข้อมูลภาพปริศนา
 
Revision 2: 
 - เพิ่มการตรวจสอบความถูกต้องใน parseDimension และ getPuzzleImageData
 - ยกระดับประสิทธิภาพและความกระชับใน replaceEncodedKeywords
*/

const ObfuscatedDecoder = {
  deobfuscator (obfuscatedCode) {
    if (!obfuscatedCode) return null;
    const matches = obfuscatedCode.match(/eval\(function.*\}\('(.*?)',(\d+),(\d+),'(.*?)'.split/);
    if (!matches) return null;
    const [_, encodedCode, baseRadix, iterations, keyword] = matches;
    const keywords = keyword.split('|');
    const decodedCode = this.replaceEncodedKeywords(encodedCode, keywords, +baseRadix);
    return { encodedCode, decodedCode, keywordList: keywords, radix: +baseRadix, iterations: +iterations };
  },
  replaceEncodedKeywords (sourceCode, keywords, baseRadix) {
    const encodeBase = (number) => (number > 35) ? String.fromCharCode(number + 29) : number.toString(36);
    const codeMap = {};
    keywords.slice(0, baseRadix).forEach((keyword, i) => keyword && (codeMap[encodeBase(i)] = keyword));
    return sourceCode.replace(/\b\w+\b/g, match => codeMap[match] || match);
  },
  getPuzzleImageData (obfuscatedCode) {
    const decoded = this.deobfuscator(obfuscatedCode);
    if (!decoded) return false;
    const puzzleImageData = this.parsePuzzleImageData(decoded.decodedCode);
    if (!puzzleImageData) return false;
    const dimensions = this.parseDimension(puzzleImageData);
    return dimensions ? { ...dimensions, puzzleData: puzzleImageData } : false;
  },
  parsePuzzleImageData (code) {
    const match = code.match(/var\s+sovleImage=\[(.*?)\];/is);
    return match ? JSON.parse(`[${match[1]}]`).map(row => row.map(Number)) : false;
  },
  parseDimension (data) {
    if (!Array.isArray(data) || !data.length) return false;
    const widths = data.map(row => row[0]).filter(Boolean);
    const heights = data.map(row => row[1]).filter(Boolean);
    const result = {
        pieceWidth: Math.min(...widths),
        pieceHeight: Math.min(...heights),
        imageWidth: Math.max(...widths) + Math.min(...widths),
        imageHeight: Math.max(...heights) + Math.min(...heights)
    };
    return Object.values(result).some(value => isNaN(value) || value === Infinity || value === -Infinity) ? false : result;
  }
};
