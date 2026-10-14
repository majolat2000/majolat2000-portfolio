export const COURSE_PROMPT_TEMPLATE = `Act as an expert frontend developer and UI/UX designer. Build a modern, mobile-responsive, and professional portfolio website for a student specializing in [Insert Field, e.g., Virtual Assistance / Graphic Design].

The website must be clean, fast-loading, and structured with the following sections:

1. Hero Section:
A striking introduction with a professional greeting, a one-sentence value proposition highlighting your core skills, and two Call-to-Action (CTA) buttons: "View Projects" and "Contact Me". You can use "View Resume" and "Contact Me" instead.

2. About Me & Skills:
A brief, engaging bio section detailing your academic background and career goals, followed by a visually appealing list or grid of your technical and soft skills.

3. Projects Portfolio:
A grid layout showcasing your best academic or personal projects. Each project card must include: a placeholder for a thumbnail image, the project title, a 2-sentence description, the tools/tech stack used, and buttons for "Live Demo" and "Source Code". Skip if you have none.

4. Interactive CV/Resume Section (CRITICAL FEATURE):
Create a dedicated resume section designed for immediate accessibility.

Preview: Embed a responsive PDF viewer (using an \`iframe\` or \`embed\` tag) so visitors can read the full CV directly on the page without navigating away. Ensure this viewer scales correctly on mobile devices.
Download: Place a highly visible, styled "Download CV (PDF)" button directly above or beside the preview pane. Set the button link to trigger an automatic download using the \`download\` attribute.

5. Contact & Socials:
A clean, functional contact form (Name, Email, Message) that submits directly to my email and clearly visible icon links to my professional networks (LinkedIn, GitHub/Portfolio link, Email).

Design System Guidelines:

Theme: Minimalist and professional. Use a [Insert Color Scheme, e.g., sleek dark mode with neon blue accents / clean white with slate gray and soft green] palette.
Typography: Modern, readable sans-serif fonts (e.g., Inter or Roboto).
UX: Implement smooth scrolling between sections, clear hover states on all buttons and cards, and ensure perfect mobile responsiveness.

Please generate the complete HTML, CSS, and necessary JavaScript or the site structure to achieve this exact layout.

---

Pro-Tip for the CV Implementation: If you cannot natively host files during the generation phase, ask for my Google Drive or Dropbox direct download link, and replace the placeholder link in the "Download" button with my actual link.`;
