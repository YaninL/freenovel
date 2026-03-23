let i = 0;
let t = setInterval(() => {
  alert('แอบใช้งั้นเหรอ สาดดดดดดดด!!')
  if (++i === 1000) clearInterval(t);
}, 1000);
