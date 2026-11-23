import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { db, initDatabase, isPostgres } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE = 'etaklif_session';

app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '6mb' }));

// --- Helpers ---
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(derived, 'hex'));
}

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
}

async function getCurrentUser(req: Request): Promise<AuthUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const row = await db.get<AuthUser & { expires_at: string }>(
    `SELECT u.id, u.name, u.email, s.expires_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ?`,
    [token]
  );

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await db.run('DELETE FROM sessions WHERE token = ?', [token]);
    return null;
  }
  return { id: Number(row.id), name: row.name, email: row.email };
}

function getEditTokens(req: Request): string[] {
  const header = req.headers['x-edit-tokens'];
  if (!header) return [];
  const raw = Array.isArray(header) ? header.join(',') : header;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeInvitation(row: Record<string, unknown>, includeToken = false) {
  let program = [];
  let quiz = [];
  try {
    program = JSON.parse(String(row.program_json || '[]'));
  } catch {
    program = [];
  }
  try {
    quiz = JSON.parse(String(row.quiz_json || '[]'));
  } catch {
    quiz = [];
  }
  const base: Record<string, unknown> = {
    id: Number(row.id),
    slug: row.slug,
    templateId: row.template_id,
    paletteId: row.palette_id,
    eventType: row.event_type,
    lang: row.lang,
    title: row.title,
    heroNames: row.hero_names,
    hostLine: row.host_line,
    welcomeText: row.welcome_text,
    eventDate: row.event_date,
    eventTime: row.event_time,
    venueName: row.venue_name,
    venueAddress: row.venue_address,
    mapUrl: row.map_url,
    dressCode: row.dress_code,
    contactPhone: row.contact_phone,
    showBismillah: Boolean(row.show_bismillah),
    quoteText: row.quote_text,
    photoUrl: row.photo_url,
    program,
    quiz,
    viewsCount: Number(row.views_count || 0),
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.rsvp_count !== undefined) base.rsvpCount = Number(row.rsvp_count || 0);
  if (row.going_count !== undefined) base.goingCount = Number(row.going_count || 0);
  if (row.total_guests !== undefined) base.totalGuests = Number(row.total_guests || 0);
  if (includeToken) base.editToken = row.edit_token;
  return base;
}

async function canManageInvitation(
  req: Request,
  inv: { user_id: number | null; edit_token: string; is_demo: number }
): Promise<boolean> {
  if (inv.is_demo) return false;
  const user = await getCurrentUser(req);
  if (user && inv.user_id !== null && Number(inv.user_id) === user.id) return true;
  const tokens = getEditTokens(req);
  const bodyToken = typeof req.body?.editToken === 'string' ? req.body.editToken : '';
  const queryToken = typeof req.query?.editToken === 'string' ? req.query.editToken : '';
  return tokens.includes(inv.edit_token) || bodyToken === inv.edit_token || queryToken === inv.edit_token;
}

// --- Health ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: isPostgres ? 'postgres' : 'sqlite', time: new Date().toISOString() });
});

// --- Persistent Media Serving (from DB so photos survive Render restarts) ---
app.get('/uploads/:id', async (req: Request, res: Response) => {
  const row = await db.get<{ mime_type: string; data_base64: string }>(
    'SELECT mime_type, data_base64 FROM media WHERE id = ?',
    [req.params.id]
  );
  if (!row) {
    res.status(404).send('Not found');
    return;
  }
  const buffer = Buffer.from(row.data_base64, 'base64');
  res.setHeader('Content-Type', row.mime_type);
  res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  res.send(buffer);
});

// --- Auth ---
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || String(password).length < 6) {
    res.status(400).json({ error: 'Ism, email va kamida 6 belgili parol kiriting.' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing) {
    res.status(409).json({ error: 'Bu email allaqachon ro‘yxatdan o‘tgan.' });
    return;
  }

  const hash = hashPassword(String(password));
  const inserted = await db.get<{ id: number }>(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id',
    [String(name).trim(), normalizedEmail, hash]
  );

  const userId = Number(inserted!.id);
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', [token, userId, expiresAt]);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ user: { id: userId, name: String(name).trim(), email: normalizedEmail } });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email va parolni kiriting.' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await db.get<AuthUser & { password_hash: string }>(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?',
    [normalizedEmail]
  );

  if (!user || !verifyPassword(String(password), user.password_hash)) {
    res.status(401).json({ error: 'Email yoki parol noto‘g‘ri.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', [token, user.id, expiresAt]);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ user: { id: Number(user.id), name: user.name, email: user.email } });
});

