const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let code = fs.readFileSync(fullPath, 'utf8');

  // 1. Remove all dark: prefixes
  code = code.replace(/dark:[^\s"'>]+/g, '');

  // 2. Overlays
  code = code.replace(/bg-black\/(95|90|85|80|75|70|65|60|50)/g, 'bg-slate-900/40');
  code = code.replace(/bg-slate-900\/(80|70|60)/g, 'bg-slate-900/40');

  // 3. Dark container backgrounds to white / slate-50
  code = code.replace(/bg-\[#(141414|1A1A1A|121212|161616|18181C|121214|0D0D0D|0B0B0C|0B0C0E|111111|141418|1E1E24|1A1A20|181818|282830)\]/gi, (match) => {
    return 'bg-white';
  });

  // 4. Dark border hexes to slate-200
  code = code.replace(/border-\[#(2E2E2E|252525|26262E|2E2E36|2A2A32|333|444|222|1f1f1f|282828|2A2A2A)\]/gi, 'border-slate-200');

  // 5. Dark text hexes to clean slate hierarchy
  code = code.replace(/text-\[#(888898|999|666|888|777|555)\]/gi, 'text-slate-500');
  code = code.replace(/text-\[#(F3F4F6|E5E7EB|ACACB8|D1D5DB|E0E0E0)\]/gi, 'text-slate-700');
  code = code.replace(/text-slate-300/g, 'text-slate-600');
  code = code.replace(/text-slate-400/g, 'text-slate-500');

  // 6. Hover states
  code = code.replace(/hover:bg-\[#(252525|1f1f1f|282830|333|2A2A2A)\]/gi, 'hover:bg-slate-100');
  code = code.replace(/hover:text-white/g, 'hover:text-slate-900');

  // 7. Clean whitespace in className
  code = code.replace(/className="([^"]*)"/g, (match, classNames) => {
    const cleaned = classNames.replace(/\s+/g, ' ').trim();
    return `className="${cleaned}"`;
  });

  fs.writeFileSync(fullPath, code, 'utf8');
  console.log(`Cleaned: ${filePath}`);
}

const files = [
  'src/components/views/DocumentsView.tsx',
  'src/components/views/AdminSettingsView.tsx',
  'src/components/views/WorkPackagesView.tsx',
  'src/components/views/BacklogView.tsx',
  'src/components/views/HRMSView.tsx',
  'src/components/views/HRAdminView.tsx',
  'src/components/tasks/TaskDetailModal.tsx',
  'src/components/modals/EmployeeDetailModal.tsx',
  'src/components/modals/InactivityWarningModal.tsx',
  'src/components/modals/DocumentViewerModal.tsx',
  'src/components/layout/DevMailboxModal.tsx',
  'src/components/layout/HRMSShell.tsx',
  'src/app/tasks/[id]/page.tsx',
  'src/app/qa/page.tsx',
  'src/app/invite/[token]/page.tsx',
  'src/app/superadmin/page.tsx',
  'src/app/hrms/page.tsx',
  'src/app/hrms/dashboard/page.tsx',
  'src/app/hrms/login/page.tsx',
  'src/app/hrms/create-account/page.tsx',
  'src/app/hrmssuperadmin/page.tsx',
  'src/app/hrmssuperadmin/login/page.tsx',
  'src/app/hrmssuperadmin/create-account/page.tsx',
  'src/app/hradmin/page.tsx'
];

files.forEach(cleanFile);
console.log('Done processing all target files.');
