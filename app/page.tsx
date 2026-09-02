"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  CircleAlert,
  Layers3,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type BankSummary = { id: string; code: string; name: string; file: string };
type Question = { id: string; text: string; options: string[]; correctOption: number };
type Bank = BankSummary & { program?: string; questions: Question[] };
type QuizQuestion = Question & { bankId: string; bankCode: string; bankName: string };
type Manifest = {
  expectedBanks: number;
  fullPracticeSize: number;
  minimumPerBank: number;
  reviewSize: number;
  banks: BankSummary[];
};

const letters = ["A", "B", "C", "D"];

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function addBankContext(bank: Bank, questions: Question[]): QuizQuestion[] {
  return questions.map((question) => ({
    ...question,
    bankId: bank.id,
    bankCode: bank.code,
    bankName: bank.name,
  }));
}

function createFullPractice(banks: Bank[], size: number, minimum: number) {
  const selected: QuizQuestion[] = [];
  const unused: QuizQuestion[] = [];
  banks.forEach((bank) => {
    const randomized = shuffle(bank.questions);
    selected.push(...addBankContext(bank, randomized.slice(0, minimum)));
    unused.push(...addBankContext(bank, randomized.slice(minimum)));
  });
  selected.push(...shuffle(unused).slice(0, Math.max(0, size - selected.length)));
  return shuffle(selected);
}

function createBankReview(bank: Bank, size: number) {
  return addBankContext(bank, shuffle(bank.questions).slice(0, size));
}

