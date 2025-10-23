import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  AnalysisSummary,
  AssessmentCheckpoint,
  AssessmentIndicator,
  AssessmentObject,
  AssessmentRecord,
  AssetThreatRecord,
  AuthorizationRecord,
  ConclusionRecord,
  DocumentRecord,
  MeetingRecord,
  OperationLog,
  PlanReviewRecord,
  PlanSection,
  PlanVersion,
  PlanUpdateRecord,
  ProductVerificationRecord,
  ProjectContextValue,
  ProjectInfo,
  ProjectMember,
  ProjectState,
  ReportDraft,
  ReportReviewRecord,
  ResourceConfirmation,
  ReturnRecord,
  RiskEntry,
  ScoreCardEntry,
  StandardFormRecord,
  SupplementalAssessmentRecord,
  SurveyField,
  SurveyRecord,
  SystemMeta,
  SystemOverview,
  SystemState,
  TechnicalDocument,
  ToolAccessPlan,
  ToolRecord,
  UnitAssessmentResult,
  UnitTestEntry
} from '../types/project';
import { createSystem, deleteSystem, listSystems, SystemRecord } from '../api/systems';
import { getSystemPreparation, saveSystemPreparation } from '../api/preparation';
import { DEFAULT_SYSTEM_NAME, LOCAL_DEFAULT_SYSTEM_ID } from '../constants/system';

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const createId = () => Math.random().toString(36).slice(2, 10);

function appendLog(logs: OperationLog[], module: string, actor: string, action: string, details?: string): OperationLog[] {
  return [
    {
      id: createId(),
      timestamp: dayjs().toISOString(),
      actor,
      module,
      action,
      details
    },
    ...logs
  ];
}

const STORAGE_KEY = 'crypto-eval-project-state';

const createDefaultPlanSections = (): PlanSection[] => [
  { key: 'overview', title: '项目概述', content: '', lastUpdated: dayjs().toISOString() },
  { key: 'basis', title: '工作依据', content: '密码应用测评过程指南\n密码应用测评要求', lastUpdated: dayjs().toISOString() },
  { key: 'approach', title: '技术思路', content: '', lastUpdated: dayjs().toISOString() },
  { key: 'tasks', title: '工作内容', content: '', lastUpdated: dayjs().toISOString() },
  { key: 'organization', title: '项目组织', content: '', lastUpdated: dayjs().toISOString() }
];

const buildEmptySystemState = (): Omit<SystemState, 'id' | 'meta'> => ({
  projectInfo: null,
  members: [],
  planSections: createDefaultPlanSections(),
  planVersions: [],
  documents: [],
  surveyFields: [],
  surveyRecords: [],
  technicalDocs: [],
  analysisSummary: null,
  toolRecords: [],
  standardForms: [],
  assessmentObjects: [],
  assetThreats: [],
  indicators: [],
  checkpoints: [],
  toolAccessPlans: [],
  unitTests: [],
  planReviews: [],
  meetingRecords: [],
  resourceConfirmations: [],
  planUpdates: [],
  authorizationRecords: [],
  assessmentRecords: [],
  productVerifications: [],
  supplementalAssessments: [],
  returnRecords: [],
  unitResults: [],
  overallResults: [],
  scoreCards: [],
  riskEntries: [],
  conclusion: null,
  reportDrafts: [],
  reportReviews: [],
  logs: []
});

function createSystemStateWithMeta(id: string, meta: SystemOverview): SystemState {
  return {
    id,
    meta: {
      ...meta,
      reportProgress: meta.reportProgress ?? 0
    },
    ...buildEmptySystemState()
  };
}

const createDefaultState = (): ProjectState => {
  const timestamp = dayjs().toISOString();
  const meta: SystemOverview = {
    name: DEFAULT_SYSTEM_NAME,
    createdAt: timestamp,
    updatedAt: timestamp,
    isDefault: true,
    evidenceTotal: 0,
    evidenceParsed: 0,
    reportProgress: 0
  };
  const system = createSystemStateWithMeta(LOCAL_DEFAULT_SYSTEM_ID, meta);
  return {
    systems: [system],
    activeSystemId: system.id
  };
};

