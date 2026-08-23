import fs from 'fs';
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

const originalHeader = `<div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-5xl font-bold text-emerald-400 shadow-inner shadow-emerald-900/50">
              {adminProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-900 shadow-sm">
              Active
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-100">{adminProfile.name}</h2>
              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-900/40 text-emerald-400 border border-emerald-500/30">Faculty Member</span>
            </div>
            <div className="text-sm text-slate-300 font-medium">
              {adminProfile.department || 'Department of Geology'}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <Mail className="w-3.5 h-3.5" />
                {adminProfile.email}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <Phone className="w-3.5 h-3.5" />
                {adminProfile.phone || '+91 70000 00000'}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <IdCard className="w-3.5 h-3.5" />
                Employee ID: {adminProfile.employeeId || 'GEO-FAC-012'}
              </div>
            </div>`;

const newHeader = `<div className="relative shrink-0">
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
              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-900/40 text-emerald-400 border border-emerald-500/30">
                {adminProfile.designation || 'Faculty Member'}
              </span>
            </div>
            <div className="text-sm text-slate-300 font-medium">
              {adminProfile.department || 'Department of Geology'}
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
              {adminProfile.employeeId && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                  <IdCard className="w-3.5 h-3.5 shrink-0" />
                  ID: {adminProfile.employeeId}
                </div>
              )}
              {adminProfile.officeLocation && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/50 border border-slate-800">
                  <Building className="w-3.5 h-3.5 shrink-0" />
                  {adminProfile.officeLocation}
                </div>
              )}
            </div>
            {adminProfile.bio && (
              <p className="text-xs text-slate-400 max-w-2xl pt-1">
                {adminProfile.bio}
              </p>
            )}`;

code = code.replace(originalHeader, newHeader);
fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
