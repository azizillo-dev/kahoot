"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/components/LangProvider";
import { CenterMsg, Confetti, Spinner, TimerRing, TopBar } from "@/components/game-ui";
import { AnswerTile, type AnswerTheme, type TileState } from "@/components/answers";
import { Shape, ShapeBackdrop } from "@/components/shapes";
import { api } from "@/lib/client";
import { tr, trList } from "@/lib/l10n";
import type { Question, Section } from "@/lib/types";

type Data = { section: Section; questions: Question[]; settings: { answerTheme: AnswerTheme } };

function shuffle<T>(a: T[]) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export default function PracticeGame() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLang();
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const [qs, setQs] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [startAt, setStartAt] = useState(0);
  const [now, setNow] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastPts, setLastPts] = useState(0);
  const [done, setDone] = useState(false);

  const begin = useCallback((d: Data) => {
    setQs(shuffle(d.questions));
    setIdx(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setChoice(null);
    setTimedOut(false);
    setDone(false);
    setStartAt(Date.now());
  }, []);

  useEffect(() => {
    api<Data>(`/api/sections/${id}/questions`)
      .then((d) => {
        setData(d);
        begin(d);
      })
      .catch(() => setFailed(true));
  }, [id, begin]);

  const q = qs[idx];
  const answered = choice != null || timedOut;

  useEffect(() => {
    if (!q || answered || done) return;
    const tm = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n - startAt >= q.time * 1000) setTimedOut(true);
    }, 100);
    return () => clearInterval(tm);
  }, [q, answered, done, startAt]);

  if (failed)
    return (
      <>
        <TopBar compact />
        <CenterMsg icon="search_off" title={t.error} />
      </>
    );
  if (!data)
    return (
      <div className="min-h-dvh grid place-items-center">
        <Spinner />
      </div>
    );
  if (!qs.length)
    return (
      <>
        <TopBar compact />
        <CenterMsg icon="quiz" title={t.noQuestions}>
          <Link href="/practice" className="btn-filled">
            {t.chooseOther}
          </Link>
        </CenterMsg>
      </>
    );

  const theme = data.settings.answerTheme;

  if (done) {
    const pct = correctCount / qs.length;
    return (
      <div className="min-h-dvh">
        {pct >= 0.7 && <Confetti />}
        <ShapeBackdrop dense />
        <TopBar compact />
        <main className="max-w-md mx-auto px-4 pb-10 flex flex-col items-center gap-5 text-center">
          <p className="title text-on-surface-variant mt-4">{tr(data.section.title, lang)}</p>
          <div className="relative w-56 h-56 grid place-items-center anim-pop">
            <Shape name="cookie12" className="absolute inset-0 text-primary anim-spin-slow" />
            <div className="relative text-on-primary">
              <div className="display text-6xl">
                {correctCount}/{qs.length}
              </div>
              <div className="label opacity-90">{t.correctCount}</div>
            </div>
          </div>
          <div className="rounded-[28px] bg-tertiary-container text-on-tertiary-container px-6 py-4">
            <div className="label text-sm">{t.yourScore}</div>
            <div className="display text-4xl tabular-nums">{score.toLocaleString("ru-RU")}</div>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <button className="btn-filled btn-lg" onClick={() => begin(data)}>
              <span className="icon">replay</span>
              {t.again}
            </button>
            <Link href="/practice" className="btn-outlined btn-lg">
              {t.chooseOther}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const opts = trList(q.options, lang);
  const remaining = Math.max(0, q.time * 1000 - (now - startAt));

  const pick = (i: number) => {
    if (answered) return;
    const ms = Date.now() - startAt;
    setChoice(i);
    if (i === q.correct) {
      const s = streak + 1;
      const tFrac = Math.min(ms / (q.time * 1000), 1);
      const pts = q.points ? Math.round(q.points * (1 - tFrac / 2)) + Math.min(s - 1, 5) * 100 * (q.points / 1000) : 0;
      setStreak(s);
      setScore((x) => x + pts);
      setLastPts(pts);
      setCorrectCount((x) => x + 1);
    } else {
      setStreak(0);
      setLastPts(0);
    }
  };

  const next = () => {
    if (idx + 1 >= qs.length) return setDone(true);
    setIdx(idx + 1);
    setChoice(null);
    setTimedOut(false);
    setStartAt(Date.now());
    setNow(Date.now());
  };

  const stateFor = (i: number): TileState => {
    if (!answered) return "idle";
    if (i === q.correct) return "correct";
    if (i === choice) return "wrong";
    return "dim";
  };
  const ok = choice === q.correct;

  return (
    <div className="min-h-dvh flex flex-col">
      <TopBar
        compact
        right={
          <span className="chip tabular-nums" data-on="true">
            <span className="icon fill text-[18px]">star</span>
            {score.toLocaleString("ru-RU")}
          </span>
        }
      />
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 pb-6 flex flex-col gap-4">
        <div className="h-2 rounded-full bg-surface-highest overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(idx / qs.length) * 100}%` }} />
        </div>
        <div className="flex items-center gap-4 card-elev p-4 sm:p-6 anim-rise" key={q.id}>
          <div className="flex-1">
            <span className="label text-sm text-primary">
              {t.question} {idx + 1}/{qs.length}
            </span>
            <h1 className="headline text-2xl sm:text-3xl mt-1">{tr(q.text, lang)}</h1>
          </div>
          <TimerRing remainingMs={answered ? 0 : remaining} totalMs={q.time * 1000} size={72} />
        </div>
        {q.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.image} alt="" className="max-h-[26vh] mx-auto rounded-[24px] object-contain" />
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {opts.map((o, i) => (
            <AnswerTile key={i} theme={theme} index={i} text={o} state={stateFor(i)} onClick={() => pick(i)} disabled={answered} size="lg" />
          ))}
        </div>
        {answered && (
          <div
            className={`rounded-[28px] p-4 flex items-center gap-3 anim-pop ${
              ok ? "bg-success-container text-on-success-container" : "bg-error-container text-on-error-container"
            }`}
          >
            <span className="icon fill text-[32px]">{ok ? "check_circle" : timedOut && choice == null ? "schedule" : "cancel"}</span>
            <span className="headline text-xl flex-1">
              {ok ? `${t.correct} +${lastPts}` : timedOut && choice == null ? t.timeUp : t.wrong}
              {ok && streak >= 2 && <span className="title text-base ml-2">🔥 {streak} {t.streak}</span>}
            </span>
            <button className="btn-filled" onClick={next} autoFocus>
              {idx + 1 >= qs.length ? t.results : t.next}
              <span className="icon">arrow_forward</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
