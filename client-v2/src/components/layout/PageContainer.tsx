import type { ReactNode } from "react";
import "./PageContainer.css";

interface Props {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}

export function PageContainer({ children, className = "", narrow }: Props) {
  return (
    <main className={`page-content ${narrow ? "page-narrow" : ""} ${className}`}>
      {children}
    </main>
  );
}
