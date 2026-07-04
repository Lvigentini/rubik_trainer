import { Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import './styles.css';
import { AppLayout } from './app/AppLayout';
import { HomePage } from './components/HomePage';
import { LearnPage } from './components/LearnPage';
import { PracticePage } from './components/PracticePage';
import { getStageById, type LearningStageId } from './learningPath';
import { useProgress } from './progress/ProgressContext';
import { getCurrentStageId } from './progress/unlocks';

const PLAY_MODE_MAP = { free: 'practice', coach: 'guided', scan: 'scan' } as const;
type PlayModeParam = keyof typeof PLAY_MODE_MAP;

function HomeRoute() {
  const navigate = useNavigate();
  return (
    <HomePage
      onStartPathway={() => navigate('/learn')}
      onScanCoach={() => navigate('/play/scan')}
      onFreePractice={() => navigate('/play/free')}
    />
  );
}

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
      onSelectStage={(id) => navigate(`/learn/${id}`)}
      onPractice={(id) => navigate(`/play/coach?skill=${id}`)}
    />
  );
}

function PlayRoute() {
  const { mode } = useParams();
  const [searchParams] = useSearchParams();
  if (!mode || !(mode in PLAY_MODE_MAP)) return <Navigate to="/play/free" replace />;
  const skill = searchParams.get('skill') ?? undefined;
  return (
    <PracticePage
      key={mode}
      initialMode={PLAY_MODE_MAP[mode as PlayModeParam]}
      skillContext={skill}
    />
  );
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomeRoute />} />
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
