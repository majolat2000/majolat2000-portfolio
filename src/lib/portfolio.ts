/**
 * Majesty's Portfolio — all site content lives here.
 *
 * To update later, just edit this one file:
 *  - resumeUrl:  paste the download link to your resume when it's ready.
 *  - projects / certificates / experience: fill the "coming soon" sections.
 */

export const portfolio = {
  name: "Majesty Olatimilehin",
  firstName: "Majesty",
  brand: "Majesty's Portfolio",
  roles: ["Computer Scientist", "Virtual Assistant"],
  initials: "MO",

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
    { label: "Certificates", href: "#certificates" },
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

  /** Coming-soon placeholders — fill these in as you collect your achievements. */
  certificates: {
    note: "This space is reserved — my certificates and achievements are on the way.",
  },
};

export type SkillGroup = (typeof portfolio.skills)[keyof typeof portfolio.skills];
