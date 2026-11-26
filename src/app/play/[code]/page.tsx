"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { CenterMsg, Confetti, Leaderboard, Podium, ReadyBar, Spinner, TimerRing, TopBar } from "@/components/game-ui";
import { AnswerMark, AnswerTile, ANSWER_COLORS } from "@/components/answers";
import { Avatar, AvatarPicker, randomAvatar } from "@/components/avatar";
import { Shape, ShapeBackdrop } from "@/components/shapes";
import { api, ApiError, store, usePoll, useServerClock } from "@/lib/client";
import { tr, trList } from "@/lib/l10n";
import type { PlayerView } from "@/lib/types";

type Session = { pid: string; token: string };

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const { t, lang } = useLang();
  const sessionStore = store<Session>(`player:${code}`);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [picked, setPicked] = useState<{ q: number; c: number } | null>(null);
  const [answerErr, setAnswerErr] = useState("");

  useEffect(() => {
    setSession(store<Session>(`player:${code}`).get());
  }, [code]);

  const { data, error } = usePoll<PlayerView>(
    () => api<PlayerView>(`/api/rooms/${code}${session ? `?pid=${session.pid}` : ""}`),
    1000,
    session !== undefined,
  );
  const now = useServerClock(data?.now);

  if (session === undefined) return null;
  if (error?.status === 404)
    return (
      <>
        <TopBar compact />
        <CenterMsg icon="search_off" title={t.roomNotFound}>
          <Link href="/" className="btn-filled mt-2">
            {t.home}
          </Link>
        </CenterMsg>
      </>
    );
  if (!data)
    return (
      <div className="min-h-dvh grid place-items-center">
        <Spinner />
      </div>
    );

  if (data.kicked && session)
    return (
      <>
        <TopBar compact />
        <CenterMsg icon="person_remove" title={t.kicked}>
          <button
            className="btn-filled mt-2"
            onClick={() => {
              sessionStore.del();
              setSession(null);
            }}
          >
            {t.join}
          </button>
        </CenterMsg>
      </>
    );

  if (!session || !data.me) {
    if (data.phase === "finished")
      return (
        <>
          <TopBar compact />
          <CenterMsg icon="flag" title={t.roomFinished}>
            <Link href="/" className="btn-filled mt-2">
              {t.home}
            </Link>
          </CenterMsg>
        </>
      );
    return (
      <JoinForm
        code={code}
        onJoined={(s) => {
          sessionStore.set(s);
          setSession(s);
        }}
      />
    );
  }

  const me = data.me;
  const q = data.question;
  const opts = q ? trList(q.options, lang) : [];
  const answeredThis = me.answered || (picked && picked.q === data.qIndex);
  const myChoice = picked && picked.q === data.qIndex ? picked.c : null;

  const answer = async (c: number) => {
    if (!session) return;
    setPicked({ q: data.qIndex, c });
    setAnswerErr("");
    if (navigator.vibrate) navigator.vibrate(30);
    try {
      await api(`/api/rooms/${code}/answer`, {
        method: "POST",
        json: { pid: session.pid, token: session.token, qIndex: data.qIndex, choice: c },
      });
    } catch (e) {
      if (e instanceof ApiError && e.code === "too_late") setAnswerErr(t.tooLate);
    }
  };

  const bar = (
    <header className="flex items-center gap-2 px-3 h-16">
      <Avatar a={me.avatar} size={40} />
      <span className="title truncate max-w-[30vw]">{me.name}</span>
      <div className="flex-1" />
      {data.phase !== "lobby" && (
        <span className="chip tabular-nums" data-on="true">
          <span className="icon fill text-[18px]">star</span>
          {(me.entry?.score ?? me.score).toLocaleString("ru-RU")}
        </span>
      )}
      <LangMini />
    </header>
  );

  /* ─── Lobbi ─── */
  if (data.phase === "lobby")
    return (
      <div className="min-h-dvh flex flex-col">
        <ShapeBackdrop />
        {bar}
        <main className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="relative w-44 h-44 grid place-items-center anim-pop">
            <Shape name="cookie12" className="absolute inset-0 text-primary-container anim-spin-slow" />
            <Avatar a={me.avatar} size={128} className="relative anim-pulse" />
          </div>
          <h1 className="display text-4xl">{t.youreIn}</h1>
          <p className="text-lg text-on-surface-variant">{t.seeName}</p>
          <p className="title text-on-surface-variant flex items-center gap-2">
            <span className="icon animate-spin" style={{ animationDuration: "3s" }}>
              progress_activity
            </span>
            {t.waitHost}
          </p>
          {data.lobby && data.lobby.length > 1 && (
            <div className="flex flex-wrap justify-center gap-1 max-w-md mt-4">
              {data.lobby
                .filter((p) => p.id !== me.id)
                .slice(0, 30)
                .map((p) => (
                  <Avatar key={p.id} a={p.avatar} size={36} className="anim-pop" />
                ))}
              <span className="w-full label text-sm text-on-surface-variant mt-1">
                {data.playerCount} {t.players}
              </span>
            </div>
          )}
        </main>
      </div>
    );

  /* ─── Savol ─── */
  if (data.phase === "question" && q) {
    const ready = now < data.qStartAt;
    const remaining = data.qEndsAt - now;
    if (ready)
      return (
        <div className="min-h-dvh flex flex-col">
          {bar}
          <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
            <span className="chip" data-on="true">
              {t.question} {data.qIndex + 1}/{data.total}
            </span>
            <h1 className="headline text-3xl text-balance anim-pop">{tr(q.text, lang)}</h1>
            <div className="w-full max-w-sm">
              <ReadyBar remainingMs={data.qStartAt - now} totalMs={4000} />
            </div>
            <p className="label text-primary">{t.getReady}</p>
          </main>
        </div>
      );

    if (answeredThis)
      return (
        <div className="min-h-dvh flex flex-col">
          {bar}
          <main className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
            {myChoice != null ? (
              <div
                className="w-40 h-40 rounded-[48px] grid place-items-center anim-pop shadow-xl"
                style={{ background: ANSWER_COLORS[data.theme][myChoice] }}
              >
                <AnswerMark theme={data.theme} index={myChoice} className="w-24 h-24 anim-spin-slow" />
              </div>
            ) : (
              <span className="icon fill text-primary anim-pop" style={{ fontSize: 96 }}>
                task_alt
              </span>
            )}
            <h1 className="display text-3xl">{answerErr || t.answerSent}</h1>
            <p className="text-on-surface-variant title">{t.waitOthers}</p>
            <TimerRing remainingMs={remaining} totalMs={q.time * 1000} size={72} />
          </main>
        </div>
      );

    return (
      <div className="min-h-dvh flex flex-col">
        {bar}
        <main className="flex-1 flex flex-col gap-3 p-3 pb-4">
          <div className="flex items-center gap-3 card-elev p-3 pl-4">
            <p className="title text-lg leading-snug flex-1">{tr(q.text, lang)}</p>
            <TimerRing remainingMs={remaining} totalMs={q.time * 1000} size={60} />
          </div>
          {q.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.image} alt="" className="max-h-[22vh] mx-auto rounded-[24px] object-contain" />
          )}
          <div className={`flex-1 grid gap-3 ${opts.length > 2 ? "grid-cols-2 grid-rows-2" : "grid-cols-1 grid-rows-2"}`}>
            {opts.map((o, i) => (
              <AnswerTile
                key={i}
                theme={data.theme}
                index={i}
                text={o}
                size="md"
                onClick={() => answer(i)}
                disabled={remaining <= 0}
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* ─── Natija (to'g'ri/noto'g'ri) ─── */
  if (data.phase === "reveal" && q) {
    const e = me.entry;
    const ok = e?.lastCorrect === true;
    const none = e?.lastCorrect == null;
    const iAmFastest = data.fastest?.id === me.id;
    return (
      <div
        className={`min-h-dvh flex flex-col ${
          ok ? "bg-success-container text-on-success-container" : none ? "bg-surface-high" : "bg-error-container text-on-error-container"
        }`}
      >
        {bar}
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="relative w-36 h-36 grid place-items-center anim-pop">
            <Shape name={ok ? "burst" : "cookie9"} className={`absolute inset-0 ${ok ? "text-success" : none ? "text-outline" : "text-error"} anim-spin-slow`} />
            <span className="icon fill relative text-white" style={{ fontSize: 72 }}>
              {ok ? "check" : none ? "schedule" : "close"}
            </span>
          </div>
          <h1 className="display text-5xl">{ok ? t.correct : none ? t.noAnswer : t.wrong}</h1>
          {ok && <p className="display text-4xl tabular-nums anim-pop">+{e?.lastPoints.toLocaleString("ru-RU")}</p>}
          {ok && e && e.streak >= 2 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-4 h-10 title">
              <span className="icon fill text-[#ff7a00]">local_fire_department</span>
              {e.streak} {t.streak}
            </span>
          )}
          {iAmFastest && (
            <span className="inline-flex items-center gap-1 rounded-full bg-tertiary text-on-tertiary px-4 h-10 title anim-pop">
              <span className="icon fill">bolt</span>
              {t.fastest}!
            </span>
          )}
          {!ok && q.correct != null && (
            <div className="w-full max-w-sm mt-2">
              <p className="label mb-2 opacity-80">{t.correctAnswer}</p>
              <AnswerTile theme={data.theme} index={q.correct} text={opts[q.correct]} />
            </div>
          )}
          {e && (
            <p className="title text-xl mt-2">
              {lang === "ru" ? `${t.youAre} ${e.rank} ${t.place}` : `${t.youAre} ${e.rank}-${t.place}`}
            </p>
          )}
        </main>
      </div>
    );
  }

  /* ─── Reyting ─── */
  if (data.phase === "leaderboard") {
    const e = me.entry;
    return (
      <div className="min-h-dvh flex flex-col">
        <ShapeBackdrop />
        {bar}
        <main className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          {e && (
            <>
              <div className="relative w-40 h-40 grid place-items-center anim-pop">
                <Shape name="clover4" className="absolute inset-0 text-primary anim-spin-slow" />
                <span className="relative display text-6xl text-on-primary">{e.rank}</span>
              </div>
              <p className="title text-xl">
                {lang === "ru" ? `${t.youAre} ${e.rank} ${t.place}` : `${t.youAre} ${e.rank}-${t.place}`}
              </p>
              <p className="display text-4xl tabular-nums">{e.score.toLocaleString("ru-RU")}</p>
              <p className="text-on-surface-variant title">
                {data.ahead ? `${(data.ahead.score - e.score).toLocaleString("ru-RU")} ${t.behind} ${data.ahead.name}` : t.leader}
              </p>
            </>
          )}
        </main>
      </div>
    );
  }

  /* ─── Yakun ─── */
  const e = me.entry;
  const top3 = e && e.rank <= 3;
  return (
    <div className="min-h-dvh flex flex-col">
      {top3 && <Confetti />}
      <ShapeBackdrop dense />
      {bar}
      <main className="flex-1 flex flex-col items-center gap-5 p-6 text-center">
        <h1 className="display text-4xl anim-pop">{t.gameOver}</h1>
        {e && (
          <div className="rounded-[40px] bg-primary text-on-primary px-8 py-6 anim-pop w-full max-w-sm">
            <p className="label opacity-80">{t.finalPlace}</p>
            <p className="display text-7xl">
              {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-3xl bg-on-primary/15 p-3">
                <div className="headline text-2xl tabular-nums">{e.score.toLocaleString("ru-RU")}</div>
                <div className="label text-xs opacity-80">{t.score}</div>
              </div>
              <div className="rounded-3xl bg-on-primary/15 p-3">
                <div className="headline text-2xl tabular-nums">
                  {e.correctCount}/{data.total}
                </div>
                <div className="label text-xs opacity-80">{t.correctCount}</div>
              </div>
            </div>
          </div>
        )}
        <div className="w-full mt-4">
          <Podium entries={data.top} />
        </div>
        {data.top.length > 3 && (
          <div className="w-full max-w-md text-left">
            <Leaderboard entries={data.top.slice(3)} meId={me.id} />
          </div>
        )}
        <p className="title text-on-surface-variant">{t.thanks}</p>
        <Link href="/" className="btn-filled">
          <span className="icon">home</span>
          {t.home}
        </Link>
      </main>
    </div>
  );
}

function LangMini() {
  const { lang, setLang } = useLang();
  return (
    <button className="icon-btn !w-auto px-3 label text-sm" onClick={() => setLang(lang === "uz" ? "ru" : "uz")}>
      <span className="icon text-[20px]">translate</span>
      <span className="ml-1">{lang === "uz" ? "RU" : "UZ"}</span>
    </button>
  );
}

function JoinForm({ code, onJoined }: { code: string; onJoined: (s: Session) => void }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAvatar(randomAvatar());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setErr(t.nameShort);
    if (!avatar) return;
    setBusy(true);
    setErr("");
    try {
      const r = await api<Session>(`/api/rooms/${code}/join`, { method: "POST", json: { name, avatar } });
      onJoined(r);
    } catch (e) {
      const c = e instanceof ApiError ? e.code : "";
      setErr(
        c === "name_taken" ? t.nameTaken : c === "full" ? t.roomFull : c === "finished" ? t.roomFinished : c === "name_short" ? t.nameShort : t.error,
      );
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <ShapeBackdrop />
      <TopBar compact />
      <main className="max-w-lg mx-auto px-4 pb-10">
        <form onSubmit={submit} className="card-elev p-5 sm:p-7 flex flex-col gap-5 anim-rise">
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 grid place-items-center shrink-0">
              <Shape name="cookie9" className="absolute inset-0 text-primary-container anim-spin-slow" />
              {avatar && <Avatar a={avatar} size={76} className="relative" key={avatar} />}
            </div>
            <div className="min-w-0">
              <p className="label text-on-surface-variant text-sm">{t.gamePin}</p>
              <p className="display text-4xl tabular-nums tracking-wider">
                {code.slice(0, 3)} {code.slice(3)}
              </p>
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="nm">
              {t.yourName}
            </label>
            <input
              id="nm"
              className="field text-lg"
              value={name}
              maxLength={20}
              autoComplete="nickname"
              placeholder={t.namePh}
              onChange={(e) => {
                setName(e.target.value);
                setErr("");
              }}
              autoFocus
            />
          </div>
          <div>
            <span className="field-label">{t.chooseAvatar}</span>
            {avatar && <AvatarPicker value={avatar} onChange={setAvatar} />}
          </div>
          {err && (
            <p className="text-error label flex items-center gap-1">
              <span className="icon text-[18px]">error</span>
              {err}
            </p>
          )}
          <button className="btn-filled btn-lg w-full" disabled={busy}>
            <span className="icon fill">sports_esports</span>
            {t.joinGame}
          </button>
        </form>
      </main>
    </div>
  );
}
