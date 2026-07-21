import React from 'react';
import Svg, { Circle, Ellipse } from 'react-native-svg';
import { colors } from '../theme/colors';

type Props = {
  size?: number;
  color?: string;
};

/** The paw logo mark — four toes over a pad. Ported from the design's inline SVG. */
export function PawMark({ size = 52, color = colors.mint }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={8} cy={8} r={2.2} fill={color} />
      <Circle cx={16} cy={8} r={2.2} fill={color} />
      <Circle cx={4.5} cy={13} r={2} fill={color} />
      <Circle cx={19.5} cy={13} r={2} fill={color} />
      <Ellipse cx={12} cy={16.5} rx={4.5} ry={3.8} fill={color} />
    </Svg>
  );
}
