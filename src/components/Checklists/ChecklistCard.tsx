import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, MapPin, Play, RotateCcw, CheckCircle } from 'lucide-react';

interface ChecklistCardProps {
  id: string;
  name: string;
  storeNames: string;
  progress: {
    completed: number;
    total: number;
  };
  status: 'not_started' | 'in_progress' | 'paused' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // in minutes
  onAction: (id: string) => void;
  variant?: 'pending' | 'history';
}

const ChecklistCard: React.FC<ChecklistCardProps> = ({
  id,
  name,
  storeNames,
  progress,
  status,
  startedAt,
  completedAt,
  duration,
  onAction,
  variant = 'pending'
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'not_started': return 'bg-muted text-muted-foreground border-border';
      case 'in_progress': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'paused': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'not_started': return 'Não Iniciado';
      case 'in_progress': return 'Em Progresso';
      case 'paused': return 'Pausado';
      case 'completed': return 'Completo';
      default: return '';
    }
  };

  const getActionButton = () => {
    if (variant === 'history') return null;

    const buttonText = status === 'not_started' ? 'INICIAR' : 'CONTINUAR';
    const Icon = status === 'not_started' ? Play : RotateCcw;

    return (
      <Button
        onClick={() => onAction(id)}
        className="w-full mt-3"
        variant={status === 'not_started' ? 'default' : 'outline'}
      >
        <Icon className="h-4 w-4 mr-2" />
        {buttonText}
      </Button>
    );
  };

  const progressPercentage = (progress.completed / progress.total) * 100;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-foreground">{name}</h3>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Lojas: {storeNames}</span>
          </div>

          {variant === 'pending' && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>Progresso: {progress.completed}/{progress.total} itens</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </>
          )}

          {startedAt && variant === 'pending' && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>Iniciado: {new Date(startedAt).toLocaleDateString('pt-BR')} {new Date(startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {completedAt && variant === 'history' && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-emerald-600" />
                <span>Completo em {new Date(completedAt).toLocaleDateString('pt-BR')} {new Date(completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {duration && (
                <span>{duration} minutos</span>
              )}
            </div>
          )}

          {variant === 'history' && (
            <div className="text-sm font-medium text-emerald-600">
              {progress.completed}/{progress.total} itens
            </div>
          )}
        </div>

        {getActionButton()}
      </CardContent>
    </Card>
  );
};

export default ChecklistCard;