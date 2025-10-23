import {
  Accordion,
  ActionIcon,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Tooltip
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconDownload, IconTrash, IconUserPlus, IconUsersGroup } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { PlanSection, ProjectMember } from '../../../types/project';
import { ProjectFormState } from '../types';

interface ProjectInitiationSectionProps {
  projectForm: ProjectFormState;
  onProjectFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void;
  members: ProjectMember[];
  onRemoveMember: (memberId: string) => void;
  openMemberModal: () => void;
  planSections: PlanSection[];
  planDraft: Record<string, string>;
  onPlanDraftChange: (key: string, value: string) => void;
  onSavePlanSection: (key: string) => void;
  planExport: { version: string; format: string; watermark: string };
  onPlanExportChange: (field: 'version' | 'format' | 'watermark', value: string) => void;
  onExportPlan: () => void;
  onSubmitProjectInfo: () => void;
}

export function ProjectInitiationSection({
  projectForm,
  onProjectFormChange,
  members,
  onRemoveMember,
  openMemberModal,
  planSections,
  planDraft,
  onPlanDraftChange,
  onSavePlanSection,
  planExport,
  onPlanExportChange,
  onExportPlan,
  onSubmitProjectInfo
}: ProjectInitiationSectionProps) {
  return (
    <Card withBorder radius="lg" padding="xl" shadow="sm">
      <Stack gap="lg">
        <Group gap="sm">
          <ThemeIcon radius="xl" size={42} variant="light" color="violet">
            <IconUsersGroup size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>项目启动</Text>
            <Text size="xs" c="dimmed">
              维护委托信息与测评项目组，保持计划书章节更新。
            </Text>
          </Stack>
        </Group>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="sm">
              <Text fw={600}>委托信息</Text>
              <TextInput
                label="委托测评协议书编号"
                placeholder="例如：MP-2025-001"
                value={projectForm.contractNo}
                onChange={(event) =>
                  onProjectFormChange((prev) => ({ ...prev, contractNo: event.currentTarget.value }))
                }
              />
              <TextInput
                label="被测单位名称"
                placeholder="XX 集团信息中心"
                value={projectForm.organization}
                onChange={(event) =>
                  onProjectFormChange((prev) => ({ ...prev, organization: event.currentTarget.value }))
                }
              />
              <TextInput
                label="被测信息系统名称"
                placeholder="核心运营支撑系统"
                value={projectForm.systemName}
                onChange={(event) =>
                  onProjectFormChange((prev) => ({ ...prev, systemName: event.currentTarget.value }))
                }
              />
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="网络安全保护等级"
                    data={['二级', '三级', '四级', '关基系统']}
                    value={projectForm.systemLevel}
                    onChange={(value) =>
                      onProjectFormChange((prev) => ({ ...prev, systemLevel: value || prev.systemLevel }))
                    }
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="系统规模"
                    placeholder="例如：3 个业务地区，1200 终端"
                    value={projectForm.systemScale}
                    onChange={(event) =>
                      onProjectFormChange((prev) => ({ ...prev, systemScale: event.currentTarget.value }))
                    }
                  />
                </Grid.Col>
              </Grid>
              <DatePickerInput
                type="range"
                label="测评周期"
                placeholder="选择开始与结束日期"
                value={projectForm.period}
                onChange={(value) =>
                  onProjectFormChange((prev) => ({
                    ...prev,
                    period: Array.isArray(value) ? (value as [Date | null, Date | null]) : [null, null]
                  }))
                }
              />
              <Button onClick={onSubmitProjectInfo}>保存项目基础信息</Button>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Text fw={600}>测评项目组</Text>
                <Button leftSection={<IconUserPlus size={16} />} variant="light" onClick={openMemberModal}>
                  添加成员
                </Button>
              </Group>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>姓名</Table.Th>
                    <Table.Th>岗位</Table.Th>
                    <Table.Th>联系方式</Table.Th>
                    <Table.Th>权限</Table.Th>
                    <Table.Th style={{ width: 80 }}>操作</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {members.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text c="dimmed" size="sm" ta="center">
                          暂无成员，请添加项目组成员。
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    members.map((member) => (
                      <Table.Tr key={member.id}>
                        <Table.Td>{member.name}</Table.Td>
                        <Table.Td>{member.role}</Table.Td>
                        <Table.Td>{member.contact}</Table.Td>
                        <Table.Td>
                          <Stack gap={2}>
                            {member.permissions.approvePlan ? <Text size="xs">计划书审批</Text> : null}
                            {member.permissions.manageDocuments ? <Text size="xs">文档管理</Text> : null}
                            {member.permissions.viewSensitive ? <Text size="xs">查看敏感信息</Text> : null}
                          </Stack>
                        </Table.Td>
                        <Table.Td>
                          <Tooltip label="移除">
                            <ActionIcon color="red" variant="subtle" onClick={() => onRemoveMember(member.id)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Stack>
          </Grid.Col>
        </Grid>

        <Divider variant="dashed" />

        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600}>项目计划书模板</Text>
            <Group>
              <TextInput
                label="版本号"
                value={planExport.version}
                onChange={(event) => onPlanExportChange('version', event.currentTarget.value)}
              />
              <Select
                label="导出格式"
                data={['PDF', 'Word']}
                value={planExport.format}
                onChange={(value) => onPlanExportChange('format', value || 'PDF')}
              />
              <TextInput
                label="水印"
                value={planExport.watermark}
                onChange={(event) => onPlanExportChange('watermark', event.currentTarget.value)}
              />
              <Button leftSection={<IconDownload size={16} />} variant="gradient" onClick={onExportPlan}>
                导出计划书
              </Button>
            </Group>
          </Group>

          <Accordion variant="separated" chevronPosition="right">
            {planSections.map((section) => (
              <Accordion.Item value={section.key} key={section.key}>
                <Accordion.Control>{section.title}</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap="sm">
                    <Textarea
                      minRows={6}
                      value={planDraft[section.key] ?? ''}
                      onChange={(event) => onPlanDraftChange(section.key, event.currentTarget.value)}
                    />
                    <Group justify="space-between" align="center">
                      <Text size="xs" c="dimmed">
                        最近更新：{dayjs(section.lastUpdated).format('YYYY-MM-DD HH:mm')}
                      </Text>
                      <Button onClick={() => onSavePlanSection(section.key)} size="xs" variant="light">
                        保存章节
                      </Button>
                    </Group>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Stack>
      </Stack>
    </Card>
  );
}
