import { useEffect, useState } from 'react';
import { Button, Checkbox, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { ProjectRole } from '../../../types/project';

interface ProjectMemberModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (member: {
    name: string;
    role: ProjectRole;
    contact: string;
    permissions: {
      approvePlan: boolean;
      manageDocuments: boolean;
      viewSensitive: boolean;
    };
  }) => void;
}

const roleOptions: ProjectRole[] = ['项目负责人', '密评人员', '被测单位人员', '系统管理员'];

export function ProjectMemberModal({ opened, onClose, onSubmit }: ProjectMemberModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<ProjectRole>('项目负责人');
  const [contact, setContact] = useState('');
  const [permissions, setPermissions] = useState({
    approvePlan: true,
    manageDocuments: false,
    viewSensitive: false
  });

  useEffect(() => {
    if (opened) {
      setName('');
      setRole('项目负责人');
      setContact('');
      setPermissions({ approvePlan: true, manageDocuments: false, viewSensitive: false });
    }
  }, [opened]);

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    onSubmit({
      name: name.trim(),
      role,
      contact: contact.trim(),
      permissions
    });
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="添加项目成员" radius="md" centered>
      <Stack gap="md">
        <TextInput label="姓名" placeholder="请输入成员姓名" value={name} onChange={(event) => setName(event.currentTarget.value)} />
        <TextInput
          label="联系方式"
          placeholder="手机号或邮箱"
          value={contact}
          onChange={(event) => setContact(event.currentTarget.value)}
        />
        <Select
          label="角色"
          data={roleOptions.map((item) => ({ value: item, label: item }))}
          value={role}
          onChange={(value) => setRole((value as ProjectRole) || '项目负责人')}
        />
        <Stack gap="xs">
          <Checkbox
            label="具备计划书审批权限"
            checked={permissions.approvePlan}
            onChange={(event) => setPermissions((prev) => ({ ...prev, approvePlan: event.currentTarget.checked }))}
          />
          <Checkbox
            label="可管理准备阶段文档"
            checked={permissions.manageDocuments}
            onChange={(event) => setPermissions((prev) => ({ ...prev, manageDocuments: event.currentTarget.checked }))}
          />
          <Checkbox
            label="可查看敏感信息"
            checked={permissions.viewSensitive}
            onChange={(event) => setPermissions((prev) => ({ ...prev, viewSensitive: event.currentTarget.checked }))}
          />
        </Stack>
        <Group justify="flex-end">
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            确认添加
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
