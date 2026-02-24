import { WIZARD_STEPS, WizardStep } from '@/types/aios';
import { useWizardStore } from '@/stores/wizard-store';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASE_GROUPS: { label: string; steps: WizardStep[]; color: string }[] = [
  { label: 'Descoberta', steps: ['welcome', 'project_config'], color: 'accent' },
  { label: 'Construcao', steps: ['agents', 'squads', 'integrations'], color: 'glow-success' },
  { label: 'Finalizacao', steps: ['review', 'generation'], color: 'glow-warning' },
];

export function StepProgress() {
  const { currentStep, setStep, getStepIndex } = useWizardStore();
  const currentIdx = getStepIndex();

  return (
    <div className="flex items-center gap-0.5 px-2 py-2 overflow-x-auto">
      {WIZARD_STEPS.map((step, i) => {
        const isActive = step.key === currentStep;
        const isCompleted = i < currentIdx;
        const isClickable = i <= currentIdx;

        // Find which phase group this step belongs to
        const group = PHASE_GROUPS.find(g => g.steps.includes(step.key));
        // Is this the first step in its group?
        const isFirstInGroup = group && group.steps[0] === step.key;
        // Is this the last step in its group?
        const isLastInGroup = group && group.steps[group.steps.length - 1] === step.key;
        // Is the next step in a different group?
        const nextStep = WIZARD_STEPS[i + 1];
        const nextGroup = nextStep ? PHASE_GROUPS.find(g => g.steps.includes(nextStep.key)) : null;
        const showGroupSeparator = nextGroup && group && nextGroup !== group;

        return (
          <div key={step.key} className="flex items-center">
            <button
              onClick={() => isClickable && setStep(step.key)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                isActive && 'bg-primary/15 text-primary border border-primary/30',
                isCompleted && 'text-glow-success cursor-pointer hover:bg-secondary',
                !isActive && !isCompleted && 'text-muted-foreground',
                !isClickable && 'opacity-40 cursor-not-allowed'
              )}
              title={`${step.label} — Etapa ${step.number} de ${WIZARD_STEPS.length}`}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all',
                isActive && 'border-primary bg-primary/20 text-primary shadow-[0_0_8px_-2px_hsl(var(--glow-primary)/0.4)]',
                isCompleted && 'border-glow-success bg-glow-success/20 text-glow-success',
                !isActive && !isCompleted && 'border-muted-foreground/30'
              )}>
                {isCompleted ? <Check className="w-3 h-3" /> : step.number}
              </span>
              <span className="hidden lg:inline">{step.label}</span>
            </button>

            {/* Group separator */}
            {showGroupSeparator && (
              <div className="mx-1 w-px h-4 bg-border/50" />
            )}
          </div>
        );
      })}
    </div>
  );
}
