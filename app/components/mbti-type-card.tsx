import { GROUP_STYLES, MbtiType } from "@/app/lib/mbti";

type MbtiTypeCardProps = {
  item: MbtiType;
  selected: boolean;
  disabled?: boolean;
  order?: number;
  onClick: (code: string) => void;
};

export function MbtiTypeCard({ item, selected, disabled, order, onClick }: MbtiTypeCardProps) {
  const style = GROUP_STYLES[item.group];

  return (
    <button
      type="button"
      disabled={disabled && !selected}
      onClick={() => onClick(item.code)}
      className={[
        "relative rounded-2xl border px-2 py-3 text-center shadow-sm transition active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        style.card,
        selected ? `ring-2 ${style.selectedRing}` : "",
        disabled && !selected ? "opacity-40" : "hover:shadow-md",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={selected}
      aria-label={`${item.code} 선택`}
    >
      {selected && order ? (
        <span className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
          {order}
        </span>
      ) : null}
      <p className="text-2xl leading-none">{item.emoji}</p>
      <p className="mt-1 text-sm font-extrabold tracking-wide">{item.code}</p>
    </button>
  );
}
