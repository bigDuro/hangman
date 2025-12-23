import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const MAX_WRONG = 6;
const LS_KEY = "hangman_word_v1";

function normalizeWord(input) {
  return (input || "")
    .toUpperCase()
    .trim()
    .replace(/[^A-Z]/g, ""); // letters only
}

function loadWord() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const clean = normalizeWord(raw);
    return clean || "";
  } catch {
    return "";
  }
}

function saveWord(word) {
  try {
    localStorage.setItem(LS_KEY, word);
  } catch {
    // ignore
  }
}

function normalizeChar(c) {
  return (c || "").toUpperCase().replace(/[^A-Z]/g, "");
}

export default function App() {
  const [word, setWord] = useState(() => loadWord());
  const [guessed, setGuessed] = useState(() => new Set());
  const [wrong, setWrong] = useState(0);

  // Word UI
  const [draftWord, setDraftWord] = useState("");
  const [showWordPanel, setShowWordPanel] = useState(true);

  const letters = useMemo(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), []);
  const wordLetters = useMemo(() => (word ? word.split("") : []), [word]);

  const revealed = useMemo(() => {
    return wordLetters.map((ch) => (guessed.has(ch) ? ch : "_"));
  }, [wordLetters, guessed]);

  const hasWord = !!word;
  const isWin = useMemo(() => hasWord && revealed.every((ch) => ch !== "_"), [revealed, hasWord]);
  const isLose = useMemo(() => wrong >= MAX_WRONG, [wrong]);

  // persist word
  useEffect(() => {
    if (word) saveWord(word);
  }, [word]);

  function reset() {
    setGuessed(new Set());
    setWrong(0);
  }

  function setNewWord() {
    const clean = normalizeWord(draftWord);
    if (!clean) return;
    setWord(clean);
    setDraftWord("");
    reset();
    setShowWordPanel(false);
  }

  function clearWord() {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
    setWord("");
    setDraftWord("");
    reset();
    setShowWordPanel(true);
  }

  function guessLetter(letter) {
    if (!hasWord) return;
    if (isWin || isLose) return;
    if (guessed.has(letter)) return;

    setGuessed((prev) => {
      const next = new Set(prev);
      next.add(letter);
      return next;
    });

    if (!word.includes(letter)) setWrong((w) => w + 1);
  }

  // Keyboard support
  useEffect(() => {
    const onKeyDown = (e) => {
      const letter = normalizeChar(e.key);
      if (!letter) return;
      guessLetter(letter);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, guessed, wrong, isWin, isLose, hasWord]);

  return (
    <div className="App">
      <header className="header">
        <div className="headerRow">
          <div>
            <h1>Hangman</h1>
            <p className="sub">
              {hasWord ? (
                <>
                  Guess the word. You have <b>{MAX_WRONG - wrong}</b> tries left.
                </>
              ) : (
                <>Set a word to start playing.</>
              )}
            </p>
          </div>

          <button
            className="btn"
            onClick={() => setShowWordPanel((s) => !s)}
            title="Toggle word editor"
          >
            {showWordPanel ? "Hide Word" : "Set / Change Word"}
          </button>
        </div>
      </header>

      {showWordPanel && (
        <section className="card wordsCard">
          <div className="wordsHeader">
            <h2 className="h2">Word</h2>
            <div className="muted">Saved locally in your browser</div>
          </div>

          <div className="wordsControls">
            <input
              className="input"
              value={draftWord}
              onChange={(e) => setDraftWord(e.target.value)}
              placeholder="Enter the word (letters only)"
              onKeyDown={(e) => {
                if (e.key === "Enter") setNewWord();
              }}
            />
            <button className="btn" onClick={setNewWord}>
              {hasWord ? "Change" : "Set"}
            </button>
            <button className="btn danger" onClick={clearWord} disabled={!hasWord}>
              Clear
            </button>
          </div>

          <div className="wordsFooter">
            <div className="muted">
              Current: <b>{hasWord ? word : "—"}</b>
            </div>
            <button className="btn" onClick={reset} disabled={!hasWord}>
              Reset Game
            </button>
          </div>
        </section>
      )}

      <main className="card">
        <section className="top">
          <HangmanFigure wrong={wrong} />
          <div className="status">
            <div className="word">
              {(hasWord ? revealed : ["_"]).map((ch, idx) => (
                <span key={idx} className="slot">
                  {ch}
                </span>
              ))}
            </div>

            <div className="meta">
              <div>
                Wrong: <b>{wrong}</b> / {MAX_WRONG}
              </div>
              <div className="guessed">
                Guessed:{" "}
                {[...guessed].sort().join(", ") || <span className="muted">none</span>}
              </div>
            </div>

            <div className="banner">
              {!hasWord && <div className="lose">✍️ Set a word above to play.</div>}
              {hasWord && isWin && <div className="win">✅ You win!</div>}
              {hasWord && isLose && <div className="lose">💀 You lose. Word was: {word}</div>}
            </div>

            <div className="actions">
              <button className="btn" onClick={reset} disabled={!hasWord}>
                New Game (same word)
              </button>
            </div>
          </div>
        </section>

        <section className="keyboard">
          {letters.map((l) => {
            const used = guessed.has(l);
            const correct = used && word.includes(l);
            const wrongGuess = used && hasWord && !word.includes(l);

            return (
              <button
                key={l}
                className={[
                  "key",
                  used ? "used" : "",
                  correct ? "correct" : "",
                  wrongGuess ? "wrong" : "",
                ].join(" ")}
                onClick={() => guessLetter(l)}
                disabled={!hasWord || used || isWin || isLose}
              >
                {l}
              </button>
            );
          })}
        </section>
      </main>

      <footer className="footer">
        <span className="muted">Tip: use your keyboard</span>
      </footer>
    </div>
  );
}

function HangmanFigure({ wrong }) {
  const parts = {
    head: wrong >= 1,
    body: wrong >= 2,
    leftArm: wrong >= 3,
    rightArm: wrong >= 4,
    leftLeg: wrong >= 5,
    rightLeg: wrong >= 6,
  };

  return (
    <div className="figure" aria-label="hangman figure">
      <div className="gallows">
        <div className="beam" />
        <div className="rope" />
        <div className="post" />
        <div className="base" />
      </div>

      <div className="person">
        {parts.head && <div className="head" />}
        {parts.body && <div className="body" />}
        {parts.leftArm && <div className="arm left" />}
        {parts.rightArm && <div className="arm right" />}
        {parts.leftLeg && <div className="leg left" />}
        {parts.rightLeg && <div className="leg right" />}
      </div>
    </div>
  );
}
