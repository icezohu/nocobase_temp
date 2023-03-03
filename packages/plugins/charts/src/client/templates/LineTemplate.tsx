import JSON5 from 'json5';
import React from 'react';
import { i18n } from '@nocobase/client';
import { lang } from '../locale';

const validateJSON = {
  validator: `{{(value, rule)=> {
    if (!value) {
      return '';
    }
    try {
      const val = JSON5.parse(value);
      if(!isNaN(val)) {
        return false;
      }
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }}}`,
  message: '{{t("Invalid JSON format",{ ns: "charts" })}}',
};

const chartConfig = {
  _xType: 'Line',
  yField: '{{metric}}',
  xField: '{{dimension}}',
  seriesField: '{{category}}',
  xAxis: {
    //type: 'time',
  },
  yAxis: {
    // label: {
    //   formatter: '{{(v) => `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`)}}',
    // },
  },
};
const arr = [{ a: '1', b: 2, c: 3 }, { a: '2', b: 2, c: 3 }, { a: '3', b: 2, c: 3 }, { a: '4', b: 2, c: 3 }, {
  a: '5',
  b: 2,
  c: 3,
}];
export const lineTemplate = {
  description: '1 「Time」 or 「Order Noun」 field, 1 「Value」 field',
  type: 'Line',
  title: 'Line',
  iconId: 'icon-line',
  group: 2,
  renderComponent: 'G2Plot',
  defaultChartOptions: chartConfig,
  configurableProperties: {
    type: 'void',
    properties: {
      dimension: {
        required: true,
        type: 'string',
        title: '{{t("Category axis / Dimension",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      metric: {
        required: true,
        type: 'string',
        title: '{{t("Value axis / Metrics",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      category: {
        type: 'string',
        title: '{{t("Color legend / Dimensional",{ns:"charts"})}}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: '{{dataSource}}',
      },
      jsonConfig: {
        type: 'void',
        'x-component': 'div',
        properties: {
          template: {
            required: true,
            title: '{{t("JSON config",{ns:"charts"})}}',
            type: 'string',
            default: JSON5.stringify(chartConfig, null, 2),
            'x-decorator': 'FormItem',
            'x-component': 'Input.TextArea',
            'x-component-props': {
              autoSize: { minRows: 8, maxRows: 16 },
            },
            'description':'{{jsonConfigDesc("Line | G2Plot","https://g2plot.antv.antgroup.com/api/plots/line")}}',
            'x-validator': validateJSON,
          },
        },
      },
    },
  },
};