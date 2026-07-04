import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';
import { HomePage } from './components/HomePage';
import { LearnPage } from './components/LearnPage';
import { PracticePage } from './components/PracticePage';
import { PLAY_MODE_ORDER, type PlayMode } from './components/play/modes';
import { getStageById, type LearningStageId } from './learningPath';
import { useProgress } from './progress/ProgressContext';
import { getCurrentStageId } from './progress/unlocks';

function LearnIndexRedirect() {
  const snapshot = useProgress();
  return <Navigate to={`/learn/${getCurrentStageId(snapshot)}`} replace />;
}

function LearnRoute() {
  const { stageId } = useParams();
  const navigate = useNavigate();
  const stage = stageId ? getStageById(stageId as LearningStageId) : undefined;
  if (!stage) return <LearnIndexRedirect />;
  return (
    <LearnPage
      stageId={stage.id}
      onPractice={(id) => navigate(`/play/coach?skill=${id}`)}
    />
  );
}

function PlayRoute() {
  const { mode } = useParams();
  const [searchParams] = useSearchParams();
  if (!mode || !PLAY_MODE_ORDER.includes(mode as PlayMode)) return <Navigate to="/play/free" replace />;
  const skill = searchParams.get('skill') ?? undefined;
  return <PracticePage key={`${mode}-${skill ?? ''}`} mode={mode as PlayMode} skillContext={skill} />;
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="learn" element={<LearnIndexRedirect />} />
        <Route path="learn/:stageId" element={<LearnRoute />} />
        <Route path="play" element={<Navigate to="/play/free" replace />} />
        <Route path="play/:mode" element={<PlayRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
