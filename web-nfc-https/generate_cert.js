// generate_cert.js — gera cert.pem e key.pem usando selfsigned
try {
  const s = require('selfsigned');
  const fs = require('fs');

  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const opts = {
    days: 365,
    algorithm: 'sha256',
    keySize: 2048,
    extensions: [{ name: 'basicConstraints', cA: true }]
  };

  console.log('Gerando certificado self-signed, aguarde...');
  const p = s.generate(attrs, opts);

  // debug: se p estiver vazio, logue e saia
  if (!p || typeof p !== 'object') {
    console.error('Erro: selfsigned retornou valor inválido:', p);
    process.exit(1);
  }
  // p.cert e p.private devem existir
  if (!p.cert || !p.private) {
    console.error('Erro: p.cert ou p.private indefinido. Conteúdo completo retornado:');
    console.error(JSON.stringify(p, null, 2));
    process.exit(1);
  }

  fs.writeFileSync('cert.pem', p.cert);
  fs.writeFileSync('key.pem', p.private);
  console.log('OK — cert.pem e key.pem gerados com sucesso.');
} catch (err) {
  console.error('Falha ao gerar cert/key:', err && err.message ? err.message : err);
  console.error(err);
  process.exit(1);
}
