import dayjs from 'dayjs';
import {
  CloudEvaluationStatus,
  CriticalInfrastructureStatus,
  CryptoPlanEvaluationMethod,
  CryptoPlanStatusOption,
  AssessmentConclusionOption,
  GradingAssessmentStatus,
  ProcessStageInfo,
  ServiceObjectOption,
  ServiceScopeOption
} from '../../types/project';

export type DateRange = [Date | null, Date | null];
export type UsageOption = '使用' | '未使用';
export type OperationSwitch = '是' | '否';

export interface ProcessFormState {
  schedule: DateRange;
  workContent: string;
  deliverables: string;
}

export interface CryptoProductCountForm {
  systemUsage: string;
  independentUsage: string;
  sharedUsage: string;
  certifiedCount: string;
  domesticCount: string;
  foreignCount: string;
}

export interface CryptoAlgorithmForm {
  block: string[];
  asymmetric: string[];
  hash: string[];
  stream: string[];
  other: string;
}

export interface MeasuredSystemFormState {
  criticalInfrastructureStatus: CriticalInfrastructureStatus;
  criticalInfrastructureDepartment: string;
  gradingAssessmentStatus: GradingAssessmentStatus;
  gradingAssessmentAgency: string;
  gradingAssessmentPeriod: DateRange;
  gradingAssessmentConclusion: string;
  serviceScope: ServiceScopeOption;
  serviceScopeCount: string;
  serviceDomains: string[];
  serviceObject: ServiceObjectOption;
  networkCoverage: string[];
  userCount: string;
  inOperation: OperationSwitch;
  operationStart: Date | null;
  currentStatus: string;
  interconnections: string[];
  interconnectionNames: string;
  interconnectionOther: string;
  cloudDependent: OperationSwitch;
  cloudPlatformName: string;
  cloudEvaluationAgency: string;
  cloudEvaluationPeriod: DateRange;
  cloudEvaluationStatus: CloudEvaluationStatus;
  cloudEvaluationConclusion: string;
  cryptoPlanStatus: CryptoPlanStatusOption;
  cryptoPlanApprovalTime: Date | null;
  cryptoPlanEvaluationMethod: CryptoPlanEvaluationMethod;
  cryptoPlanAgency: string;
  cryptoProductsUsed: UsageOption;
  cryptoProductCounts: CryptoProductCountForm;
  cryptoAlgorithms: CryptoAlgorithmForm;
}

export interface EvaluationTeamMemberForm {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  passedAssessment: boolean;
}

export interface PreviousAssessmentFormState {
  isFirstAssessment: OperationSwitch;
  lastAssessmentDate: Date | null;
  lastAssessmentAgency: string;
  conclusion: AssessmentConclusionOption | '';
  score: string;
}

export interface ProjectFormState {
  contractNo: string;
  organization: string;
  systemName: string;
  systemLevel: string;
  systemScale: string;
  period: DateRange;
  measuredSystem: MeasuredSystemFormState;
  evaluationTeam: EvaluationTeamMemberForm[];
  previousAssessment: PreviousAssessmentFormState;
  evaluationBasis: {
    standards: string[];
    references: string[];
  };
  evaluationProcess: {
    preparation: ProcessFormState;
    schemeDesign: ProcessFormState;
    onsiteAssessment: ProcessFormState;
    analysisAndReport: ProcessFormState;
  };
}

export type ProcessSectionKey = keyof ProjectFormState['evaluationProcess'];

export const parseDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toDate() : null;
};

export const convertStageToForm = (
  source: ProcessStageInfo | undefined,
  fallback: ProcessFormState
): ProcessFormState => {
  if (!source) {
    return fallback;
  }
  return {
    schedule: [
      parseDate(source.schedule?.start) ?? fallback.schedule[0],
      parseDate(source.schedule?.end) ?? fallback.schedule[1]
    ],
    workContent: source.workContent || fallback.workContent,
    deliverables: source.deliverables ?? fallback.deliverables
  };
};
