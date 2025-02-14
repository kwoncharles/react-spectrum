import {GridCollection} from '@react-types/grid';
import {Key, useEffect, useMemo} from 'react';
import {MultipleSelection} from '@react-types/shared';
import {SelectionManager, useMultipleSelectionState} from '@react-stately/selection';

export interface GridState<T, C extends GridCollection<T>> {
  collection: C,
  /** A set of keys for rows that are disabled. */
  disabledKeys: Set<Key>,
  /** A selection manager to read and update row selection state. */
  selectionManager: SelectionManager
}

interface GridStateOptions<T, C extends GridCollection<T>> extends MultipleSelection {
  collection: C,
  disabledKeys?: Iterable<Key>,
  focusMode?: 'row' | 'cell',
  allowsCellSelection?: boolean
}

/**
 * Provides state management for a grid component. Handles row selection and focusing a grid cell's focusable child if applicable.
 */
export function useGridState<T extends object, C extends GridCollection<T>>(props: GridStateOptions<T, C>): GridState<T, C> {
  let {collection, focusMode, allowsCellSelection = false} = props;
  let selectionState = useMultipleSelectionState(props);
  let disabledKeys = useMemo(() =>
      props.disabledKeys ? new Set(props.disabledKeys) : new Set<Key>()
    , [props.disabledKeys]);

  let setFocusedKey = selectionState.setFocusedKey;
  selectionState.setFocusedKey = (key, child) => {
    // If focusMode is cell and an item is focused, focus a child cell instead.
    if (focusMode === 'cell' && key != null) {
      let item = collection.getItem(key);
      if (item?.type === 'item') {
        let children = [...item.childNodes];
        if (child === 'last') {
          key = children[children.length - 1]?.key;
        } else {
          key = children[0]?.key;
        }
      }
    }

    setFocusedKey(key, child);
  };

  // Reset focused key if that item is deleted from the collection.
  useEffect(() => {
    if (selectionState.focusedKey != null && !collection.getItem(selectionState.focusedKey)) {
      selectionState.setFocusedKey(null);
    }
  }, [collection, selectionState.focusedKey]);

  return {
    collection,
    disabledKeys,
    selectionManager: new SelectionManager(collection, selectionState, {allowsCellSelection})
  };
}