export default function Home() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [screen, setScreen] = useState<"home" | "quiz" | "results">("home");
  const [mode, setMode] = useState<"full" | "review">("review");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function loadBanks() {
      try {
        const manifestResponse = await fetch("/data/banks.json");
        if (!manifestResponse.ok) throw new Error("No se pudo leer el catálogo");
        const nextManifest = (await manifestResponse.json()) as Manifest;
        const loadedBanks = await Promise.all(
          nextManifest.banks.map(async (summary) => {
            const response = await fetch(summary.file);
            if (!response.ok) throw new Error(`No se pudo leer ${summary.file}`);
            return (await response.json()) as Bank;
          }),
        );
        setManifest(nextManifest);
        setBanks(loadedBanks);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
    loadBanks();
  }, []);

  const fullPracticeReady = Boolean(
    manifest &&
      banks.length === manifest.expectedBanks &&
      banks.every((bank) => bank.questions.length >= manifest.minimumPerBank) &&
      banks.reduce((total, bank) => total + bank.questions.length, 0) >= manifest.fullPracticeSize,
  );

  const currentQuestion = quiz[current];
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const answeredCount = Object.keys(answers).length;

  const report = useMemo(() => {
    return banks
      .map((bank) => {
        const questions = quiz.filter((question) => question.bankId === bank.id);
        if (!questions.length) return null;
        const correct = questions.filter(
          (question) => answers[question.id] === question.correctOption,
        ).length;
        return { bank, total: questions.length, correct, incorrect: questions.length - correct };
      })
      .filter(Boolean) as Array<{
      bank: Bank;
      total: number;
      correct: number;
      incorrect: number;
    }>;
  }, [answers, banks, quiz]);

  const totalCorrect = report.reduce((sum, item) => sum + item.correct, 0);

  function beginQuiz(nextQuiz: QuizQuestion[], nextMode: "full" | "review") {
    setQuiz(nextQuiz);
    setMode(nextMode);
    setAnswers({});
    setCurrent(0);
    setScreen("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startFullPractice() {
    if (!manifest || !fullPracticeReady) return;
    beginQuiz(
      createFullPractice(banks, manifest.fullPracticeSize, manifest.minimumPerBank),
      "full",
    );
  }

  function startBankReview(bank: Bank) {
    if (!manifest) return;
    beginQuiz(createBankReview(bank, manifest.reviewSize), "review");
  }

  function finishQuiz() {
    setScreen("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return (
      <main className="shell center-state">
        <div className="loader" aria-label="Cargando bancos de preguntas" />
        <p>Preparando tu práctica…</p>
      </main>
    );
  }

  if (loadError || !manifest) {
    return (
      <main className="shell center-state">
        <CircleAlert size={34} />
        <h1>No pudimos cargar las preguntas</h1>
        <p>Actualiza la página para intentarlo nuevamente.</p>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("home")} aria-label="Ir al inicio">
          <span className="brand-mark">M</span>
          <span>
            <strong>MOVILIS</strong>
            <small>Práctica académica</small>
          </span>
        </button>
        <div className="bank-counter">
          <Layers3 size={17} />
          {banks.length} de {manifest.expectedBanks} bancos disponibles
        </div>
      </header>

      {screen === "home" && (
        <div className="page-grid">
          <section className="intro-panel">
            <div>
              <span className="eyebrow">Examen complexivo</span>
              <h1>Practica, identifica tus puntos débiles y vuelve a intentarlo.</h1>
              <p>
                La práctica completa combina 75 preguntas: tres de cada materia y tres
                adicionales elegidas al azar.
              </p>
            </div>
            <div className="exam-card">
              <div className="exam-number">75</div>
              <div>
                <h2>Práctica completa</h2>
                <p>24 materias · selección nueva en cada intento</p>
              </div>
              <Button
                className="primary-button"
                size="lg"
                disabled={!fullPracticeReady}
                onClick={startFullPractice}
              >
                {fullPracticeReady ? "Comenzar práctica" : "Disponible con los 24 bancos"}
                <ArrowRight />
              </Button>
            </div>
          </section>

          <section className="banks-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Repaso por materia</span>
                <h2>Bancos disponibles</h2>
              </div>
              <span className="soft-pill">10 preguntas por intento</span>
            </div>

            <div className="bank-list">
              {banks.map((bank) => (
                <article className="bank-card" key={bank.id}>
                  <div className="bank-code">{bank.code}</div>
                  <div className="bank-info">
                    <h3>{bank.name}</h3>
                    <p>{bank.questions.length} preguntas disponibles</p>
                  </div>
                  <Button variant="outline" onClick={() => startBankReview(bank)}>
                    Repasar 10 <ArrowRight />
                  </Button>
                </article>
              ))}
            </div>

            {!fullPracticeReady && (
              <div className="notice">
                <BookOpen size={20} />
                <div>
                  <strong>Primera materia incorporada</strong>
                  <p>
                    Matemática 1 ya está lista. La práctica completa se activará al agregar los{" "}
                    {manifest.expectedBanks - banks.length} bancos restantes.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {screen === "quiz" && currentQuestion && (
        <section className="quiz-wrap">
          <div className="quiz-meta">
            <button className="text-button" onClick={() => setScreen("home")}>
              <ArrowLeft size={18} /> Salir
            </button>
            <span>{mode === "full" ? "Práctica completa" : "Repaso por materia"}</span>
            <span>
              Pregunta {current + 1} de {quiz.length}
            </span>
          </div>
          <Progress className="quiz-progress" value={((current + 1) / quiz.length) * 100} />

          <article className="question-card">
            <div className="question-tag">
              <span>{currentQuestion.bankCode}</span>
              {currentQuestion.bankName}
            </div>
            <h1>{currentQuestion.text}</h1>

            <div className="options" role="radiogroup" aria-label="Opciones de respuesta">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                return (
                  <button
                    key={option}
                    className={`option ${isSelected ? "selected" : ""}`}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      setAnswers((previous) => ({ ...previous, [currentQuestion.id]: index }))
                    }
                  >
                    <span className="option-letter">{letters[index]}</span>
                    <span>{option}</span>
                    <span className="option-check">{isSelected && <Check size={18} />}</span>
                  </button>
                );
              })}
            </div>
          </article>

          <div className="quiz-actions">
            <Button
              variant="outline"
              disabled={current === 0}
              onClick={() => setCurrent((value) => value - 1)}
            >
              <ArrowLeft /> Anterior
            </Button>
            <span>{answeredCount} respondidas</span>
            {current < quiz.length - 1 ? (
              <Button
                className="primary-button"
                disabled={selectedAnswer === undefined}
                onClick={() => setCurrent((value) => value + 1)}
              >
                Siguiente <ArrowRight />
              </Button>
            ) : (
              <Button
                className="primary-button"
                disabled={answeredCount !== quiz.length}
                onClick={finishQuiz}
              >
                Ver resultados <CheckCircle2 />
              </Button>
            )}
          </div>
        </section>
      )}

      {screen === "results" && (
        <section className="results-wrap">
          <div className="score-card">
            <div className="trophy-circle"><Trophy size={30} /></div>
            <span className="eyebrow">Práctica finalizada</span>
            <h1>{totalCorrect} de {quiz.length} respuestas correctas</h1>
            <p>
              {Math.round((totalCorrect / quiz.length) * 100)}% de aciertos. Elige una materia
              para practicar otras 10 preguntas al azar.
            </p>
          </div>

          <div className="results-panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Detalle</span>
                <h2>Resultados por banco</h2>
              </div>
            </div>
            <div className="results-list">
              {report.map(({ bank, correct, incorrect, total }) => (
                <article className="result-row" key={bank.id}>
                  <div className="result-title">
                    <span>{bank.code}</span>
                    <div><h3>{bank.name}</h3><p>{total} preguntas en este intento</p></div>
                  </div>
                  <div className="result-count correct"><Check size={18} /> {correct} correctas</div>
                  <div className="result-count incorrect"><X size={18} /> {incorrect} incorrectas</div>
                  <Button variant="outline" onClick={() => startBankReview(bank)}>
                    Repasar 10
                  </Button>
                </article>
              ))}
            </div>
          </div>

          <div className="result-actions">
            <Button variant="outline" onClick={() => setScreen("home")}>
              <ArrowLeft /> Volver a materias
            </Button>
            {mode === "review" && report[0] && (
              <Button className="primary-button" onClick={() => startBankReview(report[0].bank)}>
                <RotateCcw /> Otras 10 preguntas
              </Button>
            )}
            {fullPracticeReady && (
              <Button className="primary-button" onClick={startFullPractice}>
                <RotateCcw /> {mode === "full" ? "Nueva práctica completa · 75" : "Repaso completo · 75"}
              </Button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
