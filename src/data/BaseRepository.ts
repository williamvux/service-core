import type { Knex } from 'knex';

export default abstract class BaseRepository {
    protected abstract readonly table: string;

    protected readonly db: Knex;

    constructor(db: Knex) {
        this.db = db;
    }

    protected query<T extends object>() {
        return this.db<T>(this.table);
    }
}
