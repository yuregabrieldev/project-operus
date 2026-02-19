
import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, ToggleLeft, ToggleRight, Search, Key } from 'lucide-react';
import { useUsers } from '@/contexts/UsersContext';
import { useBrand } from '@/contexts/BrandContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface UserListProps {
  onEditUser: (user: any) => void;
}

export const UserList: React.FC<UserListProps> = ({ onEditUser }) => {
  const { users, toggleUserStatus, generateTempPassword } = useUsers();
  const { stores } = useBrand();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.isActive) ||
                           (statusFilter === 'inactive' && !user.isActive);
      const matchesStore = storeFilter === 'all' || 
                          user.stores.some(store => store.id === parseInt(storeFilter));
      
      return matchesSearch && matchesRole && matchesStatus && matchesStore;
    });
  }, [users, searchTerm, roleFilter, statusFilter, storeFilter]);

  const handleToggleStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const action = user.isActive ? t('users.actionDeactivate') : t('users.actionActivate');
    const confirmed = window.confirm(t('users.confirmToggleStatus', { action }));
    
    if (confirmed) {
      toggleUserStatus(userId);
      toast({
        title: t('users.userUpdated'),
        description: t('users.userStatusChanged', { status: user.isActive ? t('users.userDeactivated') : t('users.userActivated') }),
      });
    }
  };

  const handleGeneratePassword = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = window.confirm(t('users.confirmGeneratePassword', { name: user.name }));
    
    if (confirmed) {
      const tempPassword = generateTempPassword(userId);
      toast({
        title: t('users.tempPasswordGenerated'),
        description: t('users.newPassword', { password: tempPassword }),
        duration: 10000,
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      admin: 'destructive',
      manager: 'default',
      employee: 'secondary'
    };
    
    const labels = {
      admin: t('users.roleAdmin'),
      manager: t('users.roleManager'),
      employee: t('users.roleEmployee')
    };

    return <Badge variant={variants[role] || 'default'}>{labels[role as keyof typeof labels]}</Badge>;
  };

  // Get stores for filter
  const allStores = stores || [];

  return (
    <Card>
      <CardContent className="p-6">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t('users.filterByRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allRoles')}</SelectItem>
              <SelectItem value="admin">{t('users.roleAdmin')}</SelectItem>
              <SelectItem value="manager">{t('users.roleManager')}</SelectItem>
              <SelectItem value="employee">{t('users.roleEmployee')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t('users.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allStatuses')}</SelectItem>
              <SelectItem value="active">{t('users.activeFilter')}</SelectItem>
              <SelectItem value="inactive">{t('users.inactiveFilter')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder={t('users.filterByStore')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('users.allStores')}</SelectItem>
              {allStores.map((store) => (
                <SelectItem key={store.id} value={store.id.toString()}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('users.name')}</TableHead>
                <TableHead>{t('users.email')}</TableHead>
                <TableHead>{t('users.role')}</TableHead>
                <TableHead>{t('users.storesColumn')}</TableHead>
                <TableHead>{t('users.status')}</TableHead>
                <TableHead className="text-right">{t('users.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.stores.map((store) => (
                        <Badge key={store.id} variant="outline" className="text-xs">
                          {store.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? t('users.active') : t('users.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGeneratePassword(user.id)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t('users.noUsersFound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
