"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Ícones de linha (24x24, traço 1.8) — mesma família visual da referência,
// no lugar dos emojis coloridos que brigavam com a lateral azul.
const ICONES: Record<string, ReactNode> = {
  painel: <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />,
  leads: <path d="M4 6h16M4 12h16M4 18h10" />,
  contatos: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </>
  ),
  inbox: <path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5" />,
  followup: (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 9v4l2.5 2M9 3h6" />
    </>
  ),
  grupos: (
    <>
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="10" r="2.3" />
      <path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M16 14.5c2.6 0 5 1.5 5 4.5" />
    </>
  ),
  disparos: <path d="M3 11v3l12 5V6zM15 9c2.5.6 4 1.7 4 3.5S17.5 15.4 15 16" />,
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  funis: <path d="M3 5h18l-7 8v6l-4-2v-4z" />,
  vendas: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.4-2.5-1.2M12 6v2M12 16v2" />
    </>
  ),
  reunioes: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  aquisicao: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  anuncios: <path d="M3 11v3l12 5V6zM15 9c2.5.6 4 1.7 4 3.5S17.5 15.4 15 16M6 15l1.5 5h3L9 16" />,
  roteiros: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" />,
  agentes: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <path d="M12 4v4M9 13h.01M15 13h.01M9 16h6" />
    </>
  ),
  auditoria: <path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5zM10 8h4M10 12h4" />,
  configuracoes: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </>
  ),
};

export default function NavLink({
  href,
  label,
  icone,
  compacto,
  children,
}: {
  href: string;
  label: string;
  icone: string;
  compacto?: boolean;
  children?: ReactNode;
}) {
  const caminho = usePathname();
  const ativo = href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className="nav-link"
      aria-current={ativo ? "page" : undefined}
      style={{
        padding: compacto ? "12px 10px" : "9px 12px",
        fontSize: compacto ? 15 : 14,
        minHeight: compacto ? 44 : undefined,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONES[icone]}
      </svg>
      <span>{label}</span>
      {children}
    </Link>
  );
}
