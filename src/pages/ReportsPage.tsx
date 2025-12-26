import { useListAllTransactions, useListMyTransactions, useGetCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '../types';

export default function ReportsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: allTransactions, isLoading: allLoading } = useListAllTransactions();
  const { data: myTransactions, isLoading: myLoading } = useListMyTransactions();

  const isOwner = isAdmin;
  const transactions: Transaction[] | undefined = isOwner ? allTransactions : myTransactions;
  const isLoading = isOwner ? allLoading : myLoading;

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp / BigInt(1000000))).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodsDisplay = (transaction: Transaction) => {
    if (!transaction.paymentMethods || transaction.paymentMethods.length === 0) {
      return '-';
    }
    return transaction.paymentMethods.map(pm => pm.methodName).join(', ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isOwner ? 'Laporan Penjualan' : 'Transaksi Saya'}
        </h1>
        <p className="text-muted-foreground">
          {isOwner ? 'Lihat semua transaksi penjualan' : 'Riwayat transaksi Anda'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            {isOwner ? 'Semua transaksi di semua outlet' : 'Transaksi yang Anda buat'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Belum ada transaksi</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Transaksi akan muncul di sini setelah dibuat
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Jumlah Item</TableHead>
                    <TableHead>Metode Pembayaran</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id.toString()}>
                      <TableCell className="font-medium">#{transaction.id.toString()}</TableCell>
                      <TableCell>{formatDate(transaction.timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Outlet #{transaction.outletId.toString()}</Badge>
                      </TableCell>
                      <TableCell>{transaction.items.length} item</TableCell>
                      <TableCell>{getPaymentMethodsDisplay(transaction)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(transaction.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