app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    await db.run('DELETE FROM sessions WHERE token = ?', [token]);
  }
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  res.json({ user });
});

// --- Photo Upload (stored persistently in DB) ---
app.post('/api/upload', async (req: Request, res: Response) => {
  const { dataUrl } = req.body || {};
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    res.status(400).json({ error: 'Faqat rasm fayllari qo‘llab-quvvatlanadi.' });
    return;
  }
  const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
  if (!match) {
    res.status(400).json({ error: 'Rasm formati noto‘g‘ri (PNG, JPG, WEBP).' });
    return;
  }
  const mimeType = match[1];
  const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
  const base64 = match[3];
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > 4 * 1024 * 1024) {
    res.status(413).json({ error: 'Rasm hajmi 4MB dan oshmasligi kerak.' });
    return;
  }
  const id = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  await db.run('INSERT INTO media (id, mime_type, data_base64) VALUES (?, ?, ?)', [id, mimeType, base64]);
  res.json({ url: `/uploads/${id}` });
});

// --- Invitations ---
app.get('/api/invitations/demos', async (_req, res) => {
  const rows = await db.query(
    `SELECT i.*,
      (SELECT COUNT(*) FROM rsvps r WHERE r.invitation_id = i.id) as rsvp_count,
      (SELECT COUNT(*) FROM rsvps r WHERE r.invitation_id = i.id AND r.attendance = 'yes') as going_count,
      (SELECT COALESCE(SUM(r.guests_count), 0) FROM rsvps r WHERE r.invitation_id = i.id AND r.attendance = 'yes') as total_guests
     FROM invitations i
     WHERE i.is_demo = 1
     ORDER BY i.id ASC`
  );
  res.json({ invitations: rows.map((r) => serializeInvitation(r, false)) });
});

app.get('/api/invitations/check-slug/:slug', async (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug || slug.length < 3) {
    res.json({ available: false, sanitized: slug });
    return;
  }
  const exists = await db.get('SELECT id FROM invitations WHERE slug = ?', [slug]);
  res.json({ available: !exists, sanitized: slug });
});

app.get('/api/invitations/mine', async (req, res) => {
  const user = await getCurrentUser(req);
  const tokens = getEditTokens(req);

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (user) {
    conditions.push('i.user_id = ?');
    params.push(user.id);
  }
  if (tokens.length > 0) {
    const placeholders = tokens.map(() => '?').join(',');
    conditions.push(`i.edit_token IN (${placeholders})`);
    params.push(...tokens);
  }

  if (conditions.length === 0) {
    res.json({ invitations: [] });
    return;
  }

  const sql = `
    SELECT i.*,
      (SELECT COUNT(*) FROM rsvps r WHERE r.invitation_id = i.id) as rsvp_count,
      (SELECT COUNT(*) FROM rsvps r WHERE r.invitation_id = i.id AND r.attendance = 'yes') as going_count,
      (SELECT COALESCE(SUM(r.guests_count), 0) FROM rsvps r WHERE r.invitation_id = i.id AND r.attendance = 'yes') as total_guests
    FROM invitations i
    WHERE (${conditions.join(' OR ')}) AND i.is_demo = 0
    ORDER BY i.created_at DESC
  `;

  const rows = await db.query(sql, params);
  res.json({ invitations: rows.map((r) => serializeInvitation(r, true)) });
});

app.post('/api/invitations/claim', async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'Avval tizimga kiring.' });
    return;
  }
  const tokens: string[] = Array.isArray(req.body?.editTokens) ? req.body.editTokens : [];
  if (tokens.length === 0) {
    res.json({ claimed: 0 });
    return;
  }
  const placeholders = tokens.map(() => '?').join(',');
  const result = await db.run(
    `UPDATE invitations SET user_id = ? WHERE edit_token IN (${placeholders}) AND user_id IS NULL`,
    [user.id, ...tokens]
  );
  res.json({ claimed: result.changes });
});

