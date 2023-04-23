import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '@nocobase/client';
import React from 'react';
import { useTranslation } from '../../../../locale';
import { SSSwitchItem } from '../../settings';
import { Schema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useHistory } from 'react-router-dom';

const findGridSchema = (schema: Schema) => {
  const gridSchema = schema.reduceProperties(
    (schema, next) => schema || (next['x-component'] === 'Grid' && next),
  ) as Schema;
  return gridSchema;
};

export const ContainerDesigner = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const tabBarSchema = fieldSchema.reduceProperties(
    (schema, next) => schema || (next['x-component'] === 'MTabBar' && next),
  ) as Schema;

  const history = useHistory();
  return (
    <GeneralSchemaDesigner draggable={false}>
      <SSSwitchItem name="application" title={t('Enable application info')} />
      <SchemaSettings.SwitchItem
        checked={!!tabBarSchema}
        title={t('Enable TabBar')}
        onChange={async (v) => {
          if (v) {
            const gridSchema = findGridSchema(fieldSchema);
            await dn.remove(gridSchema);
            await dn.insertBeforeEnd({
              type: 'void',
              'x-component': 'MTabBar',
              'x-component-props': {},
              name: 'tabBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'MTabBar.Item',
                  'x-designer': 'MTabBar.Item.Designer',
                  'x-component-props': {
                    icon: 'HomeOutlined',
                    title: t('Home'),
                  },
                  properties: {
                    grid: gridSchema,
                  },
                },
              },
            });
          } else {
            const gridSchema = findGridSchema(tabBarSchema.properties[Object.keys(tabBarSchema.properties)[0]]);
            await dn.remove(tabBarSchema);
            await dn.insertBeforeEnd(gridSchema, {
              onSuccess() {
                history.push('../');
              },
            });
          }
        }}
      />
    </GeneralSchemaDesigner>
  );
};
