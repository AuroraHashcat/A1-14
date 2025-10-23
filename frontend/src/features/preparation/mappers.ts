import dayjs from 'dayjs';
import { EvaluationTeamMember, ProcessStageInfo, ProjectInfo } from '../../types/project';
import {
  DEFAULT_ANALYSIS_WORK_CONTENT,
  DEFAULT_ONSITE_WORK_CONTENT,
  DEFAULT_PREPARATION_DELIVERABLES,
  DEFAULT_PREPARATION_WORK_CONTENT,
  DEFAULT_REFERENCE_STANDARDS,
  DEFAULT_SCHEME_WORK_CONTENT,
  DEFAULT_BASIS_STANDARDS,
  PREVIOUS_ASSESSMENT_CONCLUSION_OPTIONS,
  SERVICE_SCOPE_NEEDS_COUNT
} from './constants';
import {
  DateRange,
  EvaluationTeamMemberForm,
  MeasuredSystemFormState,
  PreviousAssessmentFormState,
  ProcessFormState,
  ProjectFormState,
  UsageOption,
  convertStageToForm
} from './types';

const generateId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);

const mapMemberToForm = (member: EvaluationTeamMember): EvaluationTeamMemberForm => ({
  id: member.id || generateId(),
  name: member.name ?? '',
  role: member.role ?? '',
  responsibility: member.responsibility ?? '',
  passedAssessment: Boolean(member.passedAssessment)
});

export const createEmptyTeamMember = (): EvaluationTeamMemberForm => ({
  id: generateId(),
  name: '',
  role: '',
  responsibility: '',
  passedAssessment: false
});

export const createDefaultRange = (): DateRange => [
  dayjs().startOf('day').toDate(),
  dayjs().add(7, 'day').endOf('day').toDate()
];

export const createDefaultMeasuredSystem = (): MeasuredSystemFormState => ({
  criticalInfrastructureStatus: '未认定',
  criticalInfrastructureDepartment: '',
  gradingAssessmentStatus: '未测评',
  gradingAssessmentAgency: '',
  gradingAssessmentPeriod: [null, null],
  gradingAssessmentConclusion: '',
  serviceScope: '全国',
  serviceScopeCount: '',
  serviceDomains: [],
  serviceObject: '单位内部人员',
  networkCoverage: ['局域网'],
  userCount: '',
  inOperation: '是',
  operationStart: dayjs().subtract(90, 'day').toDate(),
  currentStatus: '',
  interconnections: [],
  interconnectionNames: '',
  interconnectionOther: '',
  cloudDependent: '否',
  cloudPlatformName: '',
  cloudEvaluationAgency: '',
  cloudEvaluationPeriod: [null, null],
  cloudEvaluationStatus: '云平台未评估',
  cloudEvaluationConclusion: '',
  cryptoPlanStatus: '有密码应用方案，且通过评审',
  cryptoPlanApprovalTime: dayjs().subtract(30, 'day').toDate(),
  cryptoPlanEvaluationMethod: '委托密评机构评估',
  cryptoPlanAgency: '',
  cryptoProductsUsed: '使用',
  cryptoProductCounts: {
    systemUsage: '',
    independentUsage: '',
    sharedUsage: '',
    certifiedCount: '',
    domesticCount: '',
    foreignCount: ''
  },
  cryptoAlgorithms: {
    block: [],
    asymmetric: [],
    hash: [],
    stream: [],
    other: ''
  }
});

export const createDefaultPreviousAssessment = (): PreviousAssessmentFormState => ({
  isFirstAssessment: '是',
  lastAssessmentDate: null,
  lastAssessmentAgency: '',
  conclusion: '',
  score: ''
});

const createDefaultProcessStage = (workContent: string, deliverables: string): ProcessFormState => ({
  schedule: [...createDefaultRange()],
  workContent,
  deliverables
});

