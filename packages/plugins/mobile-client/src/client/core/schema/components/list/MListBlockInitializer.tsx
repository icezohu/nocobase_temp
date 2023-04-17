import React from 'react';
import { TableOutlined } from '@ant-design/icons';
import { DataBlockInitializer, useCollectionManager } from '@nocobase/client';

export const MListBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'Details'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        // const schema = createDetailsBlockSchema({
        //   collection: item.name,
        //   rowKey: collection.filterTargetKey || 'id',
        //   actionInitializers: collection.template !== 'view' && 'DetailsActionInitializers',
        // });
        // insert(schema);
      }}
    />
  );
};