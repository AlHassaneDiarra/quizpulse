import type { HTMLAttributes } from "react";

function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;