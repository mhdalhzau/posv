import { useState, useMemo } from 'react';
import { useListProductsByOutlet, useListActivePackages, useGetCallerUserProfile, useCreateTransaction } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Smartphone, Truck, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PaymentCategory, PaymentSubCategory } from '../backend';
import type { TransactionItem, PaymentMethod } from '../types';
import { calculatePackageStock } from '../lib/packageStockCalculator';

interface CartItem {
  id: string;
  name: string;
  price: bigint;
  quantity: number;
  isPackage: boolean;
  productId: bigint;
  availableStock: bigint;
}

interface PaymentMethodInput {
  id: string;
  category: PaymentCategory;
  subCategory?: PaymentSubCategory;
  methodName: string;
  amount: string;
}

export default function POSPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const userOutletId = userProfile?.outletId;
  const { data: products, isLoading: productsLoading } = useListProductsByOutlet(userOutletId || null);
  const { data: packages, isLoading: packagesLoading } = useListActivePackages(userOutletId || null);
  const createTransaction = useCreateTransaction();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInput[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'packages'>('products');

  // Calculate package stocks dynamically
  const packagesWithStock = useMemo(() => {
    if (!packages || !products) return [];
    return packages.map(pkg => ({
      ...pkg,
      stock: calculatePackageStock(pkg, products),
    }));
  }, [packages, products]);

  const addToCart = (item: { id: bigint; name: string; price: bigint; stock: bigint }, isPackage: boolean) => {
    const cartId = `${isPackage ? 'pkg' : 'prod'}-${item.id}`;
    const existingItem = cart.find(cartItem => cartItem.id === cartId);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === cartId
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      const newItem: CartItem = {
        id: cartId,
        name: item.name,
        price: item.price,
        quantity: 1,
        isPackage,
        productId: item.id,
        availableStock: item.stock,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartId);
    } else {
      setCart(cart.map(item =>
        item.id === cartId ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.id !== cartId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  };

  const addPaymentMethod = (category: PaymentCategory, methodName: string, subCategory?: PaymentSubCategory) => {
    const newPayment: PaymentMethodInput = {
      id: Date.now().toString(),
      category,
      subCategory,
      methodName,
      amount: '',
    };
    setPaymentMethods([...paymentMethods, newPayment]);
  };

  const updatePaymentAmount = (id: string, amount: string) => {
    setPaymentMethods(paymentMethods.map(pm =>
      pm.id === id ? { ...pm, amount } : pm
    ));
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
  };

  const calculateTotalPayment = () => {
    return paymentMethods.reduce((sum, pm) => sum + (parseFloat(pm.amount) || 0), 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }

    if (paymentMethods.length === 0) {
      toast.error('Pilih metode pembayaran');
      return;
    }

    const total = calculateTotal();
    const totalPayment = calculateTotalPayment();

    if (Math.abs(total - totalPayment) > 0.01) {
      toast.error(`Total pembayaran harus sama dengan total belanja (Rp ${total.toLocaleString('id-ID')})`);
      return;
    }

    if (!userOutletId) {
      toast.error('Outlet tidak ditemukan');
      return;
    }

    // Validate stock - recalculate for packages
    for (const item of cart) {
      let currentStock = item.availableStock;
      
      if (item.isPackage) {
        // Recalculate package stock in real-time
        const pkg = packages?.find(p => p.id === item.productId);
        if (pkg) {
          currentStock = calculatePackageStock(pkg, products);
        }
      }
      
      if (item.quantity > Number(currentStock)) {
        toast.error(`Stok tidak cukup untuk ${item.name}. Tersedia: ${currentStock.toString()}`);
        return;
      }
    }

    const items: TransactionItem[] = cart.map(item => ({
      productId: item.productId,
      quantity: BigInt(item.quantity),
      price: item.price,
      isPackage: item.isPackage,
      isBundle: false,
    }));

    const payments: PaymentMethod[] = paymentMethods.map(pm => ({
      category: pm.category,
      subCategory: pm.subCategory,
      methodName: pm.methodName,
      amount: BigInt(Math.round(parseFloat(pm.amount))),
    }));

    createTransaction.mutate(
      {
        items,
        outletId: userOutletId,
        paymentMethods: payments,
      },
      {
        onSuccess: () => {
          setCart([]);
          setPaymentMethods([]);
          toast.success('Transaksi berhasil disimpan');
        },
      }
    );
  };

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredPackages = packagesWithStock?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number | bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const isLoading = productsLoading || packagesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kasir (POS)</h1>
        <p className="text-muted-foreground">Proses transaksi penjualan produk dan paket</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Item</CardTitle>
              <CardDescription>Cari dan tambahkan produk atau paket ke keranjang</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Cari produk atau paket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'products' | 'packages')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="products">Produk Satuan</TabsTrigger>
                  <TabsTrigger value="packages">Paket</TabsTrigger>
                </TabsList>
                <TabsContent value="products" className="mt-4">
                  {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Tidak ada produk ditemukan
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <Button
                          key={product.id.toString()}
                          variant="outline"
                          className="h-auto flex flex-col items-start p-4"
                          onClick={() => addToCart(product, false)}
                          disabled={product.stock === BigInt(0)}
                        >
                          <div className="font-semibold text-left">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(product.price)}</div>
                          <Badge variant={product.stock === BigInt(0) ? 'destructive' : 'secondary'} className="mt-2">
                            Stok: {product.stock.toString()}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="packages" className="mt-4">
                  {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredPackages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Tidak ada paket ditemukan
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                      {filteredPackages.map((pkg) => (
                        <Button
                          key={pkg.id.toString()}
                          variant="outline"
                          className="h-auto flex flex-col items-start p-4"
                          onClick={() => addToCart(pkg, true)}
                          disabled={pkg.stock === BigInt(0)}
                        >
                          <div className="flex items-center gap-1 font-semibold text-left">
                            <Package className="h-4 w-4" />
                            {pkg.name}
                          </div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(pkg.price)}</div>
                          <Badge variant={pkg.stock === BigInt(0) ? 'destructive' : 'secondary'} className="mt-2">
                            Stok: {pkg.stock.toString()} paket
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Payment Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Keranjang
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keranjang kosong
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate flex items-center gap-1">
                          {item.isPackage && <Package className="h-3 w-3" />}
                          {item.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= Number(item.availableStock)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="offline">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="offline">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Offline
                    </TabsTrigger>
                    <TabsTrigger value="online">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Online
                    </TabsTrigger>
                    <TabsTrigger value="delivery">
                      <Truck className="h-4 w-4 mr-2" />
                      Delivery
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="offline" className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.offline, 'Tunai')}
                    >
                      Tunai
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.offline, 'Kartu Debit/Kredit')}
                    >
                      Kartu Debit/Kredit
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.offline, 'Transfer Bank')}
                    >
                      Transfer Bank
                    </Button>
                  </TabsContent>
                  <TabsContent value="online" className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.online, 'eWallet', PaymentSubCategory.eWallet)}
                    >
                      eWallet
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.online, 'QRIS', PaymentSubCategory.qris)}
                    >
                      QRIS
                    </Button>
                  </TabsContent>
                  <TabsContent value="delivery" className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.foodDelivery, 'ShopeeFood', PaymentSubCategory.shopeeFood)}
                    >
                      ShopeeFood
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.foodDelivery, 'GoFood', PaymentSubCategory.goFood)}
                    >
                      GoFood
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => addPaymentMethod(PaymentCategory.foodDelivery, 'GrabFood', PaymentSubCategory.grabFood)}
                    >
                      GrabFood
                    </Button>
                  </TabsContent>
                </Tabs>

                {paymentMethods.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>Pembayaran Dipilih:</Label>
                    {paymentMethods.map((pm) => (
                      <div key={pm.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{pm.methodName}</div>
                          <Input
                            type="number"
                            placeholder="Jumlah (Rp)"
                            value={pm.amount}
                            onChange={(e) => updatePaymentAmount(pm.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removePaymentMethod(pm.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Pembayaran:</span>
                      <span>{formatCurrency(calculateTotalPayment())}</span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={createTransaction.isPending || paymentMethods.length === 0}
                >
                  {createTransaction.isPending ? 'Memproses...' : 'Proses Pembayaran'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

