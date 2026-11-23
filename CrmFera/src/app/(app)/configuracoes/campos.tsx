import type { CSSProperties, ReactNode } from "react";

export const h2: CSSProperties = { fontSize: 15, fontWeight: 700, marginBottom: 12 };

interface CampoProps {
  rotulo: string;
  children: ReactNode;
}

export function Campo({ rotulo, children }: CampoProps) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: "var(--texto-fraco)" }}>{rotulo}</span>
      <div style={{ marginTop: 5 }}>{children}</div>
    </label>
  );
}
