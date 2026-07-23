export interface CourseDetailCohort {
  id: string;
  code: string;
  name: string;
  status: string;
  startDate: string;
  estimatedEndDate: string;
  capacity: number;
  enrolledCount: number;
}

export interface CourseDetailDTO {
  id: string;
  code: string;
  name: string;
  estimatedDurationWeeks: number | null;
  defaultInstallments: number;
  suggestedPriceCents: number;
  currency: string;
  active: boolean;
  cohorts: CourseDetailCohort[];
}