export const createDefaultProjectForm = (): ProjectFormState => ({
  contractNo: '',
  organization: '',
  systemName: '',
  systemLevel: '三级',
  systemScale: '',
  period: [null, null],
  measuredSystem: createDefaultMeasuredSystem(),
  evaluationTeam: [createEmptyTeamMember()],
  previousAssessment: createDefaultPreviousAssessment(),
  evaluationBasis: {
    standards: [...DEFAULT_BASIS_STANDARDS],
    references: [...DEFAULT_REFERENCE_STANDARDS]
  },
  evaluationProcess: {
    preparation: createDefaultProcessStage(DEFAULT_PREPARATION_WORK_CONTENT, DEFAULT_PREPARATION_DELIVERABLES),
    schemeDesign: createDefaultProcessStage(DEFAULT_SCHEME_WORK_CONTENT, '测评方案及测评实施手册。'),
    onsiteAssessment: createDefaultProcessStage(DEFAULT_ONSITE_WORK_CONTENT, '现场测评记录与授权确认材料。'),
    analysisAndReport: createDefaultProcessStage(DEFAULT_ANALYSIS_WORK_CONTENT, '密评报告、量化评估资料及改进建议。')
  }
});

const normalizeUsage = (used: boolean): UsageOption => (used ? '使用' : '未使用');

const mapProcessStage = (stage: ProcessFormState): ProcessStageInfo => ({
  schedule: {
    start: stage.schedule[0]?.toISOString() ?? '',
    end: stage.schedule[1]?.toISOString() ?? ''
  },
  workContent: stage.workContent,
  deliverables: stage.deliverables
});

