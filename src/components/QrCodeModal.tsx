import { useToast } from "../lib/toast";
import type { Product } from "../lib/types";
import { Button, Card } from "./ui";

export default function QrCodeModal({
  product,
  url,
  onClose,
}: {
  product: Product;
  url: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(url)}`;

  function copyLink() {
    navigator.clipboard.writeText(url);
    toast("Product link copied 🔗", "success");
  }

  function downloadQr() {
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `${product.slug || "product"}-qr.png`;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">QR Code</h3>
            <p className="line-clamp-1 text-sm text-slate-500">{product.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>
        <div className="space-y-4 p-5 text-center">
          <div className="inline-block rounded-2xl bg-white p-3">
            <img src={qrSrc} alt={`QR code for ${product.title}`} className="h-56 w-56" />
          </div>
          <p className="text-xs text-slate-400">Scan to open this product. Great for flyers, posters, or in-person sales.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={copyLink}>🔗 Copy link</Button>
            <Button className="flex-1" onClick={downloadQr}>⬇ Download</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
