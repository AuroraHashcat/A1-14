import { Card, Divider, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconTimelineEvent } from '@tabler/icons-react';
import { ProjectFormState, ProcessSectionKey } from '../types';

interface EvaluationProcessSectionProps {
  projectForm: ProjectFormState;
  onProjectFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void;
}

const stageMeta: Record<ProcessSectionKey, { title: string; description: string }> = {
  preparation: {
    title: '准备阶段',
    description: '确定项目启动相关准备事项，明确阶段开始与结束时间。'
  },
  schemeDesign: {
    title: '方案设计阶段',
    description: '编制并评审测评方案，锁定方案设计的时间范围。'
  },
  onsiteAssessment: {
    title: '现场测评阶段',
    description: '规划现场测试与取证的整体周期。'
  },
  analysisAndReport: {
    title: '分析与报告阶段',
    description: '安排分析复核与报告交付的时间窗口。'
  }
};

export function EvaluationProcessSection({ projectForm, onProjectFormChange }: EvaluationProcessSectionProps) {
  const { evaluationProcess } = projectForm;
  const orderedKeys: ProcessSectionKey[] = ['preparation', 'schemeDesign', 'onsiteAssessment', 'analysisAndReport'];

  return (
    <Card withBorder radius="lg" padding="xl" shadow="sm">
      <Stack gap="lg">
        <Group gap="sm">
          <ThemeIcon radius="xl" size={42} variant="light" color="blue">
            <IconTimelineEvent size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>测评实施计划</Text>
            <Text size="xs" c="dimmed">
              仅需填写四个阶段的起止日期，便于与整体项目时间同步。
            </Text>
          </Stack>
        </Group>

        <Stack gap="xl">
          {orderedKeys.map((key, index) => {
            const stage = evaluationProcess[key];
            if (!stage) {
              return null;
            }
            const meta = stageMeta[key];
            return (
              <Stack key={key} gap="md">
                <Group gap="sm">
                  <Text fw={600}>{meta?.title ?? key}</Text>
                  <Text size="xs" c="dimmed">
                    {meta?.description}
                  </Text>
                </Group>
                <DatePickerInput
                  type="range"
                  label="阶段时间安排"
                  placeholder="选择开始与结束日期"
                  value={stage.schedule}
                  onChange={(value) =>
                    onProjectFormChange((prev) => ({
                      ...prev,
                      evaluationProcess: {
                        ...prev.evaluationProcess,
                        [key]: {
                          ...prev.evaluationProcess[key],
                          schedule: Array.isArray(value) ? (value as typeof stage.schedule) : [null, null]
                        }
                      }
                    }))
                  }
                />
                {index < orderedKeys.length - 1 ? <Divider variant="dashed" /> : null}
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}
