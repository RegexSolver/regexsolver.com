import * as React from "react";
import RouterLink from "next/link";

export interface LinkProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  to: string;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, children, ...props }, ref) => {
    const isExternal = to.startsWith("http") || to.startsWith("//");

    if (isExternal) {
      return (
        <a href={to} ref={ref} {...props}>
          {children}
        </a>
      );
    }

    return (
      <RouterLink href={to} ref={ref} {...props}>
        {children}
      </RouterLink>
    );
  },
);

Link.displayName = "Link";
