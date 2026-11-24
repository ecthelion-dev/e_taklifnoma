export type Lang = 'uz' | 'ru';

export type TemplateCategory = 'wedding' | 'love' | 'emotions' | 'family';

export type TemplateId =
  | 'milliy'
  | 'klassik'
  | 'zamonaviy'
  | 'islomiy'
  | 'shohona'
  | 'sevgi-maktub'
  | 'sevgi-test'
  | 'romantik-kecha'
  | 'bayram'
  | 'kechirim'
  | 'rahmat'
  | 'sogindim'
  | 'tabrik';

export type EventType =
  | 'wedding'
  | 'nikoh'
  | 'xatna'
  | 'beshik'
  | 'birthday'
  | 'love_letter'
  | 'love_quiz'
  | 'romantic_date'
  | 'anniversary'
  | 'apology'
  | 'gratitude'
  | 'miss_you'
  | 'greeting'
  | 'other';

export interface ProgramItem {
  id: string;
  time: string;
  title: string;
  description?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ColorPalette {
  id: string;
  nameUz: string;
  nameRu: string;
  bg: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  muted: string;
  isDark?: boolean;
}

export interface InvitationData {
  id?: number;
  slug: string;
  templateId: TemplateId;
  paletteId: string;
  eventType: EventType;
  lang: Lang;
  title: string;
  heroNames: string;
  hostLine: string;
  welcomeText: string;
  eventDate: string; // YYYY-MM-DD (optional for personal cards)
  eventTime: string; // HH:mm
  venueName: string;
  venueAddress: string;
  mapUrl: string;
  dressCode: string;
  contactPhone: string;
  showBismillah: boolean;
  quoteText: string;
  photoUrl: string;
  program: ProgramItem[];
  quiz: QuizQuestion[];
  viewsCount?: number;
  rsvpCount?: number;
  goingCount?: number;
  totalGuests?: number;
  editToken?: string;
  telegramConnected?: boolean;
  isDemo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RsvpItem {
  id: number;
  invitationId: number;
  guestName: string;
  phone: string;
  attendance: 'yes' | 'no' | 'maybe';
  guestsCount: number;
  wishMessage: string;
  quizScore?: number | null;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
}
