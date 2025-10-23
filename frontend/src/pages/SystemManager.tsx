import React, { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Group,
  Modal,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
  LoadingOverlay
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { buildStageProgress, buildOverallProgress } from '../utils/progress';
import { notifications } from '@mantine/notifications';

export default function SystemManagerPage() {
  const { systems, addSystem, removeSystem, setActiveSystem, refreshSystems } = useProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    refreshSystems().catch((error) => {
      console.warn('Failed to refresh systems on manager page', error);
    }).finally(() => {
      setInitialLoading(false);
    });
  }, [refreshSystems]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const systemId = await addSystem({ name: trimmed });
      await refreshSystems();
      notifications.show({ color: 'teal', title: '系统已创建', message: '新测评系统已添加，可立即进入流程。' });
      setName('');
      setOpen(false);
      setActiveSystem(systemId);
      navigate(`/${systemId}/preparation`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建测评系统失败';
      notifications.show({ color: 'red', title: '创建失败', message });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (systemId: string) => {
    if (systems.some((system) => system.id === systemId && system.meta.isDefault)) {
      notifications.show({ color: 'orange', title: '提示', message: '默认测评系统不可删除。' });
      return;
    }
    setRemovingId(systemId);
    try {
      await removeSystem(systemId);
      await refreshSystems();
      notifications.show({ color: 'teal', title: '删除成功', message: '测评系统已删除。' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除测评系统失败';
      notifications.show({ color: 'red', title: '删除失败', message });
    } finally {
      setRemovingId(null);
    }
  };

  const renderSystemCards = () => {
    if (systems.length === 0) {
      return (
        <Card withBorder radius="md" padding="xl" style={{ textAlign: 'center' }}>
          <Stack gap="sm" align="center">
            <Title order={5}>暂无测评系统</Title>
            <Text size="sm" c="dimmed">
              请先创建一个测评系统，创建后即可在此处快速管理与进入密评流程。
            </Text>
            <Button onClick={() => setOpen(true)}>立即新建</Button>
          </Stack>
        </Card>
      );
    }

    return (
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {systems.map((system) => {
          const stage = buildStageProgress(system);
          const analysisProgress = system.meta.reportProgress ?? stage.analysis.progress;
          const stageForOverall = {
            ...stage,
            analysis: {
              ...stage.analysis,
              progress: analysisProgress
            }
          };
          const overall = Math.round(buildOverallProgress(stageForOverall));
          const updatedDate = system.meta.updatedAt ? system.meta.updatedAt.split('T')[0] : '-';
          const evidenceTotal = system.meta.evidenceTotal ?? 0;
          const evidenceParsed = system.meta.evidenceParsed ?? 0;
          const evidenceBadgeColor =
            evidenceTotal === 0 ? 'gray' : evidenceParsed === evidenceTotal ? 'teal' : 'blue';
          const evidenceBadgeLabel =
            evidenceTotal === 0 ? '证据 0' : `证据 ${evidenceParsed}/${evidenceTotal}`;
          const stageRows = [
            { label: '准备', value: stage.preparation.progress },
            {
              label:
                evidenceTotal > 0
                  ? `证据（${evidenceParsed}/${evidenceTotal}）`
                  : '证据',
              value: stage.upload.progress
            },
            { label: '分析', value: analysisProgress }
          ];

          return (
            <Card key={system.id} withBorder radius="lg" shadow="sm" padding="lg">
              <Stack gap="sm">
                <Group justify="space-between" align="flex-start">
                  <Stack gap={2}>
                    <Text fw={600}>{system.meta.name}</Text>
                    <Group gap={6}>
                      <Badge color="gray" variant="light" size="sm">
                        {system.meta.code ?? '未设置编号'}
                      </Badge>
                      <Badge color="violet" variant="light" size="sm">
                        更新 {updatedDate}
                      </Badge>
                      <Badge color={evidenceBadgeColor} variant="light" size="sm">
                        {evidenceBadgeLabel}
                      </Badge>
                      {system.meta.isDefault ? (
                        <Badge color="indigo" variant="light" size="sm">
                          默认系统
                        </Badge>
                      ) : null}
                    </Group>
                  </Stack>
                  <Badge color={overall >= 75 ? 'teal' : overall >= 40 ? 'indigo' : 'gray'} radius="sm">
                    {overall}%
                  </Badge>
                </Group>

                <Progress value={overall} radius="xl" size="sm" color={overall >= 75 ? 'teal' : overall >= 40 ? 'indigo' : 'gray'} />

                <Stack gap={6}>
                  {stageRows.map((item) => (
                    <Group key={item.label} gap={8} justify="space-between">
                      <Text size="xs" c="dimmed">
                        {item.label}
                      </Text>
                      <Progress value={Number((item.value * 100).toFixed(0))} color="violet" radius="xl" size="xs" w="70%" />
                    </Group>
                  ))}
                </Stack>

                <Group justify="flex-end" gap="xs">
                  <Button
                    size="xs"
                    variant="light"
                    disabled={removingId === system.id}
                    onClick={() => {
                      setActiveSystem(system.id);
                      navigate(`/${system.id}/preparation`);
                    }}
                  >
                    进入流程
                  </Button>
                  <Button
                    size="xs"
                    color="red"
                    variant="light"
                    loading={removingId === system.id}
                    disabled={system.meta.isDefault}
                    onClick={() => handleDelete(system.id)}
                  >
                    删除
                  </Button>
                </Group>
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    );
  };

  return (
    <Box style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f6ff 0%, #ffffff 100%)', position: 'relative' }}>
      <LoadingOverlay visible={initialLoading} zIndex={200} />
      <Center py={60} px={20}>
        <Stack gap="xl" style={{ width: '100%', maxWidth: 1080 }}>
          <Card withBorder radius="lg" shadow="sm" padding="xl">
            <Group justify="space-between" align="flex-start" gap="lg">
              <Stack gap={6}>
                <Title order={2}>测评系统管理</Title>
                <Text size="sm" c="dimmed">
                  在这里统一管理所有密评系统，快速选择并进入各自的测评流程。
                </Text>
              </Stack>
              <Group gap="sm" align="center">
                <Button onClick={() => setOpen(true)}>新建系统</Button>
              </Group>
            </Group>
          </Card>

          {renderSystemCards()}
        </Stack>
      </Center>

      <Modal opened={open} onClose={() => setOpen(false)} title="新建测评系统">
        <Stack gap="md">
          <TextInput
            placeholder="系统名称"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="light" color="gray" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              创建
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