app.get('/api/invitations/:slug', async (req, res) => {
  const slug = req.params.slug;
  const row = await db.get('SELECT * FROM invitations WHERE slug = ?', [slug]);
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }

  if (req.query.preview !== '1') {
    await db.run('UPDATE invitations SET views_count = views_count + 1 WHERE id = ?', [Number(row.id)]);
    row.views_count = Number(row.views_count || 0) + 1;
  }

  const wishes = await db.query(
    `SELECT id, guest_name as "guestName", attendance, guests_count as "guestsCount", wish_message as "wishMessage", created_at as "createdAt"
     FROM rsvps
     WHERE invitation_id = ? AND TRIM(wish_message) != ''
     ORDER BY id DESC
     LIMIT 30`,
    [Number(row.id)]
  );

  const canManage = await canManageInvitation(req, {
    user_id: row.user_id as number | null,
    edit_token: String(row.edit_token),
    is_demo: Number(row.is_demo || 0),
  });

  res.json({
    invitation: serializeInvitation(row, canManage),
    wishes,
    canManage,
  });
});

app.post('/api/invitations', async (req, res) => {
  const b = req.body || {};
  const user = await getCurrentUser(req);

  const heroNames = String(b.heroNames || '').trim();
  const eventDate = String(b.eventDate || '').trim();
  const venueName = String(b.venueName || '').trim();

  if (!heroNames) {
    res.status(400).json({ error: 'Ismlar yoki sarlavha kiritilishi shart.' });
    return;
  }

  let slug = sanitizeSlug(String(b.slug || ''));
  if (!slug || slug.length < 3) {
    const base = sanitizeSlug(heroNames) || 'taklifnoma';
    slug = `${base.slice(0, 32)}-${crypto.randomBytes(2).toString('hex')}`;
  }

  const existing = await db.get('SELECT id FROM invitations WHERE slug = ?', [slug]);
  if (existing) {
    slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
  }

  const editToken = crypto.randomBytes(16).toString('hex');
  const programJson = JSON.stringify(Array.isArray(b.program) ? b.program : []);
  const quizJson = JSON.stringify(Array.isArray(b.quiz) ? b.quiz : []);

  const inserted = await db.get<{ id: number }>(
    `INSERT INTO invitations (
      slug, user_id, edit_token, template_id, palette_id, event_type, lang,
      title, hero_names, host_line, welcome_text, event_date, event_time,
      venue_name, venue_address, map_url, dress_code, contact_phone,
      show_bismillah, quote_text, photo_url, program_json, quiz_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    ) RETURNING id`,
    [
      slug,
      user ? user.id : null,
      editToken,
      String(b.templateId || 'milliy'),
      String(b.paletteId || 'milliy-lapis'),
      String(b.eventType || 'wedding'),
      b.lang === 'ru' ? 'ru' : 'uz',
      String(b.title || 'Taklifnoma'),
      heroNames,
      String(b.hostLine || ''),
      String(b.welcomeText || ''),
      eventDate,
      String(b.eventTime || ''),
      venueName,
      String(b.venueAddress || ''),
      String(b.mapUrl || ''),
      String(b.dressCode || ''),
      String(b.contactPhone || ''),
      b.showBismillah ? 1 : 0,
      String(b.quoteText || ''),
      String(b.photoUrl || ''),
      programJson,
      quizJson,
    ]
  );

  const created = (await db.get('SELECT * FROM invitations WHERE id = ?', [Number(inserted!.id)]))!;
  res.status(201).json({
    invitation: serializeInvitation(created, true),
    editToken,
  });
});

