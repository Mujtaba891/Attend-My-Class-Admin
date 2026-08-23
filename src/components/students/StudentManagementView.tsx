import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Users,
  ShieldAlert,
  Smartphone,
  Filter,
  AlertTriangle,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  LayoutGrid,
  List,
  RotateCcw,
  CheckSquare,
  Square,
  MoreVertical,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { useAuth } from '../../context/AuthContext';
import { Student } from '../../types';
import { StatusBadge } from '../common/Badge';
import { StudentProfileModal } from './StudentProfileModal';
import { AddStudentModal } from './AddStudentModal';
import { EditStudentModal } from './EditStudentModal';
import { DeleteStudentConfirmModal } from './DeleteStudentConfirmModal';
import { ImportStudentsModal } from './ImportStudentsModal';

export const StudentManagementView: React.FC = () => {
  const {
    students,
    getStudentStats,
    toggleAccountStatus,
    bulkUpdateStudentStatus,
    resetDeviceBinding,
    reactivateAndBindToCurrentPhone,
  } = useAttendance();
  const { currentRole } = useAuth();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'locked' | 'defaulters'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [actionToast, setActionToast] = useState<string | null>(null);

  const handleBindCurrentPhone = (student: Student) => {
    reactivateAndBindToCurrentPhone(student.id);
    const attemptedModel = student.lastMismatchDetails?.attemptedDeviceModel || 'Current Phone';
    setActionToast(`Account reactivated & bound to ${attemptedModel} for ${student.fullName}!`);
    setTimeout(() => setActionToast(null), 4500);
  };

  const handleResetBinding = (student: Student) => {
    resetDeviceBinding(student.id);
    setActionToast(`Device binding cleared for ${student.fullName}. Account active for automatic binding on next sign-in.`);
    setTimeout(() => setActionToast(null), 4500);
  };

  // Selected students for batch actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modals state
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<Student | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Compute student cards with stats
  const enrichedStudents = useMemo(() => {
    return students.map(student => ({
      student,
      stats: getStudentStats(student.id),
    }));
  }, [students, getStudentStats]);

  // Filtered list
  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter(({ student, stats }) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        student.fullName.toLowerCase().includes(q) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(q)) ||
        student.email.toLowerCase().includes(q) ||
        (student.phone && student.phone.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (sectionFilter !== 'all' && student.section !== sectionFilter) {
        return false;
      }

      if (statusFilter === 'active' && student.accountStatus !== 'active') return false;
      if (statusFilter === 'locked' && student.accountStatus !== 'locked') return false;
      if (statusFilter === 'defaulters' && !stats.isDefaulter) return false;

      return true;
    });
  }, [enrichedStudents, searchQuery, statusFilter, sectionFilter]);

  const lockedCount = students.filter(s => s.accountStatus === 'locked').length;
  const defaulterCount = enrichedStudents.filter(s => s.stats.isDefaulter).length;

  // Batch selection helpers
  const allFilteredIds = useMemo(() => filteredStudents.map(f => f.student.id), [filteredStudents]);
  const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedStudentIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Selected students objects
  const selectedStudentsList = useMemo(() => {
    return students.filter(s => selectedStudentIds.includes(s.id));
  }, [students, selectedStudentIds]);

  // Export to CSV helper
  const handleExportCSV = (exportSelectedOnly = false) => {
    const listToExport = exportSelectedOnly && selectedStudentsList.length > 0 ? selectedStudentsList : filteredStudents.map(f => f.student);
    if (listToExport.length === 0) return;

    const headers = ['Full Name', 'Roll Number', 'Registration No', 'Email', 'Phone', 'Section', 'Batch', 'Course', 'Account Status', 'Attendance %', 'Attended', 'Total Classes', 'Device Model'];
    const rows = listToExport.map(s => {
      const stats = getStudentStats(s.id);
      return [
        `"${s.fullName}"`,
        `"${s.rollNumber || s.studentId}"`,
        `"${s.registrationNumber || ''}"`,
        `"${s.email}"`,
        `"${s.phone || ''}"`,
        `"${s.section}"`,
        `"${s.batch}"`,
        `"${s.course}"`,
        `"${s.accountStatus}"`,
        `"${stats.percentage}%"`,
        `"${stats.present}"`,
        `"${stats.totalClasses}"`,
        `"${s.authorizedDeviceModel || 'None'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AttendMyClass_Students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Academic Student Directory
            </span>
            <span className="text-xs text-slate-400">{students.length} Total Enrolled</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-heading mt-1">
            Student Management & Directory
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Enroll, update, delete student records, configure single-device locks, and track the 75% attendance criteria.
          </p>
        </div>

        {currentRole === 'admin' && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => handleExportCSV(false)}
              className="flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Feedback Toast */}
      {actionToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button
            onClick={() => setActionToast(null)}
            className="text-emerald-400/70 hover:text-emerald-200 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Batch Action Toolbar when 1+ students are selected */}
      {selectedStudentIds.length > 0 && currentRole === 'admin' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{selectedStudentIds.length} students selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => bulkUpdateStudentStatus(selectedStudentIds, 'active')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock Selected</span>
            </button>

            <button
              onClick={() => bulkUpdateStudentStatus(selectedStudentIds, 'locked', 'Bulk lock by admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Selected</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export ({selectedStudentIds.length})</span>
            </button>

            <button
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedStudentIds.length})</span>
            </button>

            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({students.length})
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Active Accounts
          </button>

          <button
            onClick={() => setStatusFilter('locked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'locked'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Locked ({lockedCount})
          </button>

          <button
            onClick={() => setStatusFilter('defaulters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'defaulters'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Defaulters &lt;75% ({defaulterCount})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Section Dropdown */}
          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Search name / roll / email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Compact Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk selection toggle row for quick check */}
      {currentRole === 'admin' && filteredStudents.length > 0 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-400">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Select All {filteredStudents.length} Students in View</span>
          </button>

          <span>Showing {filteredStudents.length} of {students.length} students</span>
        </div>
      )}

      {/* Grid or Table Directory Display */}
      {filteredStudents.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-slate-400">No students found matching criteria.</p>
          <p className="mt-1 text-slate-500">Enroll new students or adjust your search / section filters.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(({ student, stats }) => {
            const isLocked = student.accountStatus === 'locked';
            const isSelected = selectedStudentIds.includes(student.id);

            return (
              <div
                key={student.id}
                className={`p-4 sm:p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between relative ${
                  isSelected
                    ? 'border-emerald-500/60 bg-emerald-950/15 shadow-md shadow-emerald-950/30'
                    : isLocked
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {currentRole === 'admin' && (
                        <button
                          onClick={() => toggleSelectStudent(student.id)}
                          className="cursor-pointer text-slate-400 hover:text-emerald-400"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      )}

                      <img
                        src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={student.fullName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-10 sm:h-12 rounded-xl object-cover border border-slate-700 shadow"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 font-heading">
                          {student.fullName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-emerald-400 font-semibold">
                            {student.rollNumber || student.studentId}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Sec {student.section}
                          </span>
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={student.accountStatus} variant="account" />
                  </div>

                  {/* Attendance % Metric */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Overall Attendance
                      </span>
                      <span
                        className={`text-base sm:text-lg font-black font-heading ${
                          stats.isDefaulter ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {stats.percentage}%
                      </span>
                    </div>

                    <div className="text-right text-xs">
                      <div className="text-slate-300 font-semibold">
                        {stats.present} / {stats.totalClasses} classes
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {stats.isDefaulter ? '⚠️ Below 75% norm' : 'Eligible for Exams'}
                      </span>
                    </div>
                  </div>

                  {/* Bound Device info */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate text-[11px] font-mono text-slate-300">
                        {student.authorizedDeviceModel || 'No device paired'}
                      </span>
                    </div>

                    {currentRole === 'admin' && (
                      <button
                        onClick={() => handleResetBinding(student)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer flex items-center gap-1"
                        title="Clear hardware device binding"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset Binding</span>
                      </button>
                    )}
                  </div>

                  {isLocked && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                      {student.lockReason && (
                        <p className="text-[11px] text-rose-300/90 font-medium">
                          {student.lockReason}
                        </p>
                      )}
                      
                      {currentRole === 'admin' && (
                        <div className="pt-1 flex flex-col gap-1.5">
                          <button
                            onClick={() => handleBindCurrentPhone(student)}
                            title="Reactivate and bind to the student's current phone"
                            className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Reactivate & Bind to Current Phone</span>
                          </button>
                          
                          <button
                            onClick={() => handleResetBinding(student)}
                            title="Reset device binding and unlock account"
                            className="w-full py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>Reset Device Binding</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedStudentForProfile(student)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Profile</span>
                  </button>

                  {currentRole === 'admin' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedStudentForEdit(student)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                        title="Edit Student Info"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {isLocked ? (
                        <button
                          onClick={() => handleBindCurrentPhone(student)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                          title="Reactivate and Bind Current Phone"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Reactivate</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleAccountStatus(student.id, 'locked', 'Admin manual lock')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-[11px] font-medium transition-colors cursor-pointer"
                          title="Lock Account"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Lock</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedStudentForDelete(student)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors cursor-pointer"
                        title="Delete Student Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact Table View */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
              <tr>
                {currentRole === 'admin' && (
                  <th className="py-3 px-4 w-10">
                    <button onClick={toggleSelectAll} className="cursor-pointer">
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </th>
                )}
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Attendance %</th>
                <th className="py-3 px-4">Device Binding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.map(({ student, stats }) => {
                const isLocked = student.accountStatus === 'locked';
                const isSelected = selectedStudentIds.includes(student.id);

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-emerald-950/20' : ''
                    }`}
                  >
                    {currentRole === 'admin' && (
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleSelectStudent(student.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={student.fullName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-bold text-slate-100">{student.fullName}</div>
                          <div className="text-[10px] text-slate-500">{student.course}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                      {student.rollNumber || student.studentId}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div>{student.email}</div>
                      <div className="text-slate-500">{student.phone || 'No phone'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                        Sec {student.section}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-heading font-black text-sm ${
                            stats.isDefaulter ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {stats.percentage}%
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({stats.present}/{stats.totalClasses})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-400 font-mono">
                      {student.authorizedDeviceModel || 'None'}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={student.accountStatus} variant="account" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudentForProfile(student)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {currentRole === 'admin' && (
                          <>
                            <button
                              onClick={() => setSelectedStudentForEdit(student)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {isLocked ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleBindCurrentPhone(student)}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Reactivate & Bind to Current Phone"
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>Reactivate & Bind</span>
                                </button>
                                <button
                                  onClick={() => handleResetBinding(student)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                                  title="Reset Device Binding"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <>
                                {student.authorizedDeviceId && (
                                  <button
                                    onClick={() => handleResetBinding(student)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                                    title="Reset Device Binding"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={() => toggleAccountStatus(student.id, 'locked', 'Admin manual lock')}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                                  title="Lock Account"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => setSelectedStudentForDelete(student)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          isOpen={!!selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
          student={selectedStudentForProfile}
        />
      )}

      {/* Edit Student Modal */}
      {selectedStudentForEdit && (
        <EditStudentModal
          isOpen={!!selectedStudentForEdit}
          onClose={() => setSelectedStudentForEdit(null)}
          student={selectedStudentForEdit}
          onDeleteRequest={(stu) => {
            setSelectedStudentForEdit(null);
            setSelectedStudentForDelete(stu);
          }}
        />
      )}

      {/* Single Student Delete Confirmation Modal */}
      {selectedStudentForDelete && (
        <DeleteStudentConfirmModal
          isOpen={!!selectedStudentForDelete}
          onClose={() => setSelectedStudentForDelete(null)}
          student={selectedStudentForDelete}
        />
      )}

      {/* Batch Delete Confirmation Modal */}
      {isBatchDeleteModalOpen && (
        <DeleteStudentConfirmModal
          isOpen={isBatchDeleteModalOpen}
          onClose={() => setIsBatchDeleteModalOpen(false)}
          studentsList={selectedStudentsList}
          onSuccess={() => {
            setSelectedStudentIds([]);
            setIsBatchDeleteModalOpen(false);
          }}
        />
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <AddStudentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Bulk Import Students Modal */}
      {isImportModalOpen && (
        <ImportStudentsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
};
