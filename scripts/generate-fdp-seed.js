const fs = require('fs');

const rawQuestions = [
  // Section A – Cyber Security
  {
    order: 1,
    category: 'Cyber Security',
    text: 'Which security property ensures that data is accessible to authorized users when required?',
    options: ['Confidentiality', 'Integrity', 'Availability', 'Authentication'],
    correct: 2,
    explanation: 'Availability guarantees reliable, timely access to data and resources for authorized users whenever needed.'
  },
  {
    order: 2,
    category: 'Cyber Security',
    text: 'A user receives an email appearing to be from their bank asking them to click a link and verify credentials. This is most likely:',
    options: ['DDoS', 'Phishing', 'Spoofing only', 'Shoulder surfing'],
    correct: 1,
    explanation: 'Phishing is a social engineering attack that mimics legitimate institutions to deceive victims into exposing sensitive credentials.'
  },
  {
    order: 3,
    category: 'Cyber Security',
    text: 'Which attack specifically attempts to make a legitimate website unavailable by overwhelming it with traffic?',
    options: ['SQL Injection', 'DDoS', 'Phishing', 'Keylogging'],
    correct: 1,
    explanation: 'Distributed Denial of Service (DDoS) overwhelms targets with coordinated flood traffic to deny service to genuine users.'
  },
  {
    order: 4,
    category: 'Cyber Security',
    text: 'If a hash function produces the same hash for two different inputs, the situation is called:',
    options: ['Encryption', 'Collision', 'Salting', 'Tokenization'],
    correct: 1,
    explanation: 'A hash collision occurs when two distinct input values generate identical cryptographic digests.'
  },
  {
    order: 5,
    category: 'Cyber Security',
    text: 'Which is generally considered the strongest password?',
    options: ['Kavita123', 'Password@123', 'Qwerty@2026', 'A long, unique passphrase with multiple random words'],
    correct: 3,
    explanation: 'Long passphrases consisting of multiple random words provide exponential entropy, making brute-force and dictionary attacks computationally infeasible.'
  },
  {
    order: 6,
    category: 'Cyber Security',
    text: 'In asymmetric cryptography, which key is normally shared publicly?',
    options: ['Private key', 'Session key', 'Public key', 'Master key'],
    correct: 2,
    explanation: 'The public key is freely distributed for encryption or signature verification, while the corresponding private key remains secret.'
  },
  {
    order: 7,
    category: 'Cyber Security',
    text: 'Digital signatures primarily provide:',
    options: ['Confidentiality only', 'Authentication and integrity', 'Compression', 'Data availability'],
    correct: 1,
    explanation: 'Digital signatures prove the identity of the sender (authentication), ensure content has not altered in transit (integrity), and enforce non-repudiation.'
  },
  {
    order: 8,
    category: 'Cyber Security',
    text: 'Which technique adds random data to a password before hashing to make precomputed attacks harder?',
    options: ['Salting', 'Encoding', 'Encryption', 'Fragmentation'],
    correct: 0,
    explanation: 'Salting appends unique pseudo-random bytes to plaintext passwords before hashing, effectively neutralizing precomputed rainbow-table lookups.'
  },
  {
    order: 9,
    category: 'Cyber Security',
    text: 'SQL Injection primarily exploits weaknesses in:',
    options: ['Network cables', 'Database queries and input handling', 'Operating-system hardware', 'Blockchain consensus'],
    correct: 1,
    explanation: 'SQL Injection occurs when untrusted user input is directly concatenated into database queries without proper sanitization or parameterized binding.'
  },
  {
    order: 10,
    category: 'Cyber Security',
    text: 'Which security mechanism is specifically designed to detect suspicious network traffic based on predefined rules or signatures?',
    options: ['IDS', 'DNS', 'DHCP', 'NAT'],
    correct: 0,
    explanation: 'An Intrusion Detection System (IDS) inspects inbound and outbound network packets against signature databases and anomalous heuristics.'
  },
  {
    order: 11,
    category: 'Cyber Security',
    text: 'A zero-day vulnerability is one that:',
    options: ['Has existed for exactly zero days', 'Has no possible impact', 'Is unknown or has no available patch when exploited', 'Can only affect zero-day-old systems'],
    correct: 2,
    explanation: 'Zero-day vulnerabilities are previously undisclosed software flaws exploited before the vendor has developed or deployed an official security patch.'
  },
  {
    order: 12,
    category: 'Cyber Security',
    text: 'Which attack tricks a user into revealing confidential information by pretending to be a trusted entity?',
    options: ['Social engineering', 'Packet switching', 'Load balancing', 'Data deduplication'],
    correct: 0,
    explanation: 'Social engineering exploits psychological manipulation rather than technical flaws to coerce people into revealing confidential data.'
  },
  {
    order: 13,
    category: 'Cyber Security',
    text: 'Multi-factor authentication requires:',
    options: ['Two passwords', 'Two or more independent authentication factors', 'Multiple usernames', 'Only biometric authentication'],
    correct: 1,
    explanation: 'MFA mandates proof across two or more distinct categories: knowledge (password), possession (hardware key/phone), or inherence (biometrics).'
  },
  {
    order: 14,
    category: 'Cyber Security',
    text: 'Which of the following is NOT normally considered an authentication factor?',
    options: ['Something you know', 'Something you have', 'Something you are', 'Something you download'],
    correct: 3,
    explanation: 'Standard authentication factors comprise Something you know, Something you have, and Something you are. Downloaded files are not authentication factors.'
  },
  {
    order: 15,
    category: 'Cyber Security',
    text: 'Ransomware primarily aims to:',
    options: ['Improve system performance', 'Encrypt or lock data and demand payment', 'Increase network bandwidth', 'Remove advertisements'],
    correct: 1,
    explanation: 'Ransomware maliciously encrypts victim storage or locks terminal interfaces and extorts payments for decryption keys.'
  },
  {
    order: 16,
    category: 'Cyber Security',
    text: 'Which principle assumes that no user or device should automatically be trusted, even inside an organization\'s network?',
    options: ['Open Access', 'Zero Trust', 'Single Sign-On', 'Least Encryption'],
    correct: 1,
    explanation: 'Zero Trust architectural model operates on \"never trust, always verify\", requiring continuous validation for every access request.'
  },
  {
    order: 17,
    category: 'Cyber Security',
    text: 'The principle of least privilege means users should receive:',
    options: ['Maximum possible access', 'Access only necessary for their role', 'Administrator access by default', 'Access to all public data'],
    correct: 1,
    explanation: 'Principle of Least Privilege restricts access rights for accounts strictly to the bare minimum required to perform authorized duties.'
  },
  {
    order: 18,
    category: 'Cyber Security',
    text: 'A firewall primarily controls:',
    options: ['Physical access to computers', 'Network traffic based on security rules', 'Password complexity', 'Database normalization'],
    correct: 1,
    explanation: 'Firewalls inspect and filter incoming and outgoing network traffic based on configurable security rules and port policies.'
  },
  {
    order: 19,
    category: 'Cyber Security',
    text: 'Which attack involves secretly intercepting communication between two parties?',
    options: ['Man-in-the-Middle', 'Brute force', 'Ransomware', 'Buffer overflow'],
    correct: 0,
    explanation: 'A Man-in-the-Middle (MitM) attack secretly intercepts, inspects, or alters communication passing between two communicating entities.'
  },
  {
    order: 20,
    category: 'Cyber Security',
    text: 'HTTPS primarily protects web communication by using:',
    options: ['Plain HTTP only', 'TLS encryption', 'FTP', 'DNS caching'],
    correct: 1,
    explanation: 'HTTPS encrypts HTTP communications using Transport Layer Security (TLS) to guarantee confidentiality and integrity in transit.'
  },

  // Section B – Blockchain
  {
    order: 21,
    category: 'Blockchain',
    text: 'A blockchain is best described as:',
    options: ['A centralized database', 'A distributed ledger maintained across participating nodes', 'A password-management system', 'A type of firewall'],
    correct: 1,
    explanation: 'A blockchain is a decentralized distributed ledger that synchronizes replicated transaction states across peer-to-peer network nodes.'
  },
  {
    order: 22,
    category: 'Blockchain',
    text: 'The primary purpose of a cryptographic hash in blockchain is to:',
    options: ['Increase file size', 'Provide a fixed-size representation and help detect data modification', 'Hide the blockchain completely', 'Replace consensus mechanisms'],
    correct: 1,
    explanation: 'Cryptographic hashing generates deterministic fixed-length digests that detect any subsequent manipulation of underlying block payloads.'
  },
  {
    order: 23,
    category: 'Blockchain',
    text: 'In a blockchain, changing data in a previous block generally requires modification of:',
    options: ['Only that block with no further effect', 'Subsequent linked blocks and overcoming network consensus', 'Only the user\'s password', 'The internet connection'],
    correct: 1,
    explanation: 'Because each block embeds the hash of its predecessor, modifying historical blocks invalidates all successive blocks and requires re-mining against network consensus.'
  },
  {
    order: 24,
    category: 'Blockchain',
    text: 'Which property means that blockchain records are difficult to alter after confirmation?',
    options: ['Immutability', 'Centralization', 'Compression', 'Virtualization'],
    correct: 0,
    explanation: 'Immutability ensures that once confirmed by network consensus, recorded transactions cannot be altered or retroactively erased.'
  },
  {
    order: 25,
    category: 'Blockchain',
    text: 'Bitcoin primarily uses which consensus mechanism?',
    options: ['Proof of Stake', 'Proof of Work', 'Proof of Authority', 'Proof of Identity'],
    correct: 1,
    explanation: 'Bitcoin secures distributed consensus using Proof of Work (PoW) via SHA-256 mining calculations.'
  },
  {
    order: 26,
    category: 'Blockchain',
    text: 'In Proof of Work, miners primarily compete to:',
    options: ['Store passwords', 'Solve a computationally difficult puzzle', 'Encrypt all internet traffic', 'Approve usernames'],
    correct: 1,
    explanation: 'Miners iterate through candidate nonces to solve computationally demanding cryptographic hashing puzzles to earn block publishing rights.'
  },
  {
    order: 27,
    category: 'Blockchain',
    text: 'Which blockchain consensus mechanism selects validators partly according to the amount of cryptocurrency they have staked?',
    options: ['Proof of Work', 'Proof of Stake', 'Proof of Download', 'Proof of Encryption'],
    correct: 1,
    explanation: 'Proof of Stake (PoS) allocates block validation responsibilities based on the proportion of native tokens bonded or staked as security collateral.'
  },
  {
    order: 28,
    category: 'Blockchain',
    text: 'A smart contract is best described as:',
    options: ['A legal contract stored only on paper', 'Self-executing code deployed on a blockchain', 'A blockchain password', 'An antivirus program'],
    correct: 1,
    explanation: 'Smart contracts are immutable self-executing software programs deployed directly to blockchain state machines.'
  },
  {
    order: 29,
    category: 'Blockchain',
    text: 'A blockchain wallet primarily manages:',
    options: ['Cryptocurrency itself as a physical file', 'Cryptographic keys used to access blockchain assets', 'Internet bandwidth', 'Blockchain servers'],
    correct: 1,
    explanation: 'Wallets do not physically store tokens; they manage private and public cryptographic key pairs that grant transactional authority over ledger accounts.'
  },
  {
    order: 30,
    category: 'Blockchain',
    text: 'Which key must generally remain secret to authorize transactions from a blockchain account?',
    options: ['Public key', 'Private key', 'Hash value', 'Block number'],
    correct: 1,
    explanation: 'The private key generates digital signatures required to authorize and spend assets from corresponding blockchain addresses.'
  },
  {
    order: 31,
    category: 'Blockchain',
    text: 'If a private key is lost, the most immediate concern is:',
    options: ['Blockchain becomes centralized', 'Loss of access/control over associated assets', 'All blockchain blocks disappear', 'The internet stops working'],
    correct: 1,
    explanation: 'Without the private key, cryptographic signatures cannot be generated, permanently locking control over associated assets on the ledger.'
  },
  {
    order: 32,
    category: 'Blockchain',
    text: 'Which feature makes blockchain particularly useful for tracking a product\'s movement through multiple organizations?',
    options: ['Shared and tamper-evident ledger', 'Centralized password storage', 'Unlimited storage', 'Anonymous email'],
    correct: 0,
    explanation: 'A shared, immutable, tamper-evident ledger creates verifiable transparency and provenance auditing across disparate supply-chain participants.'
  },
  {
    order: 33,
    category: 'Blockchain',
    text: 'In blockchain terminology, a \"block\" generally contains:',
    options: ['Only a password', 'Transactions and information linking it to the previous block', 'Only user photographs', 'Only cryptocurrency prices'],
    correct: 1,
    explanation: 'Blocks bundle batches of validated transactions along with timestamps, nonces, and the cryptographic hash of the immediate prior block.'
  },
  {
    order: 34,
    category: 'Blockchain',
    text: 'Which statement about blockchain immutability is the most accurate?',
    options: [
      'Blockchain data can never be changed under any circumstances',
      'Confirmed data is difficult to alter because of cryptographic linking and consensus',
      'Blockchain data is always encrypted',
      'Blockchain eliminates all cyberattacks'
    ],
    correct: 1,
    explanation: 'Confirmed blocks achieve practical immutability because altering historical data requires recalculating cryptographic links and overpowering majority network consensus.'
  },
  {
    order: 35,
    category: 'Blockchain',
    text: 'A permissioned blockchain differs from a permissionless blockchain mainly because:',
    options: ['It does not use cryptography', 'Participation and access can be restricted', 'It cannot store transactions', 'It cannot use consensus'],
    correct: 1,
    explanation: 'Permissioned blockchains implement access-control layers where participation, transaction submission, and block validation require explicit authorization.'
  },

  // Section C – Digital Transformation
  {
    order: 36,
    category: 'Digital Transformation',
    text: 'Digital transformation primarily refers to:',
    options: [
      'Converting paper documents into PDFs only',
      'Using digital technologies to fundamentally improve processes, services and business models',
      'Purchasing more computers',
      'Installing antivirus software'
    ],
    correct: 1,
    explanation: 'Digital transformation integrates modern digital technologies across all enterprise areas to fundamentally reshape operations, deliver value, and redefine models.'
  },
  {
    order: 37,
    category: 'Digital Transformation',
    text: 'Which technology enables computing resources to be delivered over the internet on demand?',
    options: ['Cloud computing', 'Blockchain', 'Firewall', 'BIOS'],
    correct: 0,
    explanation: 'Cloud computing delivers on-demand computing services—including servers, storage, databases, and networking—over the internet with pay-as-you-go pricing.'
  },
  {
    order: 38,
    category: 'Digital Transformation',
    text: 'Which is an example of digital transformation rather than simple digitization?',
    options: [
      'Scanning a paper form',
      'Converting a paper report to PDF',
      'Redesigning a service around an automated digital workflow',
      'Printing a digital document'
    ],
    correct: 2,
    explanation: 'While digitization simply converts analog formats to digital, transformation restructures workflows and operating models around digital capabilities.'
  },
  {
    order: 39,
    category: 'Digital Transformation',
    text: 'IoT devices create a cybersecurity challenge mainly because:',
    options: [
      'They never communicate over networks',
      'Many connected devices increase the attack surface',
      'They cannot collect data',
      'They always use blockchain'
    ],
    correct: 1,
    explanation: 'Massive proliferation of internet-connected IoT devices, often with constrained compute and default credentials, drastically broadens the organizational threat attack surface.'
  },
  {
    order: 40,
    category: 'Digital Transformation',
    text: 'Which technology is commonly used to analyze very large datasets and identify patterns for decision-making?',
    options: ['Big Data Analytics', 'HDMI', 'BIOS', 'FTP'],
    correct: 0,
    explanation: 'Big Data Analytics employs scalable algorithms to inspect massive, diverse datasets to discover hidden patterns, correlations, and actionable insights.'
  },
  {
    order: 41,
    category: 'Digital Transformation',
    text: 'AI can strengthen cybersecurity by:',
    options: [
      'Eliminating the need for security professionals',
      'Detecting patterns and anomalies in large volumes of data',
      'Making passwords unnecessary',
      'Preventing every possible cyberattack'
    ],
    correct: 1,
    explanation: 'Artificial Intelligence and machine learning analyze vast volumes of telemetry in real time to pinpoint behavioral anomalies and detect emerging threats.'
  },
  {
    order: 42,
    category: 'Digital Transformation',
    text: 'Which cloud service model provides the greatest control over the underlying virtualized infrastructure?',
    options: ['SaaS', 'PaaS', 'IaaS', 'FaaS'],
    correct: 2,
    explanation: 'Infrastructure as a Service (IaaS) provides bare virtualized compute, storage, and networking, leaving OS, middleware, and application administration to the client.'
  },
  {
    order: 43,
    category: 'Digital Transformation',
    text: 'In SaaS, the customer typically:',
    options: [
      'Manages physical servers',
      'Uses software provided and managed by the service provider',
      'Builds the cloud data center',
      'Controls the underlying hypervisor'
    ],
    correct: 1,
    explanation: 'Software as a Service (SaaS) delivers complete applications over the web where the cloud vendor manages infrastructure, maintenance, and patches.'
  },
  {
    order: 44,
    category: 'Digital Transformation',
    text: 'Digital twins are primarily used to:',
    options: [
      'Create duplicate passwords',
      'Create digital representations of physical systems or objects',
      'Replace blockchain consensus',
      'Encrypt emails'
    ],
    correct: 1,
    explanation: 'A digital twin is a virtual model designed to accurately reflect a physical object or system using real-time sensor streams for simulation and optimization.'
  },
  {
    order: 45,
    category: 'Digital Transformation',
    text: 'Which technology is particularly useful for providing an auditable history of transactions among multiple organizations?',
    options: ['Blockchain', 'Calculator', 'Word processor', 'Image compression'],
    correct: 0,
    explanation: 'Blockchain provides a cryptographically verifiable, shared audit trail that multiple independent organizations can inspect and trust without centralized intermediaries.'
  },

  // Section D – Integrated Cyber Security + Blockchain + Digital Transformation
  {
    order: 46,
    category: 'Integrated',
    text: 'An organization stores sensitive personal information directly on a public blockchain. What is the main concern?',
    options: [
      'Blockchain cannot store data',
      'Immutability may conflict with privacy and data-erasure requirements',
      'Blockchain automatically deletes old data',
      'Public blockchains have no cryptography'
    ],
    correct: 1,
    explanation: 'Public blockchain immutability means stored data cannot be erased or modified, conflicting with regulatory privacy rights such as the \"Right to be Forgotten\" (GDPR).'
  },
  {
    order: 47,
    category: 'Integrated',
    text: 'A smart contract contains a programming bug that allows unauthorized fund transfers. Which statement is most accurate?',
    options: [
      'Blockchain automatically corrects all smart-contract bugs',
      'Immutability can make correcting deployed contract logic difficult',
      'Hashing prevents all programming errors',
      'Consensus guarantees bug-free code'
    ],
    correct: 1,
    explanation: 'Once deployed, smart contract bytecode is immutable, making hot-patching logic bugs difficult without pre-architected upgrade patterns or proxy contracts.'
  },
  {
    order: 48,
    category: 'Integrated',
    text: 'An IoT-based smart factory uses blockchain to record sensor data. What problem does blockchain not automatically solve?',
    options: [
      'Maintaining a tamper-evident ledger',
      'Whether the original sensor supplied false or manipulated data',
      'Sharing records among participants',
      'Recording transactions'
    ],
    correct: 1,
    explanation: 'The oracle/input problem: Blockchain guarantees tamper-evidence once data is committed, but cannot inherently verify if the input sensor was faulty or physically compromised.'
  },
  {
    order: 49,
    category: 'Integrated',
    text: 'An employee receives a legitimate-looking AI-generated voice message from a senior executive requesting an urgent money transfer. This is an example of the growing risk of:',
    options: [
      'Deepfake-enabled social engineering',
      'Data normalization',
      'Blockchain mining',
      'Load balancing'
    ],
    correct: 0,
    explanation: 'Generative AI audio cloning enables hyper-realistic synthetic deepfake voice phishing (vishing) used in executive impersonation attacks.'
  },
  {
    order: 50,
    category: 'Integrated',
    text: 'Which combination provides the most comprehensive approach to secure digital transformation?',
    options: [
      'Blockchain alone',
      'Antivirus alone',
      'Cybersecurity + privacy + secure technology design + user awareness + governance',
      'Cloud computing alone'
    ],
    correct: 2,
    explanation: 'Robust security during digital transformation requires multi-layered defense: technical architecture, privacy safeguards, threat intelligence, continuous human awareness, and executive governance.'
  }
];

