'use client';;
import * as React from 'react';
import { motion } from 'motion/react';

import { Slot } from '@/components/animate-ui/primitives/animate/slot';

function Button({
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  ...props
}) {
  const Component = asChild ? Slot : motion.button;

  const { asChild: _removeAsChild, ...forwardProps } = props;

  return (
    <Component
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      {...forwardProps} />
  );
}

export { Button };
