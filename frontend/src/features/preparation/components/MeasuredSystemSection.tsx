import {
  Card,
  Checkbox,
  Divider,
  Grid,
  Group,
  Radio,
  SegmentedControl,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconUsersGroup } from '@tabler/icons-react';
import {
  ASYMMETRIC_ALGORITHM_OPTIONS,
  BLOCK_ALGORITHM_OPTIONS,
  CLOUD_EVALUATION_STATUS_OPTIONS,
  CRITICAL_INFRASTRUCTURE_OPTIONS,
  CRYPTO_PLAN_METHOD_OPTIONS,
  CRYPTO_PLAN_STATUS_OPTIONS,
  CRYPTO_PRODUCT_USAGE_OPTIONS,
  HASH_ALGORITHM_OPTIONS,
  INTERCONNECTION_OPTIONS,
  NETWORK_COVERAGE_OPTIONS,
  SERVICE_DOMAIN_OPTIONS,
  SERVICE_OBJECT_OPTIONS,
  SERVICE_SCOPE_OPTIONS,
  SERVICE_SCOPE_NEEDS_COUNT,
  STREAM_ALGORITHM_OPTIONS
} from '../constants';
import { ProjectFormState } from '../types';

interface MeasuredSystemSectionProps {
  projectForm: ProjectFormState;
  onProjectFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void;
}

