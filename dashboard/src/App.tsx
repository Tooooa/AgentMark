import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';
import ControlPanel from './components/controls/ControlPanel';
import FlowFeed from './components/execution/FlowFeed';
import DecoderPanel from './components/decoder/DecoderPanel';
import ComparisonView from './components/layout/ComparisonView';
import WelcomeScreen from './components/layout/WelcomeScreen';
import { useSimulation } from './hooks/useSimulation';
import { I18nProvider } from './i18n/I18nContext';

function App() {
  const {
    scenarios,
    activeScenario,
    activeScenarioId,
    setActiveScenarioId,
    isPlaying,
    setIsPlaying,
    currentStepIndex,
    erasureRate,
    setErasureRate,
    erasedIndices,
    handleReset,
    handleNext,
    handlePrev,
    visibleSteps,
    isLiveMode,
    setIsLiveMode,
    apiKey,
    setApiKey,
    handleInitSession
  } = useSimulation();

  const [hasStarted, setHasStarted] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [targetPayload, setTargetPayload] = useState('AgentMark'); // Used for display

  const handleStart = (config: { scenarioId: string; payload: string; erasureRate: number }) => {
    setActiveScenarioId(config.scenarioId);
    setTargetPayload(config.payload);
    setErasureRate(config.erasureRate);
    setHasStarted(true);
  };

  const commonControlPanel = (
    <ControlPanel
      scenarios={scenarios}
      activeScenarioId={activeScenarioId}
      onSelectScenario={setActiveScenarioId}
      isPlaying={isPlaying}
      onTogglePlay={() => setIsPlaying(!isPlaying)}
      onReset={handleReset}
      onNext={handleNext}
      onPrev={handlePrev}
      erasureRate={erasureRate}
      setErasureRate={setErasureRate}
      currentStep={currentStepIndex}
      totalSteps={activeScenario.totalSteps}
      isLiveMode={isLiveMode}
      onToggleLiveMode={() => setIsLiveMode(!isLiveMode)}
      apiKey={apiKey}
      setApiKey={setApiKey}
      onInitSession={handleInitSession}
      isComparisonMode={isComparisonMode}
      onToggleComparisonMode={() => setIsComparisonMode(!isComparisonMode)}
    />
  );

  return (
    <I18nProvider>
      <div className="bg-slate-50 min-h-screen">
        <AnimatePresence mode='wait'>
          {!hasStarted ? (
            <WelcomeScreen
              key="welcome"
              onStart={handleStart}
              initialScenarioId={activeScenarioId}
              initialErasureRate={erasureRate}
              isLiveMode={isLiveMode}
              onToggleLiveMode={() => setIsLiveMode(!isLiveMode)}
            />
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-screen overflow-hidden"
            >
              {isComparisonMode ? (
                // Comparison Mode Layout
                <div className="h-full p-4 grid grid-cols-[340px_1fr] gap-6 overflow-hidden max-w-[1920px] mx-auto">
                  <div className="h-full overflow-hidden">
                    {commonControlPanel}
                  </div>
                  <div className="h-full overflow-hidden">
                    <ComparisonView
                      visibleSteps={visibleSteps}
                      erasedIndices={erasedIndices}
                    />
                  </div>
                </div>
              ) : (
                // Standard Dashboard Layout
                <MainLayout
                  left={commonControlPanel}
                  middle={
                    <FlowFeed
                      visibleSteps={visibleSteps}
                      erasedIndices={erasedIndices}
                      userQuery={activeScenario.userQuery}
                    />
                  }
                  right={
                    <DecoderPanel
                      visibleSteps={visibleSteps}
                      erasedIndices={erasedIndices}
                      targetPayload={targetPayload}
                    />
                  }
                  onHome={() => {
                    setHasStarted(false);
                    handleReset();
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </I18nProvider>
  );
}

export default App;
