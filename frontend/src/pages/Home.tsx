import { Link } from 'react-router-dom';
import {
  Anchor,
  Button,
  Card,
  Group,
  Overlay,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title
} from '@mantine/core';
import {
  IconBook2,
  IconChevronRight,
  IconCloudUpload,
  IconLockAccess,
  IconReportAnalytics,
  IconShieldLock,
  IconTimeline
} from '@tabler/icons-react';

const MODULES = [
  {
    title: '测评准备',
    description: '项目启动、调查表生成、资料收集与工具/表单准备，确保测评具备完备输入。',
    icon: <IconTimeline size={26} />,
    link: '/system/preparation'
  },
  {
    title: '上传证据',
    description: '集中管理评测任务与证据文件，支持批量上传、跟踪解析与后续处理。',
    icon: <IconCloudUpload size={26} />,
    link: '/system/upload'
  },
  {
    title: '分析与报告',
    description: '单元与整体测评、量化评估、风险分析及报告签发一体化管理。',
    icon: <IconReportAnalytics size={26} />,
    link: '/system/analysis'
  }
];

export function HomePage() {
  return (
    <Stack gap="xl">
      <Card radius="xl" padding="xl" withBorder style={{ position: 'relative', overflow: 'hidden' }}>
        <Overlay
          gradient="linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(129, 140, 248, 0.05) 60%, rgba(244, 244, 255, 0) 100%)"
          opacity={0.75}
        />
        <Stack gap="lg" style={{ position: 'relative', zIndex: 1 }}>
          <Stack gap={4}>
            <Title order={1} fw={700}>
              密码测评全流程数字化助手
            </Title>
            <Text size="lg" c="dimmed">
              提供任务、文档、数据追溯与日志管理的一站式密评辅助系统，帮助团队按流程稳步推进。
            </Text>
          </Stack>
          <Group gap="md">
            <Button
              size="lg"
              radius="md"
              component={Link}
              to="/system/preparation"
              rightSection={<IconChevronRight size={18} />}
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet' }}
            >
              从测评准备开始
            </Button>
          </Group>
        </Stack>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        {MODULES.map((module) => (
          <Card key={module.title} shadow="md" padding="lg" radius="lg" withBorder>
            <Stack gap="sm">
              <Group gap="sm">
                {module.icon}
                <Title order={4}>{module.title}</Title>
              </Group>
              <Text size="sm" c="dimmed">
                {module.description}
              </Text>
              <Anchor component={Link} to={module.link} size="sm" fw={600}>
                进入模块 →
              </Anchor>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      <Card padding="xl" radius="lg" shadow="sm" withBorder>
        <Stack gap="lg">
          <Group gap="sm">
            <ThemeIcon radius="xl" size={42} variant="light" color="violet">
              <IconShieldLock size={22} />
            </ThemeIcon>
            <div>
              <Title order={3}>核心设计原则</Title>
              <Text size="sm" c="dimmed">
                保证流程合规、数据安全与操作易用三大目标。
              </Text>
            </div>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            <Card withBorder padding="lg" radius="md">
              <Stack gap="sm">
                <Text fw={600}>合规对齐</Text>
                <Text size="sm" c="dimmed">
                  所有模板、判定逻辑与文档输出均紧扣密码测评规范与行业实践，确保评估结论有据可查。
                </Text>
              </Stack>
            </Card>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="sm">
                <Text fw={600}>数据安全</Text>
                <Text size="sm" c="dimmed">
                  敏感信息默认脱敏展示，文档加密存储，操作日志不可篡改，支持项目隔离与权限审计。
                </Text>
              </Stack>
            </Card>
            <Card withBorder padding="lg" radius="md">
              <Stack gap="sm">
                <Text fw={600}>流程联动</Text>
                <Text size="sm" c="dimmed">
                  前序模块数据一键传递至后续环节，减少重复录入，并通过提醒机制保障节点按期完成。
                </Text>
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>
      </Card>

      <Card padding="xl" radius="lg" shadow="sm" withBorder>
        <Stack gap="lg">
          <Group gap="sm" align="flex-start">
            <ThemeIcon radius="xl" size={42} variant="light" color="indigo">
              <IconLockAccess size={22} />
            </ThemeIcon>
            <Stack gap="xs">
              <Title order={3}>数据追溯与知识支持</Title>
              <Text size="sm" c="dimmed">
                提供操作日志与知识中心，便于评测团队统一协作。
              </Text>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mt="sm">
                <Stack gap="xs">
                  <Text fw={600}>操作日志</Text>
                  <Text size="sm" c="dimmed">
                    追踪关键操作与时间节点，为项目审计提供依据。
                  </Text>
                </Stack>
                <Stack gap="xs">
                  <Text fw={600}>知识中心</Text>
                  <Text size="sm" c="dimmed">
                    聚合密评依据、常见问题与政策解读，并配备智能问答与语义检索能力。
                  </Text>
                  <Anchor component={Link} to="/system/knowledge" size="sm" fw={600}>
                    打开知识库 →
                  </Anchor>
                </Stack>
              </SimpleGrid>
            </Stack>
          </Group>
        </Stack>
      </Card>
    </Stack>
  );
}
