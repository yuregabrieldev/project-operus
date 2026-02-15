import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Eye, Download, Filter, Calendar, Clock, User, Store } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

interface ChecklistHistory {
  id: string;
  templateName: string;
  type: 'opening' | 'closing' | 'quality';
  storeName: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // em minutos
  totalItems: number;
  completedItems: number;
  responses: ChecklistResponse[];
}

interface ChecklistResponse {
  question: string;
  response: boolean | null;
  comment?: string;
  imageUrl?: string;
  skipped: boolean;
}

const ChecklistHistory: React.FC = () => {
  const { stores } = useData();

  // Mock data - em produção viria da API
  const [historyData] = useState<ChecklistHistory[]>([
    {
      id: '1',
      templateName: 'Checklist Abertura',
      type: 'opening',
      storeName: 'Alvalade',
      userName: 'João Silva',
      startTime: new Date('2025-07-13T08:00:00'),
      endTime: new Date('2025-07-13T08:15:00'),
      duration: 15,
      totalItems: 5,
      completedItems: 5,
      responses: [
        {
          question: 'Equipamentos ligados e funcionando?',
          response: true,
          comment: '',
          skipped: false
        },
        {
          question: 'Área de trabalho limpa?',
          response: true,
          comment: 'Tudo em ordem',
          skipped: false
        }
      ]
    },
    {
      id: '2',
      templateName: 'Checklist Qualidade',
      type: 'quality',
      storeName: 'Rossio',
      userName: 'Maria Santos',
      startTime: new Date('2025-07-12T14:00:00'),
      endTime: new Date('2025-07-12T14:30:00'),
      duration: 30,
      totalItems: 8,
      completedItems: 7,
      responses: []
    },
    {
      id: '3',
      templateName: 'Checklist Fechamento',
      type: 'closing',
      storeName: 'Alvalade',
      userName: 'Carlos Lima',
      startTime: new Date('2025-07-11T22:00:00'),
      endTime: new Date('2025-07-11T22:20:00'),
      duration: 20,
      totalItems: 6,
      completedItems: 6,
      responses: []
    }
  ]);

  const [selectedHistory, setSelectedHistory] = useState<ChecklistHistory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filters, setFilters] = useState({
    store: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    user: ''
  });

  const getFilteredHistory = () => {
    let filtered = historyData;

    if (filters.store !== 'all') {
      filtered = filtered.filter(h => h.storeName === filters.store);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(h => h.type === filters.type);
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(h => h.startTime >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(h => h.startTime <= toDate);
    }

    if (filters.user) {
      filtered = filtered.filter(h =>
        h.userName.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  };

  const filteredHistory = getFilteredHistory();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opening': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'closing': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'quality': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'opening': return 'Abertura';
      case 'closing': return 'Fechamento';
      case 'quality': return 'Qualidade';
      default: return 'Personalizado';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const viewDetails = (history: ChecklistHistory) => {
    setSelectedHistory(history);
    setIsDetailOpen(true);
  };

  const exportToCSV = () => {
    const csvData = [
      ['Data', 'Hora Início', 'Hora Fim', 'Duração', 'Checklist', 'Tipo', 'Loja', 'Usuário', 'Itens Concluídos', 'Total Itens'],
      ...filteredHistory.map(h => [
        formatDate(h.startTime),
        formatTime(h.startTime),
        formatTime(h.endTime),
        formatDuration(h.duration),
        h.templateName,
        getTypeName(h.type),
        h.storeName,
        h.userName,
        h.completedItems.toString(),
        h.totalItems.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `historico_checklists_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getCompletionRate = (history: ChecklistHistory) => {
    return Math.round((history.completedItems / history.totalItems) * 100);
  };

  const getStats = () => {
    const total = filteredHistory.length;
    const totalDuration = filteredHistory.reduce((sum, h) => sum + h.duration, 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
    const completionRate = total > 0 ?
      Math.round(filteredHistory.reduce((sum, h) => sum + getCompletionRate(h), 0) / total) : 0;

    return { total, avgDuration, completionRate };
  };

  const stats = getStats();

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Realizados"
          value={stats.total}
          icon={Calendar}
          variant="default"
          valueClassName="text-2xl"
        />

        <StatsCard
          title="Duração Média"
          value={formatDuration(stats.avgDuration)}
          icon={Clock}
          variant="default"
          valueClassName="text-2xl"
        />

        <StatsCard
          title="Taxa de Conclusão"
          value={`${stats.completionRate}%`}
          icon={User}
          variant="success"
          valueClassName="text-2xl"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <Button onClick={exportToCSV} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">Loja</label>
              <Select value={filters.store} onValueChange={(value) => setFilters(prev => ({ ...prev, store: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as lojas</SelectItem>
                  {Array.from(new Set(historyData.map(h => h.storeName))).map(store => (
                    <SelectItem key={store} value={store}>{store}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="opening">Abertura</SelectItem>
                  <SelectItem value="closing">Fechamento</SelectItem>
                  <SelectItem value="quality">Qualidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Usuário</label>
              <Input
                placeholder="Nome do usuário"
                value={filters.user}
                onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico ({filteredHistory.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Checklist</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Conclusão</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((history) => (
                  <TableRow key={history.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{history.templateName}</div>
                        <Badge className={getTypeColor(history.type)}>
                          {getTypeName(history.type)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        {history.storeName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {history.userName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(history.startTime)}</div>
                        <div className="text-muted-foreground">
                          {formatTime(history.startTime)} - {formatTime(history.endTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(history.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {history.completedItems}/{history.totalItems} itens
                        <div className="text-xs text-muted-foreground">
                          {getCompletionRate(history)}% concluído
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewDetails(history)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Checklist</DialogTitle>
          </DialogHeader>

          {selectedHistory && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedHistory.templateName}</h3>
                  <Badge className={getTypeColor(selectedHistory.type)}>
                    {getTypeName(selectedHistory.type)}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedHistory.startTime)} • {formatTime(selectedHistory.startTime)} - {formatTime(selectedHistory.endTime)}
                  </p>
                  <p className="text-sm">Duração: {formatDuration(selectedHistory.duration)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loja</p>
                  <p className="font-medium">{selectedHistory.storeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="font-medium">{selectedHistory.userName}</p>
                </div>
              </div>

              {/* Responses */}
              <div>
                <h4 className="font-semibold mb-4">Respostas ({selectedHistory.responses.length} itens)</h4>
                <div className="space-y-4">
                  {selectedHistory.responses.map((response, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">{response.question}</h5>
                            <Badge variant={
                              response.skipped ? "secondary" :
                                response.response === true ? "default" :
                                  response.response === false ? "destructive" : "outline"
                            }>
                              {response.skipped ? "Pulado" :
                                response.response === true ? "Sim" :
                                  response.response === false ? "Não" : "Sem resposta"}
                            </Badge>
                          </div>

                          {response.comment && (
                            <div>
                              <p className="text-sm text-muted-foreground">Comentário:</p>
                              <p className="text-sm">{response.comment}</p>
                            </div>
                          )}

                          {response.imageUrl && (
                            <div>
                              <p className="text-sm text-muted-foreground">Evidência:</p>
                              <img
                                src={response.imageUrl}
                                alt="Evidência"
                                className="max-w-xs rounded-lg mt-1"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChecklistHistory;