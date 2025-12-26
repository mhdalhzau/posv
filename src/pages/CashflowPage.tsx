import { useState, useMemo } from 'react';
import { useGetExpenses, useGetCashflowSummary, useAddExpense, useUpdateExpense, useDeleteExpense, useListAllTransactions } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type TimeFilter = 'daily' | 'weekly' | 'monthly';

export default function CashflowPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('daily');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<bigint | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [outletId, setOutletId] = useState('');

  const { data: expenses, isLoading: expensesLoading } = useGetExpenses();
  const { data: transactions, isLoading: transactionsLoading } = useListAllTransactions();

  // Calculate date range based on filter
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const end = BigInt(now.getTime() * 1_000_000); // Convert to nanoseconds
    let start: bigint;

    switch (timeFilter) {
      case 'daily':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        start = BigInt(startOfDay.getTime() * 1_000_000);
        break;
      case 'weekly':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = BigInt(startOfWeek.getTime() * 1_000_000);
        break;
      case 'monthly':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        start = BigInt(startOfMonth.getTime() * 1_000_000);
        break;
      default:
        start = BigInt(0);
    }

    return { startDate: start, endDate: end };
  }, [timeFilter]);

  const { data: cashflowSummary, isLoading: summaryLoading } = useGetCashflowSummary(startDate, endDate);

  const addExpenseMutation = useAddExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleAddExpense = async () => {
    if (!amount || !category || !description) {
      toast.error('Semua field wajib diisi');
      return;
    }

    try {
      await addExpenseMutation.mutateAsync({
        amount: BigInt(amount),
        category,
        description,
        outletId: outletId ? BigInt(outletId) : BigInt(1),
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !amount || !category || !description) {
      toast.error('Semua field wajib diisi');
      return;
    }

    try {
      await updateExpenseMutation.mutateAsync({
        expenseId: editingExpense.id,
        amount: BigInt(amount),
        category,
        description,
      });
      setEditingExpense(null);
      resetForm();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpenseId) return;

    try {
      await deleteExpenseMutation.mutateAsync(deleteExpenseId);
      setDeleteExpenseId(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setOutletId('');
  };

  const openEditDialog = (expense: any) => {
    setEditingExpense(expense);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setOutletId(expense.outletId.toString());
  };

  // Filter transactions and expenses by time range
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => t.timestamp >= startDate && t.timestamp <= endDate);
  }, [transactions, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => e.timestamp >= startDate && e.timestamp <= endDate);
  }, [expenses, startDate, endDate]);

  // Combine transactions and expenses for display
  const allCashflowItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'income' | 'expense';
      amount: bigint;
      description: string;
      category: string;
      timestamp: bigint;
      data?: any;
    }> = [];

    // Add income from transactions
    filteredTransactions.forEach(t => {
      items.push({
        id: `transaction-${t.id}`,
        type: 'income',
        amount: t.total,
        description: `Transaksi #${t.id} - ${t.items.length} item`,
        category: 'Penjualan',
        timestamp: t.timestamp,
        data: t,
      });
    });

    // Add expenses
    filteredExpenses.forEach(e => {
      items.push({
        id: `expense-${e.id}`,
        type: 'expense',
        amount: e.amount,
        description: e.description,
        category: e.category,
        timestamp: e.timestamp,
        data: e,
      });
    });

    return items.sort((a, b) => Number(b.timestamp - a.timestamp));
  }, [filteredTransactions, filteredExpenses]);

  const displayedItems = useMemo(() => {
    if (transactionFilter === 'all') return allCashflowItems;
    return allCashflowItems.filter(item => item.type === transactionFilter);
  }, [allCashflowItems, transactionFilter]);

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'daily': return 'Hari Ini';
      case 'weekly': return '7 Hari Terakhir';
      case 'monthly': return 'Bulan Ini';
      default: return '';
    }
  };

  const balanceColor = cashflowSummary && cashflowSummary.balance >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Arus Kas</h1>
          <p className="text-muted-foreground">Kelola pemasukan dan pengeluaran bisnis Anda</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingExpense(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengeluaran</DialogTitle>
              <DialogDescription>Catat pengeluaran bisnis Anda</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Jumlah (Rp)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operasional">Operasional</SelectItem>
                    <SelectItem value="Inventori">Inventori</SelectItem>
                    <SelectItem value="Gaji">Gaji</SelectItem>
                    <SelectItem value="Pemasaran">Pemasaran</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi pengeluaran..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddExpense} disabled={addExpenseMutation.isPending}>
                {addExpenseMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Time Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <TabsList>
            <TabsTrigger value="daily">Harian</TabsTrigger>
            <TabsTrigger value="weekly">Mingguan</TabsTrigger>
            <TabsTrigger value="monthly">Bulanan</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-sm text-muted-foreground ml-2">{getTimeFilterLabel()}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(cashflowSummary?.totalIncome || BigInt(0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Dari penjualan</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(cashflowSummary?.totalExpenses || BigInt(0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Pengeluaran manual</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Saat Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className={`text-2xl font-bold ${balanceColor}`}>
                  {formatCurrency(BigInt(cashflowSummary?.balance || 0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cashflowSummary && cashflowSummary.balance >= 0 ? 'Surplus' : 'Defisit'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Riwayat Transaksi</CardTitle>
              <CardDescription>Daftar pemasukan dan pengeluaran</CardDescription>
            </div>
            <Tabs value={transactionFilter} onValueChange={(v) => setTransactionFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="income">Pemasukan</TabsTrigger>
                <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {expensesLoading || transactionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada transaksi untuk periode ini
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">{formatDate(item.timestamp)}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === 'income' ? 'default' : 'destructive'}>
                          {item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.type === 'expense' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item.data)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteExpenseId(item.data.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengeluaran</DialogTitle>
            <DialogDescription>Perbarui informasi pengeluaran</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-amount">Jumlah (Rp)</Label>
              <Input
                id="edit-amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operasional">Operasional</SelectItem>
                  <SelectItem value="Inventori">Inventori</SelectItem>
                  <SelectItem value="Gaji">Gaji</SelectItem>
                  <SelectItem value="Pemasaran">Pemasaran</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                placeholder="Deskripsi pengeluaran..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>
              Batal
            </Button>
            <Button onClick={handleUpdateExpense} disabled={updateExpenseMutation.isPending}>
              {updateExpenseMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteExpenseId} onOpenChange={(open) => !open && setDeleteExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengeluaran akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} disabled={deleteExpenseMutation.isPending}>
              {deleteExpenseMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
