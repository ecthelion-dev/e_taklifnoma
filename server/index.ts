import express, { type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { db, UPLOADS_DIR } from './db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_COOKIE = 'etaklif_session';

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '6mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

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

function getCurrentUser(req: Request): AuthUser | null {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(token) as (AuthUser & { expires_at: string }) | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { id: row.id, name: row.name, email: row.email };
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
    id: row.id,
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

function canManageInvitation(req: Request, inv: { user_id: number | null; edit_token: string; is_demo: number }): boolean {
  if (inv.is_demo) return false;
  const user = getCurrentUser(req);
  if (user && inv.user_id === user.id) return true;
  const tokens = getEditTokens(req);
  const bodyToken = typeof req.body?.editToken === 'string' ? req.body.editToken : '';
  const queryToken = typeof req.query?.editToken === 'string' ? req.query.editToken : '';
  return tokens.includes(inv.edit_token) || bodyToken === inv.edit_token || queryToken === inv.edit_token;
}

// --- Health ---
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// --- Auth ---
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || String(password).length < 6) {
    res.status(400).json({ error: 'Ism, email va kamida 6 belgili parol kiriting.' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'Bu email allaqachon ro‘yxatdan o‘tgan.' });
    return;
  }

  const hash = hashPassword(String(password));
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(String(name).trim(), normalizedEmail, hash);

  const userId = Number(result.lastInsertRowid);
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ user: { id: userId, name: String(name).trim(), email: normalizedEmail } });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email va parolni kiriting.' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db
    .prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?')
    .get(normalizedEmail) as (AuthUser & { password_hash: string }) | undefined;

  if (!user || !verifyPassword(String(password), user.password_hash)) {
    res.status(401).json({ error: 'Email yoki parol noto‘g‘ri.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  res.json({ user });
});

// --- Photo Upload ---
app.post('/api/upload', (req: Request, res: Response) => {
  const { dataUrl } = req.body || {};
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    res.status(400).json({ error: 'Faqat rasm fayllari qo‘llab-quvvatlanadi.' });
    return;
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) {
    res.status(400).json({ error: 'Rasm formati noto‘g‘ri (PNG, JPG, WEBP).' });
    return;
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 4 * 1024 * 1024) {
    res.status(413).json({ error: 'Rasm hajmi 4MB dan oshmasligi kerak.' });
    return;
  }
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  res.json({ url: `/uploads/${filename}` });
});

// --- Invitations ---
app.get('/api/invitations/demos', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT i.*,
        (SELECT COUNT(*) FROM rsvps r WHERE r.invitation_id = i.id) as rsvp_count,
        (SELECT COUNT(*) FROM rsvps r WHERE r.invitation_id = i.id AND r.attendance = 'yes') as going_count,
        (SELECT COALESCE(SUM(r.guests_count), 0) FROM rsvps r WHERE r.invitation_id = i.id AND r.attendance = 'yes') as total_guests
       FROM invitations i
       WHERE i.is_demo = 1
       ORDER BY i.id ASC`
    )
    .all() as Record<string, unknown>[];

  res.json({ invitations: rows.map((r) => serializeInvitation(r, false)) });
});

app.get('/api/invitations/check-slug/:slug', (req, res) => {
  const slug = sanitizeSlug(req.params.slug);
  if (!slug || slug.length < 3) {
    res.json({ available: false, sanitized: slug });
    return;
  }
  const exists = db.prepare('SELECT id FROM invitations WHERE slug = ?').get(slug);
  res.json({ available: !exists, sanitized: slug });
});

app.get('/api/invitations/mine', (req, res) => {
  const user = getCurrentUser(req);
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

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  res.json({ invitations: rows.map((r) => serializeInvitation(r, true)) });
});

app.post('/api/invitations/claim', (req, res) => {
  const user = getCurrentUser(req);
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
  const result = db
    .prepare(`UPDATE invitations SET user_id = ? WHERE edit_token IN (${placeholders}) AND user_id IS NULL`)
    .run(user.id, ...tokens);
  res.json({ claimed: Number(result.changes || 0) });
});

app.get('/api/invitations/:slug', (req, res) => {
  const slug = req.params.slug;
  const row = db.prepare('SELECT * FROM invitations WHERE slug = ?').get(slug) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }

  if (req.query.preview !== '1') {
    db.prepare('UPDATE invitations SET views_count = views_count + 1 WHERE id = ?').run(Number(row.id));
    row.views_count = Number(row.views_count || 0) + 1;
  }

  const wishes = db
    .prepare(
      `SELECT id, guest_name as guestName, attendance, guests_count as guestsCount, wish_message as wishMessage, created_at as createdAt
       FROM rsvps
       WHERE invitation_id = ? AND TRIM(wish_message) != ''
       ORDER BY id DESC
       LIMIT 30`
    )
    .all(Number(row.id));

  const canManage = canManageInvitation(req, {
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

app.post('/api/invitations', (req, res) => {
  const b = req.body || {};
  const user = getCurrentUser(req);

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

  const existing = db.prepare('SELECT id FROM invitations WHERE slug = ?').get(slug);
  if (existing) {
    slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
  }

  const editToken = crypto.randomBytes(16).toString('hex');
  const programJson = JSON.stringify(Array.isArray(b.program) ? b.program : []);
  const quizJson = JSON.stringify(Array.isArray(b.quiz) ? b.quiz : []);

  const result = db
    .prepare(
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
      )`
    )
    .run(
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
      String(b.eventTime || '18:00'),
      venueName,
      String(b.venueAddress || ''),
      String(b.mapUrl || ''),
      String(b.dressCode || ''),
      String(b.contactPhone || ''),
      b.showBismillah ? 1 : 0,
      String(b.quoteText || ''),
      String(b.photoUrl || ''),
      programJson,
      quizJson
    );

  const created = db.prepare('SELECT * FROM invitations WHERE id = ?').get(Number(result.lastInsertRowid)) as Record<
    string,
    unknown
  >;

  res.status(201).json({
    invitation: serializeInvitation(created, true),
    editToken,
  });
});

