import fs from 'fs';
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

// Add state to SettingsView
code = code.replace(
  "  const { adminProfile, isMasterAdmin, logout } = useAuth();\n  const [startTime, setStartTime] = useState('12:00 PM');",
  "  const { adminProfile, isMasterAdmin, logout, updateProfile } = useAuth();\n  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);\n  const [startTime, setStartTime] = useState('12:00 PM');"
);

// Connect Edit Profile button
code = code.replace(
  '<button className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-2">',
  '<button onClick={() => setIsEditProfileOpen(true)} className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-2">'
);

// Include modal at bottom
code = code.replace(
  "    </div>\n  );\n};",
  "      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} adminProfile={adminProfile} updateProfile={updateProfile} />\n    </div>\n  );\n};"
);

// Add scroll to System Config logic
code = code.replace(
  '<div className="text-sm font-medium text-slate-200">System Configuration</div>',
  '<div onClick={() => document.getElementById("sys-config")?.scrollIntoView({behavior: "smooth"})} className="text-sm font-medium text-slate-200">System Configuration</div>'
);

code = code.replace(
  '<button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors text-left group">',
  '<button onClick={() => document.getElementById("sys-config")?.scrollIntoView({behavior: "smooth"})} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors text-left group">'
);

code = code.replace(
  '<div className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">',
  '<div id="sys-config" className="p-4 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">'
);

fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
