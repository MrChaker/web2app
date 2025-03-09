export interface Database {
  load: (url: string, key: string) => Promise<Database>;
  execute: (query: string, params?: any[]) => Promise<{ lastInsertId: number }>;
  select: (query: string) => Promise<any>;
}
