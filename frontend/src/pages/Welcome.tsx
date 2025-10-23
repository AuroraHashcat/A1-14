import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Center,
  Container,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title
} from '@mantine/core';
import {
  IconArrowRight,
  IconChartArrowsVertical,
  IconChecklist,
  IconShieldCheck,
  IconTargetArrow
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

const FEATURE_ITEMS = [
  {
    title: '一体化评测阶段',
    description: '覆盖准备、计划、现场、分析全流程，保证每一步都有标准支撑。',
    icon: IconChecklist
  },
  {
    title: '实时进度可视化',
    description: '系统管理页集中展示任务进度与关键节点，帮助团队快速协作。',
    icon: IconChartArrowsVertical
  },
  {
    title: '合规知识库',
    description: '结合行业实践经验，随时检索检查要点与整改建议。',
    icon: IconShieldCheck
  }
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/systems', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <Center
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 0% 0%, rgba(99,102,241,0.15) 0%, rgba(255,255,255,0) 45%),
radial-gradient(circle at 100% 0%, rgba(16,185,129,0.18) 0%, rgba(255,255,255,0) 40%),
linear-gradient(135deg,#f8fbff 0%,#ffffff 60%)`
      }}
      px={24}
      py={48}
    >
      <Container size="lg">
        <Paper radius="xl" shadow="xl" withBorder p={{ base: 32, md: 48 }}>
          <Stack gap="xl">
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
              <Stack gap="md" maw={520}>
                <Badge size="lg" radius="sm" variant="light" color="indigo">
                  测评全流程协同
                </Badge>
                <Title order={1} style={{ lineHeight: 1.2 }}>
                  密码测评流程助手
                </Title>
                <Text size="md" c="dimmed">
                  从系统准备、测评执行到报告生成，一站式管理所有阶段任务。丰富的知识库、直观的进度视图与团队协作工具，帮助您快速完成合规评测。
                </Text>
                <List spacing="xs" size="sm" icon={<ThemeIcon size={20} radius="xl" color="teal" variant="light"><IconTargetArrow size={14} /></ThemeIcon>}>
                  <List.Item>即插即用的合规模板，确保测评流程与标准保持一致</List.Item>
                  <List.Item>团队协同记录关键结论，沉淀可复用的安全经验</List.Item>
                  <List.Item>自动化生成阶段成果，缩短报告交付周期</List.Item>
                </List>
                <Group gap="md">
                  <Button component={Link} to="/login" size="md" radius="md">
                    登录
                  </Button>
                  <Button component={Link} to="/register" variant="light" size="md" radius="md">
                    注册新账号
                  </Button>
                </Group>
              </Stack>
              <Card radius="lg" withBorder shadow="sm" p="xl" maw={360}>
                <Stack gap="md" align="center">
                  <ThemeIcon size={48} radius="xl" variant="light" color="indigo">
                    <IconChecklist size={24} />
                  </ThemeIcon>
                  <Stack gap={4}>
                    <Text fw={600} ta="center">
                      智能流程演示
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      登录后即可在系统管理页导入示例项目，快速体验完整流程并了解每个阶段的操作细节。
                    </Text>
                  </Stack>
                  <Button component={Link} to="/login" variant="light" radius="md" rightSection={<IconArrowRight size={16} />}>
                    立即体验
                  </Button>
                </Stack>
              </Card>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              {FEATURE_ITEMS.map((feature) => (
                <Card key={feature.title} radius="lg" withBorder shadow="xs" p="lg">
                  <Stack gap="md">
                    <ThemeIcon size="lg" radius="md" variant="light" color="teal">
                      <feature.icon size={20} />
                    </ThemeIcon>
                    <Stack gap={4}>
                      <Text fw={600}>{feature.title}</Text>
                      <Text size="sm" c="dimmed">
                        {feature.description}
                      </Text>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
