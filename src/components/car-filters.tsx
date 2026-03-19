import { CARS_DATA } from "@/lib/cars-data";
import Link from "next/link";

type CarFiltersProps = {
  initialValues: {
    q: string;
    make: string;
    source: string;
    damage: string;
    minYear: string;
    maxYear: string;
    maxMileageKm: string;
    sort: string;
  };
};

const damageOptions = [
  { value: "all", label: "All damage" },
  { value: "front_end", label: "Front end" },
  { value: "rear_end", label: "Rear end" },
  { value: "side", label: "Side" },
  { value: "hail", label: "Hail" },
  { value: "mechanical", label: "Mechanical" },
  { value: "rollover", label: "Rollover" },
  { value: "minor_dent_scratches", label: "Minor dent / scratches" },
];

const makeOptions = ["all", ...new Set(CARS_DATA.map((item) => item.make).sort())];

export function CarFilters({ initialValues }: CarFiltersProps) {
  return (
    <form suppressHydrationWarning className="card-surface p-4 sm:p-5 lg:sticky lg:top-4" action="/cars" method="get">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-slate-900">Filters</h2>
        <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href="/cars">
          Clear all
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        <div className="grid grid-cols-[130px_minmax(0,1fr)] border-b border-[var(--line)] text-sm">
          <label className="border-r border-[var(--line)] bg-slate-50 px-3 py-3 font-medium text-slate-700" htmlFor="q">
            Search
          </label>
          <div className="px-2 py-2">
            <input
              id="q"
              className="input-base"
              type="text"
              name="q"
              defaultValue={initialValues.q}
              placeholder="Model, VIN, lot"
            />
          </div>
        </div>

        <div className="grid grid-cols-[130px_minmax(0,1fr)] border-b border-[var(--line)] text-sm">
          <label className="border-r border-[var(--line)] bg-slate-50 px-3 py-3 font-medium text-slate-700" htmlFor="make">
            Make
          </label>
          <div className="px-2 py-2">
            <select id="make" className="input-base" name="make" defaultValue={initialValues.make}>
              {makeOptions.map((make) => (
                <option key={make} value={make}>
                  {make === "all" ? "All makes" : make}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[130px_minmax(0,1fr)] border-b border-[var(--line)] text-sm">
          <label className="border-r border-[var(--line)] bg-slate-50 px-3 py-3 font-medium text-slate-700" htmlFor="source">
            Source
          </label>
          <div className="px-2 py-2">
            <select id="source" className="input-base" name="source" defaultValue={initialValues.source}>
              <option value="all">All sources</option>
              <option value="marketcheck">MarketCheck</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[130px_minmax(0,1fr)] border-b border-[var(--line)] text-sm">
          <label className="border-r border-[var(--line)] bg-slate-50 px-3 py-3 font-medium text-slate-700" htmlFor="damage">
            Damage
          </label>
          <div className="px-2 py-2">
            <select id="damage" className="input-base" name="damage" defaultValue={initialValues.damage}>
              {damageOptions.map((damage) => (
                <option key={damage.value} value={damage.value}>
                  {damage.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-[130px_minmax(0,1fr)] border-b border-[var(--line)] text-sm">
          <label className="border-r border-[var(--line)] bg-slate-50 px-3 py-3 font-medium text-slate-700" htmlFor="minYear">
            Year min
          </label>
          <div className="px-2 py-2">
            <input
              id="minYear"
              className="input-base"
              type="number"
              name="minYear"
              min={1990}
              max={2030}
              defaultValue={initialValues.minYear}
              placeholder="eg. 2016"
            />
          </div>
        </div>

        <div className="grid grid-cols-[130px_minmax(0,1fr)] border-b border-[var(--line)] text-sm">
          <label className="border-r border-[var(--line)] bg-slate-50 px-3 py-3 font-medium text-slate-700" htmlFor="maxYear">
            Year max
          </label>
          <div className="px-2 py-2">
            <input
              id="maxYear"
              className="input-base"
              type="number"
              name="maxYear"
              min={1990}
              max={2030}
              defaultValue={initialValues.maxYear}
              placeholder="eg. 2025"
            />
          </div>
        </div>

        <div className="grid grid-cols-[130px_minmax(0,1fr)] border-b border-[var(--line)] text-sm">
          <label
            className="border-r border-[var(--line)] bg-slate-50 px-3 py-3 font-medium text-slate-700"
            htmlFor="maxMileageKm"
          >
            Max km
          </label>
          <div className="px-2 py-2">
            <input
              id="maxMileageKm"
              className="input-base"
              type="number"
              name="maxMileageKm"
              min={1000}
              step={1000}
              defaultValue={initialValues.maxMileageKm}
              placeholder="eg. 120000"
            />
          </div>
        </div>

        <div className="grid grid-cols-[130px_minmax(0,1fr)] text-sm">
          <label className="border-r border-[var(--line)] bg-slate-50 px-3 py-3 font-medium text-slate-700" htmlFor="sort">
            Sort
          </label>
          <div className="px-2 py-2">
            <select id="sort" className="input-base" name="sort" defaultValue={initialValues.sort}>
              <option value="ending_soon">Estimate low to high</option>
              <option value="newest">Newest year</option>
              <option value="price_low">Current bid low to high</option>
              <option value="price_high">Current bid high to low</option>
            </select>
          </div>
        </div>
      </div>

      <button className="btn-primary mt-4 w-full" type="submit">
        Apply filters
      </button>
    </form>
  );
}
