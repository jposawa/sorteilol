import { capitalize } from "./conversion";

const CHAMPION_ID_OVERRIDES: Record<string, string> = {
  ksante: "KSante",
  kogmaw: "KogMaw",
  reksai: "RekSai",
  xinzhao: "XinZhao",
  wukong: "MonkeyKing",
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
