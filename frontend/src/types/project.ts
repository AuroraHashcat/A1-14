export type ProjectRole = '项目负责人' | '密评人员' | '被测单位人员' | '系统管理员';

export interface SystemMeta {
  name: string;
  code?: string;
  level?: string;
  owner?: string;
  description?: string;
  isDefault?: boolean;
  evidenceTotal?: number;
  evidenceParsed?: number;
  /** 报告阶段进度，范围 0-1 */
  reportProgress?: number;
}

export interface SystemOverview extends SystemMeta {
  createdAt: string;
  updatedAt: string;
}

export type CriticalInfrastructureStatus = '已认定' | '未认定';
export type GradingAssessmentStatus = '已测评' | '正在测评' | '未测评';
export type ServiceScopeOption = '全国' | '跨省（区、市）' | '跨地（市、区）' | '地（市、区）内' | '其他';
export type ServiceDomainOption =
  | '电信'
  | '广电'
  | '经营性公众互联网'
  | '新闻'
  | '海关'
  | '税务'
  | '国防科技工业'
  | '公安'
  | '财政'
  | '人事劳动社会保障'
  | '审计'
  | '商业贸易'
  | '国土资源'
  | '能源'
  | '交通'
  | '统计'
  | '工商行政管理'
  | '邮政'
  | '教育'
  | '文化'
  | '卫生'
  | '农业'
  | '水利'
  | '外交'
  | '宏观经济'
  | '科技'
  | '宣传'
  | '质量监督检验检疫'
  | '其他';
export type ServiceObjectOption = '单位内部人员' | '公众用户' | '行业监管部门' | '合作伙伴' | '其他';
export type NetworkCoverageOption = '局域网' | '互联网' | '其他';
export type InterconnectionOption =
  | '与本行业其他单位系统连接'
  | '与其他行业系统连接'
  | '与本地其他系统连接'
  | '其他';
export type CloudEvaluationStatus = '云平台已评估' | '云平台正在评估' | '云平台未评估';
export type CryptoPlanStatusOption =
  | '有密码应用方案，且通过评审'
  | '有密码应用方案，但未通过评审'
  | '无密码应用方案';
export type CryptoPlanEvaluationMethod = '自行评估' | '委托密评机构评估';
export type AssessmentConclusionOption = '符合' | '基本符合' | '不符合';

export interface ProcessStageInfo {
  schedule: {
    start: string;
    end: string;
  };
  workContent: string;
  deliverables?: string;
}

export interface ProjectInfo {
  id: string;
  measuredSystem?: {
    criticalInfrastructure: {
      status: CriticalInfrastructureStatus;
      department?: string;
    };
    gradingAssessment: {
      status: GradingAssessmentStatus;
      agency?: string;
      period?: {
        start?: string;
        end?: string;
      };
      conclusion?: string;
    };
    service: {
      scope: ServiceScopeOption;
      scopeDetail?: string;
      domains: string[];
      serviceObject: ServiceObjectOption;
    };
    network: {
      coverage: string[];
      userCount: string;
    };
    operation: {
      inOperation: boolean;
      startDate?: string;
      currentStatus?: string;
    };
    interconnection: {
      connections: string[];
      systemNames?: string;
    };
    cloudDependency: {
      dependent: boolean;
      platformName?: string;
      evaluationAgency?: string;
      evaluationPeriod?: {
        start?: string;
        end?: string;
      };
      evaluationConclusion?: string;
      evaluationStatus?: CloudEvaluationStatus;
    };
    cryptoPlan: {
      status: CryptoPlanStatusOption;
      approvalTime?: string;
      evaluationMethod?: CryptoPlanEvaluationMethod;
      evaluationAgency?: string;
    };
    cryptoProducts: {
      used: boolean;
      counts?: {
        systemUsage?: string;
        independentUsage?: string;
        sharedUsage?: string;
        certifiedCount?: string;
        domesticCount?: string;
        foreignCount?: string;
      };
    };
    cryptoAlgorithms: {
      block: string[];
      asymmetric: string[];
      hash: string[];
      stream: string[];
      other?: string;
    };
  };
  evaluationBasis?: {
    standards: string[];
    references: string[];
  };
  evaluationProcess?: {
    preparation: ProcessStageInfo;
    schemeDesign: ProcessStageInfo;
    onsiteAssessment: ProcessStageInfo;
    analysisAndReport: ProcessStageInfo;
  };
  evaluationTeam?: {
    members: EvaluationTeamMember[];
  };
  previousAssessment?: {
    isFirstAssessment: boolean;
    lastAssessmentDate?: string;
    agency?: string;
    conclusion?: AssessmentConclusionOption;
    score?: string;
  };
  createdAt: string;
  updatedAt: string;
  preparationStatus?: 'draft' | 'submitted';
  preparationStatusChangedAt?: string;
  preparationStatusActor?: string;
  preparationSubmittedAt?: string;
  preparationSubmittedBy?: string;
  /** @deprecated Legacy fields kept for backward compatibility */
  contractNo?: string;
  /** @deprecated Legacy fields kept for backward compatibility */
  organization?: string;
  /** @deprecated Legacy fields kept for backward compatibility */
  systemName?: string;
  /** @deprecated Legacy fields kept for backward compatibility */
  systemLevel?: string;
  /** @deprecated Legacy fields kept for backward compatibility */
  systemScale?: string;
  /** @deprecated Legacy fields kept for backward compatibility */
  assessmentPeriod?: {
    start: string;
    end: string;
  };
}