const testId = 'test-fdp-2026';

const questions = [];
const options = [];

rawQuestions.forEach((q) => {
  const qId = 'q-fdp-' + q.order;
  const qObj = {
    id: qId,
    testId,
    text: q.text,
    type: 'MULTIPLE_CHOICE',
    marks: 1,
    order: q.order,
    category: q.category,
    explanation: q.explanation,
    options: []
  };

  q.options.forEach((optText, oIdx) => {
    const optId = qId + '-opt-' + String.fromCharCode(65 + oIdx);
    const optObj = {
      id: optId,
      questionId: qId,
      text: optText,
      isCorrect: oIdx === q.correct,
      order: oIdx + 1
    };
    options.push(optObj);
    qObj.options.push(optObj);
  });

  questions.push(qObj);
});

const initialData = {
  admins: [
    {
      id: 'admin-1',
      email: 'admin@nmiet.edu.in',
      name: 'FDP Coordinator / Admin',
      password: 'admin123456',
      role: 'SUPERADMIN',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    }
  ],
  users: [
    {
      id: 'user-demo-1',
      name: 'Shardul Parihar',
      email: 'shardulparihar.work@gmail.com',
      phone: '+91 98765 43210',
      organization: 'Nutan Maharashtra Institute of Engineering & Technology, Talegaon',
      createdAt: '2026-10-05T09:00:00.000Z',
      updatedAt: '2026-10-05T09:00:00.000Z',
    }
  ],
  tests: [
    {
      id: testId,
      title: 'Faculty Development Programme (FDP) Assessment',
      slug: 'fdp-cybersecurity-blockchain-assessment',
      description: 'Faculty Development Programme on "Recent advances in cyber security and blockchain for secure digital transformation" organized by Department of Information Technology association with Indian Society for Technical Education (ISTE) held on 5th to 9th Oct, 2026.',
      durationMinutes: 60,
      passingPercentage: 0,
      isPublished: true,
      certificateTitle: 'Certificate of Participation',
      organizationName: 'NMIET in association with ISTE',
      createdAt: '2026-10-05T09:00:00.000Z',
      updatedAt: '2026-10-05T09:00:00.000Z',
      questions: questions
    }
  ],
  questions,
  options,
  attempts: [],
  answers: [],
  certificates: [],
  emailLogs: []
};

const code = `// Autogenerated seed file with 50 FDP questions
import { DatabaseSchema } from './types';

export const initialDatabaseData: DatabaseSchema = ${JSON.stringify(initialData, null, 2)};
`;

fs.writeFileSync('src/lib/seed.ts', code, 'utf-8');
console.log('Successfully wrote src/lib/seed.ts with 50 questions!');

if (!fs.existsSync('data')) fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/certipulse_db.json', JSON.stringify(initialData, null, 2), 'utf-8');
console.log('Successfully wrote data/certipulse_db.json with 50 questions!');
