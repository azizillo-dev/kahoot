export type Lang = "uz" | "ru";
export type L10n = { uz: string; ru: string };
export type L10nList = { uz: string[]; ru: string[] };

export interface Section {
  id: string;
  title: L10n;
  description: L10n;
  icon: string; // Material Symbols nomi
  color: number; // 0..5 palitra indeksi
  order: number;
  createdAt: number;
}

export interface Question {
  id: string;
  sectionId: string;
  text: L10n;
  options: L10nList;
  correct: number;
  time: number; // soniya
  points: number; // 0 | 1000 | 2000
  image?: string;
  order: number;
  createdAt: number;
}

export type Phase = "lobby" | "question" | "reveal" | "leaderboard" | "finished";

export interface RoomQuestion {
  text: L10n;
  options: L10nList;
  correct: number;
  time: number;
  points: number;
  image?: string;
}

export interface BoardEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  prevRank: number;
  lastPoints: number;
  lastCorrect: boolean | null; // null = javob bermagan
  lastChoice: number | null;
  streak: number;
  correctCount: number;
}

export interface Room {
  code: string;
  hostToken: string;
  title: L10n;
  createdAt: number;
  phase: Phase;
  qIndex: number;
  qStartAt: number; // javob variantlari ochiladigan vaqt
  qEndsAt: number;
  questions: RoomQuestion[];
  board: BoardEntry[];
  stats: number[]; // oxirgi savol bo'yicha har variantga javoblar soni
  revealedIndex: number; // qaysi savol hisoblangan
  theme: "classic" | "space";
  fastest: { id: string; name: string; avatar: string; ms: number } | null; // eng tez to'g'ri javob
  answeredInfo: { answered: number; total: number } | null;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  token: string;
  score: number;
  streak: number;
  correctCount: number;
  joinedAt: number;
}

export interface AnswerRec {
  choice: number;
  ms: number;
}

/** O'yinchiga yuboriladigan xavfsiz ko'rinish (to'g'ri javob savol davomida yashiriladi). */
export interface PublicQuestion {
  text: L10n;
  options: L10nList;
  time: number;
  points: number;
  image?: string;
  correct?: number;
}

export interface PlayerView {
  now: number;
  phase: Phase;
  title: L10n;
  qIndex: number;
  total: number;
  qStartAt: number;
  qEndsAt: number;
  theme: "classic" | "space";
  question: PublicQuestion | null;
  stats: number[] | null;
  fastest: Room["fastest"];
  me: (Omit<Player, "token"> & { answered: boolean; entry: BoardEntry | null }) | null;
  top: BoardEntry[];
  ahead: { name: string; score: number } | null;
  lobby: { id: string; name: string; avatar: string }[] | null;
  playerCount: number;
  kicked?: boolean;
}

export interface HostView {
  now: number;
  room: Omit<Room, "hostToken">;
  players: { id: string; name: string; avatar: string; score: number }[];
  answered: number;
}

export type HostAction = "start" | "reveal" | "board" | "next" | "finish" | "kick";
