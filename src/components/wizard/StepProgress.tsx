import { WIZARD_STEPS, WizardStep } from '@/types/aios';
import { useWizardStore } from '@/stores/wizard-store';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StepProgress() {
  const { currentStep, setStep, getStepIndex } = useWizardStore();
  const currentIdx = getStepIndex();

  return (
    <div className="flex items-center gap-1 px-4 py-3 overflow-x-auto">
      {WIZARD_STEPS.map((step, i) => {
        const isActive = step.key === currentStep;
        const isCompleted = i < currentIdx;
        const isClickable = i <= currentIdx;

        return (
          <button
            key={step.key}
            onClick={() => isClickable && setStep(step.key)}
            disabled={!isClickable}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              isActive && 'bg-primary/15 text-primary border border-primary/30',
              isCompleted && 'text-glow-success cursor-pointer hover:bg-secondary',
              !isActive && !isCompleted && 'text-muted-foreground',
              !isClickable && 'opacity-40 cursor-not-allowed'
            )}
          >
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border',
              isActive && 'border-primary bg-primary/20 text-primary',
              isCompleted && 'border-glow-success bg-glow-success/20 text-glow-success',
              !isActive && !isCompleted && 'border-muted-foreground/30'
            )}>
              {isCompleted ? <Check className="w-3 h-3" /> : step.number}
            </span>
            <span className="hidden md:inline">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
