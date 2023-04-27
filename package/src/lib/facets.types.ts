import type { SearchOptions } from '../client.types.js';
import type { Settings } from '../index.types.js';
import type { Hooks } from '../bundle.types.js';

/**
 * Main function props
 */

export interface Props {
  facets?: SearchOptions['facets'];
  attributesForFaceting: Required<Settings>['attributesForFaceting'];
  maxValuesPerFacet: Required<Settings>['maxValuesPerFacet'];
  sortFacetValuesBy: Required<Settings>['sortFacetValuesBy'];
  maxFacetHits: Required<Settings>['maxFacetHits'];
  renderingContent: Required<Settings>['renderingContent'];
  numericAttributesForFiltering: Required<Settings>['numericAttributesForFiltering'];
  hooks: Hooks;
}

export type GetFacetsReturn = {
  db: {
    cte: string;
    statsCte: string;
    json: string;
    statsJson: string;
  };
  renderingContent: Required<Settings>['renderingContent'];
} | null;
