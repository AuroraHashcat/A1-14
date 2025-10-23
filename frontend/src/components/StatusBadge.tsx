import { Badge } from '@mantine/core';

const STATUS_COLOR_MAP: Record<string, string> = {
  pending: 'yellow',
  processing: 'blue',
  completed: 'green',
  failed: 'red',
  draft: 'gray',
  reviewing: 'cyan',
  approved: 'green',
  rejected: 'red'
};

const STATUS_LABEL_MAP: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  draft: '草稿',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已拒绝'
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR_MAP[status] || 'gray';
  const label = STATUS_LABEL_MAP[status] || status;

  return (
    <Badge color={color} variant="light" tt="uppercase">
      {label}
    </Badge>
  );
}
