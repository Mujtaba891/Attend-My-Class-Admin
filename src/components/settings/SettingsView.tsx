import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Clock, CheckCircle2, Database, Layers, UserCircle, MapPin, Mail, Phone, IdCard, Edit3, LogOut, ArrowRightLeft, Hourglass, Building, X, Camera, Upload, Calendar } from 'lucide-react';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { TeacherProfileCard } from './TeacherProfileCard';
import { CRDelegationCard } from './CRDelegationCard';
import { TimePickerModal } from '../common/TimePickerModal';
import { calculateDurationMinutes } from '../../utils/timeUtils';


const EditProfileModal = ({ isOpen, onClose, adminProfile, updateProfile }: any) => {
  const isFaculty = adminProfile.role === 'admin' || adminProfile.role === 'teacher';
  const [name, setName] = useState(adminProfile.name || '');
  const [department, setDepartment] = useState(adminProfile.department || '');
  const [phone, setPhone] = useState(adminProfile.phone || '');
  const [employeeId, setEmployeeId] = useState(adminProfile.employeeId || '');
  const [rollNumber, setRollNumber] = useState(adminProfile.rollNumber || '');
  const [semester, setSemester] = useState(adminProfile.semester || 'Semester IV');
  const [section, setSection] = useState(adminProfile.section || 'A');
  const [designation, setDesignation] = useState(adminProfile.designation || '');
  const [officeLocation, setOfficeLocation] = useState(adminProfile.officeLocation || '');
  const [bio, setBio] = useState(adminProfile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(adminProfile.avatarUrl || '');

  useEffect(() => {
    if (isOpen) {
      setName(adminProfile.name || '');
      setDepartment(adminProfile.department || '');
      setPhone(adminProfile.phone || '');
      setEmployeeId(adminProfile.employeeId || '');
      setRollNumber(adminProfile.rollNumber || '');
      setSemester(adminProfile.semester || 'Semester IV');
      setSection(adminProfile.section || 'A');
      setDesignation(adminProfile.designation || '');
      setOfficeLocation(adminProfile.officeLocation || '');
      setBio(adminProfile.bio || '');
      setAvatarUrl(adminProfile.avatarUrl || '');
    }
  }, [isOpen, adminProfile]);

  if (!isOpen) return null;

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    updateProfile({
      name,
      department,
      phone,
      employeeId: isFaculty ? employeeId : '',
      rollNumber: !isFaculty ? rollNumber : '',
      semester: !isFaculty ? semester : '',
      section: !isFaculty ? section : '',
      designation: isFaculty ? designation : '',
      officeLocation: isFaculty ? officeLocation : '',
      bio,
      avatarUrl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <h3 className="text-lg font-bold text-slate-100">Complete Your Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          
          {/* Avatar Upload Section */}
          <div className="flex items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-950/60 border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-400">
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Upload Profile Picture"
              />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">Profile Picture</h4>
              <p className="text-xs text-slate-400 mt-1">Upload a professional photo. JPEG, PNG up to 2MB.</p>
              <div className="mt-2 text-xs font-semibold text-emerald-500 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Click image to browse
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" required />
            </div>

            {!isFaculty ? (
              <>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-amber-500 mb-1.5">Student Roll Number</label>
                  <input type="text" value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="STU-2026-001" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-amber-300 font-mono focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Semester</label>
                  <input type="text" value={semester} onChange={e => setSemester(e.target.value)} placeholder="Semester IV" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Class Section</label>
                  <select
                    value={section.toUpperCase().replace(/^SECTION\s*/i, '').trim() || 'A'}
                    onChange={e => setSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Designation / Title</label>
                  <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Assistant Professor / Faculty" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Employee / Faculty ID</label>
                  <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="GEO-FAC-012" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Office / Classroom Location</label>
                  <input type="text" value={officeLocation} onChange={e => setOfficeLocation(e.target.value)} placeholder="e.g. Block C, Room 30" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Department / Course</label>
              <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Phone Number</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 70000 00000" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Professional Bio</label>
              <textarea 
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                placeholder="A brief summary of your academic background and interests..." 
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6 pt-5">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-emerald-900/20">Save Profile Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const SettingsView: React.FC = () => {
  const { adminProfile, isMasterAdmin, logout, updateProfile } = useAuth();
  const { 
    updateSessionTime, 
    updateSystemSchedule, 
    activeSession, 
    currentClass, 
    classes, 
    scheduleMaster,
    updateClassConfig, 
    resetClassesToDefaults 
  } = useAttendance();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  const [startTime, setStartTime] = useState(currentClass?.defaultStartTime || '10:40 AM');
  const [endTime, setEndTime] = useState(currentClass?.defaultEndTime || '11:20 AM');
  const [duration, setDuration] = useState(currentClass?.durationMinutes || 40);
  const [room, setRoom] = useState(currentClass?.room || adminProfile.assignedRoom || 'Block C room no 30');
  const [isSaved, setIsSaved] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);

  // Sync with currentClass
  useEffect(() => {
    if (currentClass) {
      setStartTime(currentClass.defaultStartTime || '10:40 AM');
      setEndTime(currentClass.defaultEndTime || '11:20 AM');
      setDuration(currentClass.durationMinutes || calculateDurationMinutes(currentClass.defaultStartTime, currentClass.defaultEndTime));
      setRoom(currentClass.room || adminProfile.assignedRoom || 'Block C room no 30');
    }
  }, [currentClass, adminProfile.assignedRoom]);

  const handleTimePickerConfirm = (selectedTime: string) => {
    if (timePickerTarget === 'start') {
      setStartTime(selectedTime);
      const newDur = calculateDurationMinutes(selectedTime, endTime);
      setDuration(newDur);
      if (activeSession) {
        updateSessionTime(selectedTime, endTime);
      }
    } else if (timePickerTarget === 'end') {
      setEndTime(selectedTime);
      const newDur = calculateDurationMinutes(startTime, selectedTime);
      setDuration(newDur);
      if (activeSession) {
        updateSessionTime(startTime, selectedTime);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Update the class config in classes & Firestore
    if (currentClass?.id) {
      updateClassConfig(currentClass.id, {
        defaultStartTime: startTime,
        defaultEndTime: endTime,
        durationMinutes: duration,
        room: room,
      });
    }

    // 2. Update user assignments
    let updatedAssignments = [...(adminProfile.assignments || [])];
    if (updatedAssignments.length > 0) {
      const index = updatedAssignments.findIndex(a => 
        a.subject === adminProfile.assignedSubject || 
        (a.subjectType || 'All') === (adminProfile.assignedSubjectType || 'All')
      );
      const targetIdx = index >= 0 ? index : 0;
      updatedAssignments[targetIdx] = { 
        ...updatedAssignments[targetIdx], 
        startTime, 
        endTime, 
        duration, 
        room,
        subject: adminProfile.assignedSubject || updatedAssignments[targetIdx].subject
      };
    } else {
      updatedAssignments = [{
        id: `assign_${Date.now()}`,
        subject: adminProfile.assignedSubject || 'Geology',
        subjectType: (adminProfile.assignedSubjectType || 'Minor') as any,
        className: adminProfile.assignedClass || 'Semester I - Section A',
        room,
        startTime,
        endTime,
        duration
      }];
    }

    updateProfile({ 
      assignments: updatedAssignments,
      assignedRoom: room
    });

    updateSystemSchedule({ startTime, endTime, duration, room });

    if (activeSession) {
      updateSessionTime(startTime, endTime);
    }
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const currentSelectedClass = currentClass;

  const futureSubjectBuckets = [
    { name: 'Major', status: 'Architecture Ready', active: true },
    { name: 'Minor', status: 'Architecture Ready', active: true },
    { name: 'Skill Enhancement (SEC)', status: 'Architecture Ready', active: true },
    { name: 'Multidisciplinary (MD)', status: 'Architecture Ready', active: true },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Profile Header (Full Width) */}
      <div className="w-full p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden">
        {/* Background Graphic Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-[0.03]">
          <svg viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
             <path d="M0 200 C 200 100, 400 300, 800 200" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
             <path d="M0 150 C 200 50, 400 250, 800 150" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
             <path d="M0 250 C 200 150, 400 350, 800 250" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
             <path d="M0 300 C 200 200, 400 400, 800 300" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
             <path d="M0 100 C 200 0, 400 200, 800 100" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
          </svg>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-5xl font-bold text-emerald-400 shadow-inner shadow-emerald-900/50 overflow-hidden">
              {adminProfile.avatarUrl ? (
                <img src={adminProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                adminProfile.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-900 shadow-sm">
              Active
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-100">{adminProfile.name}</h2>
              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 uppercase">
                {adminProfile.role === 'cr' ? 'Class Representative (CR)' : (adminProfile.designation || 'Faculty Member')}
              </span>
              {adminProfile.rollNumber && adminProfile.role === 'cr' && (
                <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Roll: {adminProfile.rollNumber}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-300 font-medium">
              {adminProfile.department || 'Department of Geology'}
              {adminProfile.role === 'cr' && (adminProfile.semester || adminProfile.section) && (
                <span className="ml-2 text-xs text-emerald-400 font-semibold">• {adminProfile.semester || 'Semester IV'} (Sec {adminProfile.section || 'A'})</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-none">{adminProfile.email}</span>
              </div>
              {adminProfile.phone && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {adminProfile.phone}
                </div>
              )}
              {adminProfile.role !== 'cr' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                  <IdCard className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  ID: {adminProfile.employeeId || 'GEO-FAC-01'}
                </div>
              )}
              {adminProfile.role !== 'cr' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                  <Building className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  {adminProfile.officeLocation || 'Block C, Room 30'}
                </div>
              )}
            </div>
            {adminProfile.bio && (
              <p className="text-xs text-slate-400 max-w-2xl pt-1">
                {adminProfile.bio}
              </p>
            )}
          </div>
        </div>
        
        <div className="relative z-10 mt-6 md:mt-0 ml-auto md:ml-0">
          <button onClick={() => setIsEditProfileOpen(true)} className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Main Grid: 7 / 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
          <TeacherProfileCard />
          
          {/* Class Schedule & Attendance Window */}
          <div id="sys-config" className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-heading">
                    Class Schedule & Attendance Window
                  </h3>
                  <p className="text-xs text-slate-400">
                    Active timing window for {adminProfile.assignedSubject || 'Geology'} ({adminProfile.assignedSubjectType || 'Minor'})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetClassesToDefaults}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition-colors"
                title="Reset schedule to institutional timetable"
              >
                Reset to Timetable
              </button>
            </div>

            {/* Active Class Details Banner */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {adminProfile.assignedSubjectType || 'Minor'}
                </span>
                <span className="text-slate-200 font-semibold">
                  {adminProfile.assignedSubject || 'Geology'}
                </span>
                <span className="text-slate-400">• {currentClass.days || 'Mon-Sat'}</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                {startTime} - {endTime}
              </span>
            </div>

            {/* Form for Active Class */}
            <form onSubmit={handleSave} className="space-y-5 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Start Time Trigger Card */}
                <div 
                  onClick={() => setTimePickerTarget('start')}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/60 flex flex-col justify-center space-y-1.5 cursor-pointer transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Daily Start Time
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity">1-Click</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-100 font-mono tracking-tight">{startTime}</span>
                    <Clock className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>

                {/* End Time Trigger Card */}
                <div 
                  onClick={() => setTimePickerTarget('end')}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-emerald-500/60 flex flex-col justify-center space-y-1.5 cursor-pointer transition-all group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Daily End Time
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity">1-Click</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold text-slate-100 font-mono tracking-tight">{endTime}</span>
                    <Clock className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>

                {/* Auto Calculated Session Duration */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-center space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <Hourglass className="w-3.5 h-3.5 text-purple-400" />
                    Session Duration
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-extrabold text-slate-100 font-mono">{duration}</span>
                      <span className="text-xs font-bold text-slate-300">Minutes</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                      Auto
                    </span>
                  </div>
                </div>

                {/* Classroom / Room */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-center space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    Classroom / Hall
                  </div>
                  <input
                    type="text"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-200 focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enforced Security Rules</span>
                </div>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Only marked attendance within the time window is accepted
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    QR scanner access allowed only to active, verified faculty devices
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Corrections requests strictly capped at 2 per student per semester
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-between">
                {isSaved ? (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Configuration saved for {adminProfile.assignedSubject || 'Geology'}!
                  </span>
                ) : <div />}
                <div className="ml-auto">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
                  >
                    Save Schedule Settings
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Master Timetable Dataset Viewer */}
          <div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Institutional Master Timetable ({scheduleMaster?.academicYear || '2026-2027'})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live schedule & subject slot mappings fetched from database
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 self-start sm:self-auto">
                Firestore Synced
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono tracking-wider">
                    <th className="py-2 px-2 font-semibold">Period</th>
                    <th className="py-2 px-2 font-semibold">Time Slot</th>
                    <th className="py-2 px-2 font-semibold">Subject Type</th>
                    <th className="py-2 px-2 font-semibold">Department / Subjects</th>
                    <th className="py-2 px-2 font-semibold">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {scheduleMaster?.periods?.map((period) => {
                    const isFacultySubjectSlot = 
                      (adminProfile.assignedSubjectType || '').toLowerCase() === (period.subjectType || '').toLowerCase() ||
                      (period.subjectType === 'minor' && (adminProfile.assignedSubjectType || '').toLowerCase().includes('minor'));

                    return (
                      <tr 
                        key={period.periodId} 
                        className={`transition-colors ${
                          isFacultySubjectSlot 
                            ? 'bg-emerald-950/40 text-emerald-300 font-semibold' 
                            : 'hover:bg-slate-800/30 text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{period.name}</span>
                            {isFacultySubjectSlot && (
                              <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded bg-emerald-500 text-slate-950">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-slate-200">
                          {period.startTime} - {period.endTime}
                        </td>
                        <td className="py-2.5 px-2 font-sans font-medium">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            period.subjectType === 'minor' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            period.subjectType === 'major' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                            period.subjectType === 'lab' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            period.subjectType === 'vac' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {period.subjectType}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-sans text-xs text-slate-300">
                          {period.subjectType === 'minor' && <span>Minor Subjects (Geology, Physics, Chemistry, Botany, etc.)</span>}
                          {period.subjectType === 'major' && <span>Major Core Subjects (Section Matrix A, B, C, D, E)</span>}
                          {period.subjectType === 'lab' && <span>Core Practical Lab (Batches G1, G2, G3)</span>}
                          {period.subjectType === 'vac' && <span>Value Added Course (VAC 1 & VAC 2 Pool)</span>}
                          {period.subjectType === 'aec' && <span>Ability Enhancement Course (AEC)</span>}
                          {period.subjectType === 'mdc' && <span>Multidisciplinary / SEC Course</span>}
                        </td>
                        <td className="py-2.5 px-2 text-slate-400">
                          {period.defaultRoom || 'Department Lab'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VAC Subjects quick chips */}
            {scheduleMaster?.vacSubjects && scheduleMaster.vacSubjects.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Configured VAC Subjects (Period 8: 02:00 - 02:40 PM):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {scheduleMaster.vacSubjects.map((vac) => (
                    <span key={vac.code} className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-300">
                      <strong className="text-purple-400">{vac.code}:</strong> {vac.label} ({vac.description})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          
          {/* Quick Actions */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => document.getElementById("sys-config")?.scrollIntoView({behavior: "smooth"})} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors text-left group">
                <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
                <div>
                  <div onClick={() => document.getElementById("sys-config")?.scrollIntoView({behavior: "smooth"})} className="text-sm font-medium text-slate-200">System Configuration</div>
                  <div className="text-[10px] text-slate-500">Manage class & system settings</div>
                </div>
              </button>
              <button onClick={logout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors text-left group">
                <LogOut className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
                <div>
                  <div className="text-sm font-medium text-slate-200">Logout</div>
                  <div className="text-[10px] text-slate-500">Sign out from your account</div>
                </div>
              </button>
            </div>
          </div>

          {/* Firebase Spark Plan Status */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Firebase Spark Plan Architecture
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Your database & backend configuration</p>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-500 block mb-0.5">Database Engine</span>
                  <span className="text-slate-200 font-semibold">Cloud Firestore</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Mode</span>
                  <span className="text-slate-200 font-semibold">Real-time</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Query Optimization</span>
                  <span className="text-slate-300">Indexed compound queries & 2k limit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Future Extensible Subjects Registry */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Future Subjects Architecture
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Plan and prepare for additional subject support</p>
              </div>
            </div>
            
            <div className="space-y-1 pt-2">
              <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-400">Geology (Core Course)</span>
                <span className="font-bold uppercase text-emerald-500/80">LIVE (PLANNED)</span>
              </div>
              {futureSubjectBuckets.map((item, idx) => (
                <div key={idx} className="px-3 py-2 flex items-center justify-between text-[11px] border-b border-slate-800/50 last:border-0">
                  <span className="text-slate-300">{item.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">{item.status}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CR Access Delegation */}
          <CRDelegationCard />
        </div>
      </div>

      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} adminProfile={adminProfile} updateProfile={updateProfile} />
      
      {/* 1-Click Time Picker Modal */}
      <TimePickerModal
        isOpen={timePickerTarget !== null}
        onClose={() => setTimePickerTarget(null)}
        initialTime={timePickerTarget === 'start' ? startTime : endTime}
        onConfirm={handleTimePickerConfirm}
        title={timePickerTarget === 'start' ? 'Select Daily Start Time' : 'Select Daily End Time'}
      />
    </div>
  );
};
