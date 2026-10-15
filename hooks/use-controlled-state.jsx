import * as React from 'react';

export function useControlledState(props) {
  const { value, defaultValue, onChange } = props;

  const [state, setInternalState] = React.useState(
    value !== undefined ? value : defaultValue
  );

  // Sync when the controlled value changes — adjust state during render
  // (React-recommended pattern) instead of inside an effect.
  const [prevValue, setPrevValue] = React.useState(value);
  if (value !== undefined && value !== prevValue) {
    setPrevValue(value);
    setInternalState(value);
  }

  const setState = React.useCallback((next, ...args) => {
    setInternalState(next);
    onChange?.(next, ...args);
  }, [onChange]);

  return [state, setState];
}
//hooks folder usually contains reusable custom React hooks.