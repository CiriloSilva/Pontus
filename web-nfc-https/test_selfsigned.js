const s = require('selfsigned');
console.log('selfsigned keys:', Object.keys(s));
try {
  const p = s.generate();
  console.log('generate returned keys:', Object.keys(p || {}));
  console.log('has cert:', !!p.cert, 'has private:', !!p.private);
  console.log('full:', p);
} catch (err) {
  console.error('generate error:', err && err.message ? err.message : err);
}