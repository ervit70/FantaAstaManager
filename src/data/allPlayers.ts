import { Player, Role } from '../types/fantacalcio';
import { GOALKEEPERS_DATA } from './playersGoalkeepers';
import { DEFENDERS_DATA } from './playersDefenders';
import { MIDFIELDERS_DATA } from './playersMidfielders';
import { ATTACKERS_DATA } from './playersAttackers';

export const ALL_PLAYERS: Player[] = [
  ...GOALKEEPERS_DATA,
  ...DEFENDERS_DATA,
  ...MIDFIELDERS_DATA,
  ...ATTACKERS_DATA,
];

export const getPlayersByRole = (role: Role): Player[] => {
  return ALL_PLAYERS.filter(p => p.ruolo === role);
};

export const getRoleStatsSummary = (role: Role) => {
  const players = getPlayersByRole(role);
  const total = players.length;
  const avgFantaMedia = players.reduce((acc, p) => acc + p.fantaMedia, 0) / (total || 1);
  const totalGoals = players.reduce((acc, p) => acc + p.golFatti, 0);
  const totalAssists = players.reduce((acc, p) => acc + p.assist, 0);
  const totalPenalties = players.reduce((acc, p) => acc + (p.rigoriTirati || 0), 0);
  const foreignNewcomers = players.filter(p => p.status === 'Nuovo dall\'Estero').length;

  return {
    total,
    avgFantaMedia: Number(avgFantaMedia.toFixed(2)),
    totalGoals,
    totalAssists,
    totalPenalties,
    foreignNewcomers,
  };
};
