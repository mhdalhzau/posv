import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface OptimizedProductCardProps {
  id: bigint;
  name: string;
  price: bigint;
  stock: bigint;
  type?: 'product' | 'package' | 'bundle';
  icon?: React.ReactNode;
  onAddToCart: (item: {
    id: bigint;
    name: string;
    price: bigint;
    type: 'product' | 'package' | 'bundle';
    availableStock: bigint;
  }) => void;
  formatCurrency: (amount: bigint) => string;
}

// Memoized product card to prevent unnecessary re-renders
const OptimizedProductCard = memo(function OptimizedProductCard({
  id,
  name,
  price,
  stock,
  type = 'product',
  icon,
  onAddToCart,
  formatCurrency,
}: OptimizedProductCardProps) {
  const handleAddToCart = () => {
    onAddToCart({
      id,
      name,
      price,
      type,
      availableStock: stock,
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            {icon && (
              <div className="flex items-center gap-2 mb-1">
                {icon}
                <CardTitle className="text-lg">{name}</CardTitle>
              </div>
            )}
            {!icon && <CardTitle className="text-lg">{name}</CardTitle>}
            <CardDescription className="text-xl font-bold text-primary mt-2">
              {formatCurrency(price)}
            </CardDescription>
          </div>
          <Badge variant={stock > 0n ? 'default' : 'secondary'}>
            Stok: {stock.toString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleAddToCart}
          disabled={stock === 0n}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah ke Keranjang
        </Button>
      </CardContent>
    </Card>
  );
});

export default OptimizedProductCard;
