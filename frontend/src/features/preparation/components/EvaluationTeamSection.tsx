import { Card, Checkbox, ActionIcon, Button, Group, Stack, Table, Text, TextInput, ThemeIcon, Tooltip } from '@mantine/core';
import { IconPlus, IconTrash, IconUsersGroup } from '@tabler/icons-react';
import { ProjectFormState, EvaluationTeamMemberForm } from '../types';
import { createEmptyTeamMember } from '../mappers';

interface EvaluationTeamSectionProps {
  projectForm: ProjectFormState;
  onProjectFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void;
}

const columnLabels: Array<{ key: keyof EvaluationTeamMemberForm; label: string }> = [
  { key: 'name', label: '姓名' },
  { key: 'role', label: '角色' },
  { key: 'responsibility', label: '职责说明' }
];

export function EvaluationTeamSection({ projectForm, onProjectFormChange }: EvaluationTeamSectionProps) {
  const { evaluationTeam } = projectForm;

  const updateMember = <K extends keyof EvaluationTeamMemberForm>(id: string, field: K, value: EvaluationTeamMemberForm[K]) => {
    onProjectFormChange((prev) => ({
      ...prev,
      evaluationTeam: prev.evaluationTeam.map((member) =>
        member.id === id
          ? {
              ...member,
              [field]: value
            }
          : member
      )
    }));
  };

  const handleRemoveMember = (id: string) => {
    onProjectFormChange((prev) => {
      const next = prev.evaluationTeam.filter((member) => member.id !== id);
      return {
        ...prev,
        evaluationTeam: next.length ? next : [createEmptyTeamMember()]
      };
    });
  };

  const handleAddMember = () => {
    onProjectFormChange((prev) => ({
      ...prev,
      evaluationTeam: [...prev.evaluationTeam, createEmptyTeamMember()]
    }));
  };

  return (
    <Card withBorder radius="lg" padding="xl" shadow="sm">
      <Stack gap="lg">
        <Group gap="sm">
          <ThemeIcon radius="xl" size={42} variant="light" color="blue">
            <IconUsersGroup size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>测评项目组成员</Text>
            <Text size="xs" c="dimmed">
              记录项目组核心成员的信息与资质情况，确保团队配置清晰。
            </Text>
          </Stack>
        </Group>

        <Table withTableBorder withColumnBorders highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              {columnLabels.map((column) => (
                <Table.Th key={column.key}>{column.label}</Table.Th>
              ))}
              <Table.Th>胜任评估</Table.Th>
              <Table.Th style={{ width: '4rem' }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {evaluationTeam.map((member) => (
              <Table.Tr key={member.id}>
                <Table.Td>
                  <TextInput
                    placeholder="请输入姓名"
                    value={member.name}
                    onChange={(event) => updateMember(member.id, 'name', event.currentTarget.value)}
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    placeholder="请输入角色"
                    value={member.role}
                    onChange={(event) => updateMember(member.id, 'role', event.currentTarget.value)}
                  />
                </Table.Td>
                <Table.Td>
                  <TextInput
                    placeholder="简要说明职责与分工"
                    value={member.responsibility}
                    onChange={(event) => updateMember(member.id, 'responsibility', event.currentTarget.value)}
                  />
                </Table.Td>
                <Table.Td>
                  <Group justify="center">
                    <Checkbox
                      label="已通过"
                      checked={member.passedAssessment}
                      onChange={(event) => updateMember(member.id, 'passedAssessment', event.currentTarget.checked)}
                    />
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Tooltip label="移除该成员">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => handleRemoveMember(member.id)}
                      aria-label="移除成员"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Group justify="flex-end">
          <Button leftSection={<IconPlus size={16} />} onClick={handleAddMember} variant="light">
            添加成员
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
