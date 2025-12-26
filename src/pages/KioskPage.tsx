import { useState, useMemo, useEffect, useRef } from 'react';
import { useGetCallerUserProfile, useListOutlets, useListProductsByOutlet, useListActivePackages, useListActiveBundles, useCreateTransaction, useGetUserTransactionHistory, useGetPaymentSettings, useUploadPaymentProof } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Plus, Minus, Trash2, Package, Box, Clock, CheckCircle2, XCircle, AlertCircle, ShoppingBag, Truck, QrCode, Building2, User, LogIn, Upload, X } from 'lucide-react';
import { calculatePackageStock, calculateBundleStock } from '../lib/packageStockCalculator';
import { PaymentCategory, PaymentSubCategory, OrderStatus } from '../backend';
import type { TransactionItem, PaymentMethod } from '../types';
import type { GuestCustomerData } from '../backend';
import { toast } from 'sonner';

interface CartItem {
  id: bigint;
  name: string;
  price: bigint;
  quantity: number;
  type: 'product' | 'package' | 'bundle';
  availableStock: bigint;
}

interface GuestProfileData {
  name: string;
  phone: string;
  address: string;
  password: string;
}

const GUEST_DATA_KEY = 'kiosk_guest_data';

export default function KioskPage() {
  const { identity, login } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: outlets } = useListOutlets();
  const [selectedOutletId, setSelectedOutletId] = useState<bigint | null>(null);
  const { data: products } = useListProductsByOutlet(selectedOutletId);
  const { data: packages } = useListActivePackages(selectedOutletId);
  const { data: bundles } = useListActiveBundles(selectedOutletId);
  const { data: transactionHistory } = useGetUserTransactionHistory();
  const { data: paymentSettings } = useGetPaymentSettings();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [orderType, setOrderType] = useState<'takeaway' | 'delivery' | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'bankTransfer' | ''>('');
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [currentTransactionId, setCurrentTransactionId] = useState<bigint | null>(null);
  const [guestData, setGuestData] = useState<GuestProfileData>({
    name: '',
    phone: '',
    address: '',
    password: '',
  });
  const createTransaction = useCreateTransaction();
  const uploadPaymentProof = useUploadPaymentProof();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = !!identity;
  const isGuest = !isAuthenticated;

  // Load guest data from localStorage on mount
  useEffect(() => {
    if (isGuest) {
      const savedData = localStorage.getItem(GUEST_DATA_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setGuestData(parsed);
        } catch (e) {
          console.error('Failed to parse guest data:', e);
        }
      }
    }
  }, [isGuest]);

  // Calculate stock for packages and bundles
  const packagesWithStock = useMemo(() => {
    if (!packages || !products) return [];
    return packages.map(pkg => ({
      ...pkg,
      calculatedStock: calculatePackageStock(pkg, products),
    }));
  }, [packages, products]);

  const bundlesWithStock = useMemo(() => {
    if (!bundles || !products || !packages) return [];
    return bundles.map(bundle => ({
      ...bundle,
      calculatedStock: calculateBundleStock(bundle, products, packages),
    }));
  }, [bundles, products, packages]);

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const addToCart = (item: { id: bigint; name: string; price: bigint; type: 'product' | 'package' | 'bundle'; availableStock: bigint }) => {
    const existingItem = cart.find(i => i.id === item.id && i.type === item.type);
    if (existingItem) {
      if (existingItem.quantity < Number(item.availableStock)) {
        setCart(cart.map(i => 
          i.id === item.id && i.type === item.type 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ));
      }
    } else {
      if (item.availableStock > 0n) {
        setCart([...cart, { ...item, quantity: 1 }]);
      }
    }
  };

  const updateQuantity = (id: bigint, type: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id && item.type === type) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return item;
        if (newQuantity > Number(item.availableStock)) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: bigint, type: string) => {
    setCart(cart.filter(item => !(item.id === id && item.type === type)));
  };

  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handleCheckoutClick = () => {
    if (isGuest && !guestData.name) {
      setShowGuestForm(true);
    } else {
      setShowCheckout(true);
    }
  };

  const handleGuestFormSubmit = () => {
    if (!guestData.name || !guestData.phone || !guestData.password) {
      return;
    }

    localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(guestData));
    setShowGuestForm(false);
    setShowCheckout(true);
  };

  const handleProceedToPayment = () => {
    if (!orderType || !paymentMethod) return;

    if (orderType === 'delivery' && isGuest && !guestData.address) {
      return;
    }

    setShowPaymentInstructions(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setPaymentProofFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPaymentProofPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveProofImage = () => {
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOutletId || cart.length === 0 || !orderType || !paymentMethod) return;

    const items: TransactionItem[] = cart.map(item => ({
      productId: item.id,
      quantity: BigInt(item.quantity),
      price: item.price,
      isPackage: item.type === 'package',
      isBundle: item.type === 'bundle',
    }));

    const paymentMethods: PaymentMethod[] = [{
      category: PaymentCategory.online,
      subCategory: paymentMethod === 'qris' ? PaymentSubCategory.qris : undefined,
      methodName: paymentMethod === 'qris' ? 'QRIS Statis' : 'Transfer Bank',
      amount: BigInt(cartTotal),
    }];

    const guestCustomerData: GuestCustomerData | null = isGuest ? {
      name: guestData.name,
      phone: guestData.phone,
      address: guestData.address,
    } : null;

    try {
      const transactionId = await createTransaction.mutateAsync({
        items,
        outletId: selectedOutletId,
        paymentMethods,
        guestData: guestCustomerData,
      });

      // Upload payment proof if provided
      if (paymentProofFile && transactionId) {
        await uploadPaymentProof.mutateAsync({
          transactionId,
          file: paymentProofFile,
        });
      }

      setCart([]);
      setShowCheckout(false);
      setShowPaymentInstructions(false);
      setOrderType('');
      setPaymentMethod('');
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setCurrentTransactionId(null);
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const hasOrderTypeError = showCheckout && !orderType;
  const hasPaymentMethodError = showCheckout && orderType && !paymentMethod;
  const hasAddressError = showCheckout && orderType === 'delivery' && isGuest && !guestData.address;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kiosk</h1>
          <p className="text-muted-foreground">
            {isAuthenticated 
              ? `Selamat datang, ${userProfile?.name}! Pilih produk untuk dibeli`
              : 'Selamat datang! Jelajahi produk kami'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAuthenticated && (
            <Button onClick={() => setShowHistory(true)} variant="outline">
              Riwayat Pembelian
            </Button>
          )}
          {isGuest && (
            <Button onClick={handleLogin} variant="outline">
              <LogIn className="mr-2 h-4 w-4" />
              Login untuk Melacak Pesanan
            </Button>
          )}
        </div>
      </div>

      {isGuest && (
        <Alert>
          <User className="h-4 w-4" />
          <AlertDescription>
            Anda sedang berbelanja sebagai tamu. Login untuk melacak pesanan Anda secara permanen.
          </AlertDescription>
        </Alert>
      )}

      {/* Outlet Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Outlet</CardTitle>
          <CardDescription>Pilih outlet untuk melihat produk yang tersedia</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedOutletId?.toString() || ''} onValueChange={(value) => setSelectedOutletId(BigInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih outlet" />
            </SelectTrigger>
            <SelectContent>
              {outlets?.filter(o => o.isActive).map(outlet => (
                <SelectItem key={outlet.id.toString()} value={outlet.id.toString()}>
                  {outlet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedOutletId && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Products List */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products">Produk</TabsTrigger>
                <TabsTrigger value="packages">Paket</TabsTrigger>
                <TabsTrigger value="bundles">Bundle</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {products?.map(product => (
                    <Card key={product.id.toString()} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <CardDescription className="text-xl font-bold text-primary mt-2">
                              {formatCurrency(product.price)}
                            </CardDescription>
                          </div>
                          <Badge variant={product.stock > 0n ? 'default' : 'secondary'}>
                            Stok: {product.stock.toString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            type: 'product',
                            availableStock: product.stock,
                          })}
                          disabled={product.stock === 0n}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah ke Keranjang
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="packages" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {packagesWithStock?.map(pkg => (
                    <Card key={pkg.id.toString()} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              <CardTitle className="text-lg">{pkg.name}</CardTitle>
                            </div>
                            <CardDescription className="text-xl font-bold text-primary mt-2">
                              {formatCurrency(pkg.price)}
                            </CardDescription>
                          </div>
                          <Badge variant={pkg.calculatedStock > 0n ? 'default' : 'secondary'}>
                            Stok: {pkg.calculatedStock.toString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => addToCart({
                            id: pkg.id,
                            name: pkg.name,
                            price: pkg.price,
                            type: 'package',
                            availableStock: pkg.calculatedStock,
                          })}
                          disabled={pkg.calculatedStock === 0n}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah ke Keranjang
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="bundles" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {bundlesWithStock?.map(bundle => (
                    <Card key={bundle.id.toString()} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-primary" />
                              <CardTitle className="text-lg">{bundle.name}</CardTitle>
                            </div>
                            <CardDescription className="text-xl font-bold text-primary mt-2">
                              {formatCurrency(bundle.price)}
                            </CardDescription>
                          </div>
                          <Badge variant={bundle.calculatedStock > 0n ? 'default' : 'secondary'}>
                            Stok: {bundle.calculatedStock.toString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => addToCart({
                            id: bundle.id,
                            name: bundle.name,
                            price: bundle.price,
                            type: 'bundle',
                            availableStock: bundle.calculatedStock,
                          })}
                          disabled={bundle.calculatedStock === 0n}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah ke Keranjang
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Shopping Cart */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang Belanja
                </CardTitle>
                <CardDescription>{cart.length} item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[400px] pr-4">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Keranjang kosong</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item, index) => (
                        <div key={`${item.id}-${item.type}-${index}`} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.type, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.type, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 ml-auto"
                                onClick={() => removeFromCart(item.id, item.type)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(BigInt(cartTotal))}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckoutClick}
                  disabled={cart.length === 0}
                  className="w-full"
                  size="lg"
                >
                  Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Guest Profile Form Dialog */}
      <Dialog open={showGuestForm} onOpenChange={setShowGuestForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Data Profil Anda</DialogTitle>
            <DialogDescription>Isi data Anda untuk melanjutkan pemesanan</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Nama Lengkap *</Label>
              <Input
                id="guest-name"
                placeholder="Masukkan nama lengkap"
                value={guestData.name}
                onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-phone">Nomor HP *</Label>
              <Input
                id="guest-phone"
                placeholder="08xxxxxxxxxx"
                value={guestData.phone}
                onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-address">Alamat</Label>
              <Textarea
                id="guest-address"
                placeholder="Masukkan alamat lengkap (wajib untuk delivery)"
                value={guestData.address}
                onChange={(e) => setGuestData({ ...guestData, address: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-password">Password *</Label>
              <Input
                id="guest-password"
                type="password"
                placeholder="Buat password untuk tracking pesanan"
                value={guestData.password}
                onChange={(e) => setGuestData({ ...guestData, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Password ini untuk melacak pesanan Anda di masa mendatang
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Data Anda akan disimpan di perangkat ini untuk pesanan berikutnya. Login untuk menyimpan secara permanen.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuestForm(false)}>
              Batal
            </Button>
            <Button
              onClick={handleGuestFormSubmit}
              disabled={!guestData.name || !guestData.phone || !guestData.password}
            >
              Lanjutkan Pesanan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Pilih jenis pesanan dan metode pembayaran</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Total Pembayaran</Label>
              <p className="text-2xl font-bold text-primary">{formatCurrency(BigInt(cartTotal))}</p>
            </div>

            <Separator />

            {/* Order Type Selection */}
            <div className="space-y-3">
              <Label>Jenis Pesanan *</Label>
              <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                {paymentSettings?.takeawayEnabled && (
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="takeaway" id="takeaway" />
                    <Label htmlFor="takeaway" className="flex items-center gap-2 cursor-pointer flex-1">
                      <ShoppingBag className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Takeaway</p>
                        <p className="text-xs text-muted-foreground">Dibawa pulang</p>
                      </div>
                    </Label>
                  </div>
                )}
                {paymentSettings?.deliveryEnabled && (
                  <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Truck className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Delivery</p>
                        <p className="text-xs text-muted-foreground">Diantar ke alamat</p>
                      </div>
                    </Label>
                  </div>
                )}
              </RadioGroup>
              {hasOrderTypeError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Pilih jenis pesanan terlebih dahulu</AlertDescription>
                </Alert>
              )}
              {hasAddressError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Alamat wajib diisi untuk delivery. Kembali ke form profil untuk mengisi alamat.</AlertDescription>
                </Alert>
              )}
            </div>

            {orderType && (
              <>
                <Separator />

                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label>Metode Pembayaran *</Label>
                  <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                    {paymentSettings?.qrisStaticEnabled && (
                      <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="qris" id="qris" />
                        <Label htmlFor="qris" className="flex items-center gap-2 cursor-pointer flex-1">
                          <QrCode className="h-4 w-4" />
                          <div>
                            <p className="font-medium">QRIS Statis</p>
                            <p className="text-xs text-muted-foreground">Scan QR code untuk bayar</p>
                          </div>
                        </Label>
                      </div>
                    )}
                    {paymentSettings?.bankTransferEnabled && (
                      <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                        <RadioGroupItem value="bankTransfer" id="bankTransfer" />
                        <Label htmlFor="bankTransfer" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Building2 className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Transfer Bank</p>
                            <p className="text-xs text-muted-foreground">Transfer ke rekening</p>
                          </div>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                  {hasPaymentMethodError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Pilih metode pembayaran terlebih dahulu</AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Batal
            </Button>
            <Button
              onClick={handleProceedToPayment}
              disabled={!orderType || !paymentMethod || (orderType === 'delivery' && isGuest && !guestData.address)}
            >
              Lanjut ke Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Instructions Dialog */}
      <Dialog open={showPaymentInstructions} onOpenChange={setShowPaymentInstructions}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Instruksi Pembayaran</DialogTitle>
            <DialogDescription>Ikuti langkah-langkah berikut untuk menyelesaikan pembayaran</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total yang harus dibayar</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(BigInt(cartTotal))}</p>
            </div>

            {paymentMethod === 'qris' && paymentSettings?.qrisStaticImageBlob && (
              <div className="space-y-3">
                <div className="flex items-center justify-center p-4 bg-white border rounded-lg">
                  <img
                    src={paymentSettings.qrisStaticImageBlob.getDirectURL()}
                    alt="QRIS Code"
                    className="max-w-full max-h-64 object-contain"
                  />
                </div>
                {paymentSettings.qrisMerchantName && (
                  <p className="text-center text-sm font-medium">
                    Merchant: {paymentSettings.qrisMerchantName}
                  </p>
                )}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
                      <li>Pilih menu Scan QR atau QRIS</li>
                      <li>Scan QR code di atas</li>
                      <li>Konfirmasi pembayaran sebesar {formatCurrency(BigInt(cartTotal))}</li>
                      <li>Upload bukti pembayaran di bawah setelah berhasil</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {paymentMethod === 'bankTransfer' && paymentSettings && (
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bank:</span>
                    <span className="font-medium">{paymentSettings.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nomor Rekening:</span>
                    <span className="font-medium">{paymentSettings.bankAccountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Atas Nama:</span>
                    <span className="font-medium">{paymentSettings.bankAccountName}</span>
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Buka aplikasi mobile banking Anda</li>
                      <li>Pilih menu Transfer</li>
                      <li>Masukkan nomor rekening di atas</li>
                      <li>Transfer sebesar {formatCurrency(BigInt(cartTotal))}</li>
                      <li>Upload bukti pembayaran di bawah setelah berhasil</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <Separator />

            {/* Payment Proof Upload */}
            <div className="space-y-3">
              <Label>Upload Bukti Pembayaran</Label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Pilih Gambar Bukti Pembayaran
                </Button>
                {paymentProofFile && (
                  <p className="text-sm text-muted-foreground text-center">{paymentProofFile.name}</p>
                )}
                <p className="text-xs text-muted-foreground text-center">
                  Format: JPG, PNG. Maksimal 5MB
                </p>
              </div>

              {paymentProofPreview && (
                <div className="space-y-2">
                  <Label>Preview Bukti Pembayaran</Label>
                  <div className="relative inline-block w-full">
                    <img
                      src={paymentProofPreview}
                      alt="Payment Proof Preview"
                      className="w-full rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveProofImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentInstructions(false)}>
              Batal
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={createTransaction.isPending || uploadPaymentProof.isPending}
            >
              {createTransaction.isPending || uploadPaymentProof.isPending ? 'Memproses...' : 'Konfirmasi Pembayaran'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase History Dialog */}
      {isAuthenticated && (
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="sm:max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Riwayat Pembelian</DialogTitle>
              <DialogDescription>Daftar pesanan Anda dengan status terkini</DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[500px] pr-4">
              {!transactionHistory || transactionHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada riwayat pembelian</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Terakhir Diperbarui</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionHistory.map(([transaction, history]) => (
                      <TableRow key={transaction.id.toString()}>
                        <TableCell className="text-sm">{formatDate(transaction.timestamp)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(transaction.total)}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(transaction.statusUpdatedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

