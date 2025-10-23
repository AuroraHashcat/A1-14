import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Center,
  Container,
  List,
  PasswordInput,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title
} from '@mantine/core';
import { IconArrowLeft, IconCircleCheck, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { submitForm } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuthenticated, refreshSession } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      notifications.show({ color: 'red', title: '提示', message: '请完整填写注册信息' });
      return;
    }

    try {
      setLoading(true);
  await submitForm('/api/register', { username, email, password });
      try {
        await refreshSession();
      } catch (error) {
        console.warn('Failed to refresh session after registration', error);
        setAuthenticated(true);
      }
      notifications.show({ color: 'green', title: '注册成功', message: '已自动登录，可开始创建评测任务。' });
      navigate('/systems');
    } catch (error) {
      notifications.show({
        color: 'red',
        title: '注册失败',
        message: error instanceof Error ? error.message : '请稍后再试'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 0% 0%, rgba(14,165,233,0.12) 0%, rgba(255,255,255,0) 42%),
radial-gradient(circle at 100% 0%, rgba(94,234,212,0.16) 0%, rgba(255,255,255,0) 38%),
linear-gradient(135deg,#f6fbff 0%,#ffffff 60%)`
      }}
      px={24}
    >
      <Container size={480} px={0}>
        <Paper radius="xl" shadow="xl" withBorder p={{ base: 28, md: 36 }}>
          <Stack gap="xl">
            <Stack gap={6}>
              <Title order={2}>创建账号</Title>
              <Text size="sm" c="dimmed">
                准备好与团队一起推进测评项目。注册后即可同步任务、记录证据并生成报告。
              </Text>
            </Stack>

            <List
              spacing="xs"
              size="sm"
              icon={
                <ThemeIcon size={20} radius="xl" color="teal" variant="light">
                  <IconCircleCheck size={14} />
                </ThemeIcon>
              }
            >
              <List.Item>多人协同同步阶段成果，完整追踪关键结论</List.Item>
              <List.Item>模板化收集测评证据，降低资料整理成本</List.Item>
              <List.Item>快速导出流程报告，助力通过合规审查</List.Item>
            </List>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="用户名"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(event) => setUsername(event.currentTarget.value)}
                  required
                />
                <TextInput
                  label="邮箱"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  required
                />
                <PasswordInput
                  label="密码"
                  placeholder="设置登录密码"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  required
                />
                <Button type="submit" loading={loading} leftSection={<IconUserPlus size={16} />}>
                  注册
                </Button>
                <Text size="sm" c="dimmed" ta="center">
                  已有账号？<Link to="/login"><IconArrowLeft size={14} style={{ verticalAlign: 'text-bottom' }} /> 返回登录</Link>
                </Text>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
