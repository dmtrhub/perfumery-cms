export interface PerformanceReportDTO {
  id: string;
  algorithmName: string;
  simulationData: Record<string, any>;
  efficiency: number;
  conclusions: string;
  createdAt: string;
}
