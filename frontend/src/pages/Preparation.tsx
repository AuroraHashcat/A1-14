import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { PageHeader } from '../components/PageHeader';
import { useProject } from '../context/ProjectContext';
import { MeasuredSystemSection } from '../features/preparation/components/MeasuredSystemSection';
import { EvaluationBasisSection } from '../features/preparation/components/EvaluationBasisSection';
import { EvaluationProcessSection } from '../features/preparation/components/EvaluationProcessSection';
import { EvaluationTeamSection } from '../features/preparation/components/EvaluationTeamSection';
import { PreviousAssessmentSection } from '../features/preparation/components/PreviousAssessmentSection';
import {
  buildProjectInfoPayload,
  convertProjectInfoToForm,
  createDefaultProjectForm
} from '../features/preparation/mappers';
import { ProjectFormState } from '../features/preparation/types';
import { validateProjectForm } from '../features/preparation/validation';

const actor = '演示账户';

export function PreparationPage() {
  const { activeSystem, updateProjectInfo } = useProject();

  const [projectForm, setProjectForm] = useState<ProjectFormState>(() => createDefaultProjectForm());
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeSystem) {
      setProjectForm(createDefaultProjectForm());
      return;
    }

    setProjectForm(convertProjectInfoToForm(activeSystem.projectInfo));
  }, [activeSystem]);

  const handleProjectFormChange = (updater: (prev: ProjectFormState) => ProjectFormState) => {
    setProjectForm((prev) => updater(prev));
  };

  const handleSaveDraft = async () => {
    if (!activeSystem) {
      notifications.show({ color: 'red', title: '暂存失败', message: '当前没有选中的测评系统。' });
      return;
    }

    const basePayload = buildProjectInfoPayload(projectForm, activeSystem.projectInfo);
    const now = dayjs().toISOString();
    const payload = {
      ...basePayload,
      preparationStatus: 'draft' as const,
      preparationStatusChangedAt: now,
      preparationStatusActor: actor,
      preparationSubmittedAt: activeSystem.projectInfo?.preparationSubmittedAt,
      preparationSubmittedBy: activeSystem.projectInfo?.preparationSubmittedBy
    };

    setSavingDraft(true);
    try {
      await updateProjectInfo(payload, actor, activeSystem.id);
      notifications.show({ color: 'teal', title: '已暂存草稿', message: '当前填写内容已保存为草稿。' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '暂存失败，请稍后重试。';
      notifications.show({ color: 'red', title: '暂存失败', message });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitPreparation = async () => {
    const validationMessage = validateProjectForm(projectForm);
    if (validationMessage) {
      notifications.show({ color: 'red', title: '提交失败', message: validationMessage });
      return;
    }

    if (!activeSystem) {
      notifications.show({ color: 'red', title: '提交失败', message: '当前没有选中的测评系统。' });
      return;
    }

    const basePayload = buildProjectInfoPayload(projectForm, activeSystem.projectInfo);
    const now = dayjs().toISOString();
    const payload = {
      ...basePayload,
      preparationStatus: 'submitted' as const,
      preparationStatusChangedAt: now,
      preparationStatusActor: actor,
      preparationSubmittedAt: now,
      preparationSubmittedBy: actor
    };

    setSubmitting(true);
    try {
      await updateProjectInfo(payload, actor, activeSystem.id);
      notifications.show({ color: 'teal', title: '提交成功', message: '准备阶段已完成，信息已提交。' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败，请稍后重试。';
      notifications.show({ color: 'red', title: '提交失败', message });
    } finally {
      setSubmitting(false);
    }
  };

  const statusInfo = useMemo(() => {
    if (!activeSystem?.projectInfo) {
      return {
        label: '当前为草稿状态，提交后才算完成准备阶段。',
        color: 'orange' as const
      };
    }
    const status = activeSystem.projectInfo.preparationStatus ?? 'draft';
    const changedAt = activeSystem.projectInfo.preparationStatusChangedAt;
    const formattedTime = changedAt ? dayjs(changedAt).format('YYYY-MM-DD HH:mm') : null;
    if (status === 'submitted') {
      const base = '准备阶段已完成，信息已提交。';
      return {
        label: formattedTime ? `${base} 提交时间：${formattedTime}` : base,
        color: 'teal' as const
      };
    }
    const base = '当前为草稿状态，提交后才算完成准备阶段。';
    return {
      label: formattedTime ? `${base} 最近暂存：${formattedTime}` : base,
      color: 'orange' as const
    };
  }, [activeSystem?.projectInfo]);

  if (!activeSystem) {
    return (
      <Stack gap="xl">
        <PageHeader title="测评准备" description="引导完成项目前期筹备工作，配置测评基础信息。" />
        <Card withBorder radius="lg" padding="xl" shadow="sm">
          <Stack gap="sm">
            <Text fw={600}>尚未选择测评系统</Text>
            <Text size="sm" c="dimmed">
              请先在系统管理中创建或选择一个测评系统，再回到此页面执行准备工作。
            </Text>
          </Stack>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <PageHeader
        title="测评准备"
        description="维护测评项目信息、被测系统情况与实施计划，确保准备阶段资料齐备。"
        actions={
          <Group gap="sm">
            <Button
              variant="default"
              loading={savingDraft}
              disabled={submitting}
              onClick={handleSaveDraft}
            >
              暂存
            </Button>
            <Button color="teal" loading={submitting} disabled={savingDraft} onClick={handleSubmitPreparation}>
              提交
            </Button>
          </Group>
        }
      />

      <Text size="sm" c={statusInfo.color}>
        {statusInfo.label}
      </Text>

      <Stack gap="xl">
        <MeasuredSystemSection projectForm={projectForm} onProjectFormChange={handleProjectFormChange} />

        <EvaluationBasisSection projectForm={projectForm} onProjectFormChange={handleProjectFormChange} />

        <EvaluationProcessSection projectForm={projectForm} onProjectFormChange={handleProjectFormChange} />

        <EvaluationTeamSection projectForm={projectForm} onProjectFormChange={handleProjectFormChange} />

        <PreviousAssessmentSection projectForm={projectForm} onProjectFormChange={handleProjectFormChange} />
      </Stack>
    </Stack>
  );
}
