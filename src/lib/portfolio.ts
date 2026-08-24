/**
 * Majesty's Portfolio — all site content lives here.
 *
 * To update later, just edit this one file:
 *  - resumeUrl:  paste the download link to your resume when it's ready.
 *  - catalog:    add real certificates, internships and volunteering
 *                entries — they automatically appear in the searchable
 *                Catalog section.
 */

export interface CatalogItem {
  id: string;
  type: "certificate" | "experience" | "volunteering";
  title: string;
  description: string;
  status: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location?: string;
  jobType?: string;
  period: string;
  skills?: string[];
}

export interface VolunteeringItem {
  id: string;
  role: string;
  organization: string;
  cause: string;
  period: string;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  period: string;
  detail: string;
  honors: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
  status?: string;
  /** Skills covered by the certification. */
  skills?: string[];
  /** Credential ID issued by the organisation, if any. */
  credentialId?: string;
  /** Public credential verification URL, if any. */
  credentialUrl?: string;
  /** Optional certificate image (e.g. "/certificates/upskill-crawford.jpg"). */
  image?: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  meta?: string;
}

export const portfolio = {
  name: "Majesty Olatimilehin",
  firstName: "Majesty",
  brand: "Majesty's Portfolio",
  roles: ["Computer Scientist", "Virtual Assistant"],
  initials: "MO",

  /** Full-size profile photo. */
  photo: "/majesty.jpg",

  /**
   * Cropped, face-focused square avatar used for circular logos and profile
   * pictures. Pre-cropped so it always fits a circle perfectly.
   */
  avatar: "/majesty-avatar.jpg",

  tagline:
    "Turning ideas into practical digital solutions — blending the structure of computer science with a creative, artist's eye for detail.",

  about: `I'm a Computer Scientist who enjoys turning ideas into practical digital solutions. With a creative mindset shaped by my hobby as an artist, I approach technology with curiosity, structure, and innovation — allowing me to tackle problems from both analytical and creative angles. I'm still learning every day, because for me, learning never stops.`,

  email: "hello@majolat2000.com.ng",
  linkedinUrl: "https://www.linkedin.com/in/majesty-olatimilehin",
  linkedinHandle: "majesty-olatimilehin",

  /** Resume — viewers open the Google Doc directly. */
  resumeUrl: "https://docs.google.com/document/d/1pXHt8mSOz6YBjgafrG-TPbIh-gEJ-S34/edit",

  nav: [
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
    { label: "Education", href: "#education" },
    { label: "Catalog", href: "#catalog" },
    { label: "Contact", href: "#contact" },
  ],

  traits: [
    {
      label: "Analytical problem-solver",
      description: "Tackling challenges with structure and logic.",
    },
    {
      label: "Creative mindset",
      description: "An artist's eye applied to technology.",
    },
    {
      label: "Structured & curious",
      description: "Curiosity, discipline and innovation combined.",
    },
    {
      label: "Lifelong learner",
      description: "Learning never stops — every day is a lesson.",
    },
  ],

  skills: {
    computerScience: {
      title: "Computer Science",
      description: "Core toolkit I'm building through my Computer Science journey.",
      items: [
        "Web development",
        "Programming & scripting",
        "Data & analytics",
        "Technical problem-solving",
        "Software fundamentals",
        "UI/UX awareness",
      ],
    },
    virtualAssistance: {
      title: "Virtual Assistance",
      description: "Reliable, organised support that keeps things running smoothly.",
      items: [
        "Email & calendar management",
        "Research & documentation",
        "Data entry & organisation",
        "Client communication",
        "Task coordination",
        "Scheduling & follow-ups",
      ],
    },
    workingStyle: {
      title: "How I Work",
      description: "The habits I bring to every project and every team.",
      items: [
        "Curious",
        "Innovative",
        "Detail-oriented",
        "Adaptable",
        "Reliable",
        "Creative",
      ],
    },
  },

  /**
   * The browsable, searchable catalog.
   * Add real entries here as you earn them — they flow straight into the
   * Catalog section with search and filters already wired up.
   */
  catalog: [
    {
      id: "academic-achievements",
      type: "certificate",
      title: "Academic achievements",
      description:
        "Certificates and course completions from my Computer Science journey — the full list lives on the Certificates & Achievements page.",
      status: "Live",
    },
    {
      id: "professional-training",
      type: "certificate",
      title: "Professional skills training",
      description:
        "Credentials earned to sharpen my toolkit, from technical coursework to productivity and communication.",
      status: "Live",
    },
    {
      id: "internships",
      type: "experience",
      title: "Internship experience",
      description:
        "Internships in IT, AI engineering, social media and fintech — from Reeltech to FlyRank AI, Crawford University and Cowrywise.",
      status: "In progress",
    },
    {
      id: "community-work",
      type: "volunteering",
      title: "Volunteering & community work",
      description:
        "Giving my time to causes that matter — children's welfare with the Betty Ann Moore Foundation and economic empowerment with AdeOrin's Kitchen.",
      status: "Completed",
    },
    {
      id: "personal-projects",
      type: "experience",
      title: "Projects & experiments",
      description:
        "Ideas I've built for the love of learning — small experiments that became something bigger.",
      status: "Coming soon",
    },
    {
      id: "recognition",
      type: "certificate",
      title: "Awards & recognition",
      description:
        "Mentions, honours and moments I'm proud of — collected here as they happen.",
      status: "Coming soon",
    },
  ] satisfies CatalogItem[],

  catalogNote:
    "Every certificate, role and cause I've collected so far — searchable, filterable, and growing every day.",

  /** Professional roles & internships, most recent first. */
  experience: [
    {
      id: "reeltech-it",
      role: "Information Technology Intern",
      company: "Reeltech Business Solutions Limited",
      location: "Lagos, Nigeria",
      jobType: "Hybrid",
      period: "Jul 2026 – Present",
      skills: ["ERP", "MRP", "Microsoft Dynamics 365 Business Central"],
    },
    {
      id: "flyrank-ai",
      role: "Front-end AI Engineering Intern",
      company: "FlyRank AI",
      jobType: "Remote",
      period: "Jul 2026 – Present",
    },
    {
      id: "crawford-smm",
      role: "Social Media Management Intern",
      company: "Crawford University",
      location: "Ogun State, Nigeria",
      jobType: "Hybrid",
      period: "May 2026 – Present",
      skills: [
        "Social media management",
        "Verification & validation (V&V)",
        "Clear communication",
      ],
    },
    {
      id: "cowrywise-ambassador",
      role: "Ambassador",
      company: "Cowrywise",
      location: "Lagos State, Nigeria",
      jobType: "Hybrid",
      period: "Dec 2025 – Present",
      skills: ["Financial literacy", "FLT"],
    },
    {
      id: "maka-content",
      role: "Content Creator",
      company: "MAKA",
      location: "Lagos, Nigeria",
      jobType: "Hybrid",
      period: "Jan 2023 – Jun 2024",
      skills: [
        "Video editing",
        "Paid content",
        "Product marketing",
        "Content marketing",
        "Content creation",
      ],
    },
  ] satisfies ExperienceItem[],

  /** Volunteering & community work. */
  volunteering: [
    {
      id: "betty-ann-moore",
      role: "Social Media Specialist",
      organization: "Betty Ann Moore Foundation",
      cause: "Children",
      period: "Mar 2026 – Jul 2026",
    },
    {
      id: "adeorins-kitchen",
      role: "Sales and Marketing Specialist",
      organization: "AdeOrin's Kitchen",
      cause: "Economic Empowerment",
      period: "May 2026",
    },
  ] satisfies VolunteeringItem[],

  /** Education. */
  education: [
    {
      id: "crawford-university",
      school: "Crawford University",
      degree: "BSc Computer Science",
      period: "Oct 2024 – Sep 2028",
      detail:
        "Full-time undergraduate degree with an expected graduation in September 2028.",
      honors: "First Class",
    },
  ] satisfies EducationItem[],

  /**
   * Certificates — add real ones here and they automatically appear in the
   * slideshow on the Certificates & Achievements page (/credentials).
   */
  certificates: [
    {
      id: "upskill-crawford",
      title: "Upskill Crawford",
      issuer: "Crawford University",
      date: "April 2025",
      description:
        "Financial literacy and foreign exchange (FX) trading training delivered through Crawford University's Upskill programme.",
      skills: ["Financial Literacy", "FX Trading"],
      status: "Verified",
      image: "/certificates/upskill-crawford.jpg",
    },
    {
      id: "vsavvy-virtual-assistance",
      title: "Virtual Assistance",
      issuer: "VSavvy Academy",
      date: "December 2025",
      description:
        "A practical virtual assistance programme covering the day-to-day skills needed to support clients remotely — from customer service and email marketing to social media management and data entry.",
      skills: [
        "Customer Service",
        "Email Marketing",
        "General Virtual Assistance",
        "Social Media Management",
        "Social Media Marketing",
        "Data Entry",
      ],
      credentialId: "VSA-DEC25-C8R21",
      credentialUrl: "https://vsavvyacademy.com/verify/?cert_id=VSA-DEC25-C8R21",
      status: "Verified",
      image: "/certificates/vsavvy-virtual-assistance.jpg",
    },
    {
      id: "edinburgh-code-yourself",
      title: "Code Yourself! An Introduction to Programming",
      issuer: "The University of Edinburgh",
      date: "December 2025",
      description:
        "An introductory programming course from the University of Edinburgh (via Coursera), learning to design, write and test programs — from pseudocode and flow charts to algorithms and concurrent programming.",
      skills: [
        "Python (Basics)",
        "Pseudocode",
        "Data Analysis",
        "Flow Charts",
        "Scratch",
        "Concurrent Programming",
        "Algorithms",
        "Data Entry",
        "Iterative Design",
      ],
      credentialId: "MRKYK7FP76MY",
      credentialUrl: "https://www.coursera.org/account/accomplishments/verify/MRKYK7FP76MY",
      status: "Verified",
      image: "/certificates/edinburgh-code-yourself.jpg",
    },
    {
      id: "google-gmail",
      title: "Gmail",
      issuer: "Google Cloud Training",
      date: "January 2026",
      description:
        "Hands-on training in Gmail as part of Google Workspace — getting comfortable with the inbox tools that power everyday virtual assistance work.",
      skills: ["Google Workspace"],
      credentialId: "D9MV8TE18MX9",
      credentialUrl: "https://www.coursera.org/account/accomplishments/records/D9MV8TE18MX9",
      status: "Verified",
      image: "/certificates/google-gmail.jpg",
    },
    {
      id: "google-drive",
      title: "Google Drive",
      issuer: "Google Cloud Training",
      date: "January 2026",
      description:
        "Hands-on training in Google Drive as part of Google Workspace — organising, sharing and collaborating on files with ease.",
      skills: ["Google Workspace"],
      credentialId: "BRIOK36VUTAF",
      credentialUrl: "https://www.coursera.org/account/accomplishments/records/BRIOK36VUTAF",
      status: "Verified",
      image: "/certificates/google-drive.jpg",
    },
    {
      id: "copenhagen-data-literacy",
      title: "Data Literacy — What is it and why does it matter?",
      issuer: "University of Copenhagen (Københavns Universitet)",
      date: "January 2026",
      description:
        "An introduction to data literacy from the University of Copenhagen — what data is, why it matters, and how to handle it responsibly, from collection and sharing to security and ethics.",
      skills: [
        "Data Literacy",
        "Journalism",
        "Algorithms",
        "Data Security",
        "Data Ethics",
        "Artificial Intelligence",
        "Machine Learning",
        "Data Collection",
        "Data Sharing",
        "Information Privacy",
        "Personally Identifiable Information",
      ],
      status: "Verified",
      image: "/certificates/copenhagen-data-literacy.jpg",
    },
    {
      id: "suny-basic-information-literacy",
      title: "Basic Information Literacy",
      issuer: "The State University of New York",
      date: "January 2026",
      description:
        "A foundational course on information literacy from The State University of New York — finding, evaluating and managing information effectively and responsibly.",
      skills: [
        "Data Ethics",
        "Digital Literacy",
        "Research Skills",
        "Information Management",
        "Literacy",
        "Critical Thinking",
        "Investigation",
        "Planning",
      ],
      credentialId: "V8GGNKUU44P1",
      credentialUrl: "https://www.coursera.org/account/accomplishments/records/V8GGNKUU44P1",
      status: "Verified",
      image: "/certificates/suny-basic-information-literacy.jpg",
    },
    {
      id: "google-docs",
      title: "Google Docs",
      issuer: "Google Cloud Training",
      date: "January 2026",
      description:
        "Hands-on training in Google Docs as part of Google Workspace — creating, formatting and collaborating on documents with confidence.",
      skills: ["Google Workspace"],
      credentialId: "4NF411FNPO6F",
      credentialUrl: "https://www.coursera.org/account/accomplishments/records/4NF411FNPO6F",
      status: "Verified",
      image: "/certificates/google-docs.jpg",
    },
    {
      id: "google-sheets",
      title: "Google Sheets",
      issuer: "Google Cloud Training",
      date: "January 2026",
      description:
        "Hands-on training in Google Sheets as part of Google Workspace — building, organising and analysing data in spreadsheets.",
      skills: ["Google Workspace"],
      credentialId: "UNY4XLTR8YIU",
      credentialUrl: "https://www.coursera.org/account/accomplishments/records/UNY4XLTR8YIU",
      status: "Verified",
      image: "/certificates/google-sheets.jpg",
    },
    {
      id: "coursera-powerpoint",
      title: "Getting Started with Microsoft PowerPoint",
      issuer: "Coursera",
      date: "January 2026",
      description:
        "A hands-on introduction to Microsoft PowerPoint — designing clear, polished and professional presentations.",
      skills: ["Microsoft Office"],
      credentialId: "3NR1VW62S27K",
      credentialUrl: "https://www.coursera.org/account/accomplishments/records/3NR1VW62S27K",
      status: "Verified",
      image: "/certificates/coursera-powerpoint.jpg",
    },
    {
      id: "borderless-frontend",
      title: "Complete Frontend Web Development Course",
      issuer: "Borderless Skills",
      date: "February 2026",
      description:
        "A complete frontend web development course from Borderless Skills — building modern, responsive websites with HTML, CSS, JavaScript and Bootstrap.",
      skills: [
        "HTML",
        "CSS",
        "JavaScript",
        "Bootstrap (Framework)",
        "Web Development",
        "Web Design",
      ],
      credentialId: "506cb08e4881a161",
      credentialUrl: "https://borderlessskills.com/tutor-certificate?cert_hash=506cb08e4881a161",
      status: "Verified",
    },
    {
      id: "coursera-powerpoint-design",
      title: "Designing and Formatting a Presentation in PowerPoint",
      issuer: "Coursera",
      date: "January 2026",
      description:
        "A deeper look at PowerPoint from Coursera — designing and formatting presentations that communicate clearly, from layout and visuals to editing and data visualisation.",
      skills: [
        "Graphic Design",
        "Microsoft PowerPoint",
        "Presentations",
        "Microsoft Office",
        "Data Visualisation",
        "Editing",
        "Writing",
      ],
      credentialId: "75IMDSZWVTL2",
      credentialUrl: "https://www.coursera.org/account/accomplishments/records/75IMDSZWVTL2",
      status: "Verified",
      image: "/certificates/coursera-powerpoint-design.jpg",
    },
    {
      id: "codesignal-web-dev",
      title: "Web Development with HTML, CSS, and JavaScript",
      issuer: "CodeSignal",
      date: "January 2026",
      description:
        "A hands-on CodeSignal course on web development — building interactive, well-structured web pages with HTML, CSS and JavaScript.",
      skills: ["HTML", "CSS", "JavaScript", "Web Development"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/60",
      status: "Verified",
      image: "/certificates/codesignal-web-dev.jpg",
    },
    {
      id: "codesignal-html",
      title: "HTML: The Structure of the Web",
      issuer: "CodeSignal",
      date: "January 2026",
      description:
        "A focused CodeSignal course on HTML — learning how web pages are structured with semantic, accessible markup.",
      skills: ["HTML"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/1393",
      status: "Verified",
      image: "/certificates/codesignal-html.jpg",
    },
    {
      id: "codesignal-css",
      title: "CSS: Styling the Web",
      issuer: "CodeSignal",
      date: "January 2026",
      description:
        "A focused CodeSignal course on CSS — styling the web with layout, colour, typography and responsive design.",
      skills: ["Cascading Style Sheets (CSS)"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/1394",
      status: "Verified",
      image: "/certificates/codesignal-css.jpg",
    },
    {
      id: "codesignal-javascript",
      title: "JavaScript: Making Web Pages Interactive",
      issuer: "CodeSignal",
      date: "January 2026",
      description:
        "A focused CodeSignal course on JavaScript — bringing web pages to life with interactivity, logic and dynamic content.",
      skills: ["JavaScript"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/1395",
      status: "Verified",
      image: "/certificates/codesignal-javascript.jpg",
    },
    {
      id: "codesignal-javascript-dom",
      title: "JavaScript and the DOM: Connecting Code to Web Pages",
      issuer: "CodeSignal",
      date: "February 2026",
      description:
        "A CodeSignal course on the Document Object Model — connecting JavaScript code to web pages to manipulate elements and respond to users.",
      skills: ["JavaScript"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/1396",
      status: "Verified",
      image: "/certificates/codesignal-javascript-dom.jpg",
    },
    {
      id: "codesignal-intro-web-dev",
      title: "Introduction to Web Development",
      issuer: "CodeSignal",
      date: "February 2026",
      description:
        "A CodeSignal introduction to web development — covering the full stack of front-end building blocks, from HTML, CSS and JavaScript to HTTP, APIs and JSON.",
      skills: ["HTML", "CSS", "JavaScript", "HTTP", "API", "JSON"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/course-paths/324",
      status: "Verified",
      image: "/certificates/codesignal-intro-web-dev.jpg",
    },
    {
      id: "codesignal-hello-javascript",
      title: "Hello, JavaScript! Your First Steps",
      issuer: "CodeSignal",
      date: "February 2026",
      description:
        "A beginner-friendly CodeSignal course taking the first steps with JavaScript — variables, logic and your first programs.",
      skills: ["JavaScript"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/1464",
      status: "Verified",
      image: "/certificates/codesignal-hello-javascript.jpg",
    },
    {
      id: "codesignal-js-data-variables",
      title: "JavaScript's Building Blocks: Data & Variables",
      issuer: "CodeSignal",
      date: "February 2026",
      description:
        "A CodeSignal course on JavaScript's core building blocks — working with data types, variables and the foundations of clean code.",
      skills: ["JavaScript"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/1465",
      status: "Verified",
      image: "/certificates/codesignal-js-data-variables.jpg",
    },
    {
      id: "codesignal-crossroads-of-code",
      title: "The Crossroads of Code: Making Decisions",
      issuer: "CodeSignal",
      date: "February 2026",
      description:
        "A CodeSignal course on decision-making in JavaScript — using boolean logic and conditionals to steer program flow.",
      skills: ["Boolean Logic and JavaScript"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/1466",
      status: "Verified",
      image: "/certificates/codesignal-crossroads-of-code.jpg",
    },
    {
      id: "codesignal-mastering-loops",
      title: "JavaScript's Auto-Pilot: Mastering Loops",
      issuer: "CodeSignal",
      date: "March 2026",
      description:
        "A CodeSignal course on loops in JavaScript — repeating work efficiently and combining them with boolean logic to solve real problems.",
      skills: ["JavaScript and Boolean Logic"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/1467",
      status: "Verified",
      image: "/certificates/codesignal-mastering-loops.jpg",
    },
    {
      id: "codesignal-intro-programming-js",
      title: "Introduction to Programming with JavaScript",
      issuer: "CodeSignal",
      date: "March 2026",
      description:
        "A CodeSignal learning path introducing programming through JavaScript — from data and variables to decisions, loops and logic.",
      skills: ["JavaScript", "Boolean Logic"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/course-paths/341",
      status: "Verified",
      image: "/certificates/codesignal-intro-programming-js.jpg",
    },
    {
      id: "codesignal-java-fundamentals",
      title: "Java Fundamentals",
      issuer: "CodeSignal",
      date: "March 2026",
      description:
        "A CodeSignal course on Java fundamentals — learning the syntax, structure and core concepts of one of the most widely used programming languages.",
      skills: ["Java"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/2168",
      status: "Verified",
      image: "/certificates/codesignal-java-fundamentals.jpg",
    },
    {
      id: "codesignal-oop-java",
      title: "Object-Oriented Java",
      issuer: "CodeSignal",
      date: "April 2026",
      description:
        "A CodeSignal course on object-oriented programming in Java — classes, objects, encapsulation and the design patterns that structure real applications.",
      skills: ["Java", "Object-Oriented Programming (OOP)"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/2169",
      status: "Verified",
      image: "/certificates/codesignal-oop-java.jpg",
    },
    {
      id: "codesignal-java-collections",
      title: "Java Collections Essentials",
      issuer: "CodeSignal",
      date: "April 2026",
      description:
        "A CodeSignal course on Java collections — working with lists, sets and maps to store, organise and manage data efficiently.",
      skills: ["Java"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/2170",
      status: "Verified",
      image: "/certificates/codesignal-java-collections.jpg",
    },
    {
      id: "codesignal-functional-java",
      title: "Functional Java Mastery",
      issuer: "CodeSignal",
      date: "April 2026",
      description:
        "A CodeSignal course on functional programming in Java — lambdas, streams and writing cleaner, more expressive code.",
      skills: ["Java"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/2171",
      status: "Verified",
      image: "/certificates/codesignal-functional-java.jpg",
    },
    {
      id: "codesignal-multithreading",
      title: "Multithreading Essentials",
      issuer: "CodeSignal",
      date: "May 2026",
      description:
        "A CodeSignal course on multithreading in Java — running concurrent tasks, managing threads and building responsive programs.",
      skills: ["Multithreading", "Java"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/courses/2172",
      status: "Verified",
      image: "/certificates/codesignal-multithreading.jpg",
    },
    {
      id: "codesignal-java-interview-prep",
      title: "Java Interview Prep for Interns",
      issuer: "CodeSignal",
      date: "May 2026",
      description:
        "A CodeSignal learning path preparing for Java internships — consolidating object-oriented programming, multithreading and interview-style problem solving.",
      skills: ["Java", "Multithreading", "Object-Oriented Programming (OOP)"],
      credentialUrl: "https://codesignal.com/learn/certificates/cmkn3ikkq006qjg04ctp1kgxe/course-paths/514",
      status: "Verified",
      image: "/certificates/codesignal-java-interview-prep.jpg",
    },
    {
      id: "jobberman-get-hired-sales",
      title: "Get Hired In Sales",
      issuer: "Jobberman Nigeria",
      date: "August 2026",
      description:
        "In partnership with Mastercard Foundation — successfully completed and passed the Get Hired in Sales course. Awarded by Jobberman Nigeria for sales fundamentals, customer engagement and job-readiness skills.",
      skills: ["Digital Marketing"],
      credentialId: "CERT-000000000578",
      credentialUrl: "https://www.jobberman.com/certificate/69780fbf-621a-4e6a-b353-0a11f368f447",
      status: "Verified",
      image: "/projects/jobberman-get-hired-sales.jpg",
    },
  ] satisfies CertificateItem[],

  /** Achievements & honours — milestones worth celebrating. */
  achievements: [
    {
      id: "first-class",
      title: "First Class academic standing",
      description:
        "Currently holding a First Class standing in my BSc Computer Science degree at Crawford University.",
      meta: "Oct 2024 – Sep 2028",
    },
    {
      id: "parallel-roles",
      title: "Five roles running in parallel",
      description:
        "Balancing IT, front-end AI engineering, social media, fintech ambassadorship and content creation — across Reeltech, FlyRank AI, Crawford University, Cowrywise and MAKA.",
      meta: "Since 2023",
    },
    {
      id: "community-impact",
      title: "Giving back through volunteering",
      description:
        "Social media support for children's welfare with the Betty Ann Moore Foundation, plus sales & marketing for economic empowerment at AdeOrin's Kitchen.",
      meta: "2025 – 2026",
    },
  ] satisfies AchievementItem[],
};

export type SkillGroup = (typeof portfolio.skills)[keyof typeof portfolio.skills];
