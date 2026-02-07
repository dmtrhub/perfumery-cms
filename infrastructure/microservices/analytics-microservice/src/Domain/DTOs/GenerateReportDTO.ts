import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export class GenerateReportDTO {
  @IsEnum(['WEEKLY', 'MONTHLY', 'YEARLY', 'TOTAL', 'CUSTOM'])
  period: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}