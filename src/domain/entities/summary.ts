export interface SummaryQuestion {
  answer: string;
  questionId: string;
  answerId?: string;
  groupKey?: string;
  groupInstanceId?: string;
  occurrenceOrder?: number;
  questionOrder?: number;
  questionLabel?: string;
  answerType?: string;
}

export interface SummarySnapshotAnswer {
  questionId: string;
  answerId?: string;
  rawValue: string;
  displayValue?: string;
  sourceCreatedAt?: Date;
  sourceUpdatedAt?: Date;
}

export interface SummarySnapshotQuestion {
  questionId: string;
  label: string;
  answerType: string;
  isRequired: boolean;
  presetValues: string[];
  order: number;
}

export interface SummaryGroupOccurrenceSnapshot {
  occurrenceId: string;
  order: number;
  answers: SummarySnapshotAnswer[];
}

export interface SummaryGroupSnapshot {
  groupKey: string;
  isMultiple: boolean;
  order: number;
  questions: SummarySnapshotQuestion[];
  occurrences: SummaryGroupOccurrenceSnapshot[];
}

export interface SummaryQuizSnapshot {
  quizKey: string;
  category: string;
  order: number;
  groups: SummaryGroupSnapshot[];
}

export interface SummaryPageSnapshot {
  pageKey: string;
  pageName: string;
  role?: string;
  order: number;
  quizzes: SummaryQuizSnapshot[];
}

export interface SummaryFormSnapshot {
  id: string;
  name: string;
  version: number;
  pages: SummaryPageSnapshot[];
}

export interface AttendanceEncounter {
  day: string;
  startTime: string;
  groupInstanceId: string;
  activityCode?: string;
}

export interface AttendanceActivity {
  code: string;
  name: string;
  audience?: string;
  encounters: AttendanceEncounter[];
}

export interface AttendanceAudience {
  code: string;
  name: string;
  ageMin?: number;
  ageMax?: number;
  encounters: AttendanceEncounter[];
}

export interface SummaryAttendance {
  activities: AttendanceActivity[];
  audiences: AttendanceAudience[];
}

export interface SummaryReconstruction {
  source: 'current_answers';
  reconstructedAt: Date;
  historicalIntegrity: 'approximate';
}

export interface Summary {
  id: string;
  formId: string;
  centroId: string;
  questions: SummaryQuestion[];
  schemaVersion?: number;
  formSnapshot?: SummaryFormSnapshot;
  coordinationSnapshot?: SummaryFormSnapshot;
  attendance?: SummaryAttendance;
  publicationAuthorized?: boolean;
  reconstruction?: SummaryReconstruction;
  validatedByCoordAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
