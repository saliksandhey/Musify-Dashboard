import { useState, useMemo, useEffect } from "react";
import { Mic2, CheckCircle2, Search } from "lucide-react";
import PageWrapper, { PageHeader } from "@/components/ui/PageWrapper";
import DataTable from "@/components/ui/DataTable";
import SearchInput from "@/components/ui/SearchInput";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { artistsApi } from "@/services/apiServices";
import type { Artist } from "@/types";
import { formatNumber } from "@/utils";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(() => {
      const q = search.trim() || "trending";
      loadArtists(q);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const loadArtists = async (query: string) => {
    setLoading(true);
    const data = await artistsApi.search(query);
    setArtists(data);
    setLoading(false);
  };

  const columns = [
    {
      header: "Artist",
      accessorKey: "name",
      cell: (props: any) => {
        const row: Artist = props.row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-2 overflow-hidden flex-shrink-0 border border-white/10">
              <img src={row.image_url} alt={row.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                {row.name}
                {row.verified && <CheckCircle2 size={14} className="text-blue-400 fill-blue-400/20 flex-shrink-0" />}
              </div>
              <div className="text-xs text-muted-foreground">{row.role || "Featured Artist"}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Verified Status",
      accessorKey: "verified",
      cell: (props: any) => {
        const row: Artist = props.row.original;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              row.verified
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "bg-surface-3 text-muted-foreground"
            }`}
          >
            {row.verified ? "Verified Artist" : "Unverified"}
          </span>
        );
      },
    },
    {
      header: "Popularity / Listeners",
      accessorKey: "monthly_listeners",
      cell: (props: any) => {
        const row: Artist = props.row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground font-mono">
              {formatNumber(row.monthly_listeners)}
            </span>
            <span className="text-[11px] text-muted-foreground">listeners</span>
          </div>
        );
      },
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Artists Catalog"
        description="Search and explore artists globally via JioSaavn API."
      />

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search artists globally (e.g. Arijit Singh, Shreya Ghoshal, Badshah)..."
          className="w-full max-w-md"
        />

        <div className="text-xs font-semibold text-muted-foreground px-3 py-2 bg-surface-2 rounded-xl border border-white/5 self-start sm:self-auto">
          Found <span className="text-foreground font-bold">{artists.length}</span> artists
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/5 shadow-glass">
        {loading ? <TableSkeleton rows={6} /> : <DataTable columns={columns} data={artists} />}
      </div>
    </PageWrapper>
  );
}
