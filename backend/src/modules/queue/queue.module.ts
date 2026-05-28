import { BullModule } from '@nestjs/bull';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductsModule } from '../products/products.module';
import { ScraperModule } from '../scraper/scraper.module';
import { QueueConsumer } from './queue.consumer';
import { QueueProducer } from './queue.producer';
import { SCRAPING_QUEUE } from './queue.constants';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: SCRAPING_QUEUE }),
    forwardRef(() => ProductsModule),
    ScraperModule,
    forwardRef(() => NotificationsModule),
  ],
  providers: [QueueProducer, QueueConsumer],
  exports: [QueueProducer],
})
export class QueueModule {}
