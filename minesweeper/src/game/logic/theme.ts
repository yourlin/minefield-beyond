import { TopologyType } from '../../core/topology/types.js';

/**
 * Theme colors for each topology type.
 */
export interface TopologyTheme {
  /** Primary accent color. */
  readonly accent: string;
  /** Cell border color. */
  readonly cellStroke: string;
  /** Revealed cell background. */
  readonly revealedFill: string;
  /** Header/title bar tint. */
  readonly headerTint: string;
}

/**
 * Theme definitions per topology type.
 */
const THEMES: Record<string, TopologyTheme> = {
  [TopologyType.Hexagonal]: {
    accent: '#2dd4bf',
    cellStroke: '#4a7a7a',
    revealedFill: '#1a2a3a',
    headerTint: '#0d3b3b',
  },
  [TopologyType.Triangle]: {
    accent: '#f59e0b',
    cellStroke: '#8a6a2a',
    revealedFill: '#2a2a1a',
    headerTint: '#3b2d0d',
  },
  [TopologyType.Torus]: {
    accent: '#a78bfa',
    cellStroke: '#6a4a8a',
    revealedFill: '#2a1a3a',
    headerTint: '#2d0d3b',
  },
  [TopologyType.Irregular]: {
    accent: '#4ade80',
    cellStroke: '#4a8a4a',
    revealedFill: '#1a2a1a',
    headerTint: '#0d3b0d',
  },
  [TopologyType.Mixed]: {
    accent: '#f472b6',
    cellStroke: '#8a4a6a',
    revealedFill: '#2a1a2a',
    headerTint: '#3b0d2d',
  },
};

/**
 * Get the theme for a topology type.
 */
export function getTopologyTheme(type: TopologyType): TopologyTheme {
  return THEMES[type] ?? THEMES[TopologyType.Hexagonal];
}
