import { Search } from "lucide-react";

export function SearchBar({
  defaultValue = "",
  className = "",
}: {
  defaultValue?: string;
  className?: string;
}) {
  return (
    <form
      action="/explorer"
      method="get"
      className={`flex w-full items-center gap-2 rounded-2xl bg-white p-2 shadow-lg ${className}`}
    >
      <div className="flex flex-1 items-center gap-2 pl-3 text-slate-400">
        <Search className="h-5 w-5" />
        <input
          type="text"
          name="search"
          defaultValue={defaultValue}
          placeholder="Rechercher un événement, un artiste, une ville..."
          className="w-full bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Rechercher
      </button>
    </form>
  );
}
