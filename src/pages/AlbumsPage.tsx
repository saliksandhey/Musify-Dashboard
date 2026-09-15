import { useState, useMemo, useEffect } from "react";
import { Disc3, Calendar, Search } from "lucide-react";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { albumsApi } from "@/services/apiServices";
import type { Album } from "@/types";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = search.trim() || "trending";
      loadAlbums(q);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const loadAlbums = async (query: string) => {
    setLoading(true);
    const data = await albumsApi.search(query);
    setAlbums(data);
    setLoading(false);
  };

  const columns = [
    {
      header: "Album",
      accessorKey: "title",
      cell: (props: any) => {
        const row: Album = props.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-surface-2 overflow-hidden flex-shrink-0 border border-white/10">
              <img src={row.cover_url} alt={row.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm truncate max-w-[250px]">{row.title}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[250px]">{row.artist_name}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Artist",
      accessorKey: "artist_name",
      cell: (props: any) => {
        const row: Album = props.row.original;
        return <span className="text-xs font-medium text-foreground">{row.artist_name || "Various Artists"}</span>;
      },
    },
    {
      header: "Release Year",
      accessorKey: "release_year",
      cell: (props: any) => {
        const row: Album = props.row.original;
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-3 text-foreground border border-white/5">
            <Calendar size={12} className="text-muted-foreground" />
            {row.release_year || "2024"}
          </span>
        );
      },
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Albums Catalog"
        description="Search and explore music albums globally via JioSaavn API."
      />

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search albums globally (e.g. Animal, Rockstar, Kabir Singh)..."
          className="w-full max-w-md"
        />

        <div className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-surface-2 rounded-xl border border-white/5 self-start sm:self-auto">
          Found <span className="text-foreground font-bold">{albums.length}</span> albums
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-glass">
        {loading ? <TableSkeleton rows={6} /> : <DataTable columns={columns} data={albums} />}
      </div>
    </PageWrapper>
  );
}
