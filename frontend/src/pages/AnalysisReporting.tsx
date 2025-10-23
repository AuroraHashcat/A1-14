import { useState, useEffect } from 'react';
import {
  ActionIcon,
  Button,
  Card,
  Code,
  CopyButton,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  Title
} from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IconCheck, IconCopy, IconDownload, IconFileText } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

import { PageHeader } from '../components/PageHeader';
import { useProject } from '../context/ProjectContext';
import {
  generateSystemReport,
  fetchReportDetail,
  fetchLatestSystemReport,
  exportReportDocx
} from '../api/reports';
import { triggerFileDownload } from '../utils/download';
import type { GeneratedReport } from '../types/api';

export function AnalysisReportingPage() {
  const { activeSystem, updateSystemMeta } = useProject();
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const systemId = activeSystem?.id ?? null;
  const systemName = activeSystem?.meta?.name ?? '';

  const handleGenerate = async () => {
    if (!activeSystem) {
      notifications.show({ color: 'blue', title: '提示', message: '请先选择一个系统。' });
      return;
    }

    setLoading(true);
    try {
      const result = await generateSystemReport(activeSystem.id);

      // If backend returned a saved report id, fetch full report details
      let fullContent = result.content;
      if (result.reportId && !fullContent) {
        try {
          const detail = await fetchReportDetail(result.reportId as number);
          fullContent = detail.content || fullContent;
        } catch (err) {
          // ignore fetch detail errors and proceed with whatever content we have
        }
      }

      setReport({ ...result, content: fullContent });
      if (systemId) {
        updateSystemMeta(systemId, { reportProgress: 1 });
      }
      notifications.show({ color: 'teal', title: '报告生成成功', message: '已基于最新数据生成自动化报告。' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '报告生成失败，请稍后再试。';
      notifications.show({ color: 'red', title: '生成失败', message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    if (!report?.reportId) {
      notifications.show({ color: 'blue', title: '提示', message: '当前报告尚未保存，无法导出。' });
      return;
    }

    setExporting(true);
    try {
      const { blob, filename } = await exportReportDocx(report.reportId);
      triggerFileDownload(blob, filename);
      notifications.show({ color: 'teal', title: '导出成功', message: '报告已保存为 Word 文档。' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '导出失败，请稍后重试。';
      notifications.show({ color: 'red', title: '导出失败', message });
    } finally {
      setExporting(false);
    }
  };

  // 在加载或系统切换时尝试获取该系统最新已生成的报告
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!systemId) {
        setReport(null);
        return;
      }
      const latest = await fetchLatestSystemReport(systemId);
      if (!mounted) return;
      if (latest) {
        setReport({
          reportId: latest.id,
          systemId,
          systemName,
          generatedAt: latest.createdAt,
          content: latest.content || '',
          score: latest.score ?? undefined,
          sourceData: {},
        } as unknown as GeneratedReport);
        updateSystemMeta(systemId, { reportProgress: 1 });
      } else {
        setReport(null);
        updateSystemMeta(systemId, { reportProgress: 0 });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [systemId, systemName, updateSystemMeta]);

  if (!activeSystem) {
    return (
      <Stack gap="xl">
        <PageHeader
          title="分析与报告"
          description="请先选择一个系统，系统选择后可生成自动化报告。"
        />
        <Card withBorder radius="lg" padding="xl" shadow="sm">
          <Text size="sm" c="dimmed">
            未找到激活的测评系统，请在系统管理中选择或创建后再试。
          </Text>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack gap="xl">
      <PageHeader
        title="分析与报告"
        description="一键整合测评准备与证据解析结果，生成密评报告初稿。"
      />

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={5}>自动化报告生成</Title>
            <Button
              leftSection={loading ? <Loader size="xs" /> : <IconFileText size={16} />}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? '正在生成…' : report ? '重新生成报告' : '生成报告'}
            </Button>
          </Group>
          <Text size="sm" c="dimmed">
            系统将汇总“测评准备”中的表单数据与已解析证据内容，由大模型输出报告。
          </Text>
        </Stack>
      </Card>

      {report ? (
        <Stack gap="lg">
          <Card withBorder radius="lg" padding="xl" shadow="sm">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <div>
                  <Title order={4}>生成的报告</Title>
                  <Text size="sm" c="dimmed">
                    {report.systemName} · {new Date(report.generatedAt).toLocaleString()}
                  </Text>
                </div>
                <Group>
                  {report.score !== undefined && report.score !== null ? (
                    <div style={{ textAlign: 'right', marginRight: 8 }}>
                      <Text fw={700} size="xl">{Math.round(report.score)}</Text>
                      <Text size="xs" c="dimmed">评测得分</Text>
                    </div>
                  ) : null}
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={exporting ? <Loader size="xs" /> : <IconDownload size={16} />}
                    onClick={handleExportReport}
                    disabled={!report?.reportId || exporting}
                  >
                    导出 Word
                  </Button>
                  <CopyButton value={report.content} timeout={2000}>
                    {({ copied, copy }) => (
                      <ActionIcon variant="light" color={copied ? 'teal' : 'blue'} onClick={copy}>
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    )}
                  </CopyButton>
                </Group>
              </Group>
              <Text size="sm" c="dimmed">报告内容</Text>
              <div style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.content || ''}</ReactMarkdown>
              </div>
            </Stack>
          </Card>

          {/* 原始数据展示已移除：不再在前端显示用于生成报告的 sourceData */}
        </Stack>
      ) : null}
    </Stack>
  );
}
