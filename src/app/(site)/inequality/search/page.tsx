import SearchClient from "@/components/inequality/SearchClient";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-[760px] px-6 py-10">
      <h1 className="font-display text-[32px] font-semibold">Search</h1>
      <div className="mt-4">
        <SearchClient />
      </div>
    </div>
  );
}
