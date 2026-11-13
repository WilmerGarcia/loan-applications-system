
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('loan_application', (table) => {
    table.increments('id').primary();

    table.integer('client_id').unsigned().notNullable();
    table.foreign('client_id').references('id').inTable('client').onDelete('RESTRICT');

    table.decimal('requested_amount', 12, 2).notNullable();
    table.integer('term_months').unsigned().notNullable();
    table.decimal('annual_interest_rate', 5, 2).notNullable().defaultTo(15.0);

    table.enu('status', ['pending', 'approved', 'rejected']).defaultTo('pending').notNullable();

    table.timestamp('created_at').defaultTo(knex.fn.now());

    //nos sirve para mejorar las consultas que se hagan por ststus y created_at
    table.index(['status', 'created_at'], 'idx_loan_status_created');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('loan_application');
}