export function MeasuredSystemSection({ projectForm, onProjectFormChange }: MeasuredSystemSectionProps) {
  const measured = projectForm.measuredSystem;
  const scopeRequiresCount = SERVICE_SCOPE_NEEDS_COUNT.includes(measured.serviceScope);

  return (
    <Card withBorder radius="lg" padding="xl" shadow="sm">
      <Stack gap="lg">
        <Group gap="sm">
          <ThemeIcon radius="xl" size={42} variant="light" color="violet">
            <IconUsersGroup size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={600}>被测系统信息</Text>
            <Text size="xs" c="dimmed">
              填报关键信息基础设施认定、服务范围与密码应用情况。
            </Text>
          </Stack>
        </Group>

        <Stack gap="xl">
          <Stack gap="sm">
            <Text fw={600}>关键信息基础设施认定</Text>
            <SegmentedControl
              data={CRITICAL_INFRASTRUCTURE_OPTIONS}
              value={measured.criticalInfrastructureStatus}
              onChange={(value: string | null) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    criticalInfrastructureStatus: value as typeof measured.criticalInfrastructureStatus,
                    criticalInfrastructureDepartment:
                      value === '已认定' ? prev.measuredSystem.criticalInfrastructureDepartment : ''
                  }
                }))
              }
            />
            {measured.criticalInfrastructureStatus === '已认定' ? (
              <TextInput
                label="所属安全保护工作部门"
                placeholder="请输入负责部门名称"
                value={measured.criticalInfrastructureDepartment}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  onProjectFormChange((prev) => ({
                    ...prev,
                    measuredSystem: {
                      ...prev.measuredSystem,
                      criticalInfrastructureDepartment: value
                    }
                  }));
                }}
              />
            ) : null}
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>网络安全等级保护测评情况</Text>
            <SegmentedControl
              data={CRYPTO_PLAN_STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
              value={measured.gradingAssessmentStatus}
              onChange={(value: string | null) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    gradingAssessmentStatus: value as typeof measured.gradingAssessmentStatus
                  }
                }))
              }
            />
            {measured.gradingAssessmentStatus !== '未测评' ? (
              <TextInput
                label="测评机构名称"
                placeholder="请输入测评机构名称"
                value={measured.gradingAssessmentAgency}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  onProjectFormChange((prev) => ({
                    ...prev,
                    measuredSystem: {
                      ...prev.measuredSystem,
                      gradingAssessmentAgency: value
                    }
                  }));
                }}
              />
            ) : null}
            {measured.gradingAssessmentStatus === '已测评' ? (
              <>
                <DatePickerInput
                  type="range"
                  label="测评时间"
                  placeholder="选择测评开始与结束日期"
                  value={measured.gradingAssessmentPeriod}
                  onChange={(value) =>
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: {
                        ...prev.measuredSystem,
                        gradingAssessmentPeriod: Array.isArray(value)
                          ? (value as typeof measured.gradingAssessmentPeriod)
                          : [null, null]
                      }
                    }))
                  }
                />
                <Textarea
                  label="测评结论"
                  placeholder="请描述测评结论"
                  minRows={3}
                  value={measured.gradingAssessmentConclusion}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: {
                        ...prev.measuredSystem,
                        gradingAssessmentConclusion: value
                      }
                    }));
                  }}
                />
              </>
            ) : null}
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>系统服务情况</Text>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="服务范围"
                  data={SERVICE_SCOPE_OPTIONS}
                  value={measured.serviceScope}
                  onChange={(value) =>
                    onProjectFormChange((prev) => {
                      const nextScope = (value ?? prev.measuredSystem.serviceScope) as typeof measured.serviceScope;
                      return {
                        ...prev,
                        measuredSystem: {
                          ...prev.measuredSystem,
                          serviceScope: nextScope,
                          serviceScopeCount: SERVICE_SCOPE_NEEDS_COUNT.includes(nextScope)
                            ? prev.measuredSystem.serviceScopeCount
                            : ''
                        }
                      };
                    })
                  }
                />
              </Grid.Col>
              {scopeRequiresCount ? (
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Stack gap={4}>
                    <Text size="sm" fw={500}>
                      数量说明
                    </Text>
                    <Group gap="xs" align="center">
                      <Text size="sm">跨</Text>
                      <TextInput
                        placeholder="填写数字"
                        value={measured.serviceScopeCount}
                        inputMode="numeric"
                        style={{ maxWidth: 140 }}
                        styles={{ input: { textAlign: 'center' } }}
                        onChange={(event) => {
                          const sanitized = event.currentTarget.value.replace(/[^0-9]/g, '');
                          onProjectFormChange((prev) => ({
                            ...prev,
                            measuredSystem: {
                              ...prev.measuredSystem,
                              serviceScopeCount: sanitized
                            }
                          }));
                        }}
                      />
                      <Text size="sm">个</Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              ) : null}
            </Grid>
            <Checkbox.Group
              label="服务领域"
              value={measured.serviceDomains}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    serviceDomains: value
                  }
                }))
              }
            >
              <Group gap="xs">
                {SERVICE_DOMAIN_OPTIONS.map((domain) => (
                  <Checkbox key={domain} value={domain} label={domain} />
                ))}
              </Group>
            </Checkbox.Group>
            <Select
              label="服务对象"
              data={SERVICE_OBJECT_OPTIONS}
              value={measured.serviceObject}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    serviceObject: (value as typeof measured.serviceObject) || prev.measuredSystem.serviceObject
                  }
                }))
              }
            />
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>系统网络平台 / 系统服务用户数量</Text>
            <Checkbox.Group
              label="覆盖范围"
              value={measured.networkCoverage}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: { ...prev.measuredSystem, networkCoverage: value }
                }))
              }
            >
              <Group gap="xs">
                {NETWORK_COVERAGE_OPTIONS.map((item) => (
                  <Checkbox key={item} value={item} label={item} />
                ))}
              </Group>
            </Checkbox.Group>
            <TextInput
              label="系统服务用户数量"
              placeholder="例如：2 万"
              value={measured.userCount}
              onChange={(event) => {
                const { value } = event.currentTarget;
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: { ...prev.measuredSystem, userCount: value }
                }));
              }}
            />
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>系统运行情况</Text>
            <SegmentedControl
              data={[
                { label: '已投入运行', value: '是' },
                { label: '未投入运行', value: '否' }
              ]}
              value={measured.inOperation}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    inOperation: value as typeof measured.inOperation,
                    operationStart: value === '是' ? prev.measuredSystem.operationStart : null
                  }
                }))
              }
            />
            {measured.inOperation === '是' ? (
              <DatePickerInput
                label="投入运行时间"
                placeholder="选择日期"
                value={measured.operationStart}
                onChange={(value) =>
                  onProjectFormChange((prev) => ({
                    ...prev,
                    measuredSystem: { ...prev.measuredSystem, operationStart: value }
                  }))
                }
              />
            ) : null}
            <Textarea
              label="目前情况"
              placeholder="描述系统目前运行状态"
              minRows={3}
              value={measured.currentStatus}
              onChange={(event) => {
                const { value } = event.currentTarget;
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: { ...prev.measuredSystem, currentStatus: value }
                }));
              }}
            />
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>系统互联情况</Text>
            <Checkbox.Group
              value={measured.interconnections}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: { ...prev.measuredSystem, interconnections: value }
                }))
              }
            >
              <Group gap="xs">
                {INTERCONNECTION_OPTIONS.map((item) => (
                  <Checkbox key={item} value={item} label={item} />
                ))}
              </Group>
            </Checkbox.Group>
            <Textarea
              label="互联系统名称"
              placeholder="列出互联系统名称"
              minRows={2}
              value={measured.interconnectionNames}
              onChange={(event) => {
                const { value } = event.currentTarget;
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: { ...prev.measuredSystem, interconnectionNames: value }
                }));
              }}
            />
            {measured.interconnections.includes('其他') ? (
                <TextInput
                  label="其他互联情况说明"
                  placeholder="补充说明其他互联系统"
                  value={measured.interconnectionOther}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: { ...prev.measuredSystem, interconnectionOther: value }
                    }));
                  }}
                />
            ) : null}
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>云平台依赖情况</Text>
            <SegmentedControl
              data={[
                { label: '是', value: '是' },
                { label: '否', value: '否' }
              ]}
              value={measured.cloudDependent}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    cloudDependent: value as typeof measured.cloudDependent,
                    cloudPlatformName: value === '是' ? prev.measuredSystem.cloudPlatformName : '',
                    cloudEvaluationAgency: value === '是' ? prev.measuredSystem.cloudEvaluationAgency : '',
                    cloudEvaluationPeriod: value === '是' ? prev.measuredSystem.cloudEvaluationPeriod : [null, null],
                    cloudEvaluationConclusion: value === '是' ? prev.measuredSystem.cloudEvaluationConclusion : '',
                    cloudEvaluationStatus:
                      value === '是' ? prev.measuredSystem.cloudEvaluationStatus : '云平台未评估'
                  }
                }))
              }
            />
            {measured.cloudDependent === '是' ? (
              <Stack gap="sm">
                <TextInput
                  label="云平台名称"
                  value={measured.cloudPlatformName}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: { ...prev.measuredSystem, cloudPlatformName: value }
                    }));
                  }}
                />
                <TextInput
                  label="密评机构名称"
                  value={measured.cloudEvaluationAgency}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: { ...prev.measuredSystem, cloudEvaluationAgency: value }
                    }));
                  }}
                />
                <SegmentedControl
                  data={CLOUD_EVALUATION_STATUS_OPTIONS.map((item) => ({ label: item, value: item }))}
                  value={measured.cloudEvaluationStatus}
                  onChange={(value) =>
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: {
                        ...prev.measuredSystem,
                        cloudEvaluationStatus: value as typeof measured.cloudEvaluationStatus
                      }
                    }))
                  }
                />
                <DatePickerInput
                  type="range"
                  label="评估时间"
                  placeholder="选择评估时间范围"
                  value={measured.cloudEvaluationPeriod}
                  onChange={(value) =>
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: {
                        ...prev.measuredSystem,
                        cloudEvaluationPeriod: Array.isArray(value)
                          ? (value as typeof measured.cloudEvaluationPeriod)
                          : [null, null]
                      }
                    }))
                  }
                />
                <Textarea
                  label="评估结论"
                  minRows={3}
                  value={measured.cloudEvaluationConclusion}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: { ...prev.measuredSystem, cloudEvaluationConclusion: value }
                    }));
                  }}
                />
              </Stack>
            ) : null}
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>密码应用方案</Text>
            <Radio.Group
              value={measured.cryptoPlanStatus}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    cryptoPlanStatus: value as typeof measured.cryptoPlanStatus,
                    cryptoPlanApprovalTime:
                      value === '有密码应用方案，且通过评审'
                        ? prev.measuredSystem.cryptoPlanApprovalTime
                        : null,
                    cryptoPlanAgency: value === '无密码应用方案' ? '' : prev.measuredSystem.cryptoPlanAgency
                  }
                }))
              }
            >
              <Stack gap="xs">
                {CRYPTO_PLAN_STATUS_OPTIONS.map((option) => (
                  <Radio key={option} value={option} label={option} />
                ))}
              </Stack>
            </Radio.Group>
            {measured.cryptoPlanStatus === '有密码应用方案，且通过评审' ? (
              <DatePickerInput
                label="评审通过时间"
                placeholder="选择日期"
                value={measured.cryptoPlanApprovalTime}
                onChange={(value) =>
                  onProjectFormChange((prev) => ({
                    ...prev,
                    measuredSystem: { ...prev.measuredSystem, cryptoPlanApprovalTime: value }
                  }))
                }
              />
            ) : null}
            {measured.cryptoPlanStatus !== '无密码应用方案' ? (
              <Stack gap="sm">
                <SegmentedControl
                  data={CRYPTO_PLAN_METHOD_OPTIONS.map((item) => ({ label: item, value: item }))}
                  value={measured.cryptoPlanEvaluationMethod}
                  onChange={(value) =>
                    onProjectFormChange((prev) => ({
                      ...prev,
                      measuredSystem: {
                        ...prev.measuredSystem,
                        cryptoPlanEvaluationMethod: value as typeof measured.cryptoPlanEvaluationMethod
                      }
                    }))
                  }
                />
                {measured.cryptoPlanEvaluationMethod === '委托密评机构评估' ? (
                  <TextInput
                    label="评估机构名称"
                    value={measured.cryptoPlanAgency}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      onProjectFormChange((prev) => ({
                        ...prev,
                        measuredSystem: { ...prev.measuredSystem, cryptoPlanAgency: value }
                      }));
                    }}
                  />
                ) : null}
              </Stack>
            ) : null}
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>密码产品使用情况</Text>
            <SegmentedControl
              data={CRYPTO_PRODUCT_USAGE_OPTIONS}
              value={measured.cryptoProductsUsed}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    cryptoProductsUsed: value as typeof measured.cryptoProductsUsed,
                    cryptoProductCounts:
                      value === '使用'
                        ? prev.measuredSystem.cryptoProductCounts
                        : {
                            systemUsage: '',
                            independentUsage: '',
                            sharedUsage: '',
                            certifiedCount: '',
                            domesticCount: '',
                            foreignCount: ''
                          }
                  }
                }))
              }
            />
            {measured.cryptoProductsUsed === '使用' ? (
              <Grid gutter="sm">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="系统使用的密码产品（台/套）"
                    value={measured.cryptoProductCounts.systemUsage}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      onProjectFormChange((prev) => ({
                        ...prev,
                        measuredSystem: {
                          ...prev.measuredSystem,
                          cryptoProductCounts: {
                            ...prev.measuredSystem.cryptoProductCounts,
                            systemUsage: value
                          }
                        }
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="独立使用（台/套）"
                    value={measured.cryptoProductCounts.independentUsage}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      onProjectFormChange((prev) => ({
                        ...prev,
                        measuredSystem: {
                          ...prev.measuredSystem,
                          cryptoProductCounts: {
                            ...prev.measuredSystem.cryptoProductCounts,
                            independentUsage: value
                          }
                        }
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="共享使用（台/套）"
                    value={measured.cryptoProductCounts.sharedUsage}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      onProjectFormChange((prev) => ({
                        ...prev,
                        measuredSystem: {
                          ...prev.measuredSystem,
                          cryptoProductCounts: {
                            ...prev.measuredSystem.cryptoProductCounts,
                            sharedUsage: value
                          }
                        }
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="取得认证证书数量（台/套）"
                    value={measured.cryptoProductCounts.certifiedCount}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      onProjectFormChange((prev) => ({
                        ...prev,
                        measuredSystem: {
                          ...prev.measuredSystem,
                          cryptoProductCounts: {
                            ...prev.measuredSystem.cryptoProductCounts,
                            certifiedCount: value
                          }
                        }
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="未取得认证证书的国内产品数量（台/套）"
                    value={measured.cryptoProductCounts.domesticCount}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      onProjectFormChange((prev) => ({
                        ...prev,
                        measuredSystem: {
                          ...prev.measuredSystem,
                          cryptoProductCounts: {
                            ...prev.measuredSystem.cryptoProductCounts,
                            domesticCount: value
                          }
                        }
                      }));
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <TextInput
                    label="国外产品数量（台/套）"
                    value={measured.cryptoProductCounts.foreignCount}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      onProjectFormChange((prev) => ({
                        ...prev,
                        measuredSystem: {
                          ...prev.measuredSystem,
                          cryptoProductCounts: {
                            ...prev.measuredSystem.cryptoProductCounts,
                            foreignCount: value
                          }
                        }
                      }));
                    }}
                  />
                </Grid.Col>
              </Grid>
            ) : null}
          </Stack>

          <Divider variant="dashed" />

          <Stack gap="sm">
            <Text fw={600}>密码算法使用情况</Text>
            <Checkbox.Group
              label="分组算法"
              value={measured.cryptoAlgorithms.block}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    cryptoAlgorithms: { ...prev.measuredSystem.cryptoAlgorithms, block: value }
                  }
                }))
              }
            >
              <Group gap="xs">
                {BLOCK_ALGORITHM_OPTIONS.map((item) => (
                  <Checkbox key={item} value={item} label={item} />
                ))}
              </Group>
            </Checkbox.Group>
            <Checkbox.Group
              label="非对称算法"
              value={measured.cryptoAlgorithms.asymmetric}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    cryptoAlgorithms: { ...prev.measuredSystem.cryptoAlgorithms, asymmetric: value }
                  }
                }))
              }
            >
              <Group gap="xs">
                {ASYMMETRIC_ALGORITHM_OPTIONS.map((item) => (
                  <Checkbox key={item} value={item} label={item} />
                ))}
              </Group>
            </Checkbox.Group>
            <Checkbox.Group
              label="杂凑算法"
              value={measured.cryptoAlgorithms.hash}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    cryptoAlgorithms: { ...prev.measuredSystem.cryptoAlgorithms, hash: value }
                  }
                }))
              }
            >
              <Group gap="xs">
                {HASH_ALGORITHM_OPTIONS.map((item) => (
                  <Checkbox key={item} value={item} label={item} />
                ))}
              </Group>
            </Checkbox.Group>
            <Checkbox.Group
              label="序列算法"
              value={measured.cryptoAlgorithms.stream}
              onChange={(value) =>
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    cryptoAlgorithms: { ...prev.measuredSystem.cryptoAlgorithms, stream: value }
                  }
                }))
              }
            >
              <Group gap="xs">
                {STREAM_ALGORITHM_OPTIONS.map((item) => (
                  <Checkbox key={item} value={item} label={item} />
                ))}
              </Group>
            </Checkbox.Group>
            <TextInput
              label="其他算法"
              placeholder="补充填写其他算法"
              value={measured.cryptoAlgorithms.other}
              onChange={(event) => {
                const { value } = event.currentTarget;
                onProjectFormChange((prev) => ({
                  ...prev,
                  measuredSystem: {
                    ...prev.measuredSystem,
                    cryptoAlgorithms: { ...prev.measuredSystem.cryptoAlgorithms, other: value }
                  }
                }));
              }}
            />
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}
