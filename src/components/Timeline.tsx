import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  date?: string;
  completed: boolean;
  current?: boolean;
}

interface TimelineProps {
  steps: TimelineStep[];
}

const Timeline = ({ steps }: TimelineProps) => {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Card key={step.id} className={step.current ? "border-primary shadow-soft" : ""}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full p-2 ${
                    step.completed
                      ? "bg-primary text-primary-foreground"
                      : step.current
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : step.current ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-12 mt-2 ${
                      step.completed ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-4">
                <h3
                  className={`font-semibold ${
                    step.current ? "text-primary" : ""
                  }`}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
                {step.date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {step.date}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Timeline;
