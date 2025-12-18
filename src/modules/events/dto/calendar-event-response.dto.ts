import { ApiProperty } from '@nestjs/swagger';

export class CalendarEventResponseDto {
  @ApiProperty({ description: 'Event ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Event date', example: '2024-01-01T00:00:00.000Z' })
  eventDate: Date;

  @ApiProperty({ description: 'Event time', example: '14:30', required: false, nullable: true })
  eventTime?: string | null;

  @ApiProperty({ description: 'Country code', example: 'US', required: false, nullable: true })
  country?: string | null;

  @ApiProperty({ description: 'Event title', example: 'Non-Farm Payrolls' })
  title: string;

  @ApiProperty({ description: 'Impact level', example: 'High', required: false, nullable: true })
  impact?: string | null;

  @ApiProperty({ description: 'Actual value', example: '250K', required: false, nullable: true })
  actual?: string | null;

  @ApiProperty({ description: 'Forecast value', example: '245K', required: false, nullable: true })
  forecast?: string | null;

  @ApiProperty({ description: 'Previous value', example: '248K', required: false, nullable: true })
  previous?: string | null;

  @ApiProperty({ description: 'Source URL', example: 'https://www.cryptocraft.com/calendar', required: false, nullable: true })
  sourceUrl?: string | null;

  @ApiProperty({ description: 'Created at timestamp', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

