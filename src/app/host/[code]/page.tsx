"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { CenterMsg, Confetti, Leaderboard, Podium, ReadyBar, Spinner, TimerRing, TopBar } from "@/components/game-ui";
import { AnswerMark, AnswerTile, ANSWER_COLORS } from "@/components/answers";
import { Avatar } from "@/components/avatar";
import { ShapeBackdrop } from "@/components/shapes";
import { api, store, usePoll, useServerClock } from "@/lib/client";
import { tr, trList } from "@/lib/l10n";
import type { HostView, HostAction } from "@/lib/types";

export default function HostPage() {
  const { code } = useParams<{ code: string }>();
  const { t, lang } = useLang();
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(store<string>(`host:${code}`).get());
    setOrigin(window.location.origin);
  }, [code]);

  const { data, error, setData } = usePoll<HostView>(
    () => api<HostView>(`/api/rooms/${code}/host`, { headers: { "x-host-token": token ?? "" } }),
    1000,
    !!token,
  );
  const now = useServerClock(data?.now);

  const act = async (action: HostAction, arg?: string) => {
    if (!token) return;
    setBusy(true);
    try {
      const d = await api<HostView>(`/api/rooms/${code}/host`, {
        method: "POST",
        headers: { "x-host-token": token },
        json: { action, arg },
      });
      setData(d);
    } finally {
      setBusy(false);
    }
  };

  const joinUrl = `${origin}/play/${code}`;
  const altLang = lang === "uz" ? "ru" : "uz";

  if (token === undefined) return null;
  if (token === null || error?.status === 403)
    return (
      <>
        <TopBar compact />
        <CenterMsg icon="lock" title={t.hostLost}>
          <Link href="/create" className="btn-filled mt-2">
            {t.createRoom}
          </Link>
        </CenterMsg>
      </>
    );
  if (error?.status === 404)
    return (
      <>
        <TopBar compact />
        <CenterMsg icon="search_off" title={t.roomNotFound}>
          <Link href="/create" className="btn-filled mt-2">
            {t.createRoom}
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

  const { room, players, answered } = data;
  const q = room.qIndex >= 0 ? room.questions[room.qIndex] : null;
  const opts = q ? trList(q.options, lang) : [];
  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  const header = (
    <TopBar
      compact
      right={
        <>
          <span className="chip hidden md:inline-flex" data-on="true">
            <span className="icon text-[18px]">pin</span>
            {code.slice(0, 3)} {code.slice(3)}
          </span>
          <button className="icon-btn" onClick={fullscreen} title={t.fullscreen}>
            <span className="icon">fullscreen</span>
          </button>
        </>
      }
    />
  );

  /* ─────────────── LOBBI ─────────────── */
  if (room.phase === "lobby")
    return (
      <div className="min-h-dvh flex flex-col">
        <ShapeBackdrop dense />
        {header}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-8 flex flex-col gap-6">
          <section className="grid lg:grid-cols-[1fr_auto] gap-6 items-stretch">
            <div className="rounded-[40px] bg-primary text-on-primary p-6 sm:p-10 flex flex-col justify-center anim-rise overflow-hidden relative">
              <p className="title text-lg sm:text-xl opacity-90">
                {t.joinAt}{" "}
                <b className="underline decoration-2 underline-offset-4 break-all">{origin.replace(/^https?:\/\//, "")}</b>
              </p>
              <p className="label opacity-80 mt-6">{t.gamePin}</p>
              <p className="display text-7xl sm:text-8xl lg:text-9xl tracking-wider tabular-nums">
                {code.slice(0, 3)}
                <span className="opacity-50"> </span>
                {code.slice(3)}
              </p>
              <p className="title text-xl mt-4 opacity-90">{tr(room.title, lang)}</p>
              <div className="flex gap-2 mt-6 flex-wrap">
                <button
                  className="btn bg-on-primary text-primary"
                  onClick={() => {
                    navigator.clipboard?.writeText(joinUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                >
                  <span className="icon">{copied ? "check" : "link"}</span>
                  {copied ? t.copied : t.copyLink}
                </button>
              </div>
            </div>
            {origin && (
              <div className="card-elev p-5 grid place-items-center anim-pop">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(joinUrl)}`}
                  alt="QR"
                  width={240}
                  height={240}
                  className="rounded-2xl bg-white w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]"
                />
              </div>
            )}
          </section>

          <section className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container text-on-secondary-container h-14 px-6 headline text-2xl">
              <span className="icon fill">group</span>
              {players.length}
              <span className="title text-base">{t.players}</span>
            </span>
            <div className="flex-1" />
            <button className="btn-filled btn-lg" disabled={!players.length || busy} onClick={() => act("start")}>
              <span className="icon fill">play_arrow</span>
              {t.start}
            </button>
          </section>

          {players.length === 0 ? (
            <div className="flex-1 grid place-items-center text-on-surface-variant">
              <div className="flex flex-col items-center gap-3">
                <span className="icon text-[56px] animate-pulse">hourglass_top</span>
                <span className="title text-xl">{t.waitingPlayers}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center content-start">
              {players.map((p) => (
                <button
                  key={p.id}
                  title={t.kick}
                  onClick={() => confirm(`${t.kick}: ${p.name}?`) && act("kick", p.id)}
                  className="state group anim-pop inline-flex items-center gap-2 h-14 pl-1.5 pr-5 rounded-full bg-surface-high hover:line-through"
                >
                  <Avatar a={p.avatar} size={44} />
                  <span className="title text-lg">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );

  /* ─────────────── SAVOL ─────────────── */
  if (room.phase === "question" && q) {
    const ready = now < room.qStartAt;
    const remaining = room.qEndsAt - now;
    return (
      <div className="min-h-dvh flex flex-col">
        {header}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="chip" data-on="true">
              {t.question} {room.qIndex + 1}
              {t.of}
              {room.questions.length}
            </span>
            {q.points === 2000 && <span className="chip">⚡ {t.doublePoints}</span>}
            {q.points === 0 && <span className="chip">{t.noPoints}</span>}
            <div className="flex-1" />
            <button className="btn-text" onClick={() => act("reveal")} disabled={busy || ready}>
              {t.skip}
              <span className="icon">skip_next</span>
            </button>
          </div>

          {ready ? (
            <div className="flex-1 grid place-items-center">
              <div className="w-full max-w-4xl text-center anim-pop">
                <p className="label text-primary text-lg mb-4">{t.getReady}</p>
                <h1 className="display text-4xl sm:text-6xl text-balance">{tr(q.text, lang)}</h1>
                <p className="title text-xl sm:text-2xl text-on-surface-variant mt-4">{tr(q.text, altLang)}</p>
                <div className="mt-10 max-w-xl mx-auto">
                  <ReadyBar remainingMs={room.qStartAt - now} totalMs={4000} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="card-elev px-6 py-5 text-center anim-rise">
                <h1 className="headline text-3xl sm:text-4xl text-balance">{tr(q.text, lang)}</h1>
                <p className="title text-lg text-on-surface-variant mt-1">{tr(q.text, altLang)}</p>
              </div>
              <div className="flex-1 grid grid-cols-[auto_1fr_auto] items-center gap-4 min-h-40">
                <TimerRing remainingMs={remaining} totalMs={q.time * 1000} size={120} />
                <div className="grid place-items-center h-full">
                  {q.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={q.image} alt="" className="max-h-[32vh] max-w-full rounded-[28px] object-contain anim-pop" />
                  ) : (
                    <div className="flex -space-x-3">
                      {players.slice(0, 8).map((p) => (
                        <Avatar key={p.id} a={p.avatar} size={48} className="ring-4 ring-surface" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid place-items-center w-[120px] h-[120px] rounded-[36px] bg-secondary-container text-on-secondary-container">
                  <div className="text-center">
                    <div className="display text-5xl tabular-nums">{answered}</div>
                    <div className="label text-sm">{t.answers}</div>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {opts.map((o, i) => (
                  <AnswerTile key={i} theme={room.theme} index={i} text={o} size="lg" />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  /* ─────────────── NATIJA ─────────────── */
  if (room.phase === "reveal" && q) {
    const max = Math.max(1, ...room.stats);
    const isLast = room.qIndex + 1 >= room.questions.length;
    return (
      <div className="min-h-dvh flex flex-col">
        {header}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pb-6 flex flex-col gap-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="chip" data-on="true">
              {t.question} {room.qIndex + 1}
              {t.of}
              {room.questions.length}
            </span>
            {room.answeredInfo && (
              <span className="chip">
                {room.answeredInfo.answered}/{room.answeredInfo.total} {t.answeredOf}
              </span>
            )}
            <div className="flex-1" />
            <button className="btn-tonal" onClick={() => act("board")} disabled={busy}>
              <span className="icon">leaderboard</span>
              {t.showBoard}
            </button>
            <button className="btn-filled" onClick={() => act("next")} disabled={busy}>
              {isLast ? t.results : t.next}
              <span className="icon">{isLast ? "emoji_events" : "arrow_forward"}</span>
            </button>
          </div>
          <div className="card-elev px-6 py-5 text-center">
            <h1 className="headline text-3xl sm:text-4xl text-balance">{tr(q.text, lang)}</h1>
          </div>

          <div className="flex-1 grid lg:grid-cols-[1fr_320px] gap-5 items-end">
            <div className="flex items-end justify-center gap-4 sm:gap-8 h-[30vh] min-h-48">
              {room.stats.map((n, i) => (
                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end w-20 sm:w-28">
                  <span className="headline text-3xl tabular-nums flex items-center gap-1">
                    {i === q.correct && <span className="icon fill text-success text-[32px]">check_circle</span>}
                    {n}
                  </span>
                  <div
                    className={`w-full rounded-t-[24px] origin-bottom ${i !== q.correct ? "opacity-40" : ""}`}
                    style={{
                      height: `${Math.max(6, (n / max) * 100)}%`,
                      background: ANSWER_COLORS[room.theme][i],
                      animation: "podium 700ms var(--spring) both",
                      animationDelay: `${i * 90}ms`,
                    }}
                  />
                  <span className="grid place-items-center w-full h-14 rounded-2xl" style={{ background: ANSWER_COLORS[room.theme][i] }}>
                    <AnswerMark theme={room.theme} index={i} className="w-8 h-8" />
                  </span>
                </div>
              ))}
            </div>
            {room.fastest && (
              <div className="rounded-[36px] bg-tertiary-container text-on-tertiary-container p-5 flex items-center gap-4 anim-pop">
                <Avatar a={room.fastest.avatar} size={64} />
                <div className="min-w-0">
                  <div className="label text-sm flex items-center gap-1">
                    <span className="icon fill text-[18px]">bolt</span>
                    {t.fastest}
                  </div>
                  <div className="headline text-xl truncate">{room.fastest.name}</div>
                  <div className="label opacity-80 tabular-nums">
                    {(room.fastest.ms / 1000).toFixed(2)} {t.sec}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {opts.map((o, i) => (
              <AnswerTile key={i} theme={room.theme} index={i} text={o} state={i === q.correct ? "correct" : "dim"} count={room.stats[i]} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* ─────────────── REYTING ─────────────── */
  if (room.phase === "leaderboard") {
    const isLast = room.qIndex + 1 >= room.questions.length;
    return (
      <div className="min-h-dvh flex flex-col">
        <ShapeBackdrop />
        {header}
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pb-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <h1 className="display text-4xl sm:text-5xl flex-1">{t.leaderboard}</h1>
            <button className="btn-filled btn-lg" onClick={() => act("next")} disabled={busy}>
              {isLast ? t.results : t.next}
              <span className="icon">{isLast ? "emoji_events" : "arrow_forward"}</span>
            </button>
          </div>
          <Leaderboard entries={room.board.slice(0, 5)} big />
        </main>
      </div>
    );
  }

  /* ─────────────── YAKUN ─────────────── */
  return (
    <FinishedHost board={room.board} header={header} t={t} />
  );
}

function FinishedHost({
  board,
  header,
  t,
}: {
  board: HostView["room"]["board"];
  header: React.ReactNode;
  t: ReturnType<typeof useLang>["t"];
}) {
  const rest = useMemo(() => board.slice(3, 12), [board]);
  return (
    <div className="min-h-dvh flex flex-col">
      <Confetti />
      <ShapeBackdrop dense />
      {header}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pb-10 flex flex-col gap-8">
        <h1 className="display text-5xl sm:text-6xl text-center anim-pop">{t.podium}</h1>
        <Podium entries={board} />
        {rest.length > 0 && (
          <div className="max-w-2xl w-full mx-auto">
            <Leaderboard entries={rest} />
          </div>
        )}
        <div className="flex justify-center gap-3">
          <Link href="/create" className="btn-filled btn-lg">
            <span className="icon">replay</span>
            {t.newGame}
          </Link>
          <Link href="/" className="btn-outlined btn-lg">
            <span className="icon">home</span>
            {t.home}
          </Link>
        </div>
      </main>
    </div>
  );
}
