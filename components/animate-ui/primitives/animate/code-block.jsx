'use client';;
import * as React from 'react';

import { useIsInView } from '@/hooks/use-is-in-view';

function CodeBlock({
  ref,
  code,
  lang,
  theme = 'light',

  themes = {
    light: 'github-light',
    dark: 'github-dark',
  },

  writing = false,
  duration = 5000,
  delay = 0,
  onDone,
  onWrite,
  scrollContainerRef,
  inView = false,
  inViewOnce = true,
  inViewMargin = '0px',
  ...props
}) {
  const { ref: localRef, isInView } = useIsInView(ref, {
    inView,
    inViewOnce,
    inViewMargin,
  });

  const [visibleCode, setVisibleCode] = React.useState('');
  const [highlightedCode, setHighlightedCode] = React.useState('');
  const [isDone, setIsDone] = React.useState(false);

  React.useEffect(() => {
    if (!visibleCode.length || !isInView) return;

    const loadHighlightedCode = async () => {
      try {
        const { codeToHtml } = await import('shiki');

        const highlighted = await codeToHtml(visibleCode, {
          lang,
          themes,
          defaultColor: theme,
        });

        setHighlightedCode(highlighted);
      } catch (e) {
        console.error(`Language "${lang}" could not be loaded.`, e);
      }
    };

    loadHighlightedCode();
  }, [lang, themes, writing, isInView, duration, delay, visibleCode, theme]);

  React.useEffect(() => {
    if (!writing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleCode(code);
      onDone?.();
      onWrite?.({ index: code.length, length: code.length, done: true });
      return;
    }

    if (!code.length || !isInView) return;

    const characters = Array.from(code);
    let index = 0;
    const totalDuration = duration;
    const interval = totalDuration / characters.length;
    let intervalId;

    const timeout = setTimeout(() => {
      intervalId = setInterval(() => {
        if (index < characters.length) {
          setVisibleCode(() => {
            const nextChar = characters.slice(0, index + 1).join('');
            onWrite?.({
              index: index + 1,
              length: characters.length,
              done: false,
            });
            index += 1;
            return nextChar;
          });
          localRef.current?.scrollTo({
            top: localRef.current?.scrollHeight,
            behavior: 'smooth',
          });
        } else {
          clearInterval(intervalId);
          setIsDone(true);
          onDone?.();
          onWrite?.({
            index: characters.length,
            length: characters.length,
            done: true,
          });
        }
      }, interval);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, [code, duration, delay, isInView, writing, onDone, onWrite, localRef]);

  React.useEffect(() => {
    if (!writing || !isInView) return;
    const el =
      scrollContainerRef?.current ??
      (localRef.current?.parentElement) ??
      (localRef.current);

    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [highlightedCode, writing, isInView, scrollContainerRef, localRef]);

  return (
    <div
      ref={localRef}
      data-slot="code-block"
      data-writing={writing}
      data-done={isDone}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
      {...props} />
  );
}

export { CodeBlock };
