import "./Spinner.css";

interface Props {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md" }: Props) {
  return <div className={`spinner spinner-${size}`} />;
}
