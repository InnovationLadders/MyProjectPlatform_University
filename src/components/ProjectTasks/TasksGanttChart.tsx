import React, { useMemo, useState } from 'react';
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, isSameDay, min, max } from 'date-fns';
import { Calendar, ZoomIn, ZoomOut, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  progress: number;
  created_at: string;
}

interface TasksGanttChartProps {
  tasks: Task[];
  students: any[];
}

type ViewMode = 'day' | 'week' | 'month';

const TasksGanttChart: React.FC<TasksGanttChartProps> = ({ tasks, students }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const getStudentName = (studentId: string | null) => {
    if (!studentId) return 'غير محدد';
    const studentRecord = students.find(s => s.student_id === studentId);
    return studentRecord?.student?.name || 'غير محدد';
  };

  const ganttData = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;

    const tasksWithDates = tasks.filter(task => task.due_date && task.created_at);
    if (tasksWithDates.length === 0) return null;

    const startDates = tasksWithDates.map(t => parseISO(t.created_at));
    const endDates = tasksWithDates.map(t => parseISO(t.due_date!));

    const minDate = min(startDates);
    const maxDate = max(endDates);

    const chartStartDate = startOfMonth(minDate);
    const chartEndDate = endOfMonth(addDays(maxDate, 7));

    const totalDays = differenceInDays(chartEndDate, chartStartDate);

    const timelineUnits = viewMode === 'day'
      ? eachDayOfInterval({ start: chartStartDate, end: chartEndDate })
      : viewMode === 'week'
      ? eachWeekOfInterval({ start: chartStartDate, end: chartEndDate })
      : (() => {
          const months = [];
          let current = startOfMonth(chartStartDate);
          while (current <= chartEndDate) {
            months.push(current);
            current = addDays(endOfMonth(current), 1);
          }
          return months;
        })();

    const taskBars = tasksWithDates.map(task => {
      const taskStart = parseISO(task.created_at);
      const taskEnd = parseISO(task.due_date!);

      const startOffset = differenceInDays(taskStart, chartStartDate);
      const duration = differenceInDays(taskEnd, taskStart) || 1;

      const leftPercent = (startOffset / totalDays) * 100;
      const widthPercent = (duration / totalDays) * 100;

      let progressPercent = 0;
      if (task.status === 'completed') progressPercent = 100;
      else if (task.status === 'in_progress') progressPercent = 50;

      return {
        task,
        leftPercent,
        widthPercent,
        progressPercent,
        startOffset,
        duration
      };
    });

    return {
      chartStartDate,
      chartEndDate,
      totalDays,
      timelineUnits,
      taskBars,
      today: new Date()
    };
  }, [tasks, viewMode, students]);

  if (!ganttData) {
    return null;
  }

  const todayOffset = differenceInDays(ganttData.today, ganttData.chartStartDate);
  const todayPercent = (todayOffset / ganttData.totalDays) * 100;

  const getPriorityColor = (priority: string, isBackground: boolean = false) => {
    if (isBackground) {
      switch (priority) {
        case 'high': return 'bg-red-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
        default: return 'bg-blue-500';
      }
    } else {
      switch (priority) {
        case 'high': return 'bg-red-100 border-red-300';
        case 'medium': return 'bg-yellow-100 border-yellow-300';
        case 'low': return 'bg-green-100 border-green-300';
        default: return 'bg-blue-100 border-blue-300';
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتملة';
      case 'in_progress': return 'قيد التنفيذ';
      case 'pending': return 'في الانتظار';
      default: return status;
    }
  };

  return (
    <div className="mt-8 border-t pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">المخطط الزمني للمهام (Gantt Chart)</h3>
            <p className="text-sm text-gray-600">عرض جدولة المهام على الخط الزمني</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'day'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            يومي
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            أسبوعي
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            شهري
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <div className="flex">
                <div className="w-64 font-semibold text-gray-700 text-sm">المهمة</div>
                <div className="flex-1 relative">
                  <div className="flex justify-between text-xs text-gray-600">
                    {ganttData.timelineUnits.map((date, idx) => (
                      <div key={idx} className="flex-1 text-center border-r border-gray-200 last:border-r-0 py-1">
                        {viewMode === 'day' && format(date, 'd MMM')}
                        {viewMode === 'week' && format(date, 'd MMM')}
                        {viewMode === 'month' && format(date, 'MMM yyyy')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {ganttData.taskBars.map(({ task, leftPercent, widthPercent, progressPercent }) => (
                <div
                  key={task.id}
                  className="flex items-center px-4 py-4 hover:bg-gray-50 transition-colors"
                  onMouseEnter={() => setHoveredTask(task.id)}
                  onMouseLeave={() => setHoveredTask(null)}
                >
                  <div className="w-64 pr-4">
                    <div className="font-medium text-gray-800 text-sm truncate">{task.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getStudentName(task.assigned_to)}
                    </div>
                  </div>

                  <div className="flex-1 relative h-12">
                    <div
                      className="absolute top-0 h-full"
                      style={{
                        left: `${Math.max(0, leftPercent)}%`,
                        width: `${Math.min(100 - Math.max(0, leftPercent), widthPercent)}%`
                      }}
                    >
                      <div
                        className={`relative h-8 mt-2 rounded-lg border-2 ${getPriorityColor(task.priority)} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
                      >
                        <div
                          className={`absolute inset-0 ${getPriorityColor(task.priority, true)} opacity-80`}
                          style={{ width: `${progressPercent}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-700 px-2 truncate z-10">
                            {progressPercent}%
                          </span>
                        </div>
                      </div>

                      {hoveredTask === task.id && (
                        <div className="absolute top-12 left-0 z-50 bg-gray-900 text-white rounded-lg shadow-xl p-4 min-w-[280px] animate-fade-in">
                          <div className="space-y-2">
                            <div className="font-semibold text-sm border-b border-gray-700 pb-2">{task.title}</div>
                            {task.description && (
                              <div className="text-xs text-gray-300">{task.description}</div>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                              <div>
                                <span className="text-gray-400">الحالة:</span>
                                <span className="mr-1 font-medium">{getStatusText(task.status)}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">الأولوية:</span>
                                <span className="mr-1 font-medium">
                                  {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">البداية:</span>
                                <span className="mr-1">{format(parseISO(task.created_at), 'd/M/yyyy')}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">النهاية:</span>
                                <span className="mr-1">{format(parseISO(task.due_date!), 'd/M/yyyy')}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-400">المسؤول:</span>
                                <span className="mr-1">{getStudentName(task.assigned_to)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {todayPercent >= 0 && todayPercent <= 100 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                        style={{ left: `${todayPercent}%` }}
                      >
                        <div className="absolute -top-2 -right-8 text-xs text-red-600 font-semibold whitespace-nowrap">
                          اليوم
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300"></div>
          <span>أولوية عالية</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300"></div>
          <span>أولوية متوسطة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300"></div>
          <span>أولوية منخفضة</span>
        </div>
        <div className="flex items-center gap-2 mr-auto">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>الشريط الملون يمثل نسبة الإنجاز</span>
        </div>
      </div>
    </div>
  );
};

export default TasksGanttChart;
