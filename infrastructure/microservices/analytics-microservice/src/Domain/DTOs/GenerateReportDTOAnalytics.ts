import { IsString, IsOptional } from 'class-validator';

export class GenerateReportDTOAnalytics {
  @IsString()
  @IsOptional()
  period?: 'day' | 'week' | 'month' | 'year' | 'total';

  @IsString()
  @IsOptional()
  reportType?: string;
}
