import {
  Alert,
  Card,
  Grid,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title
} from '@mantine/core';
import { IconAlertCircle, IconBook, IconClipboardData, IconShieldCheck } from '@tabler/icons-react';
import { PageHeader } from '../components/PageHeader';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { StatsCard } from '../components/StatsCard';
import { useEvaluations } from '../hooks/useEvaluations';
import { useReports } from '../hooks/useReports';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime } from '../utils/date';

export function AdminPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErrorObj } = useDashboardStats();
  const { data: evaluations, isLoading: evaluationsLoading } = useEvaluations();
  const { data: reports, isLoading: reportsLoading } = useReports();

  return (
    <Stack gap="lg">
      <PageHeader
        title="管理驾驶舱"
        description="实时掌握评测开展情况、报告输出节奏与证据上传状态。"
      />

      {statsError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {statsErrorObj instanceof Error ? statsErrorObj.message : '统计数据加载失败'}
        </Alert>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatsCard
            icon={<IconClipboardData size={20} />}
            label="评测任务"
            value={statsLoading || !stats ? '--' : stats.totalEvaluations.toString()}
            footer={statsLoading || !stats ? undefined : `待处理 ${stats.pendingEvaluations} 个`}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatsCard
            icon={<IconShieldCheck size={20} />}
            label="评测报告"
            value={statsLoading || !stats ? '--' : stats.totalReports.toString()}
            footer="包含风险概述与处置建议"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatsCard
            icon={<IconBook size={20} />}
            label="证据文件"
            value={statsLoading || !stats ? '--' : stats.totalEvidences.toString()}
            footer="含自动解析进度"
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="lg" padding="lg" shadow="sm">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Title order={4}>最新评测任务</Title>
                {evaluationsLoading && <Loader size="sm" />}
              </Group>
              <Table highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>标题</Table.Th>
                    <Table.Th>状态</Table.Th>
                    <Table.Th>创建时间</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(evaluations ?? []).slice(0, 5).map((evaluation) => (
                    <Table.Tr key={evaluation.id}>
                      <Table.Td>
                        <Text fw={600}>{evaluation.title}</Text>
                        <Text size="xs" c="dimmed">
                          {evaluation.description || '暂无描述'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <StatusBadge status={evaluation.status} />
                      </Table.Td>
                      <Table.Td>{formatDateTime(evaluation.createdAt)}</Table.Td>
                    </Table.Tr>
                  ))}
                  {evaluations && evaluations.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <Text size="sm" c="dimmed" ta="center">
                          暂无评测任务。
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : null}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="lg" padding="lg" shadow="sm">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Title order={4}>最新评测报告</Title>
                {reportsLoading && <Loader size="sm" />}
              </Group>
              <Table highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>报告标题</Table.Th>
                    <Table.Th>评测任务</Table.Th>
                    <Table.Th>生成时间</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(reports ?? []).slice(0, 5).map((report) => (
                    <Table.Tr key={report.id}>
                      <Table.Td>
                        <Text fw={600}>{report.title}</Text>
                        <Text size="xs" c="dimmed">
                          {report.summary ? report.summary.slice(0, 60) : '暂无摘要'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>{report.evaluation.title}</Text>
                      </Table.Td>
                      <Table.Td>{formatDateTime(report.createdAt)}</Table.Td>
                    </Table.Tr>
                  ))}
                  {reports && reports.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <Text size="sm" c="dimmed" ta="center">
                          暂无生成的报告。
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : null}
                </Table.Tbody>
              </Table>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
