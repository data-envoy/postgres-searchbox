import type { SearchOptions } from '../client.types.js';
import type { Handler, Settings } from '../index.types.js';
import type { Hooks } from '../bundle.types.js';

/**
 * Main function props
 */

export interface Props {
  facetFilters?: SearchOptions['facetFilters'];
  numericFilters?: SearchOptions['numericFilters'];
  numericAttributesForFiltering: Required<Settings>['numericAttributesForFiltering'];
  maxFacetHits: Required<Settings>['maxFacetHits'];
  extendedAttributes?: Handler.Config['extendedAttributes'];
  hooks: Hooks;
}

export type GetFiltersReturn = {
  db: {
    formatted: string;
    formattedJoins?: string;
  };
  extra: { refinements: AllRefinements };
} | null;

/**
 * Numeric types
 */

export type Operator = '<' | '>' | '<=' | '>=' | '=' | '!=';

export type NumericFilter = {
  attribute: string;
  operator: Operator;
  value: number | number[];
};

/**
 * Not numeric types
 */

export interface Refinements {
  OR: string[] & number[];
  AND: string[] & number[];
  ['AND NOT']: string[] & number[];
  RANGES: {
    ['>=']?: number;
    ['>']?: number;
    ['<']?: number;
    ['<=']?: number;
  }[];
}

export type AllRefinements = {
  [attribute: string]: Refinements;
};
