import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
