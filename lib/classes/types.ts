export interface ClassListItemDTO {
  id: string;
  cohortId: string;
  cohortName: string;
  cohortCode: string;
  sessionDate: string;
  startsAt: string;
  endsAt: string;
  status: string;
  instructorName: string | null;
  attendanceClosed: boolean;
}

export interface ClassRosterRow {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: string | null;
}

export interface ClassDetailDTO extends ClassListItemDTO {
  roster: ClassRosterRow[];
}
