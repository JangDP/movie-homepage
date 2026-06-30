type AdminFieldProps = {
  label: string;
  name: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: "text" | "number" | "url" | "date";
  multiline?: boolean;
  rows?: number;
};

export function AdminField({
  label,
  name,
  defaultValue = "",
  placeholder,
  type = "text",
  multiline = false,
  rows = 4,
}: AdminFieldProps) {
  const fieldClass =
    "mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700";

  return (
    <label className="block text-sm font-semibold text-zinc-300">
      {label}
      {multiline ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={rows}
          className={fieldClass}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={fieldClass}
        />
      )}
    </label>
  );
}
