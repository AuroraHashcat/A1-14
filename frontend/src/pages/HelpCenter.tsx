import { Accordion, Alert, Anchor, Card, Divider, Group, List, Stack, Text } from '@mantine/core';
import { IconBook2, IconInfoCircle, IconLifebuoy, IconQuestionMark } from '@tabler/icons-react';
import { PageHeader } from '../components/PageHeader';

const GM_LINKS = [
  {
    name: '信息系统密码应用测评过程指南',
    url: 'https://www.gmbz.org.cn/main/view?seq=12116'
  },
  {
    name: '信息系统密码应用测评要求',
    url: 'https://www.gmbz.org.cn/main/view?seq=12115'
  }
];

export function HelpCenterPage() {
  return (
    <Stack gap="xl">
      <PageHeader
        title="帮助中心"
        description="梳理测评项目的关键操作、行业标准与常见问题，帮助团队快速定位所需功能。"
      />

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Stack gap="lg">
          <Group gap="sm">
            <IconInfoCircle size={24} />
            <Text fw={600}>快速上手</Text>
          </Group>
          <Divider variant="dashed" />
          <Accordion chevronPosition="right" variant="separated">
            <Accordion.Item value="workflow">
              <Accordion.Control>如何发起并推进新的测评项目？</Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="sm">
                  <List.Item>进入“测评项目”选择“新建项目”，填写目标系统、测评范围与团队成员。</List.Item>
                  <List.Item>按照测评准备 → 方案编制 → 现场测评 → 分析与报告的模块顺序逐步补充材料。</List.Item>
                  <List.Item>每个环节均支持模板下载与数据导入，未完成的依赖项会在侧边栏提醒。</List.Item>
                  <List.Item>操作日志自动记录所有修改，可从“项目设置”导出以供审计。</List.Item>
                </List>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="knowledge">
              <Accordion.Control>知识库如何提升分析效率？</Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="sm">
                  <List.Item>在“知识库”输入关键字，系统会返回来源文档与具体段落，并可展开查看上下文。</List.Item>
                  <List.Item>点击“加入参考”即可将段落同步到当前测评项目的分析说明中，保留原文引用。</List.Item>
                  <List.Item>如需重新构建知识库，可使用“站点管理”中的 OCR 与向量库重建脚本。</List.Item>
                </List>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="documents">
              <Accordion.Control>报告与题库导出有哪些注意事项？</Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing="sm">
                  <List.Item>在“分析与报告”与“知识库 - 生成题库”页面可直接导出 Word 文档，系统将 Markdown 内容转换为原生段落、列表与表格。</List.Item>
                  <List.Item>导出文件自动应用企业字体、页眉页脚及水印，可在下载后进行格式微调。</List.Item>
                  <List.Item>若文档包含敏感信息，请先在“权限设置”授予访问权限，再分享给相关成员。</List.Item>
                </List>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Stack gap="lg">
          <Group gap="sm">
            <IconBook2 size={24} />
            <Text fw={600}>标准条款速查</Text>
          </Group>
          <Divider variant="dashed" />
          <List size="sm" spacing="sm">
            {GM_LINKS.map((item) => (
              <List.Item key={item.url}>
                <Anchor href={item.url} target="_blank" rel="noreferrer">
                  {item.name}
                </Anchor>
              </List.Item>
            ))}
          </List>
          <Alert icon={<IconQuestionMark size={18} />} color="violet" variant="light">
            可在各模块中点击 “条款查询” 按钮，快速定位与当前操作关联的行业标准条款。
          </Alert>
        </Stack>
      </Card>

      <Card withBorder radius="lg" padding="xl" shadow="sm">
        <Stack gap="lg">
          <Group gap="sm">
            <IconLifebuoy size={24} />
            <Text fw={600}>常见问题与支持</Text>
          </Group>
          <Divider variant="dashed" />
          <Accordion chevronPosition="right" variant="separated">
            <Accordion.Item value="permission">
              <Accordion.Control>权限不够导致页面被锁定怎么办？</Accordion.Control>
              <Accordion.Panel>
                在右上角点击头像进入“权限管理”提交申请，系统管理员审批通过后即可访问对应模块。
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="data">
              <Accordion.Control>数据同步或向量检索异常如何排查？</Accordion.Control>
              <Accordion.Panel>
                先检查“系统监控”中的数据同步状态，再查看后台日志；如需重建请运行 `scripts/rebuild_standards_vector_store.py` 并确认 OCR 目录完整。
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value="contact">
              <Accordion.Control>如何联系技术支持？</Accordion.Control>
              <Accordion.Panel>
                通过 support@aurorahashcat.com 或企业微信“密码测评支持群”反馈问题，提交时附上操作时间与错误截图便于排查。
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      </Card>
    </Stack>
  );
}
