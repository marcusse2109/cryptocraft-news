import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import * as puppeteer from 'puppeteer';

@Injectable()
export class CrawlerService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly cronExpression: string;

  constructor(
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
  ) {
    this.cronExpression = this.configService.get<string>('CRON_EXPRESSION', '0 */30 * * * *');
    this.logger.log(`CrawlerService instantiated with cron: ${this.cronExpression}`);
  }

  onModuleInit() {
    this.logger.log('CrawlerService module initialized, cron job should be registered');
  }

  @Cron(process.env.CRON_EXPRESSION || CronExpression.EVERY_30_MINUTES)
  async autoCrawl() {
    this.logger.log('Running scheduled crawl...');
    try {
      const data = await this.crawl();
      await this.eventsService.saveEvents(data);
      this.logger.log(`Crawl completed, saved ${data.length} events`);
    } catch (error) {
      this.logger.error('Error in autoCrawl', error);
      throw error;
    }
  }

  async crawl() {
    const url = 'https://www.cryptocraft.com/calendar';
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });
      
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      
      if (response?.status() === 403) {
        throw new Error(`Request failed with status code 403 - Website may have bot protection`);
      }
      
      await page.waitForSelector('.calendar__row', { timeout: 10000 }).catch(() => {
        this.logger.warn('Calendar rows not found, proceeding anyway');
      });
      
      const html = await page.content();
      
      // Extract days array directly from JavaScript - it's valid JSON
      const daysMatch = html.match(/days:\s*(\[[\s\S]*?\])\s*,\s*time:/);
      
      const rows = [];
      
      if (daysMatch) {
        try {
          const days = JSON.parse(daysMatch[1]);
          
          for (const day of days || []) {
            for (const event of day.events || []) {
              // Only keep the date part (set time to 00:00:00 UTC)
              const fullDate = new Date(event.dateline * 1000);
              const eventDate = new Date(Date.UTC(fullDate.getUTCFullYear(), fullDate.getUTCMonth(), fullDate.getUTCDate()));
              
              rows.push({
                eventDate,
                eventTime: event.timeLabel || null,
                country: event.country || null,
                title: event.name || event.prefixedName || '',
                impact: event.impactName || null,
                actual: event.actual || null,
                forecast: event.forecast || null,
                previous: event.previous || null,
                sourceUrl: url
              });
            }
          }
        } catch (parseError) {
          this.logger.warn('Failed to parse calendar JS data, falling back to HTML parsing');
        }
      }
      
      // Fallback to HTML parsing if JS extraction failed
      if (rows.length === 0) {
        const $ = cheerio.load(html);
        let currentDate = '';

        $('.calendar__row').each((_, el) => {
          const dateCell = $(el).find('.calendar__date').text().trim();
          if (dateCell) {
            currentDate = dateCell;
          }
          
          const timeText = $(el).find('.calendar__time').text().trim();
          const titleText = $(el).find('.calendar__event').text().trim();
          
          if (!titleText) return;
          
          let eventDate: Date;
          if (currentDate) {
            const year = new Date().getFullYear();
            const dateStr = `${currentDate} ${year}`;
            if (timeText && timeText !== 'Tentative') {
              eventDate = new Date(`${dateStr} ${timeText}`);
            } else {
              eventDate = new Date(dateStr);
            }
          } else {
            eventDate = new Date();
          }
          
          if (isNaN(eventDate.getTime())) {
            this.logger.warn(`Invalid date for event: ${titleText}`);
            return;
          }
          
          rows.push({
            eventDate,
            eventTime: timeText || null,
            country: $(el).find('img').attr('alt') || null,
            title: titleText,
            impact: $(el).find('.calendar__impact').text().trim() || null,
            actual: $(el).find('.calendar__actual').text().trim() || null,
            forecast: $(el).find('.calendar__forecast').text().trim() || null,
            previous: $(el).find('.calendar__previous').text().trim() || null,
            sourceUrl: url
          });
        });
      }

      return rows;
    } catch (error) {
      this.logger.error('Error in crawl()', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
