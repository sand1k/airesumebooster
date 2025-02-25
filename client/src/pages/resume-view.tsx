import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import PDFViewer from "@/components/pdf-viewer";
import SuggestionCard from "@/components/suggestion-card";
import type { Resume, Suggestion } from "@shared/schema";

export default function ResumeView() {
  const { id } = useParams<{ id: string }>();

  const { data: resume, isLoading: isLoadingResume } = useQuery<Resume>({
    queryKey: [`/api/resumes/${id}`]
  });

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery<Suggestion[]>({
    queryKey: [`/api/resumes/${id}/suggestions`]
  });

  if (isLoadingResume || isLoadingSuggestions) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 gap-8">
            <Card className="h-[800px] animate-pulse bg-muted" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-32 animate-pulse bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <PDFViewer url={resume?.fileUrl || ""} />
            </CardContent>
          </Card>

          <ScrollArea className="h-[800px]">
            <div className="space-y-4 pr-4">
              <h2 className="text-2xl font-bold mb-6">AI Suggestions</h2>
              {suggestions?.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
