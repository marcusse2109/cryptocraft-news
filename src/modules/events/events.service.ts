import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async saveEvents(events: any[]) {
    for (const ev of events) {
      await this.prisma.calendarEvent.upsert({
        where: {
          title_eventDate: {
            title: ev.title,
            eventDate: ev.eventDate
          }
        },
        update: {
          eventTime: ev.eventTime,
          country: ev.country,
          impact: ev.impact,
          actual: ev.actual,
          forecast: ev.forecast,
          previous: ev.previous,
          sourceUrl: ev.sourceUrl
        },
        create: ev
      });
    }
  }

  async find(query: { date?: string; country?: string; impact?: string }) {
    return this.prisma.calendarEvent.findMany({
      where: {
        eventDate: query.date ? new Date(query.date) : undefined,
        country: query.country || undefined,
        impact: query.impact || undefined
      },
      orderBy: { eventDate: 'asc' }
    });
  }
}
