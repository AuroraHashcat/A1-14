import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  List,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import {
  IconAlertCircle,
  IconCloudUpload,
  IconEye,
  IconFileCheck,
  IconTrash,
  IconUpload,
  IconX
} from '@tabler/icons-react';
import { PageHeader } from '../components/PageHeader';
import { deleteEvidence, fetchEvidenceDetail, uploadEvidence } from '../api/evidences';
import { notifications } from '@mantine/notifications';
import { useProject } from '../context/ProjectContext';
import { useEvidences } from '../hooks/useEvidences';
import { EvidenceDetail } from '../types/api';

interface PendingFile {
  id: string;
  file: File;
  status: 'ready' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function UploadPage() {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const { activeSystem, refreshSystems } = useProject();
  const [uploading, setUploading] = useState(false);
  const systemId = activeSystem?.id;
  const {
    data: evidences,
    isLoading: evidencesLoading,
    refetch: refetchEvidences
  } = useEvidences(systemId ? { systemId } : undefined);

  const handleDrop = (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map<PendingFile>((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      file,
      status: 'ready'
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const handleUpload = async () => {
    if (!activeSystem || !systemId) {
      notifications.show({ color: 'blue', title: '提示', message: '请先选择一个系统。' });
      return;
    }
    if (files.length === 0) {
      notifications.show({ color: 'yellow', title: '提示', message: '请选择至少一个文件' });
      return;
    }

    setUploading(true);
    const updated: PendingFile[] = [];

    for (const fileItem of files) {
      updated.push({ ...fileItem, status: 'uploading' });
      setFiles([...updated, ...files.slice(updated.length)]);
      try {
        await uploadEvidence(systemId, fileItem.file);
        updated[updated.length - 1] = { ...fileItem, status: 'success' };
      } catch (error) {
        updated[updated.length - 1] = {
          ...fileItem,
          status: 'error',
          error: error instanceof Error ? error.message : '上传失败'
        };
      }
      setFiles([...updated, ...files.slice(updated.length)]);
    }

  notifications.show({ color: 'green', title: '上传完成', message: '系统将自动解析证据内容。' });
  setUploading(false);
  refetchEvidences();
  refreshSystems().catch(() => null);
  };

  const successCount = useMemo(() => files.filter((file) => file.status === 'success').length, [files]);
  const [detailModalOpened, setDetailModalOpened] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<EvidenceDetail | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<number | null>(null);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  const closeDetailModal = () => {
    setDetailModalOpened(false);
    setDetailData(null);
    setSelectedEvidenceId(null);
  };

  const handleViewEvidence = async (evidenceId: number) => {
    setSelectedEvidenceId(evidenceId);
    setDetailModalOpened(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const detail = await fetchEvidenceDetail(evidenceId);
      setDetailData(detail);
    } catch (error) {
      notifications.show({
        color: 'red',
        title: '加载失败',
        message: error instanceof Error ? error.message : '无法获取证据信息。'
      });
      closeDetailModal();
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    if (!window.confirm('删除后不可恢复，确认删除该证据吗？')) {
      return;
    }

    setDeletingIds((prev) => [...prev, evidenceId]);
    try {
      await deleteEvidence(evidenceId);
      notifications.show({ color: 'green', title: '已删除', message: '证据文件已删除。' });
      if (selectedEvidenceId === evidenceId) {
        closeDetailModal();
      }
      refetchEvidences();
      refreshSystems().catch(() => null);
    } catch (error) {
      notifications.show({
        color: 'red',
        title: '删除失败',
        message: error instanceof Error ? error.message : '请稍后再试。'
      });
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== evidenceId));
    }
  };

  const summaryPreview = useMemo(() => {
    if (!detailData?.summary) {
      return null;
    }
    return detailData.summary;
  }, [detailData?.summary]);

  const rawTextPreview = useMemo(() => {
    if (!detailData?.extractedText) {
      return null;
    }
    const limit = 4000;
    if (detailData.extractedText.length > limit) {
      return `${detailData.extractedText.slice(0, limit)}\n\n…… (内容已截断，查看原文件以获取全部内容。)`;
    }
    return detailData.extractedText;
  }, [detailData?.extractedText]);

  const metadataPreview = useMemo(() => {
    if (!detailData?.metadata) {
      return null;
    }
    try {
      return JSON.stringify(detailData.metadata, null, 2);
    } catch (error) {
      return String(detailData.metadata);
    }
  }, [detailData?.metadata]);

  const isDeleting = (id: number) => deletingIds.includes(id);

  return (
    <Stack gap="lg">
      <PageHeader title="上传系统证据" description="为当前系统集中管理全部证据文件，并自动触发内容解析。" />

      {!activeSystem ? (
        <Alert color="blue" radius="md" icon={<IconAlertCircle size={16} />}>
          请先在系统管理页选择或创建系统，再进行证据上传。
        </Alert>
      ) : null}

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Stack gap="md">
          <Title order={4}>上传证据文件</Title>
          <Dropzone
            onDrop={handleDrop}
            accept={[MIME_TYPES.pdf, MIME_TYPES.docx, MIME_TYPES.doc, MIME_TYPES.png, MIME_TYPES.jpeg, MIME_TYPES.zip]}
            maxSize={16 * 1024 * 1024}
            multiple
          >
            <Group justify="center" gap="xl" style={{ pointerEvents: 'none', minHeight: 180 }}>
              <Dropzone.Accept>
                <IconUpload size={40} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={40} color="red" />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconCloudUpload size={40} />
              </Dropzone.Idle>
              <div>
                <Title order={4}>拖拽文件到此处，或点击选择</Title>
                <Text size="sm" c="dimmed">
                  支持 PDF、Word、图片等格式，单个文件不超过 16MB。
                </Text>
              </div>
            </Group>
          </Dropzone>

          <Stack gap="sm">
            {files.map((file) => (
              <Card key={file.id} padding="md" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>{file.file.name}</Text>
                    <Text size="xs" c="dimmed">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </div>
                  <Group gap="xs">
                    <Badge color={file.status === 'success' ? 'green' : file.status === 'error' ? 'red' : 'gray'} variant="light">
                      {file.status === 'success'
                        ? '上传成功'
                        : file.status === 'error'
                        ? '上传失败'
                        : file.status === 'uploading'
                        ? '上传中'
                        : '待上传'}
                    </Badge>
                    {file.status === 'error' && file.error ? (
                      <Text size="xs" c="red">
                        {file.error}
                      </Text>
                    ) : null}
                    {file.status === 'ready' ? (
                      <Button variant="subtle" size="xs" color="red" onClick={() => removeFile(file.id)}>
                        移除
                      </Button>
                    ) : null}
                  </Group>
                </Group>
              </Card>
            ))}
            {files.length === 0 ? (
              <Text size="sm" c="dimmed">
                尚未选择任何文件。
              </Text>
            ) : null}
          </Stack>

          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              成功上传 {successCount} 个文件。
            </Text>
            <Button onClick={handleUpload} loading={uploading} leftSection={<IconFileCheck size={18} />}>
              开始上传
            </Button>
          </Group>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Stack gap="sm">
          <Title order={4}>当前系统证据</Title>
          {evidencesLoading ? (
            <Group justify="center" py="lg">
              <Loader size="sm" />
            </Group>
          ) : evidences && evidences.length > 0 ? (
            <Stack gap="sm">
              {evidences.map((item) => (
                <Card key={item.id} radius="md" withBorder padding="md">
                  <Group justify="space-between" align="center">
                    <div>
                      <Text fw={600}>{item.filename}</Text>
                      <Text size="xs" c="dimmed">
                        上传时间：{new Date(item.createdAt).toLocaleString()} · 大小：{(item.fileSize / 1024).toFixed(1)} KB
                      </Text>
                    </div>
                    <Badge color={item.hasExtractedText ? 'green' : 'gray'} variant="light">
                      {item.hasExtractedText ? '已解析' : '待解析'}
                    </Badge>
                    <Group gap="xs">
                      <Button
                        variant="subtle"
                        size="xs"
                        leftSection={<IconEye size={14} />}
                        onClick={() => handleViewEvidence(item.id)}
                        loading={detailLoading && selectedEvidenceId === item.id}
                      >
                        查看
                      </Button>
                      <Button
                        variant="light"
                        size="xs"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDeleteEvidence(item.id)}
                        loading={isDeleting(item.id)}
                      >
                        删除
                      </Button>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              当前系统尚未上传任何证据。
            </Text>
          )}
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Stack gap="sm">
          <Title order={4}>操作提示</Title>
          <List spacing="xs" size="sm">
            <List.Item icon={<IconAlertCircle size={16} />}>
              上传后系统会自动提取文本内容，解析完成状态会在列表中更新。
            </List.Item>
            <List.Item icon={<IconAlertCircle size={16} />}>
              建议按证据类型进行批量上传，便于后续检索与比对。
            </List.Item>
          </List>
        </Stack>
      </Card>
      <Modal opened={detailModalOpened} onClose={closeDetailModal} title="证据详情" size="lg" centered>
        {detailLoading ? (
          <Group justify="center" py="md">
            <Loader size="sm" />
          </Group>
        ) : detailData ? (
          <Stack gap="md">
            <div>
              <Text fw={600}>{detailData.filename}</Text>
              <Text size="sm" c="dimmed">
                上传时间：{new Date(detailData.createdAt).toLocaleString()} · 类型：{detailData.fileType} · 大小：
                {(detailData.fileSize / 1024).toFixed(1)} KB
              </Text>
            </div>

            <Divider label="关键信息总结" labelPosition="center" />
            {detailData.hasExtractedText && summaryPreview ? (
              <ScrollArea.Autosize mah={220} type="never">
                <pre style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{summaryPreview}</pre>
              </ScrollArea.Autosize>
            ) : (
              <Text size="sm" c="dimmed">
                暂无总结，请稍后再试。
              </Text>
            )}

            <Divider label="证据原文摘录" labelPosition="center" />
            {detailData.hasExtractedText && rawTextPreview ? (
              <ScrollArea.Autosize mah={280} type="never">
                <pre style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{rawTextPreview}</pre>
              </ScrollArea.Autosize>
            ) : (
              <Text size="sm" c="dimmed">
                尚未获取到证据文本。
              </Text>
            )}

            {metadataPreview ? (
              <>
                <Divider label="文件元数据" labelPosition="center" />
                <ScrollArea.Autosize mah={200} type="never">
                  <pre style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{metadataPreview}</pre>
                </ScrollArea.Autosize>
              </>
            ) : null}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            未能加载证据信息，请稍后再试。
          </Text>
        )}
      </Modal>
    </Stack>
  );
}
