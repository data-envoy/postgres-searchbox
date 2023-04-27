import pkg from 'pg';
const { Client } = pkg;
import format from 'pg-format';
import { faker } from '@faker-js/faker';

let brand: string = '';

function createRandomProduct(i: number) {
  const name = faker.commerce.productName();
  const description = faker.commerce.productDescription();
  // Small price range so we get duplicates
  const price = faker.commerce.price(10, 40, 0);
  // To test the full-text search we need some products to have
  // common words in the name and description
  // Most of the time we return a random product
  // with results from faker without any changes
  if (i % 10 !== 0) {
    brand = faker.company.name();
    return [name, description, price, brand];
  }

  /**
   * Modify the faker results to create products with common words
   * and re-use brand
   */

  // Split the name and description into words
  const nameParts = name.split(' ');
  const descriptionParts = description.split(' ');
  // Pick a word from the name
  const namePosition = Math.floor(((i % 3) / 3) * nameParts.length);
  const nameWord = nameParts[namePosition].toLowerCase();
  // Pick a position in the description to insert the name word
  const descriptionPosition = Math.floor(
    ((i % 7) / 7) * descriptionParts.length
  );
  // Add the name word to the description
  descriptionParts.splice(descriptionPosition, 0, nameWord);

  return [name, descriptionParts.join(' '), price, brand];
}

export async function initTestDatabase({
  tableName,
  rowCount,
  fakerSeed,
}: {
  tableName: string;
  rowCount: number;
  fakerSeed?: number;
}) {
  const client = new Client();
  client.connect();
  // Create test table if it doesn't exist.
  const sql = format(
    'CREATE TABLE IF NOT EXISTS %I (id SERIAL PRIMARY KEY, name text, description text, price int4, brand text)',
    tableName
  );
  // run the sql
  await client.query(sql);
  // Set deed so that values are always the same
  if (fakerSeed) {
    faker.seed(123);
  }
  // Generate commerce test data using faker and createRandomProduct
  // const values = Array.from({ length: rowCount }, createRandomProduct);

  const values = [];
  for (let i = 0; i < rowCount; i++) {
    values.push(createRandomProduct(i));
  }

  // Insert test data into test table
  const insertSql = format(
    'INSERT INTO %I (name, description, price, brand) VALUES %L RETURNING id',
    tableName,
    values
  );
  // Run the insert sql
  const dbResult = await client.query(insertSql);
  // Disconnect client
  await client.end();
  // Return the result (ids)
  return dbResult.rows.map((r) => r.id);
}

/**
 * Function to add additional tables to the database
 */

/*
  Primary table
  | id | title | description | price |
  | --- | --- | --- | --- |
  | 012 | Football | A kids football | 4 |

  Facet table
  | id | title |
  | --- | --- |
  | 345 | Color |

  Facet value table
  | id | faced_id | title |
  | --- | --- | --- |
  | 678 | 123 | blue |

  Listing facet join table

  | faced_value_id | listing_id |
  | --- | --- |
  | 678 | 012 |
*/

function createFacetValues(i: number) {
  const name = faker.commerce.productName();
  const description = faker.commerce.productDescription();
  // Small price range so we get duplicates
  const price = faker.commerce.price(10, 40, 0);
  // To test the full-text search we need some products to have
  // common words in the name and description
  // Most of the time we return a random product
  // with results from faker without any changes
  if (i % 10 !== 0) {
    brand = faker.company.name();
    return [name, description, price, brand];
  }
}

