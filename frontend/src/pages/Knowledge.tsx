import { FormEvent, useMemo, useState } from 'react';
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Highlight,
  Loader,
  List,
  LoadingOverlay,
  NumberInput,
  Select,
  Stack,
  Tabs,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Timeline,
  Title
} from '@mantine/core';
import {
  IconBook2,
  IconClipboardList,
  IconDownload,
  IconInfoCircle,
  IconListDetails,
  IconQuestionMark,
  IconSearch,
  IconShieldCheck
} from '@tabler/icons-react';
import { PageHeader } from '../components/PageHeader';
import { generateQuestions, queryKnowledge, searchKnowledge, exportQuestionsDocx } from '../api/knowledge';
import { triggerFileDownload } from '../utils/download';
import { notifications } from '@mantine/notifications';
import type { GeneratedQuestion } from '../api/knowledge';

export function KnowledgePage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<
    Array<
      {
        title?: string;
        url?: string;
        source?: string;
        snippet?: string;
        content?: string;
        score?: number;
        rawScore?: number;
      }
    >
  >([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<number, boolean>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ title: string; snippet: string; score?: number; content?: string; source?: string; id?: string; rawScore?: number }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [expandedSearchResults, setExpandedSearchResults] = useState<Record<number, boolean>>({});

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [exportingQuestions, setExportingQuestions] = useState(false);

  const highlightTerms = useMemo(
    () =>
      question
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean),
    [question]
  );

  const searchHighlightTerms = useMemo(
    () =>
      searchQuery
        .split(/\s+/)
        .map((item) => item.trim())
        .filter(Boolean),
    [searchQuery]
  );

  const handleExportQuestions = async () => {
    if (generatedQuestions.length === 0) {
      notifications.show({ color: 'blue', title: '提示', message: '请先生成题目后再导出。' });
      return;
    }

    setExportingQuestions(true);
    try {
      const { blob, filename } = await exportQuestionsDocx(topic.trim(), difficulty, generatedQuestions);
      triggerFileDownload(blob, filename);
      notifications.show({ color: 'teal', title: '导出成功', message: '题库已导出为 Word 文档。' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '题库导出失败，请稍后重试。';
      notifications.show({ color: 'red', title: '导出失败', message });
    } finally {
      setExportingQuestions(false);
    }
  };

  const handleSubmitQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!question.trim()) return;

    try {
      setLoading(true);
      const result = await queryKnowledge(question.trim());
      setAnswer(result.answer);
      setSources(result.sources);
      setConfidence(result.confidence);
  setExpandedSources({});
    } catch (error) {
      setAnswer('查询失败，请稍后重试。');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const result = await searchKnowledge(searchQuery.trim(), 8);
      setSearchResults(result.results);
  setExpandedSearchResults({});
    } catch (error) {
      console.error(error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGenerateQuestions = async (event: FormEvent) => {
    event.preventDefault();
    if (!topic.trim()) return;

    try {
      setGenerateLoading(true);
      const questions = await generateQuestions(topic.trim(), difficulty, count);
      setGeneratedQuestions(questions);
    } catch (error) {
      console.error(error);
    } finally {
      setGenerateLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      <PageHeader
        title="密评知识中心"
        description="汇聚政策解读、流程指引与智能问答，为测评团队提供决策依据。"
      />

      <Tabs defaultValue="qa" radius="lg">
        <Tabs.List grow>
          <Tabs.Tab value="qa" leftSection={<IconQuestionMark size={16} />}>
            智能问答
          </Tabs.Tab>
          <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
            语义检索
          </Tabs.Tab>
          <Tabs.Tab value="generate" leftSection={<IconListDetails size={16} />}>
            题库生成
          </Tabs.Tab>
          <Tabs.Tab value="guide" leftSection={<IconInfoCircle size={16} />}>
            密评指南
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="qa" pt="lg">
          <Card withBorder radius="lg" padding="xl" shadow="sm" pos="relative">
            <LoadingOverlay visible={loading} />
            <form onSubmit={handleSubmitQuestion}>
              <Stack gap="md">
                <Textarea
                  label="请输入你的问题"
                  placeholder="例如：测评准备阶段调查表需要覆盖哪些内容？"
                  minRows={4}
                  value={question}
                  onChange={(event) => setQuestion(event.currentTarget.value)}
                />
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    知识库基于向量检索与大模型推理，回答将附带参考来源。
                  </Text>
                  <Button type="submit" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }}>
                    提交问题
                  </Button>
                </Group>
              </Stack>
            </form>

            {answer && (
              <Card radius="md" shadow="xs" padding="lg" mt="lg" withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Group gap="sm">
                      <IconBook2 size={20} />
                      <Title order={4}>智能回答</Title>
                    </Group>
                    {confidence !== null ? (
                      <Badge color="violet" variant="light">
                        置信度 {(confidence * 100).toFixed(0)}%
                      </Badge>
                    ) : null}
                  </Group>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {answer}
                  </Text>
                  {sources.length > 0 ? (
                    <Stack gap="xs">
                      <Text size="xs" c="dimmed">
                        参考来源：
                      </Text>
                      <Stack gap="xs">
                        {sources.map((source, index) => {
                          const expanded = expandedSources[index] ?? false;
                          const collapsedText = source.snippet
                            ? source.snippet
                            : source.content
                            ? (() => {
                                const maxLength = 200;
                                const sourceContent = source.content ?? '';
                                const slice = sourceContent.slice(0, maxLength).trimEnd();
                                return sourceContent.length > maxLength ? `${slice}…` : slice;
                              })()
                            : '';
                          const displayText = expanded
                            ? source.content || source.snippet || ''
                            : collapsedText;

                          return (
                                                        <Stack key={index} gap={4}>
                                                          <Group gap="xs" align="center">
                                                            <Anchor
                                                              component="button"
                                                              type="button"
                                                              size="sm"
                                                              c="indigo"
                                                              fw={600}
                                                              style={{ cursor: 'pointer' }}
                                                              onClick={() =>
                                                                setExpandedSources((prev) => ({
                                                                  ...prev,
                                                                  [index]: !expanded
                                                                }))
                                                              }
                                                            >
                                                              {source.title || source.source || source.url || `参考来源 ${index + 1}`}
                                                            </Anchor>
                                                            {source.url ? (
                                                              <Anchor size="xs" href={source.url} target="_blank" rel="noreferrer">
                                                                打开原文
                                                              </Anchor>
                                                            ) : null}
                                                            {source.score !== undefined ? (
                                                              <Badge size="xs" color="indigo" variant="light">
                                                                相似度 {(source.score * 100).toFixed(0)}%
                                                              </Badge>
                                                            ) : null}
                                                          </Group>
                                                          {displayText ? (
                                                            <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-line' }} component="div">
                                                              <Highlight highlight={highlightTerms}>{displayText}</Highlight>
                                                            </Text>
                                                          ) : null}
                                                        </Stack>
                          );
                        })}
                                                  </Stack>
                    </Stack>
                  ) : null}
                </Stack>
              </Card>
            )}
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="search" pt="lg">
          <Card withBorder radius="lg" padding="xl" shadow="sm" pos="relative">
            <LoadingOverlay visible={searchLoading} />
            <form onSubmit={handleSubmitSearch}>
              <Stack gap="md">
                <TextInput
                  label="请输入检索关键词"
                  placeholder="如：测评工具接入规划"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.currentTarget.value)}
                />
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    搜索结果将根据语义相关度排序，并展示摘要。
                  </Text>
                  <Button type="submit" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }}>
                    执行检索
                  </Button>
                </Group>
              </Stack>
            </form>

            <Stack gap="sm" mt="lg">
              {searchResults.map((item, index) => {
                const expanded = expandedSearchResults[index] ?? false;
                const sourceUrl = item.source && item.source.startsWith('http') ? item.source : undefined;

                return (
                  <Card key={index} padding="md" radius="md" withBorder shadow="xs">
                  <Stack gap={4}>
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2}>
                        <Title order={5}>{item.title || item.source || `检索结果 ${index + 1}`}</Title>
                        <Group gap="xs">
                          <Anchor
                            component="button"
                            type="button"
                            size="xs"
                            c="indigo"
                            onClick={() =>
                              setExpandedSearchResults((prev) => ({
                                ...prev,
                                [index]: !(prev[index] ?? false)
                              }))
                            }
                          >
                              {expanded ? '收起内容' : '展开内容'}
                          </Anchor>
                            {sourceUrl ? (
                              <Anchor size="xs" href={sourceUrl} target="_blank" rel="noreferrer">
                              打开原文
                            </Anchor>
                          ) : null}
                        </Group>
                      </Stack>
                      {item.score !== undefined ? (
                        <Badge color="indigo" variant="light">
                          相似度 {(item.score * 100).toFixed(0)}%
                        </Badge>
                      ) : null}
                    </Group>
                    {(() => {
                      const collapsedText = item.snippet
                        ? item.snippet
                        : item.content
                        ? (() => {
                            const maxLength = 220;
                            const content = item.content ?? '';
                            const slice = content.slice(0, maxLength).trimEnd();
                            return content.length > maxLength ? `${slice}…` : slice;
                          })()
                        : '';

                      const displayText = expanded ? item.content || item.snippet || '' : collapsedText;

                      if (!displayText) {
                        return null;
                      }

                      return (
                        <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-line' }} component="div">
                          <Highlight highlight={searchHighlightTerms}>{displayText}</Highlight>
                        </Text>
                      );
                    })()}
                  </Stack>
                  </Card>
                );
              })}
              {searchResults.length === 0 && !searchLoading ? (
                <Text size="sm" c="dimmed">
                  暂无搜索结果。
                </Text>
              ) : null}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="generate" pt="lg">
          <Card withBorder radius="lg" padding="xl" shadow="sm" pos="relative">
            <LoadingOverlay visible={generateLoading} />
            <form onSubmit={handleGenerateQuestions}>
              <Stack gap="md">
                <TextInput
                  label="输入题目主题"
                  placeholder="例如：密评方案评审流程"
                  value={topic}
                  onChange={(event) => setTopic(event.currentTarget.value)}
                />
                <Group align="flex-start" grow>
                  <Select
                    label="难度等级"
                    data={[
                      { label: '基础', value: 'easy' },
                      { label: '进阶', value: 'medium' },
                      { label: '挑战', value: 'hard' }
                    ]}
                    value={difficulty}
                    onChange={(value) => setDifficulty(value || 'medium')}
                  />
                  <NumberInput
                    label="题目数量"
                    min={1}
                    max={10}
                    value={count}
                    onChange={(value) => setCount(Number(value) || 1)}
                  />
                </Group>
                <Button type="submit" variant="gradient" gradient={{ from: 'indigo', to: 'violet' }}>
                  生成题目
                </Button>
              </Stack>
            </form>

            <Stack gap="sm" mt="lg">
              {generatedQuestions.length > 0 ? (
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">
                    共生成 {generatedQuestions.length} 道题目
                  </Text>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={exportingQuestions ? <Loader size="xs" /> : <IconDownload size={16} />}
                    onClick={handleExportQuestions}
                    disabled={exportingQuestions}
                  >
                    导出 Word
                  </Button>
                </Group>
              ) : null}
              {generatedQuestions.map((item, index) => {
                const answerText = item.answer ?? item.correct_answer;
                const explanationText = item.explanation ?? item.analysis;

                return (
                  <Card key={index} withBorder padding="md" radius="md">
                    <Stack gap={4}>
                      <Group gap="sm">
                        <Badge color="violet" variant="light">
                          题目 {index + 1}
                        </Badge>
                        <Text fw={600}>{item.question}</Text>
                      </Group>
                      {(() => {
                        if (!item.options) {
                          return null;
                        }

                        const optionEntries = Array.isArray(item.options)
                          ? item.options.map((value, idx) => ({
                              key: idx < 26 ? String.fromCharCode(65 + idx) : `${idx + 1}`,
                              value: String(value)
                            }))
                          : Object.entries(item.options).map(([optionKey, optionValue]) => ({
                              key: optionKey,
                              value: String(optionValue)
                            }));

                        if (optionEntries.length === 0) {
                          return null;
                        }

                        return (
                          <Stack gap={2}>
                            {optionEntries.map(({ key, value }, optionIndex) => (
                              <Text key={`${key}-${optionIndex}`} size="sm" c="dimmed" component="div">
                                {`${key}. ${value}`}
                              </Text>
                            ))}
                          </Stack>
                        );
                      })()}
                      {answerText ? (
                        <Text size="sm" c="dimmed">
                          参考答案：{answerText}
                        </Text>
                      ) : null}
                      {explanationText ? (
                        <Text size="sm" c="dimmed">
                          答案解析：{explanationText}
                        </Text>
                      ) : null}
                    </Stack>
                  </Card>
                );
              })}
              {generatedQuestions.length === 0 && !generateLoading ? (
                <Text size="sm" c="dimmed">
                  填写主题后即可生成演练题目。
                </Text>
              ) : null}
            </Stack>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="guide" pt="lg">
          <Stack gap="lg">
            <Card withBorder radius="lg" padding="xl" shadow="sm">
              <Stack gap="sm">
                <Group gap="sm">
                  <ThemeIcon radius="xl" size={42} variant="light" color="violet">
                    <IconShieldCheck size={22} />
                  </ThemeIcon>
                  <div>
                    <Title order={3}>密码应用安全性评估对象</Title>
                    <Text size="sm" c="dimmed">
                      聚焦国家关键信息基础设施和重要行业系统，明确密评覆盖范围。
                    </Text>
                  </div>
                </Group>
                <Divider variant="dashed" />
                <List spacing="md" size="sm">
                  <List.Item>
                    <Text fw={600}>基础信息网络：</Text>
                    <Text c="dimmed">包括电信网络、广播电视网与互联网等承载公用信息服务的基础网络。</Text>
                  </List.Item>
                  <List.Item>
                    <Text fw={600}>重要信息系统：</Text>
                    <Text c="dimmed">
                      涵盖能源、教育、公安、测绘地理、社保、交通、卫生计生、金融等涉及国计民生的行业系统。
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text fw={600}>重要工业控制系统：</Text>
                    <Text c="dimmed">
                      包括核设施、航空航天、先进制造、石油石化、油气管网、电力、交通运输、水利枢纽及城市基础设施等工控系统。
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text fw={600}>政务信息系统：</Text>
                    <Text c="dimmed">
                      面向社会提供服务的党政机关及财政性资金支持事业单位、团体组织的信息系统。
                    </Text>
                  </List.Item>
                </List>
              </Stack>
              <Alert mt="md" color="violet" icon={<IconInfoCircle size={18} />} variant="light">
                关键信息基础设施与网络安全等级保护第三级及以上系统，需要每年至少开展一次密评。
              </Alert>
            </Card>

            <Card withBorder radius="lg" padding="xl" shadow="sm">
              <Stack gap="sm">
                <Group gap="sm">
                  <ThemeIcon radius="xl" size={42} variant="light" color="indigo">
                    <IconClipboardList size={22} />
                  </ThemeIcon>
                  <div>
                    <Title order={3}>密评合规要求</Title>
                    <Text size="sm" c="dimmed">
                      围绕算法、技术、产品与服务四个层面落实密码应用合规性。
                    </Text>
                  </div>
                </Group>
                <Divider variant="dashed" />
                <List spacing="md" size="sm">
                  <List.Item>
                    <Text fw={600}>密码算法：</Text>
                    <Text c="dimmed">必须符合国家法律法规及相关密码标准、行业标准的规定。</Text>
                  </List.Item>
                  <List.Item>
                    <Text fw={600}>密码技术：</Text>
                    <Text c="dimmed">遵循国家及行业密码技术标准，重点关注加密实现的规范与正确性。</Text>
                  </List.Item>
                  <List.Item>
                    <Text fw={600}>密码产品：</Text>
                    <Text c="dimmed">需经国家密码管理部门核准，按规定完成产品安全等级确定与检测。</Text>
                  </List.Item>
                  <List.Item>
                    <Text fw={600}>密码服务：</Text>
                    <Text c="dimmed">
                      使用的服务需取得国家密码管理部门许可，例如电子认证机构需具备相关许可证书。
                    </Text>
                  </List.Item>
                </List>
              </Stack>
            </Card>

            <Card withBorder radius="lg" padding="xl" shadow="sm">
              <Stack gap="sm">
                <Group gap="sm">
                  <ThemeIcon radius="xl" size={42} variant="light" color="grape">
                    <IconBook2 size={22} />
                  </ThemeIcon>
                  <div>
                    <Title order={3}>密评标准流程</Title>
                    <Text size="sm" c="dimmed">五大阶段串联方案评估、准备、实施与成果交付。</Text>
                  </div>
                </Group>
                <Divider variant="dashed" />
                <Timeline active={5} bulletSize={40} lineWidth={3} color="violet">
                  <Timeline.Item
                    title="1. 密码应用方案评估"
                    bullet={
                      <ThemeIcon radius="xl" size={32} variant="light" color="violet">
                        <IconShieldCheck size={18} />
                      </ThemeIcon>
                    }
                  >
                    <Text size="sm" c="dimmed">
                      按照系统定级审查密码应用设计，确认密码防护措施满足政策要求。
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item
                    title="2. 测评准备"
                    bullet={
                      <ThemeIcon radius="xl" size={32} variant="light" color="indigo">
                        <IconClipboardList size={18} />
                      </ThemeIcon>
                    }
                  >
                    <Text size="sm" c="dimmed">
                      编制项目计划、完善制度资料、填写系统调查表并准备漏扫、协议分析等测评工具。
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item
                    title="3. 方案编制"
                    bullet={
                      <ThemeIcon radius="xl" size={32} variant="light" color="grape">
                        <IconBook2 size={18} />
                      </ThemeIcon>
                    }
                  >
                    <Text size="sm" c="dimmed">
                      确定测评对象与指标，复核算法与协议应用，完善现场测评指引并形成密码测评方案。
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item
                    title="4. 现场测评"
                    bullet={
                      <ThemeIcon radius="xl" size={32} variant="light" color="violet">
                        <IconSearch size={18} />
                      </ThemeIcon>
                    }
                  >
                    <Text size="sm" c="dimmed">
                      通过访谈、文档审查、实地查看与工具测试获取结果，并确保测评活动不影响系统稳定性。
                    </Text>
                  </Timeline.Item>
                  <Timeline.Item
                    title="5. 分析与报告编制"
                    bullet={
                      <ThemeIcon radius="xl" size={32} variant="light" color="indigo">
                        <IconClipboardList size={18} />
                      </ThemeIcon>
                    }
                  >
                    <Text size="sm" c="dimmed">
                      汇总现场记录，输出单项与总体结论，完成风险分析并形成最终评估报告。
                    </Text>
                  </Timeline.Item>
                </Timeline>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
