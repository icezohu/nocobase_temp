import { css } from '@emotion/css';
import { FormLayout, FormItem } from '@formily/antd';
import { SchemaInitializerItemOptions, Variable, useCollectionManager } from '@nocobase/client';
import { Evaluator, evaluators, getOptions } from '@nocobase/evaluators/client';
import { parse } from '@nocobase/utils/client';
import { Radio } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFlowContext } from '../FlowContext';
import { RadioWithTooltip } from '../components/RadioWithTooltip';
import { renderEngineReference } from '../components/renderEngineReference';
import { NAMESPACE, lang } from '../locale';
import { BaseTypeSets, useWorkflowVariableOptions } from '../variable';
import { ValueBlock } from '../components/ValueBlock';

function useDynamicExpressionCollectionFieldMatcher(field): boolean {
  const { getCollectionFields } = useCollectionManager();
  if (field.type !== 'belongsTo') {
    return false;
  }

  const fields = getCollectionFields(field.target);
  return fields.some((f) => f.interface === 'expression');
}

const DynamicConfig = ({ value, onChange }) => {
  const { t } = useTranslation();
  const scope = useWorkflowVariableOptions({ types: [useDynamicExpressionCollectionFieldMatcher] });

  return (
    <FormLayout layout="vertical">
      <FormItem colon label={t('Expression type', { ns: NAMESPACE })}>
        <Radio.Group
          value={value === false ? false : value || null}
          onChange={(ev) => {
            onChange(ev.target.value);
          }}
        >
          <Radio value={false}>{t('Static', { ns: NAMESPACE })}</Radio>
          <Radio value={value || null}>{t('Dynamic', { ns: NAMESPACE })}</Radio>
        </Radio.Group>
      </FormItem>
      {value !== false ? (
        <FormItem
          label={t('Select dynamic expression', { ns: NAMESPACE })}
          extra={t(
            'Select the dynamic expression queried from the upstream node. You need to query it from an expression collection.',
            { ns: NAMESPACE },
          )}
        >
          <Variable.Input value={value || null} onChange={(v) => onChange(v)} scope={scope} />
        </FormItem>
      ) : null}
    </FormLayout>
  );
};

function useWorkflowVariableEntityOptions() {
  return useWorkflowVariableOptions({ types: [{ type: 'reference', options: { collection: '*', entity: true } }] });
}

export default {
  title: `{{t("Calculation", { ns: "${NAMESPACE}" })}}`,
  type: 'calculation',
  group: 'control',
  description: `{{t("Calculate an expression based on a calculation engine and obtain a value as the result. Variables in the upstream nodes can be used in the expression. The expression can be static or dynamic one from an expression collections.", { ns: "${NAMESPACE}" })}}`,
  fieldset: {
    dynamic: {
      type: 'string',
      'x-component': 'DynamicConfig',
      // description: `{{t("Select the dynamic expression queried from the upstream node. You need to query it from an expression collection.", { ns: "${NAMESPACE}" })}}`,
      default: false,
    },
    engine: {
      type: 'string',
      title: `{{t("Calculation engine", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'RadioWithTooltip',
      'x-component-props': {
        options: getOptions(),
      },
      required: true,
      default: 'math.js',
      'x-reactions': {
        dependencies: ['dynamic'],
        fulfill: {
          state: {
            visible: '{{$deps[0] === false}}',
          },
        },
      },
    },
    expression: {
      type: 'string',
      title: `{{t("Calculation expression", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.TextArea',
      'x-component-props': {
        scope: '{{useWorkflowVariableOptions}}',
      },
      ['x-validator'](value, rules, { form }) {
        const { values } = form;
        const { evaluate } = evaluators.get(values.engine) as Evaluator;
        const exp = value.trim().replace(/{{([^{}]+)}}/g, ' 1 ');
        try {
          evaluate(exp);
          return '';
        } catch (e) {
          return lang('Expression syntax error');
        }
      },
      'x-reactions': [
        {
          dependencies: ['dynamic'],
          fulfill: {
            state: {
              visible: '{{$deps[0] === false}}',
            },
          },
        },
        {
          dependencies: ['engine'],
          fulfill: {
            schema: {
              description: '{{renderEngineReference($deps[0])}}',
            },
          },
        },
      ],
      required: true,
    },
    scope: {
      type: 'string',
      title: `{{t("Variable datasource", { ns: "${NAMESPACE}" })}}`,
      'x-decorator': 'FormItem',
      'x-component': 'Variable.Input',
      'x-component-props': {
        scope: '{{useWorkflowVariableEntityOptions}}',
      },
      'x-reactions': {
        dependencies: ['dynamic'],
        fulfill: {
          state: {
            visible: '{{$deps[0] !== false}}',
          },
        },
      },
    },
  },
  view: {},
  scope: {
    useWorkflowVariableOptions,
    useWorkflowVariableEntityOptions,
    renderEngineReference,
  },
  components: {
    CalculationResult({ dataSource }) {
      const { execution } = useFlowContext();
      if (!execution) {
        return lang('Calculation result');
      }
      const result = parse(dataSource)({
        $jobsMapByNodeId: (execution.jobs ?? []).reduce(
          (map, job) => Object.assign(map, { [job.nodeId]: job.result }),
          {},
        ),
      });

      return (
        <pre
          className={css`
            margin: 0;
          `}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      );
    },
    RadioWithTooltip,
    DynamicConfig,
  },
  useVariables(current, options) {
    const { types } = options ?? {};
    if (
      types &&
      !types.some((type) => type in BaseTypeSets || Object.values(BaseTypeSets).some((set) => set.has(type)))
    ) {
      return null;
    }
    return [
      // { key: '', value: '', label: lang('Calculation result') }
    ];
  },
  useInitializers(node): SchemaInitializerItemOptions {
    return {
      type: 'item',
      title: node.title ?? `#${node.id}`,
      component: ValueBlock.Initializer,
      node,
      resultTitle: lang('Calculation result'),
    };
  },
};
