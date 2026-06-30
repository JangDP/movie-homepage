type Option = {
  label: string;
  value: string;
};

type AdminSelectProps = {
  label: string;
  name: string;
  defaultValue?: string;
  options: Option[];
};

export function AdminSelect({ label, name, defaultValue, options }: AdminSelectProps) {
  return (
    <label className="block text-sm font-semibold text-zinc-300">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-700"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