export const convertProjectInfoToForm = (info: ProjectInfo | null | undefined): ProjectFormState => {
  const defaults = createDefaultProjectForm();

  if (!info) {
    return defaults;
  }

  const form: ProjectFormState = {
    ...defaults,
    contractNo: info.contractNo ?? '',
    organization: info.organization ?? '',
    systemName: info.systemName ?? '',
    systemLevel: info.systemLevel ?? defaults.systemLevel,
    systemScale: info.systemScale ?? '',
    period: [
      info.assessmentPeriod?.start ? dayjs(info.assessmentPeriod.start).toDate() : null,
      info.assessmentPeriod?.end ? dayjs(info.assessmentPeriod.end).toDate() : null
    ],
    measuredSystem: { ...defaults.measuredSystem },
    evaluationTeam: [createEmptyTeamMember()],
    previousAssessment: { ...defaults.previousAssessment },
    evaluationBasis: { ...defaults.evaluationBasis },
    evaluationProcess: { ...defaults.evaluationProcess }
  };

  const mappedTeam = info.evaluationTeam?.members?.map(mapMemberToForm) ?? [];
  if (mappedTeam.length) {
    form.evaluationTeam = mappedTeam;
  }

  if (info.measuredSystem) {
    const measured = info.measuredSystem;
    const scopeDetail = measured.service.scopeDetail ?? '';
    const normalizedScopeCount = SERVICE_SCOPE_NEEDS_COUNT.includes(measured.service.scope)
      ? scopeDetail.replace(/[^0-9]/g, '')
      : scopeDetail;
    form.measuredSystem = {
      ...defaults.measuredSystem,
      criticalInfrastructureStatus: measured.criticalInfrastructure.status,
      criticalInfrastructureDepartment: measured.criticalInfrastructure.department ?? '',
      gradingAssessmentStatus: measured.gradingAssessment.status,
      gradingAssessmentAgency: measured.gradingAssessment.agency ?? '',
      gradingAssessmentPeriod: [
        measured.gradingAssessment.period?.start ? dayjs(measured.gradingAssessment.period.start).toDate() : null,
        measured.gradingAssessment.period?.end ? dayjs(measured.gradingAssessment.period.end).toDate() : null
      ],
      gradingAssessmentConclusion: measured.gradingAssessment.conclusion ?? '',
      serviceScope: measured.service.scope,
      serviceScopeCount: normalizedScopeCount,
      serviceDomains: measured.service.domains.length
        ? measured.service.domains
        : defaults.measuredSystem.serviceDomains,
      serviceObject: measured.service.serviceObject,
      networkCoverage: measured.network.coverage.length
        ? measured.network.coverage
        : defaults.measuredSystem.networkCoverage,
      userCount: measured.network.userCount,
      inOperation: measured.operation.inOperation ? '是' : '否',
      operationStart: measured.operation.startDate ? dayjs(measured.operation.startDate).toDate() : null,
      currentStatus: measured.operation.currentStatus ?? '',
      interconnections: measured.interconnection.connections.length
        ? measured.interconnection.connections
        : defaults.measuredSystem.interconnections,
      interconnectionNames: measured.interconnection.systemNames ?? '',
      interconnectionOther: '',
      cloudDependent: measured.cloudDependency.dependent ? '是' : '否',
      cloudPlatformName: measured.cloudDependency.platformName ?? '',
      cloudEvaluationAgency: measured.cloudDependency.evaluationAgency ?? '',
      cloudEvaluationPeriod: [
        measured.cloudDependency.evaluationPeriod?.start
          ? dayjs(measured.cloudDependency.evaluationPeriod.start).toDate()
          : null,
        measured.cloudDependency.evaluationPeriod?.end
          ? dayjs(measured.cloudDependency.evaluationPeriod.end).toDate()
          : null
      ],
      cloudEvaluationStatus:
        measured.cloudDependency.evaluationStatus ?? defaults.measuredSystem.cloudEvaluationStatus,
      cloudEvaluationConclusion: measured.cloudDependency.evaluationConclusion ?? '',
      cryptoPlanStatus: measured.cryptoPlan.status,
      cryptoPlanApprovalTime: measured.cryptoPlan.approvalTime
        ? dayjs(measured.cryptoPlan.approvalTime).toDate()
        : null,
      cryptoPlanEvaluationMethod:
        measured.cryptoPlan.evaluationMethod ?? defaults.measuredSystem.cryptoPlanEvaluationMethod,
      cryptoPlanAgency: measured.cryptoPlan.evaluationAgency ?? '',
      cryptoProductsUsed: normalizeUsage(measured.cryptoProducts.used),
      cryptoProductCounts: {
        systemUsage: measured.cryptoProducts.counts?.systemUsage ?? '',
        independentUsage: measured.cryptoProducts.counts?.independentUsage ?? '',
        sharedUsage: measured.cryptoProducts.counts?.sharedUsage ?? '',
        certifiedCount: measured.cryptoProducts.counts?.certifiedCount ?? '',
        domesticCount: measured.cryptoProducts.counts?.domesticCount ?? '',
        foreignCount: measured.cryptoProducts.counts?.foreignCount ?? ''
      },
      cryptoAlgorithms: {
        block: measured.cryptoAlgorithms.block ?? [],
        asymmetric: measured.cryptoAlgorithms.asymmetric ?? [],
        hash: measured.cryptoAlgorithms.hash ?? [],
        stream: measured.cryptoAlgorithms.stream ?? [],
        other: measured.cryptoAlgorithms.other ?? ''
      }
    };

    if (
      form.measuredSystem.interconnections.includes('其他') &&
      measured.interconnection.systemNames &&
      !measured.interconnection.connections.includes('其他')
    ) {
      form.measuredSystem.interconnections = [...measured.interconnection.connections, '其他'];
    }
  }

  if (info.evaluationBasis) {
    form.evaluationBasis = {
      standards: info.evaluationBasis.standards.length
        ? info.evaluationBasis.standards
        : defaults.evaluationBasis.standards,
      references: info.evaluationBasis.references.length
        ? info.evaluationBasis.references
        : defaults.evaluationBasis.references
    };
  }

  if (info.previousAssessment) {
    const isFirst = info.previousAssessment.isFirstAssessment !== false;
    form.previousAssessment = {
      ...defaults.previousAssessment,
      isFirstAssessment: isFirst ? '是' : '否'
    };

    if (!isFirst) {
      form.previousAssessment = {
        ...form.previousAssessment,
        lastAssessmentDate: info.previousAssessment.lastAssessmentDate
          ? dayjs(info.previousAssessment.lastAssessmentDate).toDate()
          : null,
        lastAssessmentAgency: info.previousAssessment.agency ?? '',
        conclusion: info.previousAssessment.conclusion ?? '',
        score: info.previousAssessment.score ?? ''
      };
    }

    if (
      form.previousAssessment.conclusion &&
      !PREVIOUS_ASSESSMENT_CONCLUSION_OPTIONS.includes(form.previousAssessment.conclusion)
    ) {
      form.previousAssessment.conclusion = '';
    }
  }

  if (info.evaluationProcess) {
    form.evaluationProcess = {
      preparation: convertStageToForm(info.evaluationProcess.preparation, defaults.evaluationProcess.preparation),
      schemeDesign: convertStageToForm(info.evaluationProcess.schemeDesign, defaults.evaluationProcess.schemeDesign),
      onsiteAssessment: convertStageToForm(
        info.evaluationProcess.onsiteAssessment,
        defaults.evaluationProcess.onsiteAssessment
      ),
      analysisAndReport: convertStageToForm(
        info.evaluationProcess.analysisAndReport,
        defaults.evaluationProcess.analysisAndReport
      )
    };
  }

  return form;
};

