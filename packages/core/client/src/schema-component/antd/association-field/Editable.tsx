import { Field } from '@formily/core';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import React from 'react';
import { SchemaComponentOptions } from '../../';
import { useAssociationCreateActionProps as useCAP } from '../../../block-provider/hooks';
import { AssociationFieldProvider } from './AssociationFieldProvider';
import { AssociationSelect } from './AssociationSelect';
import { InternalFileManager } from './FileManager';
import { InternalNester } from './InternalNester';
import { InternalPicker } from './InternalPicker';
import { InternalSubTable } from './InternalSubTable';
import { CreateRecordAction } from './components/CreateRecordAction';
import { useAssociationFieldContext } from './hooks';

const EditableAssociationField = observer((props: any) => {
  const { multiple } = props;
  const field: Field = useField();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const { options: collectionField, currentMode } = useAssociationFieldContext();

  const useCreateActionProps = () => {
    const { onClick } = useCAP();
    const actionField: any = useField();
    return {
      async onClick() {
        await onClick();
        const { data } = actionField.data?.data?.data || {};
        if (data) {
          if (['m2m', 'o2m'].includes(collectionField?.interface) && multiple !== false) {
            const values = form.getValuesIn(field.path) || [];
            values.push(data);
            form.setValuesIn(field.path, values);
            field.onInput(values);
          } else {
            form.setValuesIn(field.path, data);
            field.onInput(data);
          }
        }
      },
    };
  };

  return (
    <SchemaComponentOptions scope={{ useCreateActionProps }} components={{ CreateRecordAction }}>
      {currentMode === 'Picker' && <InternalPicker {...props} />}
      {currentMode === 'Nester' && <InternalNester {...props} />}
      {currentMode === 'Select' && <AssociationSelect {...props} />}
      {currentMode === 'SubTable' && <InternalSubTable {...props} />}
      {currentMode === 'FileManager' && <InternalFileManager {...props} />}
    </SchemaComponentOptions>
  );
});

export const Editable = observer((props) => {
  return (
    <AssociationFieldProvider>
      <EditableAssociationField {...props} />
    </AssociationFieldProvider>
  );
});
