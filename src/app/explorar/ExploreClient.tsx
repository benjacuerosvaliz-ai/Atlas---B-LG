"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { levels } from "@/lib/tokens";

export type UserLite = {
  id: string;
  username: string;
  displayName: string | null;
  city: string | null;
  level: number;
  totalKm: number;
  avatarUrl: string | null;
  instagram: string | null;
};

type Props = { users: UserLite[] };

export function ExploreClient({ users }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const haystack = [
        u.username,
        u.displayName ?? "",
        u.city ?? "",
        u.instagram ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, users]);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, username o ciudad..."
          autoFocus
          className="w-full border-b border-border bg-transparent py-3 pl-10 pr-10 text-base placeholder:text-foreground/35 focus:border-foreground focus:outline-none transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-[0.32em] text-foreground/45">
          {query
            ? `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"}`
            : `${users.length} clientes BØLG`}
        </span>
        {!query && (
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-foreground/40">
            Ordenados por km
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="font-mono text-sm text-foreground/55">
          Nadie matchea con &quot;{query}&quot;. Prueba otra búsqueda.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((u) => (
            <li key={u.id}>
              <UserCard user={u} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UserCard({ user }: { user: UserLite }) {
  const initials = (user.displayName ?? user.username)
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const levelTitle = levels.find((l) => l.id === user.level)?.title ?? "";

  return (
    <Link
      href={`/u/${user.username}`}
      className="group flex items-center gap-4 border border-border p-4 hover:border-foreground/60 transition-colors"
    >
      <Avatar className="h-14 w-14 shrink-0 border border-mist/30 bg-fog">
        {user.avatarUrl && (
          <AvatarImage src={user.avatarUrl} alt={user.displayName ?? user.username} />
        )}
        <AvatarFallback className="bg-fog font-display text-base font-black text-foreground/80">
          {initials || "·"}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base group-hover:text-foreground transition-colors">
          {user.displayName ?? `@${user.username}`}
        </span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45">
          @{user.username}
          {user.city && (
            <>
              <span className="px-2">·</span>
              {user.city}
            </>
          )}
        </span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/45">
          Nivel {user.level} · {levelTitle}
          <span className="px-2">·</span>
          <span className="tabular-nums">
            {Math.round(user.totalKm).toLocaleString("es-CL")} km
          </span>
        </span>
      </div>
    </Link>
  );
}