app.put('/api/invitations/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM invitations WHERE slug = ?').get(req.params.slug) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }

  if (
    !canManageInvitation(req, {
      user_id: row.user_id as number | null,
      edit_token: String(row.edit_token),
      is_demo: Number(row.is_demo || 0),
    })
  ) {
    res.status(403).json({ error: 'Ushbu taklifnomani tahrirlash huquqingiz yo‘q.' });
    return;
  }

  const b = req.body || {};
  const programJson = JSON.stringify(Array.isArray(b.program) ? b.program : []);
  const quizJson = JSON.stringify(Array.isArray(b.quiz) ? b.quiz : []);

  db.prepare(
    `UPDATE invitations SET
      template_id = ?, palette_id = ?, event_type = ?, lang = ?,
      title = ?, hero_names = ?, host_line = ?, welcome_text = ?,
      event_date = ?, event_time = ?, venue_name = ?, venue_address = ?,
      map_url = ?, dress_code = ?, contact_phone = ?, show_bismillah = ?,
      quote_text = ?, photo_url = ?, program_json = ?, quiz_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
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
    Number(row.id)
  );

  const updated = db.prepare('SELECT * FROM invitations WHERE id = ?').get(Number(row.id)) as Record<string, unknown>;
  res.json({ invitation: serializeInvitation(updated, true) });
});

app.delete('/api/invitations/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM invitations WHERE slug = ?').get(req.params.slug) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }
  if (
    !canManageInvitation(req, {
      user_id: row.user_id as number | null,
      edit_token: String(row.edit_token),
      is_demo: Number(row.is_demo || 0),
    })
  ) {
    res.status(403).json({ error: 'O‘chirish huquqingiz yo‘q.' });
    return;
  }
  db.prepare('DELETE FROM invitations WHERE id = ?').run(Number(row.id));
  res.json({ ok: true });
});

// --- QR Code ---
app.get('/api/invitations/:slug/qr', async (req, res) => {
  const slug = req.params.slug;
  const origin = typeof req.query.origin === 'string' && req.query.origin.startsWith('http')
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
app.post('/api/invitations/:slug/rsvp', (req, res) => {
  const inv = db.prepare('SELECT id FROM invitations WHERE slug = ?').get(req.params.slug) as
    | { id: number }
    | undefined;
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

  const result = db
    .prepare(
      `INSERT INTO rsvps (invitation_id, guest_name, phone, attendance, guests_count, wish_message, quiz_score)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      inv.id,
      String(guestName).trim(),
      String(phone || '').trim(),
      validAttendance,
      count,
      String(wishMessage || '').trim(),
      parsedScore
    );

  const created = db
    .prepare(
      `SELECT id, invitation_id as invitationId, guest_name as guestName, phone, attendance, guests_count as guestsCount, wish_message as wishMessage, quiz_score as quizScore, created_at as createdAt
       FROM rsvps WHERE id = ?`
    )
    .get(Number(result.lastInsertRowid));

  res.status(201).json({ rsvp: created });
});

app.get('/api/invitations/:slug/rsvps', (req, res) => {
  const row = db.prepare('SELECT * FROM invitations WHERE slug = ?').get(req.params.slug) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }

  const isDemo = Boolean(row.is_demo);
  if (
    !isDemo &&
    !canManageInvitation(req, {
      user_id: row.user_id as number | null,
      edit_token: String(row.edit_token),
      is_demo: 0,
    })
  ) {
    res.status(403).json({ error: 'Mehmonlar ro‘yxatini ko‘rish huquqingiz yo‘q.' });
    return;
  }

  const rsvps = db
    .prepare(
      `SELECT id, invitation_id as invitationId, guest_name as guestName, phone, attendance, guests_count as guestsCount, wish_message as wishMessage, quiz_score as quizScore, created_at as createdAt
       FROM rsvps WHERE invitation_id = ? ORDER BY id DESC`
    )
    .all(Number(row.id)) as Array<{ attendance: string; guestsCount: number }>;

  const summary = {
    totalResponses: rsvps.length,
    goingResponses: rsvps.filter((r) => r.attendance === 'yes').length,
    declinedResponses: rsvps.filter((r) => r.attendance === 'no').length,
    maybeResponses: rsvps.filter((r) => r.attendance === 'maybe').length,
    totalGuests: rsvps.filter((r) => r.attendance === 'yes').reduce((acc, r) => acc + Number(r.guestsCount || 0), 0),
  };

  res.json({ rsvps, summary });
});

app.delete('/api/invitations/:slug/rsvps/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM invitations WHERE slug = ?').get(req.params.slug) as
    | Record<string, unknown>
    | undefined;
  if (!row) {
    res.status(404).json({ error: 'Taklifnoma topilmadi.' });
    return;
  }
  if (
    !canManageInvitation(req, {
      user_id: row.user_id as number | null,
      edit_token: String(row.edit_token),
      is_demo: Number(row.is_demo || 0),
    })
  ) {
    res.status(403).json({ error: 'O‘chirish huquqingiz yo‘q.' });
    return;
  }
  db.prepare('DELETE FROM rsvps WHERE id = ? AND invitation_id = ?').run(Number(req.params.id), Number(row.id));
  res.json({ ok: true });
});

// --- Serve Built SPA in Production ---
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`eTaklif server running at http://localhost:${PORT}`);
});