export async function extendDatabase({
  tableName,
  testIds,
  facetKeyTable,
  facetValueTable,
  facetValueLookupTable,
  fakerSeed,
}: {
  tableName: string;
  testIds: number[];
  facetKeyTable: string;
  facetValueTable: string;
  facetValueLookupTable: string;
  fakerSeed?: number;
}) {
  const client = new Client();
  client.connect();
  // Create facet key table if it doesn't exist.
  const sql = format(
    'CREATE TABLE IF NOT EXISTS %I (id SERIAL PRIMARY KEY, name text)',
    facetKeyTable
  );
  // run the sql
  await client.query(sql);
  // Create facet value table if it doesn't exist. Is should have fk to facet key table.
  const sql2 = format(
    'CREATE TABLE IF NOT EXISTS %I (id SERIAL PRIMARY KEY, name text, facet_key_id int4 REFERENCES %I(id) )',
    facetValueTable,
    facetKeyTable
  );
  // run the sql
  await client.query(sql2);
  // Create facet value lookup table if it doesn't exist. Is should have fks to facet value table and primary table.
  const sql3 = format(
    `CREATE TABLE IF NOT EXISTS %I (
        id SERIAL PRIMARY KEY, 
        facet_key_id int4 REFERENCES %I(id), 
        facet_value_id int4 REFERENCES %I(id), 
        test_table_id int4 REFERENCES %I(id) 
    )`,
    facetValueLookupTable,
    facetKeyTable,
    facetValueTable,
    tableName
  );
  // run the sql
  await client.query(sql3);

  const facetKeys = ['color', 'tag'];

  // Insert facet keys into facet key table
  const insertFacetKeysSql = format(
    'INSERT INTO %I (name) VALUES %L RETURNING id, name',
    facetKeyTable,
    facetKeys.map((key) => [key])
  );
  // Run the insert sql
  const dbResult = await client.query(insertFacetKeysSql);
  // console.log('>>> dbResult', dbResult.rows);

  const colors: string[] = [];
  const facetValueCount = 300;
  if (fakerSeed) faker.seed(123);
  for (let i = 0; i < facetValueCount; i++) {
    const color = faker.color.human();
    !colors.includes(color) && colors.push(color);
  }

  const tags: string[] = [];
  if (fakerSeed) faker.seed(123);
  for (let i = 0; i < facetValueCount; i++) {
    const tag = faker.company.bsBuzz();
    !tags.includes(tag) && tags.push(tag);
  }

  // Insert facet values into facet value table
  const insertFacetValuesSql1 = format(
    'INSERT INTO %I (name, facet_key_id) VALUES %L RETURNING id',
    facetValueTable,
    [...colors.map((color) => [color, 1])]
  );
  // Run the insert sql
  const colorIds = await client.query(insertFacetValuesSql1);
  const insertFacetValuesSql2 = format(
    'INSERT INTO %I (name, facet_key_id) VALUES %L RETURNING id',
    facetValueTable,
    [...tags.map((tag) => [tag, 2])]
  );
  // Run the insert sql
  const tagIds = await client.query(insertFacetValuesSql2);

  // Build array for the lookup table
  const lookupTableValues = [];
  for (let i = 0; i < testIds.length; i++) {
    const testId = testIds[i];
    const colorId = colorIds.rows[i % colorIds.rows.length].id;
    lookupTableValues.push([1, colorId, testId]);
    const tagId = tagIds.rows[i % tagIds.rows.length].id;
    lookupTableValues.push([2, tagId, testId]);
    const tagId2 = tagIds.rows[(i + 1) % tagIds.rows.length].id;
    lookupTableValues.push([2, tagId2, testId]);
  }
  // Add lookupTableValues to the lookup table
  const insertLookupTableValuesSql = format(
    'INSERT INTO %I (facet_key_id, facet_value_id, test_table_id) VALUES %L RETURNING id',
    facetValueLookupTable,
    lookupTableValues
  );
  // Run the insert sql
  await client.query(insertLookupTableValuesSql);

  // Run a query to return all whe date where test_table has id = 1
  const sql4 = format(/* sql */ `
    SELECT t.id, t.name, fk.id AS fk_id, fk.name as facet_key, fv.id AS fv_id, fv.name AS facet_value_id
    FROM ${tableName} t
    LEFT JOIN ${facetValueLookupTable} lu ON lu.test_table_id = t.id
    LEFT JOIN ${facetValueTable} fv ON fv.id = lu.facet_value_id
    LEFT JOIN ${facetKeyTable} fk ON fk.id = fv.facet_key_id
  `);
  // run the sql
  const result = await client.query(sql4);

  // Disconnect client
  await client.end();

  return result;
}
