require('dotenv').config();
const Fastify = require('fastify');
const fastifyJwt = require('@fastify/jwt');
const fastifyCors = require('@fastify/cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { stringify } = require('csv-stringify/sync');

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

// Registrando apenas os plugins que constam no package.json v1.0
app.register(fastifyCors, { origin: true });
app.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'changeme' });

// **NOTA**: não usamos plugin de rate-limit aqui para evitar incompatibilidades.
// Para dev/prod leve, você pode usar um rate-limiter em memória (eu mostro abaixo).

// Simples decorador de autenticação JWT
app.decorate("authenticate", async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'unauthorized' });
  }
});

// In-memory rate limiter (opcional, leve) — evita necessidade de plugin externo
const RATE_MAX = 300;
const RATE_WINDOW_MS = 60 * 1000;
const rateMap = new Map();
app.addHook('onRequest', async (req, reply) => {
  try {
    const ip = req.ip || (req.headers && (req.headers['x-forwarded-for'] || req.socket.remoteAddress)) || 'unknown';
    const now = Date.now();
    const entry = rateMap.get(ip) || { count: 0, ts: now };
    if (now - entry.ts > RATE_WINDOW_MS) {
      entry.count = 0;
      entry.ts = now;
    }
    entry.count++;
    rateMap.set(ip, entry);
    if (entry.count > RATE_MAX) {
      reply.code(429).send({ error: 'rate limit exceeded' });
      return;
    }
  } catch (e) {
    // se erro, não bloquear
    return;
  }
});

// health
app.get('/api/health', async () => ({ ok: true, time: new Date() }));

// auth: register / login
app.post('/api/auth/register', async (req, reply) => {
  const { name, email, password, role } = req.body || {};
  if (!email || !password) return reply.code(400).send({ error: 'email/password' });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return reply.code(400).send({ error: 'email exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hash, role: role || 'user' } });
  return { id: user.id, email: user.email };
});

app.post('/api/auth/login', async (req, reply) => {
  const { email, password } = req.body || {};
  if (!email || !password) return reply.code(400).send({ error: 'email/password' });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return reply.code(401).send({ error: 'invalid' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return reply.code(401).send({ error: 'invalid' });
  const token = app.jwt.sign({ id: user.id, role: user.role, email: user.email });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
});

// user management (admin)
app.post('/api/users', { preHandler: [app.authenticate] }, async (req, reply) => {
  if (req.user.role !== 'admin') return reply.code(403).send({ error: 'forbidden' });
  const { name, email, password, role } = req.body || {};
  const hash = await bcrypt.hash(password, 10);
  const u = await prisma.user.create({ data: { name, email, password: hash, role: role || 'user' } });
  return u;
});

app.get('/api/users', { preHandler: [app.authenticate] }, async (req, reply) => {
  if (req.user.role !== 'admin') return reply.code(403).send({ error: 'forbidden' });
  return prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
});

// associate uid -> user (admin)
app.post('/api/users/:id/associate-uid', { preHandler: [app.authenticate] }, async (req, reply) => {
  if (req.user.role !== 'admin') return reply.code(403).send({ error: 'forbidden' });
  const userId = Number(req.params.id);
  const { uid } = req.body || {};
  if (!uid) return reply.code(400).send({ error: 'uid required' });
  const up = await prisma.card.upsert({
    where: { uid },
    update: { userId },
    create: { uid, userId }
  });
  return up;
});

// DELETE /api/cards/:uid  -> desassocia (delete) uma pulseira (admin only)
app.delete('/api/cards/:uid', { preHandler: [app.authenticate] }, async (req, reply) => {
  if (req.user.role !== 'admin') return reply.code(403).send({ error: 'forbidden' });
  const uid = req.params.uid;
  try {
    // tenta deletar; se não existir, retorna 404
    const card = await prisma.card.findUnique({ where: { uid }});
    if (!card) return reply.code(404).send({ error: 'not found' });
    await prisma.card.delete({ where: { uid } });
    return { ok: true, uid };
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: 'internal' });
  }
});

// public: get user by uid
app.get('/api/user-by-uid/:uid', async (req, reply) => {
  const uid = req.params.uid;
  const card = await prisma.card.findUnique({ where: { uid }, include: { user: true } });
  if (!card) return reply.code(404).send({ error: 'not found' });
  return { user: card.user ? { id: card.user.id, name: card.user.name, email: card.user.email } : null };
});

// registro endpoint with dedupe + attach user info
app.post('/api/registro', async (req, reply) => {
  const { uid, timestamp, device } = req.body || {};
  if (!uid || !timestamp) return reply.code(400).send({ error: 'uid/timestamp required' });

  const ts = new Date(Number(timestamp));
  const DEDUPE_WINDOW_MS = 3000;
  const since = new Date(ts.getTime() - DEDUPE_WINDOW_MS);

  const last = await prisma.registro.findFirst({
    where: { uid, timestamp: { gte: since } },
    orderBy: { timestamp: 'desc' }
  });
  if (last) {
    const card = await prisma.card.findUnique({ where: { uid }, include: { user: true } });
    return reply.code(200).send({ ok: true, ignored: true, lastId: last.id, user: card && card.user ? { id: card.user.id, name: card.user.name } : null });
  }

  const card = await prisma.card.findUnique({ where: { uid } });
  const r = await prisma.registro.create({
    data: { uid, timestamp: ts, device: device || null, userId: card ? card.userId : null },
    include: { user: true }
  });
  const user = r.user ? { id: r.user.id, name: r.user.name } : null;
  return reply.code(201).send({ ok: true, id: r.id, user });
});

// list registros (admin sees all; user only their own)
app.get('/api/registros', { preHandler: [app.authenticate] }, async (req, reply) => {
  const { start, end, userId, page = 1, limit = 100 } = req.query || {};
  const where = {};
  if (userId) where.userId = Number(userId);
  if (start || end) {
    where.timestamp = {};
    if (start) where.timestamp.gte = new Date(Number(start));
    if (end) where.timestamp.lte = new Date(Number(end));
  }
  if (req.user.role !== 'admin') where.userId = req.user.id;
  const take = Math.min(1000, Number(limit));
  const skip = (Number(page) - 1) * take;
  const rows = await prisma.registro.findMany({ where, orderBy: { timestamp: 'desc' }, skip, take, include: { user: true } });
  return { rows };
});

// export csv (admin)
app.get('/api/registros/export.csv', { preHandler: [app.authenticate] }, async (req, reply) => {
  if (req.user.role !== 'admin') return reply.code(403).send({ error: 'forbidden' });
  const { start, end, userId } = req.query || {};
  const where = {};
  if (userId) where.userId = Number(userId);
  if (start || end) {
    where.timestamp = {};
    if (start) where.timestamp.gte = new Date(Number(start));
    if (end) where.timestamp.lte = new Date(Number(end));
  }
  const rows = await prisma.registro.findMany({ where, orderBy: { timestamp: 'desc' }, include: { user: true } });
  const records = rows.map(r => ({ id: r.id, uid: r.uid, timestamp: r.timestamp.toISOString(), device: r.device || '', userId: r.userId || '', userName: r.user ? r.user.name : '' }));
  const csv = stringify(records, { header: true });
  reply.header('Content-Type', 'text/csv');
  reply.header('Content-Disposition', 'attachment; filename="registros.csv"');
  return reply.send(csv);
});

const PORT = process.env.PORT || 3000;
app.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening on ${address}`);
});
