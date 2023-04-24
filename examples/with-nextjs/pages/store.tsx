import Head from 'next/head';
import {
  useConnector,
  InstantSearch,
  Configure,
  DynamicWidgets,
  HierarchicalMenu,
  Highlight,
  Hits,
  HitsPerPage,
  Pagination,
  RefinementList,
  SearchBox,
  SortBy,
  ToggleRefinement,
} from 'react-instantsearch-hooks-web';
import connectStats from 'instantsearch.js/es/connectors/stats/connectStats';
import type {
  StatsConnectorParams,
  StatsWidgetDescription,
} from 'instantsearch.js/es/connectors/stats/connectStats';
import { Panel } from '../components/Panel';

type UseStatsProps = StatsConnectorParams;

import { make_client } from 'postgres-searchbox/client';
import type { SearchOptions } from 'postgres-searchbox/client.types';
// During postgres-searchbox development this can be:
// import { make_client } from '../../../package/build/client.js';
// import type { SearchOptions } from '../../../package/build/client.types.js';

const client = make_client('api/search');

function Hit({ hit }: { hit: any }) {
  return (
    <article>
      <img src={`${hit.image};maxHeight=120;maxWidth=120`} alt="" />
      <h1>
        {/* {hit.name} */}
        <Highlight hit={hit} attribute="name" className="Hit-label" />
      </h1>
      <p>
        {hit.description}
        <Highlight hit={hit} attribute="description" className="Hit-label" />
      </p>
      <p>{hit.price}</p>
      <p>{hit.objectID}</p>
    </article>
  );
}

export default function Basic() {
  const configureProps: SearchOptions = {};

  // Using only items
  const transformItems = (items) => {
    return items.map((item) => ({
      ...item,
      objectID: item.objectid,
    }));
  };

  return (
    <>
      <Head>
        <title>Postgres Searchbox - With NextJS</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <InstantSearch searchClient={client} indexName="bestbuy_product">
        <Configure {...configureProps} />
        <div className="Container">
          <div>
            <DynamicWidgets fallbackComponent={FallbackComponent}>
              <HierarchicalMenu
                attributes={[
                  'hierarchicalCategorieslvl0',
                  'hierarchicalCategorieslvl1',
                  'hierarchicalCategorieslvl2',
                  'hierarchicalCategorieslvl3',
                  'hierarchicalCategorieslvl4',
                ]}
              />
              <ToggleRefinement attribute="free_shipping" />
            </DynamicWidgets>
          </div>
          <div className="Search">
            <SearchBox placeholder="Search" autoFocus defaultValue="test" />

            <div className="Search-header">
              <Stats />
              <HitsPerPage
                items={[
                  { label: '20 hits per page', value: 20, default: true },
                  { label: '100 hits per page', value: 100 },
                ]}
              />
              <SortBy
                items={[
                  { label: 'Relevance', value: 'bestbuy_product' },
                  {
                    label: 'Lowest Price',
                    value: 'bestbuy_product?sort=price+asc',
                  },
                  {
                    label: 'Highest Price',
                    value: 'bestbuy_product?sort=price+desc+nulls+last',
                  },
                ]}
              />
              {/* <Refresh /> */}
            </div>

            <Hits hitComponent={Hit} transformItems={transformItems} />
            <Pagination className="Pagination" />
          </div>
        </div>
      </InstantSearch>
    </>
  );
}

function FallbackComponent({ attribute }: { attribute: string }) {
  return (
    <Panel header={attribute}>
      <RefinementList attribute={attribute} />
    </Panel>
  );
}

/**
 * Stats
 */

function useStats(props?: UseStatsProps) {
  return useConnector<StatsConnectorParams, StatsWidgetDescription>(
    connectStats,
    props
  );
}

function Stats(props: UseStatsProps) {
  const { nbHits, processingTimeMS } = useStats(props);

  return (
    <span>
      {nbHits} results found in {processingTimeMS}ms
    </span>
  );
}
