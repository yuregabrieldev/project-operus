import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Eye, Download, Filter, Calendar, Clock, User, Store } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useChecklist, ChecklistHistory as ChecklistHistoryType } from '@/contexts/ChecklistContext';

const ChecklistHistory: React.FC = () => {
  const { stores } = useData();
  const { t } = useLanguage();
  const { history } = useChecklist();

  const historyData = useMemo(() => history, [history]);

  const [selectedHistory, setSelectedHistory] = useState<ChecklistHistoryType | null>(null);
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
      case 'opening': return t('checklists.opening');
      case 'closing': return t('checklists.closing');
      case 'quality': return t('checklists.quality');
      default: return t('checklists.custom');
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

  const viewDetails = (historyItem: ChecklistHistoryType) => {
    setSelectedHistory(historyItem);
    setIsDetailOpen(true);
  };

  const exportToCSV = () => {
    const csvData = [
      [t('checklists.csvDate'), t('checklists.csvStartTime'), t('checklists.csvEndTime'), t('checklists.csvDuration'), 'Checklist', t('checklists.csvType'), t('checklists.csvStore'), t('checklists.csvUser'), t('checklists.csvCompletedItems'), t('checklists.csvTotalItems')],
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

  const getCompletionRate = (historyItem: ChecklistHistoryType) => {
    if (historyItem.totalItems === 0) return 0;
    return Math.round((historyItem.completedItems / historyItem.totalItems) * 100);
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
          title={t('checklists.totalCompleted')}
          value={stats.total}
          icon={Calendar}
          variant="default"
          valueClassName="text-2xl"
        />

        <StatsCard
          title={t('checklists.avgDuration')}
          value={formatDuration(stats.avgDuration)}
          icon={Clock}
          variant="default"
          valueClassName="text-2xl"
        />

        <StatsCard
          title={t('checklists.completionRate')}
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
            {t('checklists.filters')}
          </CardTitle>
          <Button onClick={exportToCSV} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            {t('checklists.exportCSV')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium">{t('checklists.store')}</label>
              <Select value={filters.store} onValueChange={(value) => setFilters(prev => ({ ...prev, store: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('checklists.allStores')}</SelectItem>
                  {Array.from(new Set(historyData.map(h => h.storeName))).map(store => (
                    <SelectItem key={store} value={store}>{store}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">{t('checklists.type')}</label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('checklists.all_types')}</SelectItem>
                  <SelectItem value="opening">{t('checklists.opening')}</SelectItem>
                  <SelectItem value="closing">{t('checklists.closing')}</SelectItem>
                  <SelectItem value="quality">{t('checklists.quality')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">{t('checklists.startDate')}</label>
              <DateInput
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t('checklists.endDate')}</label>
              <DateInput
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t('checklists.user')}</label>
              <Input
                placeholder={t('checklists.userPlaceholder')}
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
          <CardTitle>{t('checklists.historyTitle')} ({filteredHistory.length} {t('checklists.records')})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('checklists.checklist')}</TableHead>
                  <TableHead>{t('checklists.store')}</TableHead>
                  <TableHead>{t('checklists.user')}</TableHead>
                  <TableHead>{t('checklists.dateTime')}</TableHead>
                  <TableHead>{t('checklists.duration')}</TableHead>
                  <TableHead>{t('checklists.conclusion')}</TableHead>
                  <TableHead>{t('checklists.actions')}</TableHead>
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
                        {history.completedItems}/{history.totalItems} {t('checklists.itemsCount')}
                        <div className="text-xs text-muted-foreground">
                          {getCompletionRate(history)}% {t('checklists.completed')}
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
              <p className="text-muted-foreground">{t('checklists.noRecordsFound')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('checklists.checklistDetails')}</DialogTitle>
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
                  <p className="text-sm">{t('checklists.durationLabel')} {formatDuration(selectedHistory.duration)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('checklists.store')}</p>
                  <p className="font-medium">{selectedHistory.storeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('checklists.user')}</p>
                  <p className="font-medium">{selectedHistory.userName}</p>
                </div>
              </div>

              {/* Responses */}
              <div>
                <h4 className="font-semibold mb-4">{t('checklists.responses')} ({selectedHistory.responses.length} {t('checklists.itemsCount')})</h4>
                <div className="space-y-4">
                  {selectedHistory.responses.map((response, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">{response.question || `${t('checklists.item')} ${index + 1}`}</h5>
                            <Badge variant={
                              response.skipped ? "secondary" :
                                response.response === true ? "default" :
                                  response.response === false ? "destructive" : "outline"
                            }>
                              {response.skipped ? t('checklists.skipped') :
                                response.response === true ? t('checklists.yes') :
                                  response.response === false ? t('checklists.no') : t('checklists.noResponse')}
                            </Badge>
                          </div>

                          {response.comment && (
                            <div>
                              <p className="text-sm text-muted-foreground">{t('checklists.comment')}</p>
                              <p className="text-sm">{response.comment}</p>
                            </div>
                          )}

                          {response.imageUrl && (
                            <div>
                              <p className="text-sm text-muted-foreground">{t('checklists.evidence')}</p>
                              <img
                                src={response.imageUrl}
                                alt={t('checklists.evidence')}
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