import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Center,
  Container,
  PasswordInput,
  Paper,
  Stack,
  Text,
  TextInput,
  Title
} from '@mantine/core';
import { IconArrowRight, IconInfoCircle, IconLock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { submitForm } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthenticated, refreshSession } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTarget = useMemo(() => {
    const state = location.state as { from?: string } | undefined;
    return state?.from || '/systems';
  }, [location.state]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      notifications.show({ color: 'red', title: '提示', message: '请输入用户名和密码' });
      return;
    }

    try {
      setLoading(true);
  await submitForm('/api/login', { username, password });
      try {
        await refreshSession();
      } catch (error) {
        console.warn('Failed to refresh session after login', error);
        setAuthenticated(true);
      }
      notifications.show({ color: 'green', title: '登录成功', message: '欢迎回来。' });
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      notifications.show({
        color: 'red',
        title: '登录失败',
        message: error instanceof Error ? error.message : '请检查账号信息'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center
      style={{
        minHeight: '100vh',
        background: `radial-gradient(circle at 0% 0%, rgba(99,102,241,0.12) 0%, rgba(255,255,255,0) 42%),
radial-gradient(circle at 100% 0%, rgba(16,185,129,0.14) 0%, rgba(255,255,255,0) 38%),
linear-gradient(135deg,#f7f9ff 0%,#ffffff 60%)`
      }}
      px={24}
    >
      <Container size={460} px={0}>
        <Paper radius="xl" shadow="xl" withBorder p={{ base: 28, md: 36 }}>
          <Stack gap="xl">
            <Stack gap={6}>
              <Title order={2}>账号登录</Title>
              <Text size="sm" c="dimmed">
                登录后即可管理测评流程、跟踪任务进度并访问知识库资源。
              </Text>
            </Stack>

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="用户名"
                  placeholder="输入用户名"
                  value={username}
                  onChange={(event) => setUsername(event.currentTarget.value)}
                  required
                />
                <PasswordInput
                  label="密码"
                  placeholder="输入密码"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  required
                />
                <Button type="submit" loading={loading} leftSection={<IconLock size={16} />}>
                  登录
                </Button>
                <Alert
                  variant="light"
                  color="teal"
                  radius="md"
                  icon={<IconInfoCircle size={16} />}
                >
                  示范账号：demo_user / Demo@123
                </Alert>
                <Text size="sm" c="dimmed" ta="center">
                  还没有账号？<Link to="/register">立即注册 <IconArrowRight size={14} style={{ verticalAlign: 'text-bottom' }} /></Link>
                </Text>
              </Stack>
            </form>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
}
