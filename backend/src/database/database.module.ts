import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex from 'knex';
import { KNEX_CONNECTION } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: KNEX_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        knex({
          client: 'mysql2',
          connection: {
            host: config.get('DB_HOST'),
            port: Number(config.get('DB_PORT')),
            user: config.get('DB_USER'),
            password: config.get('DB_PASSWORD'),
            database: config.get('DB_NAME'),
          },
        }),
    },
  ],
  exports: [KNEX_CONNECTION],
})
export class DatabaseModule {}