function loadInitialState(): ProjectState {
  if (typeof window === 'undefined') {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }
    const parsed = JSON.parse(raw) as ProjectState;
    if (!parsed || !Array.isArray(parsed.systems) || parsed.systems.length === 0) {
      return createDefaultState();
    }
    const activeId = parsed.systems.some((system) => system.id === parsed.activeSystemId)
      ? parsed.activeSystemId
      : parsed.systems[0].id;
    return {
      systems: parsed.systems,
      activeSystemId: activeId
    };
  } catch (error) {
    console.warn('Failed to load project state from localStorage', error);
    return createDefaultState();
  }
}

function normalizeSystemMeta(record: SystemRecord): SystemOverview {
  return {
    name: record.name,
    code: record.code ?? undefined,
    level: record.level ?? undefined,
    owner: record.owner ?? undefined,
    description: record.description ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    isDefault: record.isDefault ?? false,
    evidenceTotal: record.evidenceTotal ?? 0,
    evidenceParsed: record.evidenceParsed ?? 0,
    reportProgress: record.reportProgress ?? undefined
  };
}

function mergeStateWithRemote(current: ProjectState, records: SystemRecord[]): ProjectState {
  if (records.length === 0) {
    return current;
  }

  const currentMap = new Map(current.systems.map((system) => [system.id, system]));
  const systems = records.map((record) => {
    const meta = normalizeSystemMeta(record);
    const existing = currentMap.get(record.id);
    if (existing) {
      return {
        ...existing,
        meta: {
          ...existing.meta,
          ...meta,
          reportProgress: meta.reportProgress ?? existing.meta.reportProgress ?? 0
        }
      };
    }
    return createSystemStateWithMeta(record.id, meta);
  });

  const activeSystemId = systems.some((system) => system.id === current.activeSystemId)
    ? current.activeSystemId
    : systems[0]?.id ?? null;

  return {
    systems,
    activeSystemId
  };
}

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [state, setState] = useState<ProjectState>(() => loadInitialState());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to persist project state to localStorage', error);
    }
  }, [state]);

  const syncSystems = useCallback(async () => {
    const records = await listSystems();
    setState((prev) => mergeStateWithRemote(prev, records));

    if (records.length === 0) {
      return;
    }

    const preparations = await Promise.all(
      records.map(async (record) => {
        try {
          return await getSystemPreparation(record.id);
        } catch (error) {
          console.warn(`Failed to fetch preparation info for system ${record.id}`, error);
          return { systemId: record.id, projectInfo: null };
        }
      })
    );

    setState((prev) => {
      const preparationMap = new Map<string, ProjectInfo | null>();
      preparations.forEach((item) => {
        preparationMap.set(item.systemId, item.projectInfo ?? null);
      });
      const systems = prev.systems.map((system) =>
        preparationMap.has(system.id)
          ? { ...system, projectInfo: preparationMap.get(system.id) ?? null }
          : system
      );
      return {
        ...prev,
        systems
      };
    });
  }, []);

  useEffect(() => {
    syncSystems().catch((error) => {
      console.warn('Failed to synchronize systems from server', error);
    });
  }, [syncSystems]);

  const value = useMemo<ProjectContextValue>(() => {
    const activeSystem = state.systems.find((item) => item.id === state.activeSystemId) ?? null;

    const applySystemUpdate = (
      targetId: string | undefined,
      updater: (system: SystemState) => SystemState
    ) => {
      setState((prev) => {
        const systemId = targetId ?? prev.activeSystemId;
        if (!systemId) {
          console.warn('No active system available for the requested operation.');
          return prev;
        }
        const index = prev.systems.findIndex((system) => system.id === systemId);
        if (index === -1) {
          console.warn(`System ${systemId} not found when applying update.`);
          return prev;
        }
        const updatedSystem = updater(prev.systems[index]);
        if (updatedSystem === prev.systems[index]) {
          return prev;
        }
        const systems = [...prev.systems];
        systems[index] = updatedSystem;
        return {
          ...prev,
          systems
        };
      });
    };

    return {
      systems: state.systems,
      activeSystemId: state.activeSystemId,
      activeSystem,
      refreshSystems: syncSystems,
      addSystem: async (meta) => {
        const record = await createSystem({
          name: meta.name,
          code: meta.code,
          level: meta.level,
          owner: meta.owner,
          description: meta.description
        });
        const normalizedMeta = normalizeSystemMeta(record);
        setState((prev) => {
          const exists = prev.systems.some((system) => system.id === record.id);
          const systems = exists
            ? prev.systems.map((system) =>
                system.id === record.id
                  ? { ...system, meta: normalizedMeta }
                  : system
              )
            : [...prev.systems, createSystemStateWithMeta(record.id, normalizedMeta)];

          return {
            systems,
            activeSystemId: record.id
          };
        });
        return record.id;
      },
      updateSystemMeta: (systemId, updates) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          meta: {
            ...system.meta,
            ...updates,
            updatedAt: dayjs().toISOString()
          }
        }));
      },
      removeSystem: async (systemId) => {
        await deleteSystem(systemId);
        setState((prev) => {
          const systems = prev.systems.filter((system) => system.id !== systemId);
          if (systems.length === prev.systems.length) {
            return prev;
          }
          if (systems.length === 0) {
            return createDefaultState();
          }
          const activeSystemId =
            prev.activeSystemId === systemId
              ? systems[systems.length - 1].id
              : prev.activeSystemId;
          return {
            systems,
            activeSystemId
          };
        });
      },
      setActiveSystem: (systemId) => {
        setState((prev) =>
          prev.systems.some((system) => system.id === systemId)
            ? { ...prev, activeSystemId: systemId }
            : prev
        );
      },
      updateProjectInfo: async (info, actor, systemId) => {
        const targetId = systemId ?? state.activeSystemId;
        if (!targetId) {
          throw new Error('未选择测评系统');
        }

        const response = await saveSystemPreparation(targetId, { projectInfo: info });
        const storedInfo = response.projectInfo ?? info;
        const status = storedInfo?.preparationStatus;
        const actionLabel =
          status === 'submitted'
            ? '提交测评准备信息'
            : status === 'draft'
            ? '暂存测评准备信息'
            : '更新测评准备信息';

        applySystemUpdate(targetId, (system) => ({
          ...system,
          projectInfo: storedInfo,
          logs: appendLog(system.logs, '测评准备', actor, actionLabel)
        }));
      },
      addMember: (member, actor, systemId) => {
        applySystemUpdate(systemId, (system) => {
          const newMember: ProjectMember = {
            ...member,
            id: createId(),
            createdAt: dayjs().toISOString()
          };
          return {
            ...system,
            members: [...system.members, newMember],
            logs: appendLog(system.logs, '测评准备', actor, `新增项目成员 ${member.name}`)
          };
        });
      },
      removeMember: (memberId, actor, systemId) => {
        applySystemUpdate(systemId, (system) => {
          const member = system.members.find((item) => item.id === memberId);
          if (!member) {
            return system;
          }
          return {
            ...system,
            members: system.members.filter((item) => item.id !== memberId),
            logs: appendLog(system.logs, '测评准备', actor, `移除项目成员 ${member.name}`)
          };
        });
      },
      updatePlanSection: (sectionKey, content, actor, systemId) => {
        applySystemUpdate(systemId, (system) => {
          const planSections = system.planSections.map((section) =>
            section.key === sectionKey
              ? { ...section, content, lastUpdated: dayjs().toISOString() }
              : section
          );
          return {
            ...system,
            planSections,
            logs: appendLog(system.logs, '测评准备', actor, `更新项目计划书章节 ${sectionKey}`)
          };
        });
      },
      addPlanVersion: (version, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          planVersions: [...system.planVersions, { ...version, id: createId() }],
          logs: appendLog(system.logs, '测评准备', actor, `导出项目计划书 ${version.version}`)
        }));
      },
      registerDocument: (document, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          documents: [{ ...document, id: createId() }, ...system.documents],
          logs: appendLog(system.logs, document.relatedModule, actor, `登记文档 ${document.name}`)
        }));
      },
      addSurveyField: (field, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          surveyFields: [...system.surveyFields, { ...field, id: createId() }],
          logs: appendLog(system.logs, '测评准备', actor, `新增调查字段 ${field.label}`)
        }));
      },
      removeSurveyField: (fieldId, actor, systemId) => {
        applySystemUpdate(systemId, (system) => {
          const field = system.surveyFields.find((item) => item.id === fieldId);
          if (!field) {
            return system;
          }
          return {
            ...system,
            surveyFields: system.surveyFields.filter((item) => item.id !== fieldId),
            logs: appendLog(system.logs, '测评准备', actor, `删除调查字段 ${field.label}`)
          };
        });
      },
      saveSurveyRecord: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          surveyRecords: [{ ...record, id: createId(), submittedAt: dayjs().toISOString() }, ...system.surveyRecords],
          logs: appendLog(system.logs, '测评准备', actor, '保存调查表结果')
        }));
      },
      addTechnicalDocument: (doc, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          technicalDocs: [{ ...doc, id: createId(), uploadedAt: dayjs().toISOString() }, ...system.technicalDocs],
          logs: appendLog(system.logs, '测评准备', actor, `上传技术资料 ${doc.name}`)
        }));
      },
      setAnalysisSummary: (summary, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          analysisSummary: {
            ...summary,
            id: system.analysisSummary?.id ?? createId(),
            lastUpdated: dayjs().toISOString()
          },
          logs: appendLog(system.logs, '测评准备', actor, '更新调查结果分析')
        }));
      },
      addToolRecord: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          toolRecords: [...system.toolRecords, { ...record, id: createId(), createdAt: dayjs().toISOString() }],
          logs: appendLog(system.logs, '测评准备', actor, `新增测评工具 ${record.name}`)
        }));
      },
      removeToolRecord: (recordId, actor, systemId) => {
        applySystemUpdate(systemId, (system) => {
          const record = system.toolRecords.find((item) => item.id === recordId);
          if (!record) {
            return system;
          }
          return {
            ...system,
            toolRecords: system.toolRecords.filter((item) => item.id !== recordId),
            logs: appendLog(system.logs, '测评准备', actor, `移除测评工具 ${record.name}`)
          };
        });
      },
      addStandardForm: (form, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          standardForms: [
            ...system.standardForms,
            { ...form, id: createId(), lastUpdated: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '测评准备', actor, `生成标准表单 ${form.type}`)
        }));
      },
      updateStandardFormStatus: (formId, updates, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          standardForms: system.standardForms.map((form) =>
            form.id === formId
              ? { ...form, ...updates, lastUpdated: dayjs().toISOString() }
              : form
          ),
          logs: appendLog(system.logs, '测评准备', actor, `更新标准表单状态 ${formId}`)
        }));
      },
      addAssessmentObject: (object, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          assessmentObjects: [...system.assessmentObjects, { ...object, id: createId() }],
          logs: appendLog(system.logs, '方案编制', actor, `新增测评对象 ${object.name}`)
        }));
      },
      addAssetThreat: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          assetThreats: [...system.assetThreats, { ...record, id: createId() }],
          logs: appendLog(system.logs, '方案编制', actor, `记录资产威胁 ${record.assetName}`)
        }));
      },
      addIndicator: (indicator, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          indicators: [...system.indicators, { ...indicator, id: createId() }],
          logs: appendLog(system.logs, '方案编制', actor, `添加测评指标 ${indicator.code}`)
        }));
      },
      updateIndicator: (indicatorId, updates, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          indicators: system.indicators.map((indicator) =>
            indicator.id === indicatorId ? { ...indicator, ...updates } : indicator
          ),
          logs: appendLog(system.logs, '方案编制', actor, `更新测评指标 ${indicatorId}`)
        }));
      },
      addCheckpoint: (checkpoint, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          checkpoints: [...system.checkpoints, { ...checkpoint, id: createId() }],
          logs: appendLog(system.logs, '方案编制', actor, `新增测评检查点 ${checkpoint.name}`)
        }));
      },
      addToolAccessPlan: (plan, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          toolAccessPlans: [...system.toolAccessPlans, { ...plan, id: createId() }],
          logs: appendLog(system.logs, '方案编制', actor, '新增工具接入规划')
        }));
      },
      addUnitTest: (unit, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          unitTests: [...system.unitTests, { ...unit, id: createId() }],
          logs: appendLog(system.logs, '方案编制', actor, `新增单元测评项 ${unit.indicatorCode}`)
        }));
      },
      addPlanReview: (review, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          planReviews: [...system.planReviews, { ...review, id: createId(), reviewedAt: dayjs().toISOString() }],
          logs: appendLog(system.logs, '方案编制', actor, `登记方案评审 ${review.reviewer}`)
        }));
      },
      addMeetingRecord: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          meetingRecords: [
            ...system.meetingRecords,
            {
              ...record,
              id: createId(),
              signed: record.signed ?? false
            }
          ],
          logs: appendLog(system.logs, '现场测评', actor, `${record.meetingType} 记录更新`)
        }));
      },
      addResourceConfirmation: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          resourceConfirmations: [
            ...system.resourceConfirmations,
            { ...record, id: createId(), confirmedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '现场测评', actor, `资源确认 ${record.contactName}`)
        }));
      },
      addPlanUpdate: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          planUpdates: [
            ...system.planUpdates,
            { ...record, id: createId(), updatedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '现场测评', actor, '密评方案现场更新')
        }));
      },
      addAuthorizationRecord: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          authorizationRecords: [
            ...system.authorizationRecords,
            { ...record, id: createId(), signedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '现场测评', actor, `签署 ${record.formType}`)
        }));
      },
      addAssessmentRecord: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          assessmentRecords: [
            ...system.assessmentRecords,
            { ...record, id: createId(), recordedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '现场测评', actor, `新增${record.recordType}记录 ${record.objectName}`)
        }));
      },
      addProductVerification: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          productVerifications: [
            ...system.productVerifications,
            { ...record, id: createId(), recordedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '现场测评', actor, `核验密码产品 ${record.productName}`)
        }));
      },
      addSupplementalAssessment: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          supplementalAssessments: [
            ...system.supplementalAssessments,
            { ...record, id: createId(), performedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '现场测评', actor, '补充测评登记')
        }));
      },
      addReturnRecord: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          returnRecords: [
            ...system.returnRecords,
            { ...record, id: createId(), returnedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '现场测评', actor, `资料归还 ${record.documentName}`)
        }));
      },
      addUnitResult: (result, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          unitResults: [...system.unitResults, { ...result, id: createId() }],
          logs: appendLog(system.logs, '分析与报告', actor, `新增单元测评结果 ${result.unitName}`)
        }));
      },
      addOverallResult: (result, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          overallResults: [
            ...system.overallResults,
            { ...result, id: createId(), updatedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '分析与报告', actor, `更新层面测评结果 ${result.layer}`)
        }));
      },
      addScoreCard: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          scoreCards: [...system.scoreCards, { ...record, id: createId() }],
          logs: appendLog(system.logs, '分析与报告', actor, `记录量化得分 ${record.name}`)
        }));
      },
      addRiskEntry: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          riskEntries: [...system.riskEntries, { ...record, id: createId() }],
          logs: appendLog(system.logs, '分析与报告', actor, `记录风险项 ${record.issue}`)
        }));
      },
      setConclusion: (record, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          conclusion: {
            ...record,
            id: system.conclusion?.id ?? createId(),
            confirmedAt: dayjs().toISOString()
          },
          logs: appendLog(system.logs, '分析与报告', actor, `更新评估结论 ${record.result}`)
        }));
      },
      addReportDraft: (draft, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          reportDrafts: [
            ...system.reportDrafts,
            {
              ...draft,
              id: createId(),
              createdAt: dayjs().toISOString(),
              updatedAt: dayjs().toISOString()
            }
          ],
          logs: appendLog(system.logs, '分析与报告', actor, `创建报告版本 ${draft.version}`)
        }));
      },
      updateReportDraft: (draftId, updates, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          reportDrafts: system.reportDrafts.map((draft) =>
            draft.id === draftId
              ? { ...draft, ...updates, updatedAt: dayjs().toISOString() }
              : draft
          ),
          logs: appendLog(system.logs, '分析与报告', actor, `更新报告草稿 ${draftId}`)
        }));
      },
      addReportReview: (review, actor, systemId) => {
        applySystemUpdate(systemId, (system) => ({
          ...system,
          reportReviews: [
            ...system.reportReviews,
            { ...review, id: createId(), reviewedAt: dayjs().toISOString() }
          ],
          logs: appendLog(system.logs, '分析与报告', actor, `报告评审 ${review.reviewer}`)
        }));
      }
    };
  }, [state, syncSystems]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