app.put('/api/invitations/:slug', async (req, res) => {
  const row = await db.get('SELECT * FROM invitations WHERE slug = ?', [req.params.slug]);
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }

  if (
    !(await canManageInvitation(req, {
      user_id: row.user_id as number | null,
      edit_token: String(row.edit_token),
      is_demo: Number(row.is_demo || 0),
    }))
  ) {
    res.status(403).json({ error: 'Ushbu taklifnomani tahrirlash huquqingiz yo‘q.' });
    return;
  }

  const b = req.body || {};
  const programJson = JSON.stringify(Array.isArray(b.program) ? b.program : []);
  const quizJson = JSON.stringify(Array.isArray(b.quiz) ? b.quiz : []);

  await db.run(
    `UPDATE invitations SET
      template_id = ?, palette_id = ?, event_type = ?, lang = ?,
      title = ?, hero_names = ?, host_line = ?, welcome_text = ?,
      event_date = ?, event_time = ?, venue_name = ?, venue_address = ?,
      map_url = ?, dress_code = ?, contact_phone = ?, show_bismillah = ?,
      quote_text = ?, photo_url = ?, program_json = ?, quiz_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      String(b.templateId || row.template_id),
      String(b.paletteId || row.palette_id),
      String(b.eventType || row.event_type),
      b.lang === 'ru' ? 'ru' : 'uz',
      String(b.title ?? row.title),
      String(b.heroNames ?? row.hero_names),
      String(b.hostLine ?? row.host_line),
      String(b.welcomeText ?? row.welcome_text),
      String(b.eventDate ?? row.event_date),
      String(b.eventTime ?? row.event_time),
      String(b.venueName ?? row.venue_name),
      String(b.venueAddress ?? row.venue_address),
      String(b.mapUrl ?? row.map_url),
      String(b.dressCode ?? row.dress_code),
      String(b.contactPhone ?? row.contact_phone),
      b.showBismillah ? 1 : 0,
      String(b.quoteText ?? row.quote_text),
      String(b.photoUrl ?? row.photo_url),
      programJson,
      quizJson,
      Number(row.id),
    ]
  );

  const updated = (await db.get('SELECT * FROM invitations WHERE id = ?', [Number(row.id)]))!;
  res.json({ invitation: serializeInvitation(updated, true) });
});

app.delete('/api/invitations/:slug', async (req, res) => {
  const row = await db.get('SELECT * FROM invitations WHERE slug = ?', [req.params.slug]);
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }
  if (
    !(await canManageInvitation(req, {
      user_id: row.user_id as number | null,
      edit_token: String(row.edit_token),
      is_demo: Number(row.is_demo || 0),
    }))
  ) {
    res.status(403).json({ error: 'O‘chirish huquqingiz yo‘q.' });
    return;
  }
  await db.run('DELETE FROM invitations WHERE id = ?', [Number(row.id)]);
  res.json({ ok: true });
});

// --- QR Code ---
app.get('/api/invitations/:slug/qr', async (req, res) => {
  const slug = req.params.slug;
  const origin =
    typeof req.query.origin === 'string' && req.query.origin.startsWith('http')
      ? req.query.origin
      : `${req.protocol}://${req.get('host')}`;
  const targetUrl = `${origin}/i/${slug}`;

  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      width: 480,
      margin: 2,
      color: { dark: '#1c1917', light: '#ffffff' },
    });
    res.json({ dataUrl, url: targetUrl });
  } catch {
    res.status(500).json({ error: 'QR-kod yaratishda xatolik.' });
  }
});

