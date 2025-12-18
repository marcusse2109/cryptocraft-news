import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { GetEventsQueryDto } from './dto/get-events-query.dto';
import { CalendarEventResponseDto } from './dto/calendar-event-response.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get calendar events', description: 'Retrieve calendar events with optional filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of calendar events',
    type: [CalendarEventResponseDto]
  })
  async getEvents(@Query() query: GetEventsQueryDto) {
    return this.eventsService.find(query);
  }
}
