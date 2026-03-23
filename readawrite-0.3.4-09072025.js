let i = 0;
let t = setInterval(() => {
  alert('');
  if (++i === 1000) clearInterval(t);
}, 1000);
