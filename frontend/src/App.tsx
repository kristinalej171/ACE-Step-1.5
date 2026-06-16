import { Header } from '@/components/Header';
import { TaskModeSelector } from '@/features/generation/TaskModeSelector';
import { GenerateForm } from '@/features/generation/GenerateForm';
import { ResultsPanel } from '@/features/results/ResultsPanel';
import { HistoryPanel } from '@/features/history/HistoryPanel';
import { PresetSelector } from '@/features/generation/PresetSelector';
import { VramProfileSelector } from '@/features/generation/VramProfileSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-6">
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <TaskModeSelector />
                  <div className="flex flex-col gap-3 md:items-end">
                    <VramProfileSelector />
                    <PresetSelector />
                  </div>
                </div>

                <GenerateForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <ResultsPanel />
          </TabsContent>

          <TabsContent value="history">
            <HistoryPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}