import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2 } from 'lucide-react';

interface CartItem {
  id: bigint;
  name: string;
  price: bigint;
  quantity: number;
  type: string;
  availableStock: bigint;
}

interface OptimizedCartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: bigint, type: string, delta: number) => void;
  onRemove: (id: bigint, type: string) => void;
  formatCurrency: (amount: bigint) => string;
}

// Memoized cart item to prevent unnecessary re-renders
const OptimizedCartItem = memo(function OptimizedCartItem({
  item,
  onUpdateQuantity,
  onRemove,
  formatCurrency,
}: OptimizedCartItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div className="flex-1">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(item.id, item.type, -1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onUpdateQuantity(item.id, item.type, 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 ml-auto"
            onClick={() => onRemove(item.id, item.type)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

export default OptimizedCartItem;
