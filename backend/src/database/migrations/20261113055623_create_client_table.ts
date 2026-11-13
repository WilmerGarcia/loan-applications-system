import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('client', (table) => {
    table.increments('id').primary();
    table.string('full_name', 150).notNullable();
    table.string('dni', 20).notNullable().unique();
    table.decimal('monthly_income', 12, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('client');
}
