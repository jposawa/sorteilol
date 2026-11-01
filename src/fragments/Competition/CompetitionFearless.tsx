import React from "react";
import { MdLock } from "react-icons/md";
import clsx from "clsx";

import { CHAMPIONS } from "@/constants";
import { getChampionPortraitUrl } from "@/helpers";
import { useCompetition } from "@/hooks/useCompetition";

import styles from "./Competition.module.css";

export const CompetitionFearless: React.FC = () => {
  const { activeCompetition } = useCompetition();

  const pickCounts = React.useMemo(() => {
    const counts = new Map<string, number>();

    if (!activeCompetition) {
      return counts;
    }

    activeCompetition.matches.forEach((match) => {
      const sides = match.draftState?.picks;

      if (!sides) {
        return;
      }

      Object.values(sides).forEach((sidePicks) => {
        Object.values(sidePicks).forEach((championKey) => {
          if (championKey) {
            counts.set(championKey, (counts.get(championKey) ?? 0) + 1);
          }
        });
      });
    });

    return counts;
  }, [activeCompetition]);

  if (!activeCompetition) {
    return null;
  }

  const fearless = activeCompetition.draftFormat === "fearless";
  const contested = [...pickCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6);

  return (
    <section className={clsx(styles.panel, styles.fearlessPanel)}>
      <div className={styles.panelHead}>
        <div>
          <span className={styles.panelTag}>Meta &amp; Draft Report</span>
          <h3 className={styles.panelTitle}>Campeões contestados</h3>
        </div>
      </div>

      <div
        className={clsx(
          styles.fearlessBanner,
          !fearless && styles.fearlessBannerOff,
        )}
      >
        <span className={styles.bannerIcon}>
          <MdLock size={20} aria-hidden="true" />
        </span>

        <div>
          <div className={styles.bannerTitle}>
            {fearless ? "Regra Fearless Ativa" : "Regra Fearless Inativa"}
          </div>
          <div className={styles.bannerSub}>
            {fearless
              ? "Picks das rodadas anteriores ficam bloqueados nas seguintes"
              : "Draft padrão — sem bloqueio de campeões"}
          </div>
        </div>
      </div>

      {contested.length === 0 ? (
        <p className={styles.emptyNote}>
          Nenhum draft registrado nesta competição ainda — os campeões escolhidos
          aparecem aqui ao fechar o primeiro draft.
        </p>
      ) : (
        <div className={styles.champList}>
          {contested.map(([championKey, picks]) => (
            <div key={championKey} className={styles.champRow}>
              <div className={styles.champLeft}>
                <img
                  className={styles.champImg}
                  src={getChampionPortraitUrl(championKey)}
                  alt={CHAMPIONS[championKey]?.name ?? championKey}
                  loading="lazy"
                />

                <div>
                  <span className={styles.champName}>
                    {CHAMPIONS[championKey]?.name ?? championKey}
                  </span>
                  <span className={styles.champRole}>
                    {CHAMPIONS[championKey]?.primaryLane ?? "—"}
                  </span>
                  <span
                    className={clsx(
                      styles.champPick,
                      styles.champPickCyan,
                    )}
                  >
                    Pickado {picks}x na competição
                  </span>
                </div>
              </div>

              {fearless && (
                <span className={styles.lockBadge}>Fearless Lock</span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};