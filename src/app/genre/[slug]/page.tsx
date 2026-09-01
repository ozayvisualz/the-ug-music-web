import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { GENRES } from "@/lib/utils";
import { slugify, absoluteUrl, breadcrumbJsonLd, jsonLdScript, SITE_NAME } from "@/lib/seo";
import { Sidebar } from "@/components/layout/sidebar";
import { WebPlayer } from "@/components/layout/player";
import { SongCard } from "@/components/ui/song-card";

type Props = { params: Promise<{ slug: string }> };

function resolveGenre(slug: string): string | null {
  return GENRES.find((g) => slugify(g) === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const genre = resolveGenre(slug);
  if (!genre) return {};

  const url = absoluteUrl(`/genre/${slug}`);
  const description = `Stream the best Ugandan ${genre} music and songs on TheUgMusic.`;

  return {
    title: `${genre} Music`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${genre} Music`,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${genre} Music`, description },
  };
}

export default async function GenrePage({ params }: Props) {
  const { slug } = await params;
  const genre = resolveGenre(slug);
  if (!genre) notFound();

  const songs = await db.song.findMany({
    where: { genre, approved: true, published: true },
    include: {
      artist: { select: { artistName: true, user: { select: { name: true, image: true } } } },
      album: { select: { id: true, title: true, coverUrl: true } },
    },
    orderBy: { playCount: "desc" },
    take: 50,
  });

  const url = absoluteUrl(`/genre/${slug}`);
  const jsonLd = [
    breadcrumbJsonLd([
      { name: "Home", url: absoluteUrl("/") },
      { name: `${genre} Music`, url },
    ]),
  ];

  return (
    <div className="h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20">
          <div className="px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold">{genre} Music</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Stream the best Ugandan {genre.toLowerCase()} songs on TheUgMusic.
            </p>
            <div className="space-y-1 mt-6">
              {songs.length ? (
                songs.map((song: any) => <SongCard key={song.id} song={song} />)
              ) : (
                <p className="text-zinc-600 text-sm py-8 text-center">No songs in this genre yet.</p>
              )}
            </div>
          </div>
        </main>
      </div>
      <WebPlayer />
    </div>
  );
}
