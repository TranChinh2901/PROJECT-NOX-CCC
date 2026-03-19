import { DefaultNamingStrategy, NamingStrategyInterface, Table } from 'typeorm';

const normalizeTableName = (tableOrName: Table | string): string => {
  const rawName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
  return rawName.split('.').pop() ?? rawName;
};

const normalizeColumnSegment = (columnName: string): string =>
  columnName
    .split('.')
    .pop()
    ?.replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/_id$/i, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') ?? columnName;

export class ProjectNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return `UQ_${normalizeTableName(tableOrName)}_${columnNames.map(normalizeColumnSegment).join('_')}`;
  }

  indexName(tableOrName: Table | string, columnNames: string[]): string {
    return `IDX_${normalizeTableName(tableOrName)}_${columnNames.map(normalizeColumnSegment).join('_')}`;
  }

  foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return `FK_${normalizeTableName(tableOrName)}_${columnNames.map(normalizeColumnSegment).join('_')}`;
  }
}
