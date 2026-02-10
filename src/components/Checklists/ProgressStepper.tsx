import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface StepItem {
  id: string;
  question: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  hasError?: boolean;
}

interface ProgressStepperProps {
  title: string;
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSave: () => void;
  canNavigateFreely?: boolean;
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({
  title,
  steps,
  currentStepIndex,
  onStepClick,
  onNext,
  onPrevious,
  onSave,
  canNavigateFreely = true
}) => {
  const completedSteps = steps.filter(step => step.isCompleted).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const getStepIcon = (step: StepItem, index: number) => {
    if (step.hasError) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (step.isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (index === currentStepIndex) {
      return <Circle className="h-5 w-5 text-primary fill-primary" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const getStepStatus = (step: StepItem, index: number) => {
    if (step.hasError) return 'error';
    if (step.isCompleted) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'pending';
  };

  const canClickStep = (index: number) => {
    if (!canNavigateFreely) return false;
    return index <= currentStepIndex || steps[index].isCompleted;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {completedSteps} de {steps.length} itens completos
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {Math.round(progressPercentage)}%
          </Badge>
        </div>
        <Progress value={progressPercentage} className="h-2 mt-4" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Steps List */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const status = getStepStatus(step, index);
            const clickable = canClickStep(index);
            
            return (
              <div
                key={step.id}
                onClick={() => clickable && onStepClick(index)}
                className={`
                  flex items-start gap-3 p-3 rounded-lg border transition-all duration-200
                  ${status === 'current' ? 'border-primary bg-primary/5' : 'border-border'}
                  ${status === 'completed' ? 'bg-green-50 border-green-200' : ''}
                  ${status === 'error' ? 'bg-red-50 border-red-200' : ''}
                  ${clickable ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default'}
                `}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStepIcon(step, index)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`
                        text-sm font-medium
                        ${status === 'current' ? 'text-primary' : ''}
                        ${status === 'completed' ? 'text-green-700' : ''}
                        ${status === 'error' ? 'text-red-700' : ''}
                      `}>
                        {step.question}
                        {step.isRequired && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h4>
                      {step.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {step.isRequired && (
                        <Badge variant="outline" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                      {status === 'completed' && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Completo
                        </Badge>
                      )}
                      {status === 'current' && (
                        <Badge variant="default" className="text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onSave}
              className="flex items-center gap-2"
            >
              Salvar Progresso
            </Button>

            {isLastStep ? (
              <Button
                onClick={onSave}
                className="flex items-center gap-2"
              >
                Finalizar Checklist
              </Button>
            ) : (
              <Button
                onClick={onNext}
                className="flex items-center gap-2"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm">
            <span>Progresso atual:</span>
            <span className="font-medium">
              {completedSteps}/{steps.length} ({Math.round(progressPercentage)}%)
            </span>
          </div>
          {steps.some(s => s.isRequired && !s.isCompleted) && (
            <p className="text-xs text-orange-600 mt-2">
              * Alguns itens obrigatórios ainda precisam ser completados
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressStepper;