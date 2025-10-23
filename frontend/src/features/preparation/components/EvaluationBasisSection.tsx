import { Card, Divider, Group, Stack, TagsInput, Text, ThemeIcon } from '@mantine/core';
import { IconBooks } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { DEFAULT_BASIS_STANDARDS, DEFAULT_REFERENCE_STANDARDS } from '../constants';
import { ProjectFormState } from '../types';

interface EvaluationBasisSectionProps {
  projectForm: ProjectFormState;
  onProjectFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void;
}

export function EvaluationBasisSection({ projectForm, onProjectFormChange }: EvaluationBasisSectionProps) {
  const [customBasisOptions, setCustomBasisOptions] = useState<string[]>([]);
  const [customReferenceOptions, setCustomReferenceOptions] = useState<string[]>([]);

  const basisOptions = useMemo(() => {
    const merged = new Set([...DEFAULT_BASIS_STANDARDS, ...customBasisOptions, ...projectForm.evaluationBasis.standards]);
    return Array.from(merged).map((value) => ({ value, label: value }));
  }, [customBasisOptions, projectForm.evaluationBasis.standards]);

  const referenceOptions = useMemo(() => {
    const merged = new Set([
      ...DEFAULT_REFERENCE_STANDARDS,
      ...customReferenceOptions,
      ...projectForm.evaluationBasis.references
    ]);
    return Array.from(merged).map((value) => ({ value, label: value }));
  }, [customReferenceOptions, projectForm.evaluationBasis.references]);

  return (
    <Card withBorder radius="lg" padding="xl" shadow="sm">
      <Stack gap="lg">
        <Group gap="sm">
          <ThemeIcon radius="xl" size={42} variant="light" color="indigo">
            <IconBooks size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>测评依据</Text>
            <Text size="xs" c="dimmed">
              维护测评方案引用的标准依据与参考资料，可按需补充自定义条目。
            </Text>
          </Stack>
        </Group>

        <Stack gap="xl">
          <Stack gap="sm">
            <Text fw={600}>依据标准</Text>
            <TagsInput
              value={projectForm.evaluationBasis.standards}
              data={basisOptions}
              splitChars={[',', ';', '；', '、']}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  evaluationBasis: {
                    ...prev.evaluationBasis,
                    standards: value
                  }
                }))
              }
              onOptionSubmit={(option) => {
                setCustomBasisOptions((prev) => [...prev, option]);
                return option;
              }}
              placeholder="输入或选择依据标准，使用逗号分隔"
              clearable
            />
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>参考资料</Text>
            <TagsInput
              value={projectForm.evaluationBasis.references}
              data={referenceOptions}
              splitChars={[',', ';', '；', '、']}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  evaluationBasis: {
                    ...prev.evaluationBasis,
                    references: value
                  }
                }))
              }
              onOptionSubmit={(option) => {
                setCustomReferenceOptions((prev) => [...prev, option]);
                return option;
              }}
              placeholder="输入或选择参考资料，使用逗号分隔"
              clearable
            />
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
