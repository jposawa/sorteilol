import { capitalize } from "./conversion";

const CHAMPION_ID_OVERRIDES: Record<string, string> = {
  ksante: "KSante",
  kogmaw: "KogMaw",
  reksai: "RekSai",
  xinzhao: "XinZhao",
  wukong: "MonkeyKing",
  renataGlasc: "Renata",
};

const toDataDragonChampionId = (championKey: string) => {
  if (CHAMPION_ID_OVERRIDES[championKey]) {
    return CHAMPION_ID_OVERRIDES[championKey];
  }

  return capitalize(championKey);
};

export const getChampionPortraitUrl = (championKey: string) => {
  const championId = toDataDragonChampionId(championKey);

  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championId}_0.jpg`;
};

/**
 * Arte de card do pool (Sala de Draft): tile quadrado do Data Dragon. O
 * endpoint "loading" (retrato vertical) responde 403 no CDN; o splash é
 * widescreen e em cards de ~150px o recorte central cortava o campeão.
 */
export const getChampionCardArtUrl = (championKey: string) => {
  const championId = toDataDragonChampionId(championKey);
  const endpoint = championKey === "fiddlesticks" ? "loading" : "tiles";

  return `https://ddragon.leagueoflegends.com/cdn/img/champion/${endpoint}/${championId}_0.jpg`;
};
