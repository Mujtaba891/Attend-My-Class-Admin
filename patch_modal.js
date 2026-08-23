import fs from 'fs';
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

const modalCode = `
const EditProfileModal = ({ isOpen, onClose, adminProfile, updateProfile }: any) => {
  const [name, setName] = useState(adminProfile.name);
  const [department, setDepartment] = useState(adminProfile.department || '');
  const [phone, setPhone] = useState(adminProfile.phone || '');
  const [employeeId, setEmployeeId] = useState(adminProfile.employeeId || '');
  
  // Update state when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setName(adminProfile.name);
      setDepartment(adminProfile.department || '');
      setPhone(adminProfile.phone || '');
      setEmployeeId(adminProfile.employeeId || '');
    }
  }, [isOpen, adminProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    updateProfile({ name, department, phone, employeeId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-100">Edit Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" required />
          </div>
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Department</label>
            <input type="text" value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Phone Number</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 70000 00000" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-[11px] uppercase font-bold text-slate-500 mb-1.5">Employee ID</label>
            <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="GEO-FAC-012" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {`;

code = code.replace("export const SettingsView: React.FC = () => {", modalCode);

fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
