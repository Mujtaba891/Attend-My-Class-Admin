import fs from 'fs';
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

// The rogue one is right before `    </div>\n  );\n};\n\nexport const SettingsView: React.FC = () => {`
const toFindRogue = `      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} adminProfile={adminProfile} updateProfile={updateProfile} />\n    </div>\n  );\n};\n\nexport const SettingsView: React.FC = () => {`;
const toReplaceRogue = `    </div>\n  );\n};\n\nexport const SettingsView: React.FC = () => {`;

if (code.includes(toFindRogue)) {
  code = code.replace(toFindRogue, toReplaceRogue);
  fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
  console.log("Rogue removed successfully!");
} else {
  console.log("Could not find the rogue string!");
}
