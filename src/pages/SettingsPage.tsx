import { useState, useEffect, useRef } from 'react';
import { useGetPaymentSettings, useUpdatePaymentSettings, useGetOwnerProfile, useUpdateOwnerProfile, useGetBusinessProfile, useUpdateBusinessProfile, useExportDatabase } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, User, CreditCard, Lock, ShoppingBag, Smartphone, AlertCircle, CheckCircle2, Building2, Upload, X, Database, Download, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';

export default function SettingsPage() {
  const { data: paymentSettings, isLoading: settingsLoading } = useGetPaymentSettings();
  const { data: ownerProfile, isLoading: ownerLoading } = useGetOwnerProfile();
  const { data: businessProfile, isLoading: businessLoading } = useGetBusinessProfile();
  const updatePaymentSettings = useUpdatePaymentSettings();
  const updateOwnerProfile = useUpdateOwnerProfile();
  const updateBusinessProfile = useUpdateBusinessProfile();
  const exportDatabase = useExportDatabase();

  // Profile Details State
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  // Payment Settings State
  const [takeawayEnabled, setTakeawayEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [qrisEnabled, setQrisEnabled] = useState(true);
  const [qrisImageFile, setQrisImageFile] = useState<File | null>(null);
  const [qrisImagePreview, setQrisImagePreview] = useState<string | null>(null);
  const [qrisMerchantName, setQrisMerchantName] = useState('');
  const [bankTransferEnabled, setBankTransferEnabled] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ownerProfile) {
      setOwnerName(ownerProfile.ownerName || '');
      setOwnerEmail(ownerProfile.email || '');
      setOwnerPhone(ownerProfile.phoneNumber || '');
    }
  }, [ownerProfile]);

  useEffect(() => {
    if (businessProfile) {
      setBusinessName(businessProfile.businessName || '');
      setBusinessAddress(businessProfile.businessAddress || '');
      setBusinessDescription(businessProfile.businessDescription || '');
    }
  }, [businessProfile]);

  useEffect(() => {
    if (paymentSettings) {
      setTakeawayEnabled(paymentSettings.takeawayEnabled);
      setDeliveryEnabled(paymentSettings.deliveryEnabled);
      setQrisEnabled(paymentSettings.qrisStaticEnabled);
      setQrisMerchantName(paymentSettings.qrisMerchantName || '');
      setBankTransferEnabled(paymentSettings.bankTransferEnabled);
      setBankName(paymentSettings.bankName || '');
      setBankAccountNumber(paymentSettings.bankAccountNumber || '');
      setBankAccountName(paymentSettings.bankAccountName || '');
      
      // Load existing QRIS image if available
      if (paymentSettings.qrisStaticImageBlob) {
        const imageUrl = paymentSettings.qrisStaticImageBlob.getDirectURL();
        setQrisImagePreview(imageUrl);
      }
    }
  }, [paymentSettings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    setQrisImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setQrisImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setQrisImageFile(null);
    setQrisImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveOwnerProfile = async () => {
    if (!ownerName.trim()) {
      toast.error('Nama lengkap wajib diisi');
      return;
    }

    if (!ownerEmail.trim()) {
      toast.error('Email wajib diisi');
      return;
    }

    if (!ownerPhone.trim()) {
      toast.error('Nomor telepon wajib diisi');
      return;
    }

    try {
      await updateOwnerProfile.mutateAsync({
        ownerName,
        email: ownerEmail,
        phoneNumber: ownerPhone,
        profilePhoto: null,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSaveBusinessProfile = async () => {
    if (!businessName.trim()) {
      toast.error('Nama bisnis wajib diisi');
      return;
    }

    if (!businessAddress.trim()) {
      toast.error('Alamat bisnis wajib diisi');
      return;
    }

    try {
      await updateBusinessProfile.mutateAsync({
        businessName,
        businessAddress,
        businessDescription,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSavePaymentSettings = async () => {
    if (!takeawayEnabled && !deliveryEnabled) {
      toast.error('Minimal satu jenis pesanan harus aktif');
      return;
    }
    if (!qrisEnabled && !bankTransferEnabled) {
      toast.error('Minimal satu metode pembayaran harus aktif');
      return;
    }
    if (qrisEnabled && (!qrisMerchantName || (!qrisImageFile && !qrisImagePreview))) {
      toast.error('Nama merchant dan gambar QRIS wajib diisi jika QRIS aktif');
      return;
    }
    if (bankTransferEnabled && (!bankName || !bankAccountNumber || !bankAccountName)) {
      toast.error('Informasi bank wajib lengkap jika transfer bank aktif');
      return;
    }

    try {
      let qrisBlob: ExternalBlob | null = null;
      
      if (qrisEnabled && qrisImageFile) {
        // Upload new image
        const arrayBuffer = await qrisImageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        qrisBlob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      } else if (qrisEnabled && paymentSettings?.qrisStaticImageBlob) {
        // Keep existing image
        qrisBlob = paymentSettings.qrisStaticImageBlob;
      }

      await updatePaymentSettings.mutateAsync({
        qrisStaticEnabled: qrisEnabled,
        qrisStaticImageBlob: qrisBlob,
        qrisMerchantName: qrisEnabled ? qrisMerchantName : null,
        bankTransferEnabled,
        bankName: bankTransferEnabled ? bankName : null,
        bankAccountNumber: bankTransferEnabled ? bankAccountNumber : null,
        bankAccountName: bankTransferEnabled ? bankAccountName : null,
        takeawayEnabled,
        deliveryEnabled,
      });
      
      setUploadProgress(0);
    } catch (error) {
      setUploadProgress(0);
      // Error handled by mutation
    }
  };

  const handleResetPaymentSettings = () => {
    setTakeawayEnabled(true);
    setDeliveryEnabled(true);
    setQrisEnabled(true);
    setQrisImageFile(null);
    setQrisImagePreview(null);
    setQrisMerchantName('');
    setBankTransferEnabled(false);
    setBankName('');
    setBankAccountNumber('');
    setBankAccountName('');
  };

  const handleExportDatabase = async () => {
    try {
      const data = await exportDatabase.mutateAsync();
      
      // Convert data to JSON string
      const jsonString = JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.download = `database-backup-${timestamp}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Database berhasil diekspor');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const hasOrderTypeError = !takeawayEnabled && !deliveryEnabled;
  const hasPaymentMethodError = !qrisEnabled && !bankTransferEnabled;
  const hasQrisInfoError = qrisEnabled && (!qrisMerchantName || (!qrisImageFile && !qrisImagePreview));
  const hasBankInfoError = bankTransferEnabled && (!bankName || !bankAccountNumber || !bankAccountName);
  const hasPaymentErrors = hasOrderTypeError || hasPaymentMethodError || hasQrisInfoError || hasBankInfoError;

  if (settingsLoading || ownerLoading || businessLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola profil, pembayaran, dan informasi login Anda</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-2" />
            Pembayaran
          </TabsTrigger>
          <TabsTrigger value="login">
            <Lock className="h-4 w-4 mr-2" />
            Login
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Profile Details Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Informasi Pribadi</CardTitle>
              </div>
              <CardDescription>Kelola informasi pribadi Anda sebagai owner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Nama Lengkap *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Masukkan nama lengkap"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Email *</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerPhone">Nomor Telepon *</Label>
                  <Input
                    id="ownerPhone"
                    placeholder="+62 812 3456 7890"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveOwnerProfile} disabled={updateOwnerProfile.isPending}>
                  {updateOwnerProfile.isPending ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>Informasi Bisnis</CardTitle>
              </div>
              <CardDescription>Kelola informasi bisnis Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nama Bisnis *</Label>
                <Input
                  id="businessName"
                  placeholder="Contoh: Toko Sejahtera"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Alamat Bisnis *</Label>
                <Textarea
                  id="businessAddress"
                  placeholder="Masukkan alamat lengkap bisnis"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessDescription">Deskripsi Bisnis</Label>
                <Textarea
                  id="businessDescription"
                  placeholder="Ceritakan tentang bisnis Anda"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBusinessProfile} disabled={updateBusinessProfile.isPending}>
                  {updateBusinessProfile.isPending ? 'Menyimpan...' : 'Simpan Profil Bisnis'}
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Informasi bisnis ini akan ditampilkan di struk dan dokumen resmi lainnya
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Order Type Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <CardTitle>Jenis Pesanan</CardTitle>
                </div>
                <CardDescription>Aktifkan atau nonaktifkan opsi jenis pesanan untuk pelanggan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="takeaway">Takeaway</Label>
                    <p className="text-sm text-muted-foreground">Pelanggan dapat memesan untuk dibawa pulang</p>
                  </div>
                  <Switch
                    id="takeaway"
                    checked={takeawayEnabled}
                    onCheckedChange={setTakeawayEnabled}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="delivery">Delivery</Label>
                    <p className="text-sm text-muted-foreground">Pelanggan dapat memesan untuk diantar</p>
                  </div>
                  <Switch
                    id="delivery"
                    checked={deliveryEnabled}
                    onCheckedChange={setDeliveryEnabled}
                  />
                </div>

                {hasOrderTypeError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Minimal satu jenis pesanan harus aktif
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>Metode Pembayaran</CardTitle>
                </div>
                <CardDescription>Aktifkan atau nonaktifkan metode pembayaran yang tersedia</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="qris">QRIS Statis</Label>
                    <p className="text-sm text-muted-foreground">QR code statis untuk pembayaran</p>
                  </div>
                  <Switch
                    id="qris"
                    checked={qrisEnabled}
                    onCheckedChange={setQrisEnabled}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="bankTransfer">Transfer Bank</Label>
                    <p className="text-sm text-muted-foreground">Pembayaran melalui transfer bank</p>
                  </div>
                  <Switch
                    id="bankTransfer"
                    checked={bankTransferEnabled}
                    onCheckedChange={setBankTransferEnabled}
                  />
                </div>

                {hasPaymentMethodError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Minimal satu metode pembayaran harus aktif
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* QRIS Static Configuration */}
            {qrisEnabled && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <CardTitle>Konfigurasi QRIS Statis</CardTitle>
                  </div>
                  <CardDescription>Upload gambar QR code statis untuk pembayaran</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="qrisMerchantName">Nama Merchant *</Label>
                      <Input
                        id="qrisMerchantName"
                        placeholder="Contoh: Toko Sejahtera"
                        value={qrisMerchantName}
                        onChange={(e) => setQrisMerchantName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Gambar QR Code *</Label>
                    <div className="flex items-center gap-4">
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
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Pilih Gambar
                      </Button>
                      {qrisImageFile && (
                        <span className="text-sm text-muted-foreground">{qrisImageFile.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: JPG, PNG. Maksimal 2MB
                    </p>
                  </div>

                  {qrisImagePreview && (
                    <div className="space-y-2">
                      <Label>Preview QR Code</Label>
                      <div className="relative inline-block">
                        <img
                          src={qrisImagePreview}
                          alt="QRIS Preview"
                          className="max-w-xs rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-2">
                      <Label>Upload Progress</Label>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                    </div>
                  )}

                  {hasQrisInfoError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nama merchant dan gambar QR code wajib diisi jika QRIS aktif
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Gambar QR code statis akan ditampilkan di halaman checkout kiosk untuk pelanggan
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Bank Information */}
            {bankTransferEnabled && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <CardTitle>Informasi Rekening Bank</CardTitle>
                  </div>
                  <CardDescription>Masukkan detail rekening bank untuk transfer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Nama Bank *</Label>
                      <Input
                        id="bankName"
                        placeholder="Contoh: Bank BCA"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Nomor Rekening *</Label>
                      <Input
                        id="bankAccountNumber"
                        placeholder="Contoh: 1234567890"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName">Atas Nama *</Label>
                      <Input
                        id="bankAccountName"
                        placeholder="Contoh: PT Toko Sejahtera"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value)}
                      />
                    </div>
                  </div>

                  {hasBankInfoError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Semua informasi bank wajib diisi jika transfer bank aktif
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Preview Konfigurasi Checkout</CardTitle>
                <CardDescription>Tampilan yang akan dilihat pelanggan saat checkout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-6 space-y-4 bg-muted/50">
                  <div>
                    <h3 className="font-semibold mb-2">Jenis Pesanan:</h3>
                    <div className="flex gap-2">
                      {takeawayEnabled && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Takeaway</span>
                        </div>
                      )}
                      {deliveryEnabled && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Delivery</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-2">Metode Pembayaran:</h3>
                    <div className="flex gap-2">
                      {qrisEnabled && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">QRIS Statis</span>
                        </div>
                      )}
                      {bankTransferEnabled && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-background border">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Transfer Bank</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {qrisEnabled && qrisImagePreview && qrisMerchantName && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Preview QRIS:</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Merchant: {qrisMerchantName}</p>
                          <img
                            src={qrisImagePreview}
                            alt="QRIS Preview"
                            className="max-w-[200px] rounded-lg border"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {bankTransferEnabled && bankName && bankAccountNumber && bankAccountName && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-2">Detail Rekening:</h3>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Bank:</span> {bankName}</p>
                          <p><span className="text-muted-foreground">Nomor Rekening:</span> {bankAccountNumber}</p>
                          <p><span className="text-muted-foreground">Atas Nama:</span> {bankAccountName}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleResetPaymentSettings}>
              Reset ke Default
            </Button>
            <Button
              onClick={handleSavePaymentSettings}
              disabled={hasPaymentErrors || updatePaymentSettings.isPending}
            >
              {updatePaymentSettings.isPending ? 'Menyimpan...' : 'Simpan Pengaturan Pembayaran'}
            </Button>
          </div>
        </TabsContent>

        {/* Login Information Tab */}
        <TabsContent value="login" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Informasi Login</CardTitle>
              </div>
              <CardDescription>Kelola kredensial dan keamanan akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aplikasi ini menggunakan Internet Identity untuk autentikasi yang aman. Anda dapat mengelola kredensial Anda melalui Internet Identity.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Status Akun</Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Aktif</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Metode Autentikasi</Label>
                <div className="px-3 py-2 rounded-md bg-muted">
                  <span className="text-sm">Internet Identity</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Keamanan Akun</h3>
                <p className="text-sm text-muted-foreground">
                  Untuk mengubah password atau mengelola perangkat yang terhubung, silakan kunjungi dashboard Internet Identity Anda.
                </p>
                <Button variant="outline" asChild>
                  <a href="https://identity.ic0.app" target="_blank" rel="noopener noreferrer">
                    Buka Internet Identity
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup/Export Database Tab */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Export Database</CardTitle>
              </div>
              <CardDescription>Unduh backup lengkap database Anda dalam format JSON</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Data yang Akan Diekspor</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Semua pengguna dan profil</li>
                    <li>• Outlet dan konfigurasi</li>
                    <li>• Produk, kategori, dan brand</li>
                    <li>• Paket dan bundle produk</li>
                    <li>• Transaksi dan riwayat pembayaran</li>
                    <li>• Pengeluaran dan cashflow</li>
                    <li>• Log stok dan perubahan</li>
                    <li>• Bukti pembayaran dan verifikasi</li>
                  </ul>
                </div>

                <Separator />

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Peringatan Keamanan:</strong> File backup berisi semua data bisnis Anda. Simpan file ini di tempat yang aman dan jangan bagikan kepada pihak yang tidak berwenang.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-1">
                    <p className="font-medium">Database Backup</p>
                    <p className="text-sm text-muted-foreground">
                      Format: JSON • Timestamp otomatis
                    </p>
                  </div>
                  <Button
                    onClick={handleExportDatabase}
                    disabled={exportDatabase.isPending}
                    size="lg"
                  >
                    {exportDatabase.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export Database
                      </>
                    )}
                  </Button>
                </div>

                {exportDatabase.isSuccess && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Database berhasil diekspor! File telah diunduh ke perangkat Anda.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Informasi Tambahan</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    • File backup dapat digunakan untuk restore data atau migrasi ke sistem lain
                  </p>
                  <p>
                    • Nama file akan menyertakan timestamp untuk memudahkan identifikasi
                  </p>
                  <p>
                    • Disarankan untuk melakukan backup secara berkala (mingguan atau bulanan)
                  </p>
                  <p>
                    • Simpan backup di beberapa lokasi untuk keamanan maksimal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
