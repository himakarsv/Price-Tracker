import { Module, forwardRef } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { QueueModule } from '../queue/queue.module';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [forwardRef(() => ProductsModule), QueueModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
