import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.constants';


@Injectable()
export class ClientsService {
    constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}
    
    async findByIdOrFail(id: number) {
        const client = await this.knex('client').where({ id }).first();
        if (!client) throw new NotFoundException(`Cliente con id ${id} no existe`);
        return client;
    }

    async findAll() {
        return this.knex('client').select('*');
    }
}
