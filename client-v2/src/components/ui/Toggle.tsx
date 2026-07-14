import "./Toggle.css";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Toggle({ checked, onChange, disabled, size = "md" }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle toggle-${size} ${checked ? "toggle-on" : "toggle-off"}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}