// --- RSVPs ---
app.post('/api/invitations/:slug/rsvp', async (req, res) => {
  const inv = await db.get<{ id: number }>('SELECT id FROM invitations WHERE slug = ?', [req.params.slug]);
  if (!inv) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }

  const { guestName, phone, attendance, guestsCount, wishMessage, quizScore } = req.body || {};
  if (!guestName || !String(guestName).trim()) {
    res.status(400).json({ error: 'Ismingizni kiriting.' });
    return;
  }
  const validAttendance = ['yes', 'no', 'maybe'].includes(attendance) ? attendance : 'yes';
  const count = validAttendance === 'no' ? 0 : Math.max(1, Math.min(20, Number(guestsCount) || 1));
  const parsedScore =
    quizScore !== undefined && quizScore !== null && !Number.isNaN(Number(quizScore))
      ? Math.max(0, Math.min(100, Math.round(Number(quizScore))))
      : null;

  const inserted = await db.get<{ id: number }>(
    `INSERT INTO rsvps (invitation_id, guest_name, phone, attendance, guests_count, wish_message, quiz_score)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    [
      Number(inv.id),
      String(guestName).trim(),
      String(phone || '').trim(),
      validAttendance,
      count,
      String(wishMessage || '').trim(),
      parsedScore,
    ]
  );

  const created = await db.get(
    `SELECT id, invitation_id as "invitationId", guest_name as "guestName", phone, attendance, guests_count as "guestsCount", wish_message as "wishMessage", quiz_score as "quizScore", created_at as "createdAt"
     FROM rsvps WHERE id = ?`,
    [Number(inserted!.id)]
  );

  res.status(201).json({ rsvp: created });
});

app.get('/api/invitations/:slug/rsvps', async (req, res) => {
  const row = await db.get('SELECT * FROM invitations WHERE slug = ?', [req.params.slug]);
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }

  const isDemo = Boolean(row.is_demo);
  if (
    !isDemo &&
    !(await canManageInvitation(req, {
      user_id: row.user_id as number | null,
      edit_token: String(row.edit_token),
      is_demo: 0,
    }))
  ) {
    res.status(403).json({ error: 'Mehmonlar ro‘yxatini ko‘rish huquqingiz yo‘q.' });
    return;
  }

  const rsvps = await db.query<{ attendance: string; guestsCount: number }>(
    `SELECT id, invitation_id as "invitationId", guest_name as "guestName", phone, attendance, guests_count as "guestsCount", wish_message as "wishMessage", quiz_score as "quizScore", created_at as "createdAt"
     FROM rsvps WHERE invitation_id = ? ORDER BY id DESC`,
    [Number(row.id)]
  );

  const summary = {
    totalResponses: rsvps.length,
    goingResponses: rsvps.filter((r) => r.attendance === 'yes').length,
    declinedResponses: rsvps.filter((r) => r.attendance === 'no').length,
    maybeResponses: rsvps.filter((r) => r.attendance === 'maybe').length,
    totalGuests: rsvps
      .filter((r) => r.attendance === 'yes')
      .reduce((acc, r) => acc + Number(r.guestsCount || 0), 0),
  };

  res.json({ rsvps, summary });
});

app.delete('/api/invitations/:slug/rsvps/:id', async (req, res) => {
  const row = await db.get('SELECT * FROM invitations WHERE slug = ?', [req.params.slug]);
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }
  if (
    !(await canManageInvitation(req, {
      user_id: row.user_id as number | null,
      edit_token: String(row.edit_token),
      is_demo: Number(row.is_demo || 0),
    }))
  ) {
    res.status(403).json({ error: 'O‘chirish huquqingiz yo‘q.' });
    return;
  }
  await db.run('DELETE FROM rsvps WHERE id = ? AND invitation_id = ?', [Number(req.params.id), Number(row.id)]);
  res.json({ ok: true });
});

// --- Serve Built SPA in Production with Dynamic Telegram/OG Meta Tags ---
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

if (fs.existsSync(DIST_DIR)) {
  const indexHtmlPath = path.join(DIST_DIR, 'index.html');
  const cachedIndexHtml = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf-8') : '';

  app.use('/assets', express.static(path.join(DIST_DIR, 'assets'), { maxAge: '1y', immutable: true }));
  app.use(express.static(DIST_DIR, { maxAge: '1h' }));

  app.get('/i/:slug', async (req, res) => {
    if (!cachedIndexHtml) {
      res.sendFile(indexHtmlPath);
      return;
    }
    const row = await db.get<{
      title: string;
      hero_names: string;
      host_line: string;
      welcome_text: string;
      venue_name: string;
      photo_url: string;
    }>(
      'SELECT title, hero_names, host_line, welcome_text, venue_name, photo_url FROM invitations WHERE slug = ?',
      [req.params.slug]
    );

    if (!row) {
      res.type('html').send(cachedIndexHtml);
      return;
    }

    const ogTitle = escapeHtml(`${row.hero_names} — ${row.title}`);
    const descSource = row.host_line || row.venue_name || row.welcome_text || 'eTaklif — Elektron taklifnoma';
    const ogDesc = escapeHtml(descSource.slice(0, 180));
    const origin = `${req.protocol}://${req.get('host')}`;
    const ogImageTag = row.photo_url
      ? `<meta property="og:image" content="${escapeHtml(
          row.photo_url.startsWith('http') ? row.photo_url : `${origin}${row.photo_url}`
        )}" />`
      : '';

    const metaInjection = `
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${ogTitle}" />
    <meta property="og:description" content="${ogDesc}" />
    ${ogImageTag}
    <meta name="twitter:card" content="summary_large_image" />
  </head>`;

    const html = cachedIndexHtml
      .replace(/<title>.*?<\/title>/, `<title>${ogTitle} | eTaklif</title>`)
      .replace('</head>', metaInjection);

    res.setHeader('Cache-Control', 'no-cache');
    res.type('html').send(html);
  });

  app.get('/{*splat}', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.type('html').send(cachedIndexHtml);
  });
}

// Start server after DB initialization
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`eTaklif server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
