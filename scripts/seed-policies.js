const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedPolicies() {
  console.log("Checking company policies...");
  const count = await prisma.companyPolicy.count();
  if (count > 0) {
    console.log(`Company policies already exist (${count} records). Skipping seeding.`);
    await prisma.$disconnect();
    return;
  }

  const superAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  const adminId = superAdmin?.id;

  const defaultPolicies = [
    {
      title: "Information Security & Confidentiality Policy",
      category: "SECURITY",
      version: "1.0",
      isPublished: true,
      summary: "Strict requirements for handling company and client confidential data, credentials, and proprietary code.",
      content: `1. Purpose & Scope:
This Information Security Policy governs all employees, contractors, and affiliates of Domain Expansion. It establishes mandatory standards for protecting organizational intellectual property, client repositories, system credentials, and confidential business documents.

2. Confidential Information:
Confidential Information includes all source code, architecture diagrams, client proposals, financial records, employee directories, and security credentials. Disclosure to unauthorized internal or external parties is strictly prohibited.

3. Access Control & Credential Security:
- All users must use strong, unique passwords and enable Multi-Factor Authentication (MFA).
- Sharing of user accounts or API keys via unencrypted channels (Slack, email, SMS) is forbidden.
- Session tokens must not be persisted on public or shared computers.

4. Data Storage & Transfer:
- Work-related documents and source code must only reside on authorized company cloud storage and Git repositories.
- Exporting or transmitting confidential data to personal email addresses or third-party storage is a critical violation.

5. Breach Reporting:
Any suspected security breach, leaked credential, or lost device must be reported to the Super Admin or Security Officer immediately within 1 hour of discovery.`,
      createdById: adminId,
    },
    {
      title: "Code of Business Conduct & Workplace Ethics",
      category: "COMPLIANCE",
      version: "1.0",
      isPublished: true,
      summary: "Standards of professional integrity, respect, non-discrimination, and ethical decision making.",
      content: `1. Professional Conduct:
Every team member at Domain Expansion is expected to uphold the highest standards of integrity, mutual respect, and accountability. Discrimination, harassment, or disrespectful behavior will not be tolerated under any circumstances.

2. Conflicts of Interest:
Employees must avoid situations where personal interests conflict with Domain Expansion's business obligations. Engaging in concurrent employment or side contracting with direct competitors requires formal written approval.

3. Open Communication & Reporting:
Team members are encouraged to raise concerns or ethical doubts directly with their Reporting Manager, Team Lead, or the Super Admin. Retaliation against any individual reporting in good faith is strictly prohibited.`,
      createdById: adminId,
    },
    {
      title: "Acceptable Use of Computing Assets & Devices",
      category: "IT_OPERATIONS",
      version: "1.0",
      isPublished: true,
      summary: "Mandatory guidelines for company-provided laptops, remote workstations, VPNs, and software installation.",
      content: `1. Device Authorization:
All devices accessing Domain Expansion systems must have full-disk encryption enabled and run up-to-date operating systems and security patches.

2. Software Installation:
Unauthorized, pirated, or peer-to-peer file sharing software is strictly prohibited on work machines. Only vetted engineering and productivity tools may be installed.

3. Network Security:
When accessing company systems over public or untrusted Wi-Fi networks, a corporate VPN must be active at all times.

4. Device Loss or Theft:
If a laptop, mobile phone, or hardware key with work access is lost or stolen, it must be reported to IT administration immediately to trigger remote wipe protocols.`,
      createdById: adminId,
    },
    {
      title: "Customer Data Privacy & Compliance Policy",
      category: "PRIVACY",
      version: "1.0",
      isPublished: true,
      summary: "Compliance procedures for safeguarding customer Personally Identifiable Information (PII).",
      content: `1. Data Minimization:
Domain Expansion processes client and user personal data strictly on a need-to-know basis for legitimate project and business operations.

2. Privacy Rights:
All customer and employee personal data will be managed in compliance with applicable global data privacy regulations. Unauthorized data scraping or selling is prohibited.

3. Retention & Deletion:
Client data will only be retained for the contractual duration of the engagement, after which it must be purged or archived in accordance with client confidentiality agreements.`,
      createdById: adminId,
    },
  ];

  for (const policy of defaultPolicies) {
    await prisma.companyPolicy.create({ data: policy });
    console.log(`Created policy: ${policy.title}`);
  }

  console.log("Successfully seeded 4 company policies.");
  await prisma.$disconnect();
}

seedPolicies().catch((err) => {
  console.error("Error seeding policies:", err);
  process.exit(1);
});
