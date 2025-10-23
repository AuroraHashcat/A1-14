import { Button, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Stack gap="md" align="center" py="xl">
      <Title order={2}>页面未找到</Title>
      <Text c="dimmed">抱歉，您访问的页面不存在或已被移动。</Text>
      <Button component={Link} to="/" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }}>
        返回首页
      </Button>
    </Stack>
  );
}