export const buildProjectInfoPayload = (
  form: ProjectFormState,
  currentInfo: ProjectInfo | null | undefined
): ProjectInfo => {
  const measured = form.measuredSystem;
  const interconnectionNames = [measured.interconnectionNames, measured.interconnectionOther]
    .map((item) => item.trim())
    .filter(Boolean)
    .join('；');
  const scopeRequiresCount = SERVICE_SCOPE_NEEDS_COUNT.includes(measured.serviceScope);
  const scopeCountValue = measured.serviceScopeCount.trim();
  const computedScopeDetail = scopeRequiresCount
    ? scopeCountValue
      ? `跨${scopeCountValue}个`
      : ''
    : scopeCountValue;
  const previous = form.previousAssessment;

  const sanitizedMembers = form.evaluationTeam
    .map((member) => ({
      ...member,
      name: member.name.trim(),
      role: member.role.trim(),
      responsibility: member.responsibility.trim()
    }))
    .filter((member) => member.name || member.role || member.responsibility);

  const info: ProjectInfo = {
    id: currentInfo?.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10)),
    measuredSystem: {
      criticalInfrastructure: {
        status: measured.criticalInfrastructureStatus,
        ...(measured.criticalInfrastructureDepartment
          ? { department: measured.criticalInfrastructureDepartment }
          : {})
      },
      gradingAssessment: {
        status: measured.gradingAssessmentStatus,
        ...(measured.gradingAssessmentAgency ? { agency: measured.gradingAssessmentAgency } : {}),
        ...(measured.gradingAssessmentPeriod[0] || measured.gradingAssessmentPeriod[1]
          ? {
              period: {
                start: measured.gradingAssessmentPeriod[0]?.toISOString(),
                end: measured.gradingAssessmentPeriod[1]?.toISOString()
              }
            }
          : {}),
        ...(measured.gradingAssessmentConclusion ? { conclusion: measured.gradingAssessmentConclusion } : {})
      },
      service: {
        scope: measured.serviceScope,
        ...(computedScopeDetail ? { scopeDetail: computedScopeDetail } : {}),
        domains: measured.serviceDomains,
        serviceObject: measured.serviceObject
      },
      network: {
        coverage: measured.networkCoverage,
        userCount: measured.userCount
      },
      operation: {
        inOperation: measured.inOperation === '是',
        ...(measured.operationStart ? { startDate: measured.operationStart.toISOString() } : {}),
        ...(measured.currentStatus ? { currentStatus: measured.currentStatus } : {})
      },
      interconnection: {
        connections: measured.interconnections,
        ...(interconnectionNames ? { systemNames: interconnectionNames } : {})
      },
      cloudDependency: {
        dependent: measured.cloudDependent === '是',
        ...(measured.cloudDependent === '是' && measured.cloudPlatformName
          ? { platformName: measured.cloudPlatformName }
          : {}),
        ...(measured.cloudDependent === '是' && measured.cloudEvaluationAgency
          ? { evaluationAgency: measured.cloudEvaluationAgency }
          : {}),
        ...(measured.cloudDependent === '是' && (measured.cloudEvaluationPeriod[0] || measured.cloudEvaluationPeriod[1])
          ? {
              evaluationPeriod: {
                start: measured.cloudEvaluationPeriod[0]?.toISOString(),
                end: measured.cloudEvaluationPeriod[1]?.toISOString()
              }
            }
          : {}),
        ...(measured.cloudDependent === '是' && measured.cloudEvaluationConclusion
          ? { evaluationConclusion: measured.cloudEvaluationConclusion }
          : {}),
        ...(measured.cloudDependent === '是' ? { evaluationStatus: measured.cloudEvaluationStatus } : {})
      },
      cryptoPlan: {
        status: measured.cryptoPlanStatus,
        ...(measured.cryptoPlanApprovalTime ? { approvalTime: measured.cryptoPlanApprovalTime.toISOString() } : {}),
        ...(measured.cryptoPlanEvaluationMethod ? { evaluationMethod: measured.cryptoPlanEvaluationMethod } : {}),
        ...(measured.cryptoPlanAgency ? { evaluationAgency: measured.cryptoPlanAgency } : {})
      },
      cryptoProducts: {
        used: measured.cryptoProductsUsed === '使用',
        ...(measured.cryptoProductsUsed === '使用'
          ? {
              counts: {
                systemUsage: measured.cryptoProductCounts.systemUsage,
                independentUsage: measured.cryptoProductCounts.independentUsage,
                sharedUsage: measured.cryptoProductCounts.sharedUsage,
                certifiedCount: measured.cryptoProductCounts.certifiedCount,
                domesticCount: measured.cryptoProductCounts.domesticCount,
                foreignCount: measured.cryptoProductCounts.foreignCount
              }
            }
          : {})
      },
      cryptoAlgorithms: {
        block: measured.cryptoAlgorithms.block,
        asymmetric: measured.cryptoAlgorithms.asymmetric,
        hash: measured.cryptoAlgorithms.hash,
        stream: measured.cryptoAlgorithms.stream,
        ...(measured.cryptoAlgorithms.other ? { other: measured.cryptoAlgorithms.other } : {})
      }
    },
    evaluationBasis: {
      standards: form.evaluationBasis.standards,
      references: form.evaluationBasis.references
    },
    evaluationProcess: {
      preparation: mapProcessStage(form.evaluationProcess.preparation),
      schemeDesign: mapProcessStage(form.evaluationProcess.schemeDesign),
      onsiteAssessment: mapProcessStage(form.evaluationProcess.onsiteAssessment),
      analysisAndReport: mapProcessStage(form.evaluationProcess.analysisAndReport)
    },
    ...(sanitizedMembers.length
      ? {
          evaluationTeam: {
            members: sanitizedMembers.map((member) => ({
              id: member.id || generateId(),
              name: member.name,
              role: member.role,
              responsibility: member.responsibility,
              passedAssessment: member.passedAssessment
            }))
          }
        }
      : {}),
    previousAssessment:
      previous.isFirstAssessment === '是'
        ? {
            isFirstAssessment: true
          }
        : {
            isFirstAssessment: false,
            ...(previous.lastAssessmentDate
              ? { lastAssessmentDate: previous.lastAssessmentDate.toISOString() }
              : {}),
            ...(previous.lastAssessmentAgency.trim() ? { agency: previous.lastAssessmentAgency.trim() } : {}),
            ...(previous.conclusion ? { conclusion: previous.conclusion } : {}),
            ...(previous.score.trim() ? { score: previous.score.trim() } : {})
          },
    preparationStatus: currentInfo?.preparationStatus,
    preparationStatusChangedAt: currentInfo?.preparationStatusChangedAt,
    preparationStatusActor: currentInfo?.preparationStatusActor,
    preparationSubmittedAt: currentInfo?.preparationSubmittedAt,
    preparationSubmittedBy: currentInfo?.preparationSubmittedBy,
    createdAt: currentInfo?.createdAt ?? dayjs().toISOString(),
    updatedAt: dayjs().toISOString(),
    ...(form.contractNo ? { contractNo: form.contractNo } : {}),
    ...(form.organization ? { organization: form.organization } : {}),
    ...(form.systemName ? { systemName: form.systemName } : {}),
    ...(form.systemLevel ? { systemLevel: form.systemLevel } : {}),
    ...(form.systemScale ? { systemScale: form.systemScale } : {}),
    ...(form.period[0] && form.period[1]
      ? {
          assessmentPeriod: {
            start: form.period[0]?.toISOString(),
            end: form.period[1]?.toISOString()
          }
        }
      : {})
  };

  return info;
};
