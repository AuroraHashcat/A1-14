import { SystemState } from '../types/project';

const PHASES = [
  { key: 'preparation', weight: 1 },
  { key: 'upload', weight: 1 },
  { key: 'analysis', weight: 1 }
] as const;

export type PhaseKey = (typeof PHASES)[number]['key'];

interface Milestone {
  label: string;
  detail: string;
  completed: boolean;
}

export interface StageProgress {
  progress: number;
  milestones: Milestone[];
  summary: string;
}

export function calcProgress(milestones: Milestone[]): StageProgress {
  if (milestones.length === 0) {
    return { progress: 0, milestones, summary: '暂无里程碑。' };
  }
  const completedCount = milestones.filter((item) => item.completed).length;
  const progress = completedCount / milestones.length;
  const pending = milestones.find((item) => !item.completed);
  const summary = pending ? `待完成：${pending.label}` : '阶段已完成，等待下一阶段启动。';
  return { progress, milestones, summary };
}

export function buildStageProgress(system: SystemState): Record<PhaseKey, StageProgress> {
  const {
    projectInfo,
    unitResults,
    overallResults,
    scoreCards,
    riskEntries,
    conclusion,
    reportDrafts,
    reportReviews
  } = system;

  const preparationStatus = projectInfo?.preparationStatus;
  const preparationMilestones: Milestone[] = [
    {
      label: '准备信息已填写',
      detail: '完成测评准备信息的基础内容录入',
      completed: Boolean(projectInfo)
    },
    {
      label: '准备信息已暂存',
      detail: '点击暂存将当前信息保存为草稿',
      completed: preparationStatus === 'draft' || preparationStatus === 'submitted'
    },
    {
      label: '准备阶段已提交',
      detail: '确认提交，准备阶段正式完成',
      completed: preparationStatus === 'submitted'
    }
  ];

  const evidenceTotal = system.meta.evidenceTotal ?? 0;
  const evidenceParsed = system.meta.evidenceParsed ?? 0;

  const evidenceMilestones: Milestone[] = [
    {
      label: '上传证据文件',
      detail: '至少上传一份证据文件',
      completed: evidenceTotal > 0
    },
    {
      label: '证据解析推进',
      detail: `当前进度：${evidenceParsed}/${evidenceTotal} 已解析`,
      completed: evidenceTotal > 0 && evidenceParsed > 0
    },
    {
      label: '证据解析完成',
      detail: '所有证据均已完成解析',
      completed: evidenceTotal > 0 && evidenceParsed === evidenceTotal
    }
  ];

  const evidenceProgress: StageProgress = {
    progress: evidenceTotal === 0 ? 0 : evidenceParsed / evidenceTotal,
    milestones: evidenceMilestones,
    summary:
      evidenceTotal === 0
        ? '尚未上传证据文件。'
        : evidenceParsed === evidenceTotal
        ? '证据上传与解析已全部完成。'
        : `已解析 ${evidenceParsed}/${evidenceTotal}，解析任务进行中。`
  };

  const analysisMilestones: Milestone[] = [
    {
      label: '单元测评结果形成',
      detail: '生成单元测评结果并完成整体层面汇总',
      completed: unitResults.length > 0 && overallResults.length > 0
    },
    {
      label: '量化评估数据',
      detail: '录入量化得分并生成统计视图',
      completed: scoreCards.length > 0
    },
    {
      label: '风险分析记录',
      detail: '建立风险清单并给出风险等级',
      completed: riskEntries.length > 0
    },
    {
      label: '评估结论与报告',
      detail: '确认最终结论并创建报告版本/评审记录',
      completed: Boolean(conclusion) && reportDrafts.length > 0 && reportReviews.length > 0
    }
  ];

  return {
    preparation: calcProgress(preparationMilestones),
    upload: evidenceProgress,
    analysis: calcProgress(analysisMilestones)
  };
}

export function buildOverallProgress(stageProgress: Record<PhaseKey, StageProgress>): number {
  const totalWeight = PHASES.reduce((sum, phase) => sum + phase.weight, 0);
  const weighted = PHASES.reduce(
    (sum, phase) => sum + stageProgress[phase.key].progress * phase.weight,
    0
  );
  if (totalWeight === 0) {
    return 0;
  }
  return (weighted / totalWeight) * 100;
}
