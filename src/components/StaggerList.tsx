import { type ReactNode, Children, isValidElement, cloneElement } from 'react';

interface StaggerListProps {
  children: ReactNode;
  gap?: number;
  className?: string;
}

export default function StaggerList({ children, gap = 60, className = '' }: StaggerListProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;
        const props = child.props as Record<string, unknown>;
        return cloneElement(child, {
          ...props,
          style: {
            ...(props.style as Record<string, unknown> | undefined),
            animationDelay: `${i * gap}ms`,
          },
        } as Record<string, unknown>);
      })}
    </div>
  );
}
