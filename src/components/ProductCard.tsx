import { useEffect, useState } from "react";
import { Link } from "../lib/router";
import { useAuth } from "../lib/auth";
import { money, typeLabel, effectivePrice, isFlashSaleActive, isWishlisted, toggleWishlist } from "../lib/data";
import type { Product } from "../lib/types";
import { Stars, Badge } from "./ui";
import { TypeIcon } from "./Icons";
import Icon from "./Icon";

export default function ProductCard({
  product,
  external,
}: {
  product: Product;
  external?: boolean;
}) {
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    if (!user) { setWishlisted(false); return; }
    isWishlisted(user.id, product.id).then(setWishlisted);
  }, [user, product.id]);

  async function onHeartClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const next = await toggleWishlist(user.id, product.id);
    setWishlisted(next);
  }

  const href = product.creator?.username
    ? `/@${product.creator.username}/${product.slug}`
    : `/product/${product.id}`;

  const cls =
    "group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/40";

  const Wrapper = external
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={href} target="_blank" rel="noopener" className={cls}>
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <Link to={href} className={cls}>
          {children}
        </Link>
      );

  const onSale = isFlashSaleActive(product);
  const displayPrice = effectivePrice(product);
  const isFree = displayPrice === 0;

  return (
    <Wrapper>
      {/*
        Image container — aspect-ratio box keeps a fixed 4:3 ratio on ALL screen
        sizes. `overflow-hidden` clips the image so it never bleeds out. The img
        uses object-cover so it fills the box without distorting; on mobile this
        means it scales down correctly instead of trying to render at desktop size.
      */}
      <div
        className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-slate-800 dark:to-slate-700"
        style={{ aspectRatio: "4/3" }}
      >
        {product.cover_url ? (
          <img
            src={product.cover_url}
            alt={product.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-indigo-300/70 dark:text-slate-600">
            <TypeIcon type={product.type} className="h-14 w-14" />
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top-left badge stack — featured / flash sale never collide with anything else */}
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-5rem)] flex-col items-start gap-1.5">
          {onSale ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              <Icon name="zap" size={11} className="flex-shrink-0" /> FLASH SALE
            </span>
          ) : product.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-amber-950 shadow-sm">
              <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="m12 2 2.9 6.3L22 9.3l-5 4.7 1.3 6.9L12 17.8 5.7 20.9 7 14 2 9.3l7.1-1Z" />
              </svg>
              FEATURED
            </span>
          ) : null}
        </div>

        {/* Top-right badge — type only (kept separate from top-left so they can never overlap) */}
        <span className="absolute right-2 top-2 inline-flex max-w-[7.5rem] items-center gap-1.5 truncate rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
          <TypeIcon type={product.type} className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{typeLabel(product.type)}</span>
        </span>

        {/* Bottom-left badge — bundle */}
        {product.is_bundle && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-violet-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
            📦 Bundle
          </span>
        )}

        {/* Wishlist heart */}
        {user && (
          <button
            onClick={onHeartClick}
            aria-label="Toggle wishlist"
            className="absolute bottom-2 right-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition hover:bg-black/80"
          >
            <Icon name="heart" size={14} className={wishlisted ? "fill-current text-rose-400" : "text-white"} />
          </button>
        )}
      </div>

      {/* Price + sale price row — moved off the image into the card body so it never collides with badges */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
          isFree
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : onSale
            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        }`}>
          {isFree ? "Free" : money(displayPrice)}
        </span>
        {onSale && (
          <span className="text-xs font-semibold text-slate-400 line-through">{money(product.price)}</span>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-2">
        {/* Title — clamp to 2 lines, never overflows */}
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">
          {product.title}
        </h3>

        {/* Description — clamp to 2 lines */}
        <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {product.short_desc}
        </p>

        {/* Creator + rating row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[9px] font-bold text-white">
              {(product.creator?.username || "?").charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-xs text-slate-400">
              @{product.creator?.username || "creator"}
            </span>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            {product.rating_count > 0 ? (
              <>
                <Stars value={product.rating} />
                <span className="text-[10px] text-slate-400">
                  ({product.rating_count})
                </span>
              </>
            ) : (
              <Badge color="slate">New</Badge>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
