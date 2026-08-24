import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { 
  GraduationCap, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Building2, 
  KeyRound, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  QrCode, 
  CheckCircle2, 
  Lock, 
  MapPin,
  Laptop
} from 'lucide-react';

const SUBJECT_PRESETS = [
  'Core Major Subject (Theory & Practical Lab)',
  'Major Elective - Advanced Disciplines (Paper 301)',
  'Minor Elective - Interdisciplinary Studies',
  'Skill Enhancement - Computational & Digital Tools',
  'Multi-Disciplinary - Applied Research Methods',
  'Value Added Course - Academic Ethics & Safety',
];

const CLASS_PRESETS = [
  'Semester IV - Section A (Batch 2024-2027)',
  'Semester IV - Section B (Batch 2024-2027)',
  'Semester II - Section A (Batch 2025-2028)',
  'Semester VI - Final Year (Batch 2023-2026)',
  'Post-Graduate Year 1 (M.Sc. / M.A.)',
];

const DEPARTMENT_PRESETS = [
  'Department of Academic Sciences',
  'Department of Computer Applications',
  'Department of Physical Sciences',
  'Department of Commerce & Management',
  'Department of Humanities & Social Sciences',
];

export const LoginPage: React.FC = () => {
  const { loginAsFaculty, loginWithEmail, loginWithGoogle, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [department, setDepartment] = useState<string>('Department of Academic Sciences');
  const [assignedSubject, setAssignedSubject] = useState<string>('Core Major Subject (Theory & Practical Lab)');
  const [assignedSubjectType, setAssignedSubjectType] = useState<'Major' | 'Minor' | 'MDC' | 'Skills' | 'AEC' | 'VAC 1' | 'VAC 2' | 'All'>('All');
  const [assignedClass, setAssignedClass] = useState<string>('Semester IV - Section A (Batch 2024-2027)');
  const [assignedRoom, setAssignedRoom] = useState<string>('Lecture Hall 204 (North Wing)');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const prefillEmail = localStorage.getItem('faculty_prefill_email');
    if (prefillEmail) {
      setEmail(prefillEmail);
      setIsLoginMode(false);
      // Don't remove it immediately here in case of re-renders,
      // but we could remove it on submit. For now, leave it.
      localStorage.removeItem('faculty_prefill_email');
    }
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'teacher') {
      setDepartment('Department of Academic Sciences');
    } else {
      setDepartment('Student Academic Council');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please provide your institutional email address.');
      return;
    }
    if (selectedRole !== 'cr' && !isLoginMode && !name.trim()) {
      setErrorMsg('Please provide your name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (selectedRole === 'cr') {
        await loginAsFaculty(
          {
            name: email.split('@')[0] || 'Class Representative',
            email: email.trim(),
            role: 'cr',
            department: 'Student Academic Council',
          },
          password.trim() || undefined
        );
      } else if (isLoginMode) {
        await loginWithEmail(email.trim(), password.trim() || undefined, selectedRole);
      } else {
        await loginAsFaculty(
          {
            name: name.trim(),
            email: email.trim(),
            role: selectedRole,
            department: department.trim() || 'Department of Academic Studies',
            assignedSubject: selectedRole === 'teacher' ? assignedSubject.trim() : undefined,
            assignedSubjectType: selectedRole === 'teacher' ? assignedSubjectType : undefined,
            assignedClass: selectedRole === 'teacher' ? assignedClass.trim() : undefined,
            assignedRoom: selectedRole === 'teacher' ? assignedRoom.trim() : undefined,
          },
          password.trim() || undefined
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-xl shadow-emerald-950/50 mb-4 flex items-center justify-center overflow-hidden">
            <img src="/logo-1.png" alt="Attend My Class Logo" className="w-full h-full object-contain" />
          </div>

          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Institutional Attendance & Academic Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl sm:text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-heading">
            Attend My <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Class</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Secure faculty sign-in portal for subject teachers, department heads, and college administration.
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-8 md:p-10">
          {/* Role Switcher Tabs */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Select Your Access Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Teacher Tab */}
              <button
                type="button"
                id="role-btn-teacher"
                onClick={() => handleRoleChange('teacher')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  selectedRole === 'teacher'
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedRole === 'teacher' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Faculty / Teacher</div>
                  <div className="text-[11px] text-slate-400">Subject Faculty & Course Admin</div>
                </div>
              </button>

              {/* Class Monitor / CR Tab */}
              <button
                type="button"
                id="role-btn-cr"
                onClick={() => handleRoleChange('cr')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  selectedRole === 'cr'
                    ? 'bg-amber-500/15 border-amber-500/50 text-white ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedRole === 'cr' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Student / Class Representative</div>
                  <div className="text-[11px] text-slate-400">Class Monitor & Live Display</div>
                </div>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 sm:mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
                    <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className={`grid grid-cols-1 ${!isLoginMode && selectedRole !== 'cr' ? 'md:grid-cols-2' : ''} gap-4 sm:gap-5`}>
              {/* Name */}
              {!isLoginMode && selectedRole !== 'cr' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {selectedRole === 'teacher' ? 'Teacher / Faculty Full Name' : 'Representative Name'}
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      id="login-name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLoginMode}
                      placeholder="e.g. Prof. Rajesh Kumar"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    id="login-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. faculty.name@college.edu"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>

              {!isLoginMode && selectedRole !== 'cr' && (
                <>
                  {/* Department */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      College Department / Faculty Division
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        id="login-department-input"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Department of Computer Sciences"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors"
                      />
                    </div>
                    {/* Department presets */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['Department of Computer Sciences', 'Department of Life Sciences', 'Faculty of Commerce', 'Faculty of Arts'].map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setDepartment(dept)}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Teacher Specific Fields: Assigned Class & Subject */}
                  {selectedRole === 'teacher' && (
                    <>
                      {/* Assigned Subject */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-emerald-300 mb-1.5 flex items-center justify-between">
                          <span>Assigned Subject / Course Paper</span>
                          <span className="text-[10px] text-slate-400 font-normal">What subject do you teach?</span>
                        </label>
                        <div className="relative">
                          <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                          <input
                            type="text"
                            id="login-subject-input"
                            value={assignedSubject}
                            onChange={(e) => setAssignedSubject(e.target.value)}
                            placeholder="e.g. Core Major Subject (Theory & Practical Lab)"
                            className="w-full bg-slate-950 border border-emerald-500/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-emerald-100 placeholder-slate-600 transition-colors"
                          />
                        </div>
                        {/* Subject presets */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['Core Academic Course (Theory & Lab)', 'Minor / Interdisciplinary Course', 'Skill Enhancement Course (SEC)', 'Value Added Course (VAC)'].map((sub) => (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => setAssignedSubject(sub)}
                              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                                assignedSubject === sub
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Subject Type */}
                      <div>
                        <label className="block text-xs font-semibold text-emerald-300 mb-1.5">
                          Subject Type
                        </label>
                        <div className="relative">
                          <select
                            value={assignedSubjectType}
                            onChange={(e) => setAssignedSubjectType(e.target.value as any)}
                            className="w-full bg-slate-950 border border-emerald-500/40 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-emerald-100 placeholder-slate-600 transition-colors appearance-none"
                          >
                            <option value="All">All Subjects</option>
                            <option value="Major">Major</option>
                            <option value="Minor">Minor</option>
                            <option value="MDC">MDC</option>
                            <option value="Skills">Skills</option>
                            <option value="AEC">AEC</option>
                            <option value="VAC 1">VAC 1</option>
                            <option value="VAC 2">VAC 2</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-emerald-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                          </div>
                        </div>
                      </div>

                      {/* Assigned Class / Batch */}
                      <div>
                        <label className="block text-xs font-semibold text-emerald-300 mb-1.5">
                          Assigned Class / Semester & Section
                        </label>
                        <div className="relative">
                          <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                          <input
                            type="text"
                            id="login-class-input"
                            value={assignedClass}
                            onChange={(e) => setAssignedClass(e.target.value)}
                            placeholder="e.g. Semester IV - Section A"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors"
                          />
                        </div>
                        {/* Class presets */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['Semester II - Section A', 'Semester IV - Section A', 'Semester VI - Section A'].map((cls) => (
                            <button
                              key={cls}
                              type="button"
                              onClick={() => setAssignedClass(cls)}
                              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                                assignedClass === cls
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {cls}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Room / Lecture Hall */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Lecture Room / Laboratory Location
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input
                            type="text"
                            id="login-room-input"
                            value={assignedRoom}
                            onChange={(e) => setAssignedRoom(e.target.value)}
                            placeholder="e.g. Lecture Hall 204 (North Wing)"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Password / Access Pin */}
              <div className={selectedRole === 'teacher' && !isLoginMode ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {selectedRole === 'cr' ? 'CR Account Password / PIN' : 'Faculty Access PIN / Password'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    id="login-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* CR Permissions Overview Box */}
            {selectedRole === 'cr' && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>CR Permissions Overview</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-amber-300/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Can view live active session attendance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Can view students, but lock / unlock action is disabled</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Can't mark or download attendance or alter data</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="login-submit-btn"
                disabled={isSubmitting || isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3.5 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting || isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>
                      {selectedRole === 'cr'
                        ? 'Login as Class Representative'
                        : isLoginMode
                        ? 'Sign In to Academic Platform'
                        : `Enter Academic Platform as ${selectedRole === 'teacher' ? 'Teacher' : 'Administrator'}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            
            {selectedRole !== 'cr' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {isLoginMode ? "Don't have an account? Create Profile" : "Already have an account? Login"}
                </button>
              </div>
            )}

            {/* Institutional Sign In Option */}
            <div className="mt-5 text-center">
              <button
                type="button"
                id="google-signin-btn"
                onClick={loginWithGoogle}
                className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 py-2 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Or sign in with Institutional Google Account</span>
              </button>
            </div>
          </form>
        </div>

        {/* Feature badges footer */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-slate-400 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <QrCode className="w-4 h-4 mx-auto mb-1.5 text-emerald-400" />
            <div className="font-semibold text-slate-200">Dynamic QR Tokens</div>
            <div className="text-[10px] text-slate-400 mt-0.5">3-5s Rotating Anti-Proxy</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <Laptop className="w-4 h-4 mx-auto mb-1.5 text-blue-400" />
            <div className="font-semibold text-slate-200">Device Hardware Lock</div>
            <div className="text-[10px] text-slate-400 mt-0.5">1-Student 1-Phone Binding</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <CheckCircle2 className="w-4 h-4 mx-auto mb-1.5 text-teal-400" />
            <div className="font-semibold text-slate-200">Instant Sync & Ledgers</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Monthly Attendance Ledgers</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 mx-auto mb-1.5 text-amber-400" />
            <div className="font-semibold text-slate-200">Dual-Step Appeals</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Formal Correction Workflow</div>
          </div>
        </div>
      </div>
    </div>
  );
};
