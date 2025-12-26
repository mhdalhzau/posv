import { useGetCallerUserProfile, useIsCallerAdmin, useListOutlets, useGetDailySummaryOutlet, useGetOverallSummaryOutlet, useGetBestSellers, useListProductsByOutlet, useGetTopOutlets, useGetOutlet } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingCart, Package, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: outlets } = useListOutlets();

  const isOwner = isAdmin;
  const userOutletId = userProfile?.outletId;

  // Owner sees all outlets aggregated
  // Manager/Cashier sees their assigned outlet
  const targetOutletId = isOwner ? null : userOutletId;

  if (isOwner) {
    return <OwnerDashboard outlets={outlets || []} />;
  } else if (userOutletId) {
    return <OutletDashboard outletId={userOutletId} />;
  } else {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Anda belum ditugaskan ke outlet manapun</p>
        </div>
      </div>
    );
  }
}

function OwnerDashboard({ outlets }: { outlets: any[] }) {
  const { data: topOutlets, isLoading: topOutletsLoading } = useGetTopOutlets();

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  // Calculate aggregated stats
  const totalRevenue = topOutlets?.reduce((sum, [_, revenue]) => sum + Number(revenue), 0) || 0;
  const activeOutlets = outlets.filter(o => o.isActive).length;

  const getOutletName = (outletId: bigint) => {
    const outlet = outlets.find(o => o.id === outletId);
    return outlet?.name || `Outlet #${outletId}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Owner</h1>
        <p className="text-muted-foreground">Ringkasan performa semua outlet</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outlet</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{outlets.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{activeOutlets} aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topOutletsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(BigInt(totalRevenue))}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Semua outlet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outlet Terbaik</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topOutletsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : topOutlets && topOutlets.length > 0 ? (
              <>
                <p className="text-2xl font-bold">{getOutletName(topOutlets[0][0])}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(topOutlets[0][1])}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Operasional</p>
            <p className="text-xs text-muted-foreground mt-1">Semua sistem normal</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Outlets */}
      <Card>
        <CardHeader>
          <CardTitle>Performa Outlet</CardTitle>
          <CardDescription>Outlet dengan pendapatan tertinggi</CardDescription>
        </CardHeader>
        <CardContent>
          {topOutletsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !topOutlets || topOutlets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada data penjualan
            </p>
          ) : (
            <div className="space-y-3">
              {topOutlets
                .sort((a, b) => Number(b[1] - a[1]))
                .slice(0, 5)
                .map(([outletId, revenue]) => (
                  <div key={outletId.toString()} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{getOutletName(outletId)}</p>
                        <p className="text-sm text-muted-foreground">Outlet #{outletId.toString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(revenue)}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outlets List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Outlet</CardTitle>
          <CardDescription>Semua outlet yang terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          {outlets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada outlet terdaftar
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {outlets.map((outlet) => (
                <Card key={outlet.id.toString()}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{outlet.name}</CardTitle>
                      <Badge variant={outlet.isActive ? 'default' : 'secondary'}>
                        {outlet.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">{outlet.address}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OutletDashboard({ outletId }: { outletId: bigint }) {
  const { data: outlet } = useGetOutlet(outletId);
  const { data: dailySummary, isLoading: dailyLoading } = useGetDailySummaryOutlet(outletId);
  const { data: overallSummary, isLoading: overallLoading } = useGetOverallSummaryOutlet(outletId);
  const { data: bestSellers, isLoading: bestSellersLoading } = useGetBestSellers(outletId);
  const { data: products } = useListProductsByOutlet(outletId);

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getProductName = (productId: bigint) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || `Produk #${productId}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {outlet ? `${outlet.name} - ${outlet.address}` : 'Ringkasan outlet Anda'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{dailySummary?.transactionCount.toString() || '0'}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Transaksi dalam 24 jam terakhir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(dailySummary?.totalRevenue || BigInt(0))}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total penjualan hari ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overallLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{overallSummary?.[0].toString() || '0'}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {overallLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(overallSummary?.[1] || BigInt(0))}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
          </CardContent>
        </Card>
      </div>

      {/* Best Sellers */}
      <Card>
        <CardHeader>
          <CardTitle>Produk Terlaris</CardTitle>
          <CardDescription>Produk dengan penjualan tertinggi di outlet ini</CardDescription>
        </CardHeader>
        <CardContent>
          {bestSellersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : !bestSellers || bestSellers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada data penjualan produk
            </p>
          ) : (
            <div className="space-y-3">
              {bestSellers
                .sort((a, b) => Number(b[1] - a[1]))
                .slice(0, 5)
                .map(([productId, quantity]) => (
                  <div key={productId.toString()} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{getProductName(productId)}</p>
                        <p className="text-sm text-muted-foreground">Produk #{productId.toString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{quantity.toString()}</p>
                      <p className="text-xs text-muted-foreground">Terjual</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
