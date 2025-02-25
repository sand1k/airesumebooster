import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Suggestion } from "@shared/schema";

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export default function SuggestionCard({ suggestion }: SuggestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Badge>{suggestion.category}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-mono">{suggestion.content}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Suggested Improvement:</h4>
          <p className="text-sm text-muted-foreground">{suggestion.improvement}</p>
        </div>
      </CardContent>
    </Card>
  );
}
