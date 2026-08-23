import fs from 'fs';

let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

// Update imports
code = code.replace(
  "import { Settings, ShieldCheck, Clock, CheckCircle2, Database, Layers, UserCircle, MapPin, Mail, Phone, IdCard, Edit3, LogOut, ArrowRightLeft, Hourglass, Building, X } from 'lucide-react';",
  "import { Settings, ShieldCheck, Clock, CheckCircle2, Database, Layers, UserCircle, MapPin, Mail, Phone, IdCard, Edit3, LogOut, ArrowRightLeft, Hourglass, Building, X, Camera, Upload } from 'lucide-react';"
);

const newModal = `const EditProfileModal = ({ isOpen, onClose, adminProfile, updateProfile }: any) => {
  const [name, setName] = useState(adminProfile.name || '');
  const [department, setDepartment] = useState(adminProfile.department || '');
  const [phone, setPhone] = useState(adminProfile.phone || '');
  const [employeeId, setEmployeeId] = useState(adminProfile.employeeId || '');
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
    updateProfile({ name, department, phone, employeeId, designation, officeLocation, bio, avatarUrl });
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
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Designation / Title</label>
              <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Associate Professor" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Department</label>
              <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Employee ID</label>
              <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="GEO-FAC-012" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Phone Number</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 70000 00000" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Office Location</label>
              <input type="text" value={officeLocation} onChange={e => setOfficeLocation(e.target.value)} placeholder="e.g. Block A, Room 102" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
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
}`;

code = code.replace(/const EditProfileModal = \(\{ isOpen, onClose, adminProfile, updateProfile \}: any\) => \{[\s\S]*?      <\/div>\n    <\/div>\n  \);\n\};/, newModal);

fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
