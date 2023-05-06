import { RecursionField, useField, useFieldSchema, observer } from '@formily/react';
import { Button, Input, Select } from 'antd';
import React, { useState, useEffect, useContext } from 'react';
import { differenceBy, unionBy } from 'lodash';
import { ActionContext } from '../action';
import { useInsertSchema, useFieldNames } from './hooks';
import schema from './schema';
import { useCompile } from '../../hooks';
import { useCollection, CollectionProvider, useCollectionManager } from '../../../collection-manager';
import {
  RecordPickerProvider,
  SchemaComponentOptions,
  RecordPickerContext,
  useActionContext,
  FormProvider,
} from '../../';
import {
  TableSelectorParamsProvider,
  useTableSelectorProps as useTsp,
} from '../../../block-provider/TableSelectorProvider';
import { FileSelector } from '../preview';
import { getLabelFormatValue, useLabelUiSchema } from './util';

function flatData(data) {
  const newArr = [];
  for (let i = 0; i < data.length; i++) {
    const children = data[i]['children'];
    if (Array.isArray(children)) {
      newArr.push(...flatData(children));
    }
    newArr.push({ ...data[i] });
  }
  return newArr;
}

const useTableSelectorProps = () => {
  const field: any = useField();
  const {
    multiple,
    options = [],
    setSelectedRows,
    selectedRows: rcSelectRows = [],
    onChange,
  } = useContext(RecordPickerContext);
  const { onRowSelectionChange, rowKey = 'id', ...others } = useTsp();
  const { setVisible } = useActionContext();
  return {
    ...others,
    rowKey,
    rowSelection: {
      type: multiple ? 'checkbox' : 'radio',
      selectedRowKeys: rcSelectRows
        ?.filter((item) => options.every((row) => row[rowKey] !== item[rowKey]))
        .map((item) => item[rowKey]),
    },
    onRowSelectionChange(selectedRowKeys, selectedRows) {
      if (multiple) {
        const scopeRows = flatData(field.value) || [];
        const allSelectedRows = rcSelectRows || [];
        const otherRows = differenceBy(allSelectedRows, scopeRows, rowKey);
        const unionSelectedRows = unionBy(otherRows, selectedRows, rowKey);
        const unionSelectedRowKeys = unionSelectedRows.map((item) => item[rowKey]);
        setSelectedRows?.(unionSelectedRows);
        onRowSelectionChange?.(unionSelectedRowKeys, unionSelectedRows);
      } else {
        setSelectedRows?.(selectedRows);
        onRowSelectionChange?.(selectedRowKeys, selectedRows);
        onChange(selectedRows?.[0] || null);
        setVisible(false);
      }
    },
  };
};

