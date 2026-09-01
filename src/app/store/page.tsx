"use client";

import { trpc } from "@/trpc/client";
import { ShoppingBag, Loader2 } from "lucide-react";
import { formatUGX, getArtistName } from "@/lib/utils";

export default function StorePage() {
  const { data: products, isLoading } = trpc.merch.getProducts.useQuery({ limit: 50 });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;

  return (
    <div className="px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Merch Store</h1>
        <p className="text-sm text-zinc-400">Support artists by buying their merchandise</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products?.map((product: any) => (
          <div key={product.id} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition">
            <div className="aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-10 h-10 text-zinc-700" /></div>
              )}
            </div>
            <p className="text-sm font-semibold truncate">{product.title}</p>
            <p className="text-xs text-zinc-500">{getArtistName(product.artist)}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="font-bold text-yellow-500">{formatUGX(product.price)}</p>
              <button className="px-3 py-1 rounded-lg bg-yellow-500 text-black text-xs font-semibold hover:bg-yellow-400 transition">Buy</button>
            </div>
          </div>
        ))}
        {products?.length === 0 && (
          <div className="col-span-full text-center py-20">
            <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No products available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
