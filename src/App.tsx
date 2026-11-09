import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Layout } from "./components/Layout";
import { getSettings } from "./db/repo";
import { HomePage } from "./pages/Home";
import { Onboarding } from "./pages/Onboarding";

const Learn = lazy(() => import("./pages/Learn"));
const LessonPage = lazy(() => import("./pages/Lesson"));
const ReviewPage = lazy(() => import("./pages/Review"));
const PracticePage = lazy(() => import("./pages/Practice"));
const Library = lazy(() => import("./pages/Library"));
const ScenePage = lazy(() => import("./pages/Scene"));
const Vocabulary = lazy(() => import("./pages/Vocabulary"));
const WordPage = lazy(() => import("./pages/WordDetail"));
const Stats = lazy(() => import("./pages/Stats"));
const Tutor = lazy(() => import("./pages/Tutor"));
const Speaking = lazy(() => import("./pages/Speaking"));
const SettingsPage = lazy(() => import("./pages/Settings"));

export function App() {
  const settings = useLiveQuery(() => getSettings(), []);
  useEffect(() => {
    try {
      const theme = localStorage.getItem("parla-theme");
      if (theme) document.documentElement.dataset.theme = theme;
    } catch {
      /* stockage indisponible : thème système */
    }
  }, []);
  if (!settings) return null;
  if (!settings.onboarded) return <Onboarding />;
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <Suspense fallback={<div className="page subtle" style={{ paddingTop: 40 }}>Chargement…</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="apprendre" element={<Learn />} />
            <Route path="lecon/:id" element={<LessonPage />} />
            <Route path="revision" element={<ReviewPage />} />
            <Route path="exercices" element={<PracticePage />} />
            <Route path="films" element={<Library />} />
            <Route path="scene/:id" element={<ScenePage />} />
            <Route path="vocabulaire" element={<Vocabulary />} />
            <Route path="vocabulaire/:id" element={<WordPage />} />
            <Route path="progres" element={<Stats />} />
            <Route path="professeur" element={<Tutor />} />
            <Route path="prononciation" element={<Speaking />} />
            <Route path="reglages" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

/** Filet de sécurité : une erreur inattendue n'efface pas l'application. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page empty" role="alert">
        <div className="big">😕</div>
        <p>Une erreur inattendue est survenue. Vos données sont intactes.</p>
        <p className="subtle">{this.state.error.message}</p>
        <button className="btn primary mt" onClick={() => location.assign("/")}>
          Revenir à l'accueil
        </button>
      </div>
    );
  }
}
