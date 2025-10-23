import { Card, Group, Select, SegmentedControl, Stack, Text, TextInput, ThemeIcon } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconReportSearch } from '@tabler/icons-react';
import { PREVIOUS_ASSESSMENT_CONCLUSION_OPTIONS } from '../constants';
import { ProjectFormState } from '../types';

interface PreviousAssessmentSectionProps {
  projectForm: ProjectFormState;
  onProjectFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void;
}

export function PreviousAssessmentSection({ projectForm, onProjectFormChange }: PreviousAssessmentSectionProps) {
  const previous = projectForm.previousAssessment;
  const isFirst = previous.isFirstAssessment === '是';

  const handleToggle = (value: string | null) => {
    const next = (value ?? previous.isFirstAssessment) as typeof previous.isFirstAssessment;
    onProjectFormChange((prev) => ({
      ...prev,
      previousAssessment:
        next === '是'
          ? {
              isFirstAssessment: '是',
              lastAssessmentDate: null,
              lastAssessmentAgency: '',
              conclusion: '',
              score: ''
            }
          : {
              ...prev.previousAssessment,
              isFirstAssessment: '否'
            }
    }));
  };

  return (
    <Card withBorder radius="lg" padding="xl" shadow="sm">
      <Stack gap="lg">
        <Group gap="sm">
          <ThemeIcon radius="xl" size={42} variant="light" color="grape">
            <IconReportSearch size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>前次测评情况</Text>
            <Text size="xs" c="dimmed">
              说明本系统是否已开展过密码应用安全性评估，并补充上次评估的关键信息。
            </Text>
          </Stack>
        </Group>

        <Stack gap="md">
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              是否为本系统第一次密码应用安全性评估
            </Text>
            <SegmentedControl
              data={[
                { label: '是', value: '是' },
                { label: '否', value: '否' }
              ]}
              value={previous.isFirstAssessment}
              onChange={handleToggle}
            />
          </Stack>

          {!isFirst ? (
            <Stack gap="md">
              <DatePickerInput
                label="上次评估时间"
                placeholder="请选择日期"
                value={previous.lastAssessmentDate}
                onChange={(value) =>
                  onProjectFormChange((prev) => ({
                    ...prev,
                    previousAssessment: {
                      ...prev.previousAssessment,
                      lastAssessmentDate: value
                    }
                  }))
                }
              />
              <TextInput
                label="密评机构"
                placeholder="请输入机构名称"
                value={previous.lastAssessmentAgency}
                onChange={(event) =>
                  onProjectFormChange((prev) => ({
                    ...prev,
                    previousAssessment: {
                      ...prev.previousAssessment,
                      lastAssessmentAgency: event.currentTarget.value
                    }
                  }))
                }
              />
              <Select
                label="评估结论"
                placeholder="请选择结论"
                data={PREVIOUS_ASSESSMENT_CONCLUSION_OPTIONS.map((item) => ({ label: item, value: item }))}
                value={previous.conclusion || null}
                onChange={(value) =>
                  onProjectFormChange((prev) => ({
                    ...prev,
                    previousAssessment: {
                      ...prev.previousAssessment,
                      conclusion: ((value ?? '') as typeof previous.conclusion)
                    }
                  }))
                }
              />
              <TextInput
                label="综合得分"
                placeholder="请输入分值"
                value={previous.score}
                inputMode="decimal"
                onChange={(event) =>
                  onProjectFormChange((prev) => ({
                    ...prev,
                    previousAssessment: {
                      ...prev.previousAssessment,
                      score: event.currentTarget.value.replace(/[^0-9.]/g, '')
                    }
                  }))
                }
              />
            </Stack>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}
