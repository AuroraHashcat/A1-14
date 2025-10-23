import { ReactNode } from 'react';
import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  footer?: string;
}

export function StatsCard({ icon, label, value, footer }: StatsCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="lg" withBorder style={{ backdropFilter: 'blur(6px)' }}>
      <Stack gap="sm">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color="violet">
            {icon}
          </ThemeIcon>
          <Text size="sm" fw={600} c="dimmed">
            {label}
          </Text>
        </Group>
        <Text fz={32} fw={700} lh={1}>
          {value}
        </Text>
        {footer ? (
          <Text size="xs" c="dimmed">
            {footer}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
