import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, Avatar, Badge, Burger, Button, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import {
  IconBook2,
  IconCalendarStats,
  IconCloudUpload,
  IconHelpCircle,
  IconReportAnalytics
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../context/AuthContext';
import { logout as apiLogout } from '../../api/auth';
import { useProject } from '../../context/ProjectContext';

export function AppLayout() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const { isAuthenticated, user, setAuthenticated } = useAuth();
  const { activeSystem } = useProject();

  const systemPrefix = activeSystem ? `/${activeSystem.id}` : '/systems';

  const navItems = [
    { label: '测评准备', path: `${systemPrefix}/preparation`, icon: IconCalendarStats },
    { label: '上传证据', path: `${systemPrefix}/upload`, icon: IconCloudUpload },
    { label: '分析与报告', path: `${systemPrefix}/analysis`, icon: IconReportAnalytics },
    { label: '知识资源', path: `${systemPrefix}/knowledge`, icon: IconBook2 },
    { label: '帮助中心', path: `${systemPrefix}/help`, icon: IconHelpCircle }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      notifications.show({ color: 'green', title: '已退出登录', message: '期待下次再见。' });
    } catch (error) {
      console.error(error);
      notifications.show({ color: 'red', title: '网络异常', message: '请检查网络连接。' });
    } finally {
      setAuthenticated(false);
      navigate('/');
    }
  };

  const renderNavButton = (item: { label: string; path: string; icon: any }, variant: 'subtle' | 'light' = 'subtle') => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Button
        key={item.path}
        component={Link}
        to={item.path}
        variant={active ? 'gradient' : variant}
        gradient={{ from: theme.colors.indigo[5], to: theme.colors.violet[5] }}
        leftSection={<Icon size={18} stroke={1.6} />}
        onClick={() => setOpened(false)}
      >
        {item.label}
      </Button>
    );
  };

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group justify="space-between" h="100%" px="md">
          <Group>
            <Burger opened={opened} onClick={() => setOpened((o) => !o)} hiddenFrom="sm" size="sm" />
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Group gap="xs">
                <Avatar radius="xl" color="indigo" variant="gradient">
                  CA
                </Avatar>
                <Stack gap={0}>
                  <Title order={4}>密码测评助手</Title>
                  <Text size="xs" c="dimmed">
                    面向全流程的密码测评辅助平台
                  </Text>
                </Stack>
                {activeSystem ? (
                  <div style={{ marginLeft: 12 }}>
                    <Badge color="violet" variant="light">{`当前系统：${activeSystem.meta.name}`}</Badge>
                  </div>
                ) : null}
              </Group>
            </Link>
          </Group>

          <Group gap="xs" visibleFrom="sm">
            {navItems.map((item) => renderNavButton(item))}
          </Group>

          <Group gap="xs">
            {isAuthenticated ? (
              <>
                {user ? (
                  <Group gap={8} align="center">
                    <Avatar radius="xl" color="violet" variant="light">
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Stack gap={0} align="flex-start">
                      <Text size="sm" fw={500}>
                        {user.username}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user.email}
                      </Text>
                    </Stack>
                  </Group>
                ) : null}
                <Button variant="outline" color="gray" onClick={handleLogout}>
                  退出
                </Button>
              </>
            ) : (
              <>
                <Button variant="light" color="violet" component={Link} to="/login">
                  登录
                </Button>
                <Button variant="gradient" gradient={{ from: 'indigo', to: 'violet' }} component={Link} to="/register">
                  注册
                </Button>
              </>
            )}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {navItems.map((item) => renderNavButton(item, 'light'))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <div style={{ paddingBlock: '1rem' }}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
