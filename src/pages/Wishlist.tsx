import { useEffect, useState } from "react";
import { useRouter } from "../lib/router";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import { fetchWishlist, toggleWishlist } from "../lib/data";
import type { WishlistItem } from "../lib/types";
import ProductCard from "../components/ProductCard";
import { Spinner, EmptyState, PageHeader, Button } from "../components/ui";
import Icon from "../components/Icon";

export default function Wishlist() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    setItems(await fetchWishlist(user.id));
    setLoading(false);
  }

  async function remove(productId: string) {
    if (!user) return;
    await toggleWishlist(user.id, productId);
    setItems((list) => list.filter((i) => i.product_id !== productId));
    toast("Removed from wishlist", "info");
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="animate-fade">
      <PageHeader
        title="Wishlist"
        subtitle={`${items.length} saved ${items.length === 1 ? "product" : "products"}`}
        icon={<Icon name="heart" size={22} />}
      />

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Icon name="heart" size={36} />}
            title="Your wishlist is empty"
            desc="Tap the heart on any product to save it here for later."
            action={<Button onClick={() => navigate("/explore")}>Browse marketplace</Button>}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.filter((i) => i.product).map((i) => (
            <div key={i.id} className="relative">
              <ProductCard product={i.product!} />
              <button
                onClick={() => remove(i.product_id)}
                aria-label="Remove from wishlist"
                className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-rose-400 backdrop-blur-sm transition hover:bg-black/80"
              >
                <Icon name="heart" size={14} className="fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
