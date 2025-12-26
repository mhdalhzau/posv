import { useGetAllCustomers, useIsCallerAdmin, useListAllTransactions, useUpdateTransactionStatus } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCircle, TrendingUp, Users, ShoppingBag, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { OrderStatus } from '../backend';
import { useState } from 'react';

export default function CustomerManagementPage() {
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: customers, isLoading } = useGetAllCustomers();
  const { data: allTransactions } = useListAllTransactions();
  const updateStatus = useUpdateTransactionStatus();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Akses Ditolak</h1>
          <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini</p>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      processing: { label: 'Diproses', variant: 'default' as const, icon: AlertCircle, color: 'text-blue-600' },
      ready: { label: 'Siap', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' },
      completed: { label: 'Selesai', variant: 'outline' as const, icon: CheckCircle2, color: 'text-gray-600' },
      canceled: { label: 'Dibatalkan', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const handleStatusChange = (transactionId: bigint, newStatus: OrderStatus) => {
    updateStatus.mutate({ transactionId, newStatus });
  };

  const filteredTransactions = allTransactions?.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Pelanggan</h1>
        <p className="text-muted-foreground">Kelola pelanggan dan pantau pesanan mereka</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Pelanggan terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allTransactions?.length || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pesanan Aktif</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {allTransactions?.filter(t => t.status === 'pending' || t.status === 'processing').length || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Perlu diproses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Daftar Pelanggan</TabsTrigger>
          <TabsTrigger value="orders">Pesanan Pelanggan</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pelanggan</CardTitle>
              <CardDescription>Semua pelanggan yang terdaftar di sistem</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : !customers || customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada pelanggan terdaftar
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Principal ID</TableHead>
                      <TableHead>Tanggal Registrasi</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total Pembelian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map(([principal, profile]) => {
                      const customerTransactions = allTransactions?.filter(t => t.userId === principal.toString()) || [];
                      const totalSpent = customerTransactions.reduce((sum, t) => sum + Number(t.total), 0);
                      
                      return (
                        <TableRow key={principal.toString()}>
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell className="font-mono text-xs">{principal.toString().slice(0, 20)}...</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(profile.registeredAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">Aktif</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(BigInt(totalSpent))}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pesanan Pelanggan</CardTitle>
                  <CardDescription>Kelola status pesanan dari semua pelanggan</CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="processing">Diproses</SelectItem>
                    <SelectItem value="ready">Siap</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="canceled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Tidak ada pesanan</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const customer = customers?.find(([principal]) => principal.toString() === transaction.userId);
                      
                      return (
                        <TableRow key={transaction.id.toString()}>
                          <TableCell className="font-mono text-xs">#{transaction.id.toString()}</TableCell>
                          <TableCell className="font-medium">
                            {customer ? customer[1].name : 'Unknown'}
                          </TableCell>
                          <TableCell className="text-sm">{formatDateTime(transaction.timestamp)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(transaction.total)}</TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell>
                            <Select
                              value={transaction.status}
                              onValueChange={(value) => handleStatusChange(transaction.id, value as OrderStatus)}
                              disabled={updateStatus.isPending}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Menunggu</SelectItem>
                                <SelectItem value="processing">Diproses</SelectItem>
                                <SelectItem value="ready">Siap</SelectItem>
                                <SelectItem value="completed">Selesai</SelectItem>
                                <SelectItem value="canceled">Dibatalkan</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
