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

export const portfolio = {
  name: "Majesty Olatimilehin",
  firstName: "Majesty",
  brand: "Majesty's Portfolio",
  roles: ["Computer Scientist", "Virtual Assistant"],
  initials: "MO",

  /** Profile photo — replace /majesty.jpg with your own image if you prefer. */
  photo: "/majesty.jpg",

  tagline:
    "Turning ideas into practical digital solutions — blending the structure of computer science with a creative, artist's eye for detail.",

  about: `I'm a Computer Scientist who enjoys turning ideas into practical digital solutions. With a creative mindset shaped by my hobby as an artist, I approach technology with curiosity, structure, and innovation — allowing me to tackle problems from both analytical and creative angles. I'm still learning every day, because for me, learning never stops.`,

  email: "majesty.olatimilehin@crawforduniversity.edu.ng",
  phoneDisplay: "+234 817 928 9269",
  phoneTel: "+2348179289269",
  linkedinUrl: "https://www.linkedin.com/in/majesty-olatimilehin",
  linkedinHandle: "majesty-olatimilehin",

  /** ✏️ Add your resume download link here when it's ready. */
  resumeUrl: "",

  nav: [
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Experience", href: "#experience" },
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
        "Certificates and course completions from my Computer Science journey — the first entries will land here soon.",
      status: "Adding soon",
    },
    {
      id: "professional-training",
      type: "certificate",
      title: "Professional skills training",
      description:
        "Credentials earned to sharpen my toolkit, from technical coursework to productivity and communication.",
      status: "Adding soon",
    },
    {
      id: "internships",
      type: "experience",
      title: "Internship experience",
      description:
        "Hands-on professional training in real-world settings, where I've put classroom ideas into practice.",
      status: "Adding soon",
    },
    {
      id: "community-work",
      type: "volunteering",
      title: "Volunteering & community work",
      description:
        "The causes I give my time to, and the contributions I've made along the way.",
      status: "Adding soon",
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
};

export type SkillGroup = (typeof portfolio.skills)[keyof typeof portfolio.skills];
