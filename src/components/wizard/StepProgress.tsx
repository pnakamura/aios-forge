import { WIZARD_STEPS, WizardStep } from '@/types/aios';
import { useWizardStore } from '@/stores/wizard-store';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const PHASE_COLORS: Record<string, { dot: string; line: string; text: string }> = {
  Descoberta: {
    dot: 'border-accent bg-accent/20 text-accent shadow-[0_0_8px_-2px_hsl(var(--glow-accent)/0.4)]',
    line: 'bg-accent/40',
    text: 'text-accent',
  },
  Construcao: {
    dot: 'border-glow-success bg-glow-success/20 text-glow-success shadow-[0_0_8px_-2px_hsl(var(--glow-success)/0.4)]',
    line: 'bg-glow-success/40',
    text: 'text-glow-success',
  },
  Finalizacao: {
    dot: 'border-glow-warning bg-glow-warning/20 text-glow-warning shadow-[0_0_8px_-2px_hsl(var(--glow-warning)/0.4)]',
    line: 'bg-glow-warning/40',
    text: 'text-glow-warning',
  },
};

const PHASE_GROUPS: { label: string; steps: WizardStep[] }[] = [
  { label: 'Descoberta', steps: ['welcome', 'project_config'] },
  { label: 'Construcao', steps: ['agents', 'squads', 'integrations'] },
  { label: 'Finalizacao', steps: ['review', 'generation'] },
];

function getPhaseLabel(stepKey: WizardStep): string {
  return PHASE_GROUPS.find(g => g.steps.includes(stepKey))?.label || 'Descoberta';
}

export function StepProgress() {
  const { currentStep, setStep, getStepIndex, getHighestStepIndex } = useWizardStore();
  const currentIdx = getStepIndex();
  const highestIdx = getHighestStepIndex();

  return (
    <div className="flex items-center gap-0 px-2 py-2 overflow-x-auto">
      {WIZARD_STEPS.map((step, i) => {
        const isActive = step.key === currentStep;
        const isCompleted = i < highestIdx && !isActive;
        const isClickable = i <= highestIdx;
        const phase = getPhaseLabel(step.key);
        const colors = PHASE_COLORS[phase];

        // Connector before this step (except first)
        const prevPhase = i > 0 ? getPhaseLabel(WIZARD_STEPS[i - 1].key) : phase;
        const prevCompleted = i > 0 && i - 1 < highestIdx;

        return (
          <div key={step.key} className="flex items-center">
            {/* Connector line */}
            {i > 0 && (
              <div className="relative w-6 h-[2px] mx-0.5">
                <div className="absolute inset-0 bg-border/30 rounded-full" />
                {prevCompleted && (
                  <motion.div
                    className={cn('absolute inset-0 rounded-full', PHASE_COLORS[prevPhase].line)}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            )}

            {/* Step dot */}
            <button
              onClick={() => isClickable && setStep(step.key)}
              disabled={!isClickable}
              className={cn(
                'relative flex items-center gap-1.5 transition-all group',
                !isClickable && 'opacity-35 cursor-not-allowed',
                isClickable && !isActive && 'cursor-pointer',
              )}
              title={`${step.label} — Etapa ${step.number} de ${WIZARD_STEPS.length}`}
            >
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-[1.5px] transition-all',
                isActive && colors.dot,
                isCompleted && 'border-glow-success bg-glow-success/20 text-glow-success',
                !isActive && !isCompleted && 'border-muted-foreground/20 text-muted-foreground/50',
              )}>
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="text-[9px]">{step.number}</span>
                )}
              </div>

              {/* Label — only visible for active step on small screens, all on lg */}
              <span className={cn(
                'text-[11px] font-medium whitespace-nowrap transition-colors',
                isActive ? colors.text : isCompleted ? 'text-glow-success' : 'text-muted-foreground/40',
                !isActive && 'hidden lg:inline',
              )}>
                {step.label}
              </span>

              {/* Active ring — steady glow, no blinking */}
              {isActive && (
                <motion.div
                  className={cn(
                    'absolute -inset-1.5 rounded-full border',
                    phase === 'Descoberta' && 'border-accent/30 shadow-[0_0_8px_-2px_hsl(var(--glow-accent)/0.3)]',
                    phase === 'Construcao' && 'border-glow-success/30 shadow-[0_0_8px_-2px_hsl(var(--glow-success)/0.3)]',
                    phase === 'Finalizacao' && 'border-glow-warning/30 shadow-[0_0_8px_-2px_hsl(var(--glow-warning)/0.3)]',
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
