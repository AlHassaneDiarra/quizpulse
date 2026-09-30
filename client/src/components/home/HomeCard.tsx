import type { ReactNode } from "react";
import { Card } from "../ui";

interface HomeCardProps {
  children: ReactNode;
}

function HomeCard({ children }: HomeCardProps) {
  return (
    <Card className="w-full max-w-md p-8">
      {children}
    </Card>
  );
}

export default HomeCard;