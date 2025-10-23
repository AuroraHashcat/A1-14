import { ProjectFormState } from './types';
import { SERVICE_SCOPE_NEEDS_COUNT } from './constants';

export const validateProjectForm = (form: ProjectFormState): string | null => {
  const measured = form.measuredSystem;

  if (measured.criticalInfrastructureStatus === '已认定' && !measured.criticalInfrastructureDepartment.trim()) {
    return '请填写所属安全保护工作部门。';
  }

  if (measured.gradingAssessmentStatus === '已测评') {
    if (!measured.gradingAssessmentAgency.trim()) {
      return '请填写测评机构名称。';
    }
    if (!measured.gradingAssessmentPeriod[0] || !measured.gradingAssessmentPeriod[1]) {
      return '请补充测评时间范围。';
    }
    if (!measured.gradingAssessmentConclusion.trim()) {
      return '请填写测评结论。';
    }
  }

  if (measured.gradingAssessmentStatus === '正在测评' && !measured.gradingAssessmentAgency.trim()) {
    return '请填写测评机构名称。';
  }

  const requiresScopeCount = SERVICE_SCOPE_NEEDS_COUNT.includes(measured.serviceScope);
  if (requiresScopeCount && !measured.serviceScopeCount.trim()) {
    return '请填写跨地区覆盖数量。';
  }

  if (measured.serviceDomains.length === 0) {
    return '请至少选择一个服务领域。';
  }

  if (measured.networkCoverage.length === 0) {
    return '请选择系统覆盖范围。';
  }

  if (!measured.userCount.trim()) {
    return '请填写系统服务用户数量。';
  }

  if (measured.interconnections.includes('其他') && !measured.interconnectionOther.trim()) {
    return '选择“其他”互联时需填写互联系统名称。';
  }

  if (measured.cloudDependent === '是' && !measured.cloudPlatformName.trim()) {
    return '请填写云平台名称。';
  }

  if (
    measured.cryptoPlanStatus === '有密码应用方案，且通过评审' &&
    (!measured.cryptoPlanApprovalTime || !measured.cryptoPlanEvaluationMethod)
  ) {
    return '请完善密码应用方案评审信息。';
  }

  if (
    measured.cryptoPlanStatus === '有密码应用方案，且通过评审' &&
    measured.cryptoPlanEvaluationMethod === '委托密评机构评估' &&
    !measured.cryptoPlanAgency.trim()
  ) {
    return '请填写密评机构名称。';
  }

  if (form.evaluationBasis.standards.length === 0) {
    return '请至少选择一个依据标准。';
  }

  if (form.evaluationBasis.references.length === 0) {
    return '请至少选择一个参考标准。';
  }

  if (form.previousAssessment.isFirstAssessment === '否') {
    if (!form.previousAssessment.lastAssessmentDate) {
      return '请填写上次评估时间。';
    }
    if (!form.previousAssessment.lastAssessmentAgency.trim()) {
      return '请填写上次评估的密评机构。';
    }
    if (!form.previousAssessment.conclusion) {
      return '请选择上次评估结论。';
    }
    if (!form.previousAssessment.score.trim()) {
      return '请填写上次评估综合得分。';
    }
  }

  const filledMembers = form.evaluationTeam.filter((member) =>
    member.name.trim() || member.role.trim() || member.responsibility.trim()
  );

  if (filledMembers.length === 0) {
    return '请至少填写一名测评项目组成员。';
  }

  for (const member of filledMembers) {
    if (!member.name.trim()) {
      return '测评项目组成员姓名不能为空。';
    }
    if (!member.role.trim()) {
      return '测评项目组成员角色不能为空。';
    }
    if (!member.responsibility.trim()) {
      return '请补充成员的职责说明。';
    }
  }

  return null;
};
