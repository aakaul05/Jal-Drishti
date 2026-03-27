import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDashboard } from '@/context/DashboardContext';

export function MonthYearSelector() {
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useDashboard();
  
  const currentYear = new Date().getFullYear();
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Generate years: current year + 1 year prediction
  const years = Array.from({ length: 2 }, (_, i) => currentYear + i);

  return (
    <div className="glass rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-cyan-glow" />
        <h3 className="text-sm font-semibold text-foreground">Time Period Selection</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Month Selector */}
        <div>
          <Label htmlFor="month-select" className="text-xs text-muted-foreground mb-1 block">
            Month
          </Label>
          <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(value ? parseInt(value) : null)}>
            <SelectTrigger id="month-select" className="bg-secondary/50 border-border/50 text-sm">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Selector */}
        <div>
          <Label htmlFor="year-select" className="text-xs text-muted-foreground mb-1 block">
            Year
          </Label>
          <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(value ? parseInt(value) : null)}>
            <SelectTrigger id="year-select" className="bg-secondary/50 border-border/50 text-sm">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year} {year === currentYear ? '(Current)' : '(Prediction)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selection Summary */}
      {(selectedMonth && selectedYear) && (
        <div className="mt-3 p-2 bg-secondary/30 rounded-lg border border-border/30">
          <p className="text-xs text-muted-foreground text-center">
            {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            {selectedYear > currentYear && (
              <span className="ml-1 text-neon-green font-medium">• Predicted</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