export const InternalSelect = observer((props: any) => {
  const { value, multiple, onChange, quickUpload, selectFile, ...others } = props;
  const field: any = useField();
  const fieldNames = useFieldNames(props);
  const { getCollection } = useCollectionManager();
  const [visibleAddNewer, setVisibleAddNewer] = useState(false);
  const [visibleSelector, setVisibleSelector] = useState(false);
  const fieldSchema = useFieldSchema();
  const insertAddNewer = useInsertSchema('AddNewer');
  const insertSelector = useInsertSchema('Selector');
  const { getField } = useCollection();
  const collectionField = getField(field.props.name);
  const addbuttonClick = () => {
    insertAddNewer(schema.AddNewer);
    setVisibleAddNewer(true);
  };
  const compile = useCompile();
  const labelUiSchema = useLabelUiSchema(collectionField, fieldNames?.label || 'label');
  const showFilePicker = getCollection(collectionField?.target).template === 'file';
  const isAllowAddNew = fieldSchema['x-add-new'] !== false;
  const [selectedRows, setSelectedRows] = useState([]);
  const [options, setOptions] = useState([]);
  const pickerProps = {
    size: 'small',
    fieldNames,
    multiple: ['o2m', 'm2m'].includes(collectionField?.interface),
    association: {
      target: collectionField?.target,
    },
    onChange: props?.onChange,
    selectedRows,
    setSelectedRows,
  };
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      const opts = (Array.isArray(value) ? value : value ? [value] : []).map((option) => {
        const label = option[fieldNames.label];
        return {
          ...option,
          [fieldNames.label]: getLabelFormatValue(labelUiSchema, compile(label)),
        };
      });
      setOptions(opts);
    }
  }, [value, fieldNames?.label]);

  const getValue = () => {
    if (multiple == null) return null;
    return Array.isArray(value) ? value?.map((v) => v[fieldNames.value]) : value?.[fieldNames.value];
  };

  const handleSelect = () => {
    setVisibleSelector(true);
    setSelectedRows([]);
  };

  const handleRemove = (file) => {
    const newOptions = options.filter((option) => option.id !== file.id);
    setOptions(newOptions);
    if (newOptions.length === 0) {
      return onChange(null);
    }
    onChange(newOptions);
  };
  const getFilter = () => {
    const targetKey = collectionField?.targetKey || 'id';
    const list = options.map((option) => option[targetKey]).filter(Boolean);
    const filter = list.length ? { $and: [{ [`${targetKey}.$ne`]: list }] } : {};
    return filter;
  };
  const usePickActionProps = () => {
    const { setVisible } = useActionContext();
    const { multiple, selectedRows, onChange, options, collectionField } = useContext(RecordPickerContext);
    return {
      onClick() {
        if (multiple) {
          onChange(unionBy(selectedRows, options, collectionField?.targetKey || 'id'));
        } else {
          onChange(selectedRows?.[0] || null);
        }
        setVisible(false);
      },
    };
  };
  return (
    <>
      <Input.Group compact style={{ display: 'flex' }}>
        <div style={{ width: '100%' }}>
          {showFilePicker ? (
            <FileSelector
              value={options}
              multiple={multiple}
              quickUpload={quickUpload !== false}
              selectFile={selectFile !== false}
              action={`${collectionField?.target}:create`}
              onSelect={handleSelect}
              onRemove={handleRemove}
              onChange={(changed) => {
                if (changed.every((file) => file.status !== 'uploading')) {
                  changed = changed.filter((file) => file.status === 'done').map((file) => file.response.data);
                  if (multiple) {
                    onChange([...options, ...changed]);
                  } else {
                    onChange(changed[0]);
                  }
                }
              }}
            />
          ) : (
            <Select
              style={{ width: '100%' }}
              {...others}
              mode={multiple ? 'multiple' : props.mode}
              fieldNames={fieldNames}
              onDropdownVisibleChange={(open) => {
                insertSelector(schema.Selector);
                setVisibleSelector(true);
              }}
              allowClear
              onChange={(changed: any) => {
                if (!changed) {
                  const value = multiple ? [] : null;
                  onChange(value);
                  setSelectedRows(value);
                } else if (Array.isArray(changed)) {
                  if (!changed.length) {
                    onChange([]);
                    setSelectedRows([]);
                    return;
                  }
                  const values = options?.filter((option) => changed.includes(option[fieldNames.value]));
                  onChange(values);
                  setSelectedRows(values);
                }
              }}
              options={options}
              value={getValue()}
              open={false}
            />
          )}
        </div>
        {isAllowAddNew && (
          <Button
            style={{ width: '15%' }}
            type={'primary'}
            onClick={() => {
              addbuttonClick();
            }}
          >
            Add new
          </Button>
        )}
      </Input.Group>
      <ActionContext.Provider value={{ openMode: 'drawer', visible: visibleAddNewer, setVisible: setVisibleAddNewer }}>
        <CollectionProvider name={collectionField.target}>
          <RecursionField
            onlyRenderProperties
            basePath={field.address}
            schema={fieldSchema}
            filterProperties={(s) => {
              return s['x-component'] === 'AssociationField.AddNewer';
            }}
          />
        </CollectionProvider>
      </ActionContext.Provider>
      <ActionContext.Provider value={{ openMode: 'drawer', visible: visibleSelector, setVisible: setVisibleSelector }}>
        <RecordPickerProvider {...pickerProps}>
          <CollectionProvider name={collectionField.target}>
            <FormProvider>
              <TableSelectorParamsProvider params={{ filter: getFilter() }}>
                <SchemaComponentOptions scope={{ usePickActionProps, useTableSelectorProps }}>
                  <RecursionField
                    onlyRenderProperties
                    basePath={field.address}
                    schema={fieldSchema}
                    filterProperties={(s) => {
                      return s['x-component'] === 'AssociationField.Selector';
                    }}
                  />
                </SchemaComponentOptions>
              </TableSelectorParamsProvider>
            </FormProvider>
          </CollectionProvider>
        </RecordPickerProvider>
      </ActionContext.Provider>
    </>
  );
});