export interface EvaluationTeamMember {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  passedAssessment: boolean;
}

export interface ProjectMember {
  id: string;
  name: string;
  role: ProjectRole;
  contact: string;
  permissions: {
    approvePlan: boolean;
    manageDocuments: boolean;
    viewSensitive: boolean;
  };
  createdAt: string;
}

export interface PlanSection {
  key: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface PlanVersion {
  id: string;
  version: string;
  format: 'PDF' | 'Word';
  exportedAt: string;
  exportedBy: string;
  watermark: string;
}

export type DocumentCategory =
  | '项目计划书'
  | '调查表格'
  | '技术资料'
  | '工具清单'
  | '标准表单'
  | '测评对象'
  | '测评指标'
  | '测评检查点'
  | '单元测评'
  | '密评方案'
  | '现场测评记录'
  | '授权与会议记录'
  | '资料归还'
  | '量化评估'
  | '风险分析'
  | '评估结论'
  | '密评报告';

export interface DocumentRecord {
  id: string;
  name: string;
  category: DocumentCategory;
  relatedModule: string;
  version: string;
  updatedAt: string;
  updatedBy: string;
  downloadUrl?: string;
}

export type SurveyCategory = '基本信息' | '密码应用' | '软硬件部署' | '业务信息';

export interface SurveyField {
  id: string;
  category: SurveyCategory;
  label: string;
  description?: string;
  required: boolean;
}

export interface SurveyResponse {
  fieldId: string;
  value: string;
}

export interface SurveyRecord {
  id: string;
  responder: string;
  submittedAt: string;
  values: SurveyResponse[];
}

export type TechnicalDocCategory = '系统资料' | '密码资料' | '管理资料';

export interface TechnicalDocument {
  id: string;
  name: string;
  category: TechnicalDocCategory;
  size: number;
  uploadedAt: string;
  uploader: string;
}

export interface AnalysisSummary {
  id: string;
  basicInfo: string;
  cryptoStatus: string;
  lastUpdated: string;
  author: string;
}

export interface ToolRecord {
  id: string;
  name: string;
  model: string;
  purpose: string;
  calibrationStatus: '已校准' | '未校准';
  calibrationDate?: string;
  compliant: boolean;
  notes?: string;
  createdAt: string;
}

export type StandardFormType =
  | '现场测评授权书'
  | '风险告知书'
  | '文档交接单'
  | '会议记录表'
  | '会议签到表';

export interface StandardFormRecord {
  id: string;
  type: StandardFormType;
  status: '草稿' | '待签署' | '已签署';
  lastUpdated: string;
  evaluatorSigned: boolean;
  unitSigned: boolean;
  filledBy: string;
  dueDate?: string;
}

export interface OperationLog {
  id: string;
  timestamp: string;
  actor: string;
  module: string;
  action: string;
  details?: string;
}

export type AssessmentObjectType =
  | '机房'
  | '业务应用'
  | '主机/服务器'
  | '数据库'
  | '网络设备'
  | '密码产品'
  | '密码服务'
  | '人员'
  | '管理制度';

export interface AssessmentObject {
  id: string;
  type: AssessmentObjectType;
  area: string;
  name: string;
  usage: string;
  cryptoApplication: string;
}

export type AssetType = '业务应用' | '数据' | '设备';
export type ValueLevel = '高' | '中' | '低';
export type ThreatFrequency = '高' | '中' | '低';

export interface AssetThreatRecord {
  id: string;
  assetName: string;
  assetType: AssetType;
  valueLevel: ValueLevel;
  threatType: string;
  frequency: ThreatFrequency;
}

export interface AssessmentIndicator {
  id: string;
  source: '基础' | '特殊';
  code: string;
  content: string;
  applicable: boolean;
  reason?: string;
  substituteMeasure?: string;
  referenceStandard?: string;
}

export interface AssessmentCheckpoint {
  id: string;
  name: string;
  objectIds: string[];
  indicatorIds: string[];
  method: string;
  riskControl: string;
}

export interface ToolAccessPlan {
  id: string;
  accessPoint: string;
  toolType: string;
  purpose: string;
  method: string;
}

export interface UnitTestEntry {
  id: string;
  indicatorCode: string;
  objectName: string;
  description: string;
  method: string;
  expectedResult: string;
  layer: string;
}

export interface PlanReviewRecord {
  id: string;
  reviewer: string;
  status: '通过' | '修改后通过' | '不通过';
  comments: string;
  reviewedAt: string;
}

export interface MeetingRecord {
  id: string;
  meetingType: '首次会议' | '结束会议';
  time: string;
  location: string;
  participants: string[];
  summary: string;
  signed: boolean;
}

export interface ResourceConfirmation {
  id: string;
  contactName: string;
  role: string;
  phone: string;
  providedResources: string;
  backupConfirmed: boolean;
  evidence?: string;
  confirmedAt: string;
}

export interface PlanUpdateRecord {
  id: string;
  changeSummary: string;
  reason: string;
  updatedAt: string;
  confirmedByEvaluator: boolean;
  confirmedByUnit: boolean;
}

export interface AuthorizationRecord {
  id: string;
  formType: '现场测评授权书' | '风险告知书';
  signedByEvaluator: boolean;
  signedByUnit: boolean;
  signedAt: string;
}

export type AssessmentRecordType = '访谈' | '文档审查' | '实地察看' | '配置检查' | '工具测试';

export interface AssessmentRecord {
  id: string;
  recordType: AssessmentRecordType;
  objectName: string;
  indicatorCode: string;
  result: '符合' | '不符合' | '部分符合' | '不适用';
  basis: string;
  evidence?: string;
  details: string;
  recordedAt: string;
}

export interface ProductVerificationRecord {
  id: string;
  productName: string;
  certificateNo: string;
  verificationResult: '有效' | '失效' | '人工核验';
  remarks?: string;
  recordedAt: string;
}

export interface SupplementalAssessmentRecord {
  id: string;
  target: string;
  reason: string;
  performedAt: string;
  result: string;
}

export interface ReturnRecord {
  id: string;
  documentName: string;
  quantity: number;
  returnedAt: string;
  receiver: string;
  environmentRecovery: string;
  confirmedByUnit: boolean;
}

export interface UnitAssessmentResult {
  id: string;
  unitName: string;
  indicatorCode: string;
  objectResults: {
    objectName: string;
    result: '符合' | '不符合' | '部分符合' | '不适用';
  }[];
  finalResult: '符合' | '不符合' | '部分符合' | '不适用';
  basis: string;
}

export interface OverallAssessmentResult {
  id: string;
  layer: string;
  summary: string;
  updatedAt: string;
}

export interface ScoreCardEntry {
  id: string;
  name: string;
  level: '对象' | '单元' | '安全层面' | '整体';
  weight: number;
  score: number;
}

export interface RiskEntry {
  id: string;
  issue: string;
  threatType: string;
  frequency: ThreatFrequency;
  valueLevel: ValueLevel;
  possibility: ThreatFrequency;
  impact: ValueLevel;
  riskLevel: ValueLevel;
  description: string;
}

export interface ConclusionRecord {
  id: string;
  result: '符合' | '基本符合' | '不符合';
  score: number;
  highRiskExists: boolean;
  summary: string;
  confirmedBy: string;
  confirmedAt: string;
}

export interface ReportDraft {
  id: string;
  version: string;
  status: '编制中' | '评审中' | '已签发';
  createdAt: string;
  updatedAt: string;
}

export interface ReportReviewRecord {
  id: string;
  reviewer: string;
  comments: string;
  reviewedAt: string;
  status: '通过' | '修改后通过' | '不通过';
}

export interface SystemState {
  id: string;
  meta: SystemOverview;
  projectInfo: ProjectInfo | null;
  members: ProjectMember[];
  planSections: PlanSection[];
  planVersions: PlanVersion[];
  documents: DocumentRecord[];
  surveyFields: SurveyField[];
  surveyRecords: SurveyRecord[];
  technicalDocs: TechnicalDocument[];
  analysisSummary: AnalysisSummary | null;
  toolRecords: ToolRecord[];
  standardForms: StandardFormRecord[];
  assessmentObjects: AssessmentObject[];
  assetThreats: AssetThreatRecord[];
  indicators: AssessmentIndicator[];
  checkpoints: AssessmentCheckpoint[];
  toolAccessPlans: ToolAccessPlan[];
  unitTests: UnitTestEntry[];
  planReviews: PlanReviewRecord[];
  meetingRecords: MeetingRecord[];
  resourceConfirmations: ResourceConfirmation[];
  planUpdates: PlanUpdateRecord[];
  authorizationRecords: AuthorizationRecord[];
  assessmentRecords: AssessmentRecord[];
  productVerifications: ProductVerificationRecord[];
  supplementalAssessments: SupplementalAssessmentRecord[];
  returnRecords: ReturnRecord[];
  unitResults: UnitAssessmentResult[];
  overallResults: OverallAssessmentResult[];
  scoreCards: ScoreCardEntry[];
  riskEntries: RiskEntry[];
  conclusion: ConclusionRecord | null;
  reportDrafts: ReportDraft[];
  reportReviews: ReportReviewRecord[];
  logs: OperationLog[];
}

export interface ProjectState {
  systems: SystemState[];
  activeSystemId: string | null;
}

export interface ProjectContextValue {
  systems: SystemState[];
  activeSystemId: string | null;
  activeSystem: SystemState | null;
  refreshSystems: () => Promise<void>;
  addSystem: (meta: SystemMeta) => Promise<string>;
  updateSystemMeta: (systemId: string, updates: Partial<SystemMeta>) => void;
  removeSystem: (systemId: string) => Promise<void>;
  setActiveSystem: (systemId: string) => void;
  updateProjectInfo: (info: ProjectInfo, actor: string, systemId?: string) => Promise<void>;
  addMember: (member: Omit<ProjectMember, 'id' | 'createdAt'>, actor: string, systemId?: string) => void;
  removeMember: (memberId: string, actor: string, systemId?: string) => void;
  updatePlanSection: (sectionKey: string, content: string, actor: string, systemId?: string) => void;
  addPlanVersion: (version: PlanVersion, actor: string, systemId?: string) => void;
  registerDocument: (document: DocumentRecord, actor: string, systemId?: string) => void;
  addSurveyField: (field: Omit<SurveyField, 'id'>, actor: string, systemId?: string) => void;
  removeSurveyField: (fieldId: string, actor: string, systemId?: string) => void;
  saveSurveyRecord: (record: SurveyRecord, actor: string, systemId?: string) => void;
  addTechnicalDocument: (doc: TechnicalDocument, actor: string, systemId?: string) => void;
  setAnalysisSummary: (summary: AnalysisSummary, actor: string, systemId?: string) => void;
  addToolRecord: (record: Omit<ToolRecord, 'id' | 'createdAt'>, actor: string, systemId?: string) => void;
  removeToolRecord: (recordId: string, actor: string, systemId?: string) => void;
  addStandardForm: (form: Omit<StandardFormRecord, 'id' | 'lastUpdated'>, actor: string, systemId?: string) => void;
  updateStandardFormStatus: (formId: string, updates: Partial<StandardFormRecord>, actor: string, systemId?: string) => void;
  addAssessmentObject: (object: Omit<AssessmentObject, 'id'>, actor: string, systemId?: string) => void;
  addAssetThreat: (record: Omit<AssetThreatRecord, 'id'>, actor: string, systemId?: string) => void;
  addIndicator: (indicator: Omit<AssessmentIndicator, 'id'>, actor: string, systemId?: string) => void;
  updateIndicator: (indicatorId: string, updates: Partial<AssessmentIndicator>, actor: string, systemId?: string) => void;
  addCheckpoint: (checkpoint: Omit<AssessmentCheckpoint, 'id'>, actor: string, systemId?: string) => void;
  addToolAccessPlan: (plan: Omit<ToolAccessPlan, 'id'>, actor: string, systemId?: string) => void;
  addUnitTest: (unit: Omit<UnitTestEntry, 'id'>, actor: string, systemId?: string) => void;
  addPlanReview: (review: Omit<PlanReviewRecord, 'id' | 'reviewedAt'>, actor: string, systemId?: string) => void;
  addMeetingRecord: (record: Omit<MeetingRecord, 'id' | 'signed'> & { signed?: boolean }, actor: string, systemId?: string) => void;
  addResourceConfirmation: (record: Omit<ResourceConfirmation, 'id' | 'confirmedAt'>, actor: string, systemId?: string) => void;
  addPlanUpdate: (record: Omit<PlanUpdateRecord, 'id' | 'updatedAt'>, actor: string, systemId?: string) => void;
  addAuthorizationRecord: (record: Omit<AuthorizationRecord, 'id' | 'signedAt'>, actor: string, systemId?: string) => void;
  addAssessmentRecord: (record: Omit<AssessmentRecord, 'id' | 'recordedAt'>, actor: string, systemId?: string) => void;
  addProductVerification: (record: Omit<ProductVerificationRecord, 'id' | 'recordedAt'>, actor: string, systemId?: string) => void;
  addSupplementalAssessment: (record: Omit<SupplementalAssessmentRecord, 'id' | 'performedAt'>, actor: string, systemId?: string) => void;
  addReturnRecord: (record: Omit<ReturnRecord, 'id' | 'returnedAt'>, actor: string, systemId?: string) => void;
  addUnitResult: (result: Omit<UnitAssessmentResult, 'id'>, actor: string, systemId?: string) => void;
  addOverallResult: (result: Omit<OverallAssessmentResult, 'id' | 'updatedAt'>, actor: string, systemId?: string) => void;
  addScoreCard: (record: Omit<ScoreCardEntry, 'id'>, actor: string, systemId?: string) => void;
  addRiskEntry: (record: Omit<RiskEntry, 'id'>, actor: string, systemId?: string) => void;
  setConclusion: (record: Omit<ConclusionRecord, 'id' | 'confirmedAt'>, actor: string, systemId?: string) => void;
  addReportDraft: (draft: Omit<ReportDraft, 'id' | 'createdAt' | 'updatedAt'>, actor: string, systemId?: string) => void;
  updateReportDraft: (draftId: string, updates: Partial<ReportDraft>, actor: string, systemId?: string) => void;
  addReportReview: (review: Omit<ReportReviewRecord, 'id' | 'reviewedAt'>, actor: string, systemId?: string) => void;
}
