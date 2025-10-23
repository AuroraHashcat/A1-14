import {
  CloudEvaluationStatus,
  CriticalInfrastructureStatus,
  CryptoPlanEvaluationMethod,
  CryptoPlanStatusOption,
  GradingAssessmentStatus,
  InterconnectionOption,
  ServiceDomainOption,
  ServiceObjectOption,
  ServiceScopeOption,
  AssessmentConclusionOption,
  StandardFormType,
  SurveyCategory
} from '../../types/project';
import { UsageOption } from './types';

export const CRITICAL_INFRASTRUCTURE_OPTIONS: Array<{ label: string; value: CriticalInfrastructureStatus }> = [
  { label: '已认定', value: '已认定' },
  { label: '未认定', value: '未认定' }
];

export const GRADING_ASSESSMENT_OPTIONS: Array<{ label: string; value: GradingAssessmentStatus }> = [
  { label: '已测评', value: '已测评' },
  { label: '正在测评', value: '正在测评' },
  { label: '未测评', value: '未测评' }
];

export const SERVICE_SCOPE_OPTIONS: Array<{ label: string; value: ServiceScopeOption }> = [
  { label: '全国', value: '全国' },
  { label: '跨省（区、市）', value: '跨省（区、市）' },
  { label: '跨地（市、区）', value: '跨地（市、区）' },
  { label: '地（市、区）内', value: '地（市、区）内' },
  { label: '其他', value: '其他' }
];

export const SERVICE_SCOPE_NEEDS_COUNT: ServiceScopeOption[] = ['跨省（区、市）', '跨地（市、区）'];

export const PREVIOUS_ASSESSMENT_CONCLUSION_OPTIONS: AssessmentConclusionOption[] = ['符合', '基本符合', '不符合'];

export const SERVICE_DOMAIN_OPTIONS: ServiceDomainOption[] = [
  '电信',
  '广电',
  '经营性公众互联网',
  '新闻',
  '海关',
  '税务',
  '国防科技工业',
  '公安',
  '财政',
  '人事劳动社会保障',
  '审计',
  '商业贸易',
  '国土资源',
  '能源',
  '交通',
  '统计',
  '工商行政管理',
  '邮政',
  '教育',
  '文化',
  '卫生',
  '农业',
  '水利',
  '外交',
  '宏观经济',
  '科技',
  '宣传',
  '质量监督检验检疫',
  '其他'
];

export const SERVICE_OBJECT_OPTIONS: Array<{ label: string; value: ServiceObjectOption }> = [
  { label: '单位内部人员', value: '单位内部人员' },
  { label: '公众用户', value: '公众用户' },
  { label: '行业监管部门', value: '行业监管部门' },
  { label: '合作伙伴', value: '合作伙伴' },
  { label: '其他', value: '其他' }
];

export const NETWORK_COVERAGE_OPTIONS: string[] = ['局域网', '互联网'];

export const INTERCONNECTION_OPTIONS: InterconnectionOption[] = [
  '与本行业其他单位系统连接',
  '与其他行业系统连接',
  '与本地其他系统连接',
  '其他'
];

export const CLOUD_EVALUATION_STATUS_OPTIONS: CloudEvaluationStatus[] = [
  '云平台已评估',
  '云平台正在评估',
  '云平台未评估'
];

export const CRYPTO_PLAN_STATUS_OPTIONS: CryptoPlanStatusOption[] = [
  '有密码应用方案，且通过评审',
  '有密码应用方案，但未通过评审',
  '无密码应用方案'
];

export const CRYPTO_PLAN_METHOD_OPTIONS: CryptoPlanEvaluationMethod[] = ['自行评估', '委托密评机构评估'];

export const CRYPTO_PRODUCT_USAGE_OPTIONS: Array<{ label: string; value: UsageOption }> = [
  { label: '使用', value: '使用' },
  { label: '未使用', value: '未使用' }
];

export const BLOCK_ALGORITHM_OPTIONS: string[] = ['SM4', 'DES', '3DES', 'AES', '其他'];
export const ASYMMETRIC_ALGORITHM_OPTIONS: string[] = ['SM2', 'RSA', 'ECC', 'DSA', '其他'];
export const HASH_ALGORITHM_OPTIONS: string[] = ['SM3', 'SHA-1', 'SHA-2', 'SHA-3', 'MD5', '其他'];
export const STREAM_ALGORITHM_OPTIONS: string[] = ['ZUC', 'RC4', '其他'];

export const DEFAULT_BASIS_STANDARDS: string[] = [
  '《中华人民共和国密码法》',
  'GM/T 0035-2014 信息系统密码应用基本要求',
  'GB/T 39786-2021 信息安全技术 网络安全等级保护测评要求'
];

export const DEFAULT_REFERENCE_STANDARDS: string[] = [
  'GM/T 0051-2020 密码检测规范',
  'GB/T 35273-2020 信息安全技术 个人信息安全规范',
  '《信息系统密码应用检测评估工作指南》'
];

export const DEFAULT_PREPARATION_WORK_CONTENT =
  '沟通测评需求，明确工作范围与目标，收集系统基础资料并完成工具准备。';
export const DEFAULT_PREPARATION_DELIVERABLES = '调查表、准备阶段会议纪要、工具清单。';
export const DEFAULT_SCHEME_WORK_CONTENT = '编制并评审测评方案，形成实施计划与资源安排。';
export const DEFAULT_ONSITE_WORK_CONTENT = '执行现场测评、访谈与证据收集，记录问题和风险。';
export const DEFAULT_ANALYSIS_WORK_CONTENT = '整理证据，开展量化分析，形成密评报告与整改建议。';

export const SURVEY_CATEGORY_OPTIONS: Array<{ label: string; value: SurveyCategory }> = [
  { label: '基本信息', value: '基本信息' },
  { label: '密码应用', value: '密码应用' },
  { label: '软硬件部署', value: '软硬件部署' },
  { label: '业务信息', value: '业务信息' }
];

export const STANDARD_FORM_OPTIONS: Array<{ label: string; value: StandardFormType }> = [
  { label: '现场测评授权书', value: '现场测评授权书' },
  { label: '风险告知书', value: '风险告知书' },
  { label: '文档交接单', value: '文档交接单' },
  { label: '会议记录表', value: '会议记录表' },
  { label: '会议签到表', value: '会议签到表' }
];
