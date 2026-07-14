import type { ReactNode } from "react";
import "./Badge.css";

interface Props {
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  children: ReactNode;
}

export function Badge({ variant = "default", size = "sm", children }: Props) {
  return (
    <span className={`badge badge-${variant} badge-${size}`}>
      {children}
    </span>
  );
}
