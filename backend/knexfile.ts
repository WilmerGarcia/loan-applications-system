
import 'dotenv/config';
import type { Knex } from 'knex';

const databaseConfiguration: Knex.Config = {
  client: 'mysql2',

  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loan_applications',
  },

  migrations: {
    directory: './src/database/migrations',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },

  seeds: {
    directory: './src/database/seeds',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};

export default databaseConfiguration;
