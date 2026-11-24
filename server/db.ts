import { DatabaseSync } from 'node:sqlite';
import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

export const isPostgres = Boolean(process.env.DATABASE_URL);

let pgPool: Pool | null = null;
let sqliteDb: DatabaseSync | null = null;

if (isPostgres) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  console.log('Database mode: PostgreSQL (Neon)');
} else {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  sqliteDb = new DatabaseSync(path.join(DATA_DIR, 'etaklif.db'));
  sqliteDb.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
  `);
  console.log('Database mode: Local SQLite');
}

function toPgParams(sql: string): string {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

export const db = {
  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (pgPool) {
      const res = await pgPool.query(toPgParams(sql), params);
      return res.rows as T[];
    }
    return sqliteDb!.prepare(sql).all(...(params as (string | number | null)[])) as T[];
  },

  async get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    if (pgPool) {
      const res = await pgPool.query(toPgParams(sql), params);
      return res.rows[0] as T | undefined;
    }
    return sqliteDb!.prepare(sql).get(...(params as (string | number | null)[])) as T | undefined;
  },

  async run(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
    if (pgPool) {
      const res = await pgPool.query(toPgParams(sql), params);
      return { changes: res.rowCount ?? 0 };
    }
    const res = sqliteDb!.prepare(sql).run(...(params as (string | number | null)[]));
    return { changes: Number(res.changes || 0) };
  },
};

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export async function initDatabase() {
  if (pgPool) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        edit_token TEXT NOT NULL,
        template_id TEXT NOT NULL,
        palette_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        lang TEXT NOT NULL DEFAULT 'uz',
        title TEXT NOT NULL,
        hero_names TEXT NOT NULL,
        host_line TEXT DEFAULT '',
        welcome_text TEXT DEFAULT '',
        event_date TEXT DEFAULT '',
        event_time TEXT DEFAULT '',
        venue_name TEXT DEFAULT '',
        venue_address TEXT DEFAULT '',
        map_url TEXT DEFAULT '',
        dress_code TEXT DEFAULT '',
        contact_phone TEXT DEFAULT '',
        show_bismillah INTEGER DEFAULT 0,
        quote_text TEXT DEFAULT '',
        photo_url TEXT DEFAULT '',
        program_json TEXT DEFAULT '[]',
        quiz_json TEXT DEFAULT '[]',
        views_count INTEGER DEFAULT 0,
        telegram_chat_id TEXT DEFAULT '',
        is_demo INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE invitations ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT DEFAULT '';

      CREATE TABLE IF NOT EXISTS rsvps (
        id SERIAL PRIMARY KEY,
        invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
        guest_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        attendance TEXT NOT NULL CHECK(attendance IN ('yes', 'no', 'maybe')),
        guests_count INTEGER DEFAULT 1,
        wish_message TEXT DEFAULT '',
        quiz_score INTEGER DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        mime_type TEXT NOT NULL,
        data_base64 TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
      CREATE INDEX IF NOT EXISTS idx_invitations_edit_token ON invitations(edit_token);
      CREATE INDEX IF NOT EXISTS idx_rsvps_invitation_id ON rsvps(invitation_id);
    `);
  } else {
    sqliteDb!.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        user_id INTEGER,
        edit_token TEXT NOT NULL,
        template_id TEXT NOT NULL,
        palette_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        lang TEXT NOT NULL DEFAULT 'uz',
        title TEXT NOT NULL,
        hero_names TEXT NOT NULL,
        host_line TEXT DEFAULT '',
        welcome_text TEXT DEFAULT '',
        event_date TEXT DEFAULT '',
        event_time TEXT DEFAULT '',
        venue_name TEXT DEFAULT '',
        venue_address TEXT DEFAULT '',
        map_url TEXT DEFAULT '',
        dress_code TEXT DEFAULT '',
        contact_phone TEXT DEFAULT '',
        show_bismillah INTEGER DEFAULT 0,
        quote_text TEXT DEFAULT '',
        photo_url TEXT DEFAULT '',
        program_json TEXT DEFAULT '[]',
        quiz_json TEXT DEFAULT '[]',
        views_count INTEGER DEFAULT 0,
        telegram_chat_id TEXT DEFAULT '',
        is_demo INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS rsvps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invitation_id INTEGER NOT NULL,
        guest_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        attendance TEXT NOT NULL CHECK(attendance IN ('yes', 'no', 'maybe')),
        guests_count INTEGER DEFAULT 1,
        wish_message TEXT DEFAULT '',
        quiz_score INTEGER DEFAULT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invitation_id) REFERENCES invitations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        mime_type TEXT NOT NULL,
        data_base64 TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON invitations(user_id);
      CREATE INDEX IF NOT EXISTS idx_invitations_edit_token ON invitations(edit_token);
      CREATE INDEX IF NOT EXISTS idx_rsvps_invitation_id ON rsvps(invitation_id);
    `);
  }

  await seedDemoInvitations();
}

async function seedDemoInvitations() {
  const demos = [
    {
      slug: 'demo-milliy',
      template_id: 'milliy',
      palette_id: 'milliy-lapis',
      event_type: 'wedding',
      lang: 'uz',
      title: 'Nikoh to‘yi taklifnomasi',
      hero_names: 'Javohir & Madina',
      host_line: 'Karimovlar va Rahimovlar oilasi sizni aziz mehmon sifatida taklif etadi',
      welcome_text:
        'Hurmatli qadrdonlarimiz! Hayotimizdagi eng baxtli va unutilmas kun — nikoh oqshomimizni siz bilan birga nishonlashdan benihoya mamnunmiz. Sizning tashrifingiz va ezgu duolaringiz to‘yimizga fayz bag‘ishlaydi.',
      event_date: futureDate(28),
      event_time: '18:00',
      venue_name: '«Navro‘z» tantanalar saroyi',
      venue_address: 'Toshkent sh., Alisher Navoiy ko‘chasi, 45',
      map_url: 'https://yandex.uz/maps/?text=Tashkent+Navruz+Saroyi',
      dress_code: 'Milliy yoki bayramona liboslar',
      contact_phone: '+998 90 123 45 67',
      show_bismillah: 1,
      quote_text: 'Ikki qalb birlashgan kunda muhabbat va baraka doimiy hamroh bo‘lsin.',
      photo_url: '',
      program: [
        { id: '1', time: '17:30', title: 'Mehmonlarni kutib olish', description: 'Karnay-surnay sadolari va shirinliklar' },
        { id: '2', time: '18:30', title: 'Kelin-kuyov kirib kelishi', description: 'Tantanali kutib olish va birinchi vals' },
        { id: '3', time: '19:30', title: 'To‘y dasturxoni va tabriklar', description: 'Ota-onalar va yaqinlar duosi' },
        { id: '4', time: '21:30', title: 'To‘y torti va raqslar', description: 'Jonli musiqa va unutilmas kecha' },
      ],
      quiz: [],
      views_count: 248,
      rsvps: [
        { guest_name: 'Azizbek va oilasi', phone: '+998 90 555 11 22', attendance: 'yes', guests_count: 3, wish_message: 'Baxtli bo‘linglar, qo‘sha qaringlar! Albatta boramiz.', quiz_score: null },
        { guest_name: 'Dilnoza opa', phone: '+998 93 412 00 99', attendance: 'yes', guests_count: 2, wish_message: 'To‘ylar muborak bo‘lsin, ko‘z tegmasin!', quiz_score: null },
      ],
    },
    {
      slug: 'demo-klassik',
      template_id: 'klassik',
      palette_id: 'klassik-burgundy',
      event_type: 'wedding',
      lang: 'ru',
      title: 'Приглашение на свадьбу',
      hero_names: 'Тимур & Алина',
      host_line: 'С любовью приглашаем вас разделить с нами этот особенный день',
      welcome_text:
        'Дорогие родные и близкие! Мы счастливы пригласить вас на торжество, посвящённое дню нашего бракосочетания. Ваше присутствие, улыбки и тёплые пожелания сделают этот вечер по-настоящему волшебным.',
      event_date: futureDate(42),
      event_time: '17:00',
      venue_name: 'Ресторан «Grand Imperial Hall»',
      venue_address: 'г. Ташкент, ул. Шахрисабз, 18',
      map_url: 'https://yandex.uz/maps/?text=Tashkent+Shahrisabz+18',
      dress_code: 'Black Tie / Вечерние наряды в пастельных тонах',
      contact_phone: '+998 99 876 54 32',
      show_bismillah: 0,
      quote_text: 'Любовь — это когда счастье другого человека важнее собственного.',
      photo_url: '',
      program: [
        { id: '1', time: '17:00', title: 'Сбор гостей и фуршет', description: 'Живая скрипка и приветственные напитки' },
        { id: '2', time: '18:00', title: 'Торжественная церемония', description: 'Обмен клятвами и кольцами' },
        { id: '3', time: '19:00', title: 'Праздничный банкет', description: 'Ужин, тосты и поздравления' },
      ],
      quiz: [],
      views_count: 312,
      rsvps: [
        { guest_name: 'Семья Усмановых', phone: '+998 90 777 33 44', attendance: 'yes', guests_count: 4, wish_message: 'Совет да любовь! С нетерпением ждём ваш праздник!', quiz_score: null },
      ],
    },
    {
      slug: 'demo-zamonaviy',
      template_id: 'zamonaviy',
      palette_id: 'zamonaviy-sage',
      event_type: 'wedding',
      lang: 'uz',
      title: 'Wedding Day',
      hero_names: 'Sardor & Kamola',
      host_line: 'Yangi hayotimizning ilk sahifasini siz bilan birga ochamiz',
      welcome_text:
        'Aziz do‘stlarimiz va yaqinlarimiz! Bizning nikoh kunimizni iliq muhit, samimiy suhbatlar va go‘zal xotiralar bilan bezash uchun sizni kutib qolamiz.',
      event_date: futureDate(35),
      event_time: '16:30',
      venue_name: '«Botanika Garden Terrace»',
      venue_address: 'Toshkent sh., Bog‘ishamol ko‘chasi, 12',
      map_url: 'https://yandex.uz/maps/?text=Tashkent+Botanical+Garden',
      dress_code: 'Smart Casual — oq, bej va zaytun ranglar',
      contact_phone: '+998 97 300 20 10',
      show_bismillah: 0,
      quote_text: 'Eng go‘zal hikoyalar birgalikda yoziladi.',
      photo_url: '',
      program: [
        { id: '1', time: '16:30', title: 'Welcome & Fotozona', description: 'Qahva, limonad va suratga tushish' },
        { id: '2', time: '17:30', title: 'Nikoh marosimi', description: 'Ochiq osmon ostida tantanali qism' },
        { id: '3', time: '18:30', title: 'Kechki ziyofat', description: 'Mualliflik taomlari va akustik musiqa' },
      ],
      quiz: [],
      views_count: 194,
      rsvps: [
        { guest_name: 'Farrux & Mohira', phone: '+998 90 111 22 33', attendance: 'yes', guests_count: 2, wish_message: 'Juda chiroyli taklifnoma! Albatta kelyapmiz!', quiz_score: null },
      ],
    },
    {
      slug: 'demo-islomiy',
      template_id: 'islomiy',
      palette_id: 'islomiy-emerald',
      event_type: 'nikoh',
      lang: 'uz',
      title: 'Nikoh marosimi taklifnomasi',
      hero_names: 'Abdulloh & Soliha',
      host_line: 'Allohning roziligi ila qurilayotgan oilamizning nikoh marosimiga marhamat',
      welcome_text:
        'Assalomu alaykum va rahmatullohi va barokatuh! Siz azizlarni farzandlarimizning muborak nikoh va valima dasturxoniga taklif etamiz. Duolaringiz va tashrifingiz bilan bizni xursand qiling.',
      event_date: futureDate(21),
      event_time: '12:00',
      venue_name: '«Samarqand» mehmonxona zali',
      venue_address: 'Toshkent sh., Sebzor ko‘chasi, 24',
      map_url: 'https://yandex.uz/maps/?text=Tashkent+Sebzor',
      dress_code: 'Odobli va bayramona liboslar',
      contact_phone: '+998 94 600 77 88',
      show_bismillah: 1,
      quote_text: '«Alloh sizlarning orangizga mehr-muhabbat va rahmat solib qo‘ydi.» (Rum surasi, 21-oyat)',
      photo_url: '',
      program: [
        { id: '1', time: '11:30', title: 'Mehmonlarni kutib olish', description: 'Salomlashish va choy dasturxoni' },
        { id: '2', time: '12:00', title: 'Qur’on tilovati va duo', description: 'Nikoh xutbasi va ezgu tilaklar' },
        { id: '3', time: '12:45', title: 'Valima dasturxoni', description: 'Milliy taomlar va samimiy suhbat' },
      ],
      quiz: [],
      views_count: 420,
      rsvps: [
        { guest_name: 'Muhammadali aka', phone: '+998 93 900 12 34', attendance: 'yes', guests_count: 2, wish_message: 'Barakallohu lakuma va baraka alaykuma! Alloh baxtli qilsin.', quiz_score: null },
      ],
    },
    {
      slug: 'demo-shohona',
      template_id: 'shohona',
      palette_id: 'shohona-gold',
      event_type: 'xatna',
      lang: 'uz',
      title: 'Xatna to‘yi tantanasi',
      hero_names: 'Amirbek',
      host_line: 'Toshmatovlar xonadoni sizni aziz o‘g‘limizning sunnat to‘yiga taklif etadi',
      welcome_text:
        'Hurmatli do‘stlar, qarindoshlar va mahalladoshlar! Shirin farzandimiz Amirbekning sunnat to‘yi munosabati bilan yoziladigan bayram dasturxonimizga tashrif buyurishingizni chin dildan so‘raymiz.',
      event_date: futureDate(19),
      event_time: '18:00',
      venue_name: '«Yakkasaroy» tantanalar saroyi',
      venue_address: 'Toshkent sh., Shota Rustaveli ko‘chasi, 62',
      map_url: 'https://yandex.uz/maps/?text=Tashkent+Yakkasaroy+Saroyi',
      dress_code: 'Bayramona liboslar',
      contact_phone: '+998 90 987 65 43',
      show_bismillah: 1,
      quote_text: 'Farzandimizning umri uzoq, rizqi keng va kelajagi porloq bo‘lsin!',
      photo_url: '',
      program: [
        { id: '1', time: '17:30', title: 'Mehmonlarni kutib olish', description: 'Bolalar uchun animatorlar va fotozona' },
        { id: '2', time: '18:30', title: 'To‘y bolaning kirib kelishi', description: 'Tantanali chiqish va tabriklar' },
        { id: '3', time: '19:30', title: 'Bayram dasturxoni', description: 'San’atkorlar chiqishi va shou dastur' },
      ],
      quiz: [],
      views_count: 176,
      rsvps: [
        { guest_name: 'Rustamjon va oilasi', phone: '+998 91 543 21 00', attendance: 'yes', guests_count: 4, wish_message: 'Amirbek katta yigit bo‘lsin! To‘y muborak!', quiz_score: null },
      ],
    },
    {
      slug: 'demo-sevgi-maktub',
      template_id: 'sevgi-maktub',
      palette_id: 'sevgi-rose',
      event_type: 'love_letter',
      lang: 'uz',
      title: 'Senga atalgan sevgi maktubi',
      hero_names: 'Sevgilim, Malika',
      host_line: 'Yuragimning eng samimiy so‘zlari — faqat sen uchun',
      welcome_text:
        'Hayotimga kirib kelgan kuningdan beri har bir tongim yanada yorqinroq, har bir kunim esa ma’noga to‘la. Sening tabassuming — mening eng katta baxtim. Hayotimda borliging va menga quvonch ulashayotganing uchun cheksiz rahmat.',
      event_date: '',
      event_time: '',
      venue_name: '',
      venue_address: '',
      map_url: '',
      dress_code: '',
      contact_phone: '',
      show_bismillah: 0,
      quote_text: '«Mingta sabab orasidan ham yuragim har doim seni tanlaydi.»',
      photo_url: '',
      program: [],
      quiz: [],
      views_count: 534,
      rsvps: [
        { guest_name: 'Malika ❤️', phone: '', attendance: 'yes', guests_count: 1, wish_message: 'Eng chiroyli va samimiy maktub bo‘ldi! Men ham seni yaxshi ko‘raman ❤️', quiz_score: null },
      ],
    },
    {
      slug: 'demo-sevgi-test',
      template_id: 'sevgi-test',
      palette_id: 'test-blush',
      event_type: 'love_quiz',
      lang: 'uz',
      title: 'Sevgi testi: Meni qanchalik bilasan?',
      hero_names: 'Jasur ❤️ Nigora',
      host_line: 'Keling, bir-birimizni qanchalik yaxshi bilishimizni tekshirib ko‘ramiz!',
      welcome_text:
        'Salom, jonim! Sening uchun kichik va qiziqarli sevgi testini tayyorladim. Barcha savollarga javob ber — agar 80% dan yuqori to‘plasang, mendan maxsus syurpriz bor!',
      event_date: '',
      event_time: '',
      venue_name: '',
      venue_address: '',
      map_url: '',
      dress_code: '',
      contact_phone: '',
      show_bismillah: 0,
      quote_text: 'Haqiqiy sevgi — eng kichik tafsilotlarni ham yodda saqlashdir.',
      photo_url: '',
      program: [],
      quiz: [
        { id: 'q1', question: 'Biz ilk bor qaysi faslda tanishganmiz?', options: ['Bahorda', 'Yozda', 'Kuzda', 'Qishda'], correctIndex: 0 },
        { id: 'q2', question: 'Mening eng sevimli ichimligim qaysi?', options: ['Latte qahva', 'Ko‘k choy', 'Yangi apelsin sharbati', 'Issiq shokolad'], correctIndex: 0 },
        { id: 'q3', question: 'Birga borishni eng ko‘p orzu qiladigan shahrimiz?', options: ['Parij', 'Istanbul', 'Samarqand', 'Rim'], correctIndex: 1 },
        { id: 'q4', question: 'Senda meni eng birinchi maftun qilgan narsa nima edi?', options: ['Tabassuming', 'Ovozing', 'Hazilkashliging', 'Hamma narsang'], correctIndex: 3 },
      ],
      views_count: 689,
      rsvps: [
        { guest_name: 'Nigora', phone: '', attendance: 'yes', guests_count: 1, wish_message: '4/4 topdim! Syurprizni kutyapman 😍', quiz_score: 100 },
      ],
    },
    {
      slug: 'demo-romantik-kecha',
      template_id: 'romantik-kecha',
      palette_id: 'romantik-starlight',
      event_type: 'anniversary',
      lang: 'ru',
      title: 'Наша годовщина любви',
      hero_names: 'Артём & Сабина',
      host_line: 'Ровно год вместе — приглашаю тебя на наш особенный вечер под звёздами',
      welcome_text:
        'Любимая, этот год рядом с тобой стал самым счастливым в моей жизни. Спасибо за каждое мгновение, за тепло и вдохновение. Давай отметим нашу годовщину там, где время остановится только для нас двоих.',
      event_date: futureDate(10),
      event_time: '20:00',
      venue_name: 'Панорамный ресторан «Sette»',
      venue_address: 'г. Ташкент, ул. Навои, 1А',
      map_url: 'https://yandex.uz/maps/?text=Tashkent+Hyatt+Sette',
      dress_code: 'Вечерний романтический образ',
      contact_phone: '',
      show_bismillah: 0,
      quote_text: '«Ты — моя любимая история, которую хочется перечитывать бесконечно.»',
      photo_url: '',
      program: [
        { id: '1', time: '20:00', title: 'Бокал шампанского на закате', description: 'Вид на вечерний город' },
        { id: '2', time: '20:45', title: 'Авторский ужин при свечах', description: 'Живая музыка и наши любимые песни' },
      ],
      quiz: [],
      views_count: 295,
      rsvps: [
        { guest_name: 'Сабина ❤️', phone: '', attendance: 'yes', guests_count: 1, wish_message: 'Считаю часы до нашего вечера!', quiz_score: null },
      ],
    },
    {
      slug: 'demo-bayram',
      template_id: 'bayram',
      palette_id: 'bayram-peach',
      event_type: 'birthday',
      lang: 'uz',
      title: 'Tug‘ilgan kun bayrami',
      hero_names: 'Madinaxon — 25 yosh!',
      host_line: 'Eng yaqin dugonalarim va do‘stlarimni bayram oqshomiga taklif etaman',
      welcome_text:
        'Aziz do‘stlarim! 25 yoshimni sizlar bilan birga quvnoq musiqa, mazali taomlar va chiroyli suratlar bilan nishonlashni juda xohlayman. Keling, unutilmas kecha o‘tkazamiz!',
      event_date: futureDate(14),
      event_time: '18:30',
      venue_name: '«L’Opera» restorani',
      venue_address: 'Toshkent sh., Taras Shevchenko ko‘chasi, 21',
      map_url: 'https://yandex.uz/maps/?text=Tashkent+Taras+Shevchenko',
      dress_code: 'Pastel va yorqin bahoriy ranglar',
      contact_phone: '+998 90 444 55 66',
      show_bismillah: 0,
      quote_text: 'Yangi yosh — yangi orzular va yorqin g‘alabalar sari!',
      photo_url: '',
      program: [
        { id: '1', time: '18:30', title: 'Welcome & Fotozona', description: 'Kokteyllar va suratga tushish' },
        { id: '2', time: '19:30', title: 'Bayram kechki ovqati', description: 'Tabriklar va o‘yinlar' },
        { id: '3', time: '21:00', title: 'Bayram torti va shamlar', description: 'Tilak aytish va raqslar' },
      ],
      quiz: [],
      views_count: 218,
      rsvps: [
        { guest_name: 'Zarina', phone: '+998 93 111 44 55', attendance: 'yes', guests_count: 1, wish_message: 'Tug‘ilgan kuning bilan, jonim! Albatta boraman 🎉', quiz_score: null },
      ],
    },
    {
      slug: 'demo-kechirim',
      template_id: 'kechirim',
      palette_id: 'kechirim-mist',
      event_type: 'apology',
      lang: 'uz',
      title: 'Chin yurakdan kechirim so‘rayman',
      hero_names: 'Meni kechir, azizim...',
      host_line: 'Xatoyimni tushundim va sening qalbingni ranjitganimdan juda afsusdaman',
      welcome_text:
        'Ba’zan o‘ylamay aytilgan bir og‘iz so‘z eng yaqin insonimizni xafa qilib qo‘yar ekan. Men sening qadringni juda yaxshi bilaman va tabassumingni yana ko‘rishni istayman. Iltimos, meni kechir — boshqa bunday takrorlanmaydi.',
      event_date: '',
      event_time: '',
      venue_name: '',
      venue_address: '',
      map_url: '',
      dress_code: '',
      contact_phone: '',
      show_bismillah: 0,
      quote_text: '«Kechirish — kuchli va mehribon qalblarning eng go‘zal fazilatidir.»',
      photo_url: '',
      program: [],
      quiz: [],
      views_count: 412,
      rsvps: [
        { guest_name: 'Madina', phone: '', attendance: 'yes', guests_count: 1, wish_message: 'Kechirdim ❤️ Endi meni xafa qilma!', quiz_score: null },
      ],
    },
    {
      slug: 'demo-rahmat',
      template_id: 'rahmat',
      palette_id: 'rahmat-honey',
      event_type: 'gratitude',
      lang: 'uz',
      title: 'Cheksiz minnatdorchilik xati',
      hero_names: 'Katta rahmat, Onajon!',
      host_line: 'Har bir duoingiz, mehringiz va qo‘llab-quvvatlashingiz uchun',
      welcome_text:
        'Hayotimdagi har bir yutug‘im, har bir quvonchim ortida sizning sabringiz, mehringiz va tunlari qilgan duolaringiz turibdi. So‘zlar kamlik qilsa-da, chin qalbimdan sizga cheksiz rahmat aytaman. Baxtimizga doimo sog‘-omon bo‘ling!',
      event_date: '',
      event_time: '',
      venue_name: '',
      venue_address: '',
      map_url: '',
      dress_code: '',
      contact_phone: '',
      show_bismillah: 0,
      quote_text: '«Shukur va minnatdorchilik bor joyda baraka hamisha ziyoda bo‘ladi.»',
      photo_url: '',
      program: [],
      quiz: [],
      views_count: 286,
      rsvps: [],
    },
    {
      slug: 'demo-sogindim',
      template_id: 'sogindim',
      palette_id: 'sogindim-twilight',
      event_type: 'miss_you',
      lang: 'ru',
      title: 'Письмо на расстоянии',
      hero_names: 'Очень скучаю по тебе...',
      host_line: 'Даже если нас разделяют километры — ты всегда в моих мыслях',
      welcome_text:
        'Каждый день без тебя кажется длиннее обычного. Вспоминаю наш смех, тёплые разговоры и жду того момента, когда мы снова обнимемся. Отправляю тебе это письмо, чтобы ты знал(а): ты для меня невероятно дорог(а)!',
      event_date: '',
      event_time: '',
      venue_name: '',
      venue_address: '',
      map_url: '',
      dress_code: '',
      contact_phone: '',
      show_bismillah: 0,
      quote_text: '«Расстояние лишь доказывает, насколько сильно ты нужен моему сердцу.»',
      photo_url: '',
      program: [],
      quiz: [],
      views_count: 341,
      rsvps: [],
    },
    {
      slug: 'demo-tabrik',
      template_id: 'tabrik',
      palette_id: 'tabrik-emerald',
      event_type: 'greeting',
      lang: 'uz',
      title: 'Samimiy tabrik va ezgu tilaklar',
      hero_names: 'Bayramingiz muborak!',
      host_line: 'Sizga va oilangizga eng pok niyatlar va baraka tilayman',
      welcome_text:
        'Ushbu muborak va quvonchli kunda xonadoningizga tinchlik, fayz-u baraka, dasturxoningizga to‘kinlik va qalbingizga abadiy xotirjamlik tilayman. Barcha ezgu orzularingiz ro‘yobga chiqsin!',
      event_date: '',
      event_time: '',
      venue_name: '',
      venue_address: '',
      map_url: '',
      dress_code: '',
      contact_phone: '',
      show_bismillah: 1,
      quote_text: '«Yaxshi so‘z va ezgu tilak — eng go‘zal hadyadir.»',
      photo_url: '',
      program: [],
      quiz: [],
      views_count: 263,
      rsvps: [],
    },
  ];

  for (const demo of demos) {
    const token = crypto.randomBytes(16).toString('hex');
    const inserted = await db.get<{ id: number }>(
      `INSERT INTO invitations (
        slug, edit_token, template_id, palette_id, event_type, lang, title,
        hero_names, host_line, welcome_text, event_date, event_time,
        venue_name, venue_address, map_url, dress_code, contact_phone,
        show_bismillah, quote_text, photo_url, program_json, quiz_json, views_count, is_demo
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, 1
      ) ON CONFLICT (slug) DO NOTHING RETURNING id`,
      [
        demo.slug,
        token,
        demo.template_id,
        demo.palette_id,
        demo.event_type,
        demo.lang,
        demo.title,
        demo.hero_names,
        demo.host_line,
        demo.welcome_text,
        demo.event_date,
        demo.event_time,
        demo.venue_name,
        demo.venue_address,
        demo.map_url,
        demo.dress_code,
        demo.contact_phone,
        demo.show_bismillah,
        demo.quote_text,
        demo.photo_url,
        JSON.stringify(demo.program),
        JSON.stringify(demo.quiz || []),
        demo.views_count,
      ]
    );

    if (inserted?.id) {
      for (const r of demo.rsvps) {
        await db.run(
          `INSERT INTO rsvps (invitation_id, guest_name, phone, attendance, guests_count, wish_message, quiz_score)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [inserted.id, r.guest_name, r.phone, r.attendance, r.guests_count, r.wish_message, r.quiz_score]
        );
      }
    }
  }
}
