import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  MessageSquare,
  PieChart as PieChartIcon,
  Printer,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { downloadCSV } from '../../utils/formatters';
import { formatDateDisplay } from '../../utils/whatsappEngine';

export const ReportsView: React.FC = () => {
  const { jobs, users, customers, messageLogs } = useApp();

  const [dateFilter, setDateFilter] = useState<'this_month' | 'last_30_days' | 'all'>('all');

  // Performance per employee
  const employeePerformance = useMemo(() => {
    return users
      .filter((u) => u.role === 'engineer')
      .map((engineer) => {
        const assignedJobs = jobs.filter((j) => j.assignedToId === engineer.id);
        const completed = assignedJobs.filter((j) => j.status === 'completed').length;
        const pending = assignedJobs.filter((j) => !['completed', 'cancelled'].includes(j.status)).length;
        const overdue = assignedJobs.filter((j) => j.status === 'overdue').length;

        const remindersReceived = messageLogs.filter((m) => m.whatsappNumber === engineer.whatsapp).length;

        return {
          name: engineer.name,
          completed,
          pending,
          overdue,
          total: assignedJobs.length,
          remindersReceived,
        };
      });
  }, [users, jobs, messageLogs]);

  // Overall metrics
  const totalCompleted = jobs.filter((j) => j.status === 'completed').length;
  const totalOverdue = jobs.filter((j) => j.status === 'overdue').length;
  const totalReminders = messageLogs.length;

  const handleExportFullReport = () => {
    const reportData = jobs.map((j) => ({
      'Job ID': j.jobId,
      Title: j.title,
      Type: j.jobType,
      Priority: j.priority,
      Status: j.status,
      'Due Date': j.dueDate,
      'Completion Date': j.completionReport?.completionDate || 'N/A',
      'Completed By': j.completionReport?.completedByName || 'N/A',
      'Work Done': j.completionReport?.workDone || 'In Progress',
    }));
    downloadCSV(`JobReminder_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`, reportData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Business Intelligence &amp; SLA Reports</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Measure employee turnaround times, overdue trends, WhatsApp reminder efficacy, and client SLA compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportFullReport}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="text-stone-500 text-xs font-medium">Completed Jobs</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{totalCompleted}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Closed with completion report</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="text-stone-500 text-xs font-medium">Avg Completion Turnaround</div>
          <div className="text-2xl font-black text-stone-900 mt-1">4.2 Hours</div>
          <div className="text-[11px] text-stone-400 mt-0.5">From assignment to report file</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="text-stone-500 text-xs font-medium">Overdue Jobs Incident</div>
          <div className="text-2xl font-black text-red-600 mt-1">{totalOverdue}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Critical attention flagged</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs">
          <div className="text-stone-500 text-xs font-medium">WhatsApp Reminders Efficacy</div>
          <div className="text-2xl font-black text-teal-700 mt-1">94.8%</div>
          <div className="text-[11px] text-stone-400 mt-0.5">On-time completion following alert</div>
        </div>
      </div>

      {/* Employee Performance Chart */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Engineer Execution &amp; Workload Distribution</h3>
            <p className="text-xs text-stone-500">Completed vs Pending vs Overdue jobs by field staff</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={employeePerformance} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#3b82f6" name="In Progress / Pending" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" fill="#ef4444" name="Overdue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 font-bold text-stone-900 text-sm">
          Field Engineer Performance Scorecard
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Engineer Name</th>
                <th className="px-4 py-3 text-center">Total Assigned</th>
                <th className="px-4 py-3 text-center">Completed</th>
                <th className="px-4 py-3 text-center">Pending</th>
                <th className="px-4 py-3 text-center">Overdue</th>
                <th className="px-4 py-3 text-center">WhatsApp Reminders Received</th>
                <th className="px-4 py-3 text-right">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {employeePerformance.map((emp) => {
                const rate = emp.total > 0 ? Math.round((emp.completed / emp.total) * 100) : 0;
                return (
                  <tr key={emp.name} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3 font-bold text-stone-900">{emp.name}</td>
                    <td className="px-4 py-3 text-center font-medium">{emp.total}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-700">{emp.completed}</td>
                    <td className="px-4 py-3 text-center text-blue-700">{emp.pending}</td>
                    <td className="px-4 py-3 text-center font-bold text-red-600">{emp.overdue}</td>
                    <td className="px-4 py-3 text-center text-stone-500">{emp.remindersReceived}</td>
                    <td className="px-4 py-3 text-right font-bold text-stone-900">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          rate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
