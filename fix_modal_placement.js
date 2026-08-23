import fs from 'fs';
let code = fs.readFileSync('src/components/settings/SettingsView.tsx', 'utf8');

// The string to find at the end of the file
const toFind = `          <CRDelegationCard />\n        </div>\n      </div>\n    </div>\n  );\n};`;
const toReplace = `          <CRDelegationCard />\n        </div>\n      </div>\n      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} adminProfile={adminProfile} updateProfile={updateProfile} />\n    </div>\n  );\n};`;

if (code.includes(toFind)) {
  code = code.replace(toFind, toReplace);
  fs.writeFileSync('src/components/settings/SettingsView.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the target string!");
}
