import React from "react";

import { type DrawSeedRecord,loadStorage } from "@/helpers";

/**
 * Badge exibido quando o shuffle de distribuição dos times foi assinado pela
 * beacon drand. Some se o sorteio caiu no fallback local (round null).
 */
export const DrandBadge: React.FC = () => {
  const record = loadStorage("drand-draw", { needParse: true }) as
    | DrawSeedRecord
    | null;

  if (!record || typeof record.round !== "number") {
    return null;
  }

  return (
    <span
      className="drand-badge"
      style={{ fontSize: "0.75rem", opacity: 0.75 }}
      title={`Seed (SHA-256): ${record.seed}`}
    >
      🔐 Times sorteados com{" "}
      <a href="https://drand.love" target="_blank" rel="noreferrer">
        drand
      </a>{" "}
      (round{" "}
      <a
        href={`https://api.drand.sh/public/${record.round}`}
        target="_blank"
        rel="noreferrer"
      >
        #{record.round}
      </a>
      )
    </span>
  );
};