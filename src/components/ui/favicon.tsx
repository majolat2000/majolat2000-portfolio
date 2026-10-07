import { cn } from "@/lib/utils";
import { Linkedin, Mail, Github, Figma, Triangle, Award, Chrome, Calendar, MapPin, User, Layout } from "lucide-react";

export const favicons = {
  site: "site",
  avatar: "avatar",
  linkedin: "linkedin",
  gmail: "gmail",
  github: "github",
  figma: "figma",
  vercel: "vercel",
  coursera: "coursera",
  google: "google",
  calendar: "calendar",
  maps: "maps",
} as const;

export function Favicon({
  src,
  alt,
  size = 16,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const iconProps = { 
    width: size, 
    height: size, 
    className: cn("shrink-0", className) 
  };

  switch (src) {
    case favicons.linkedin:
      return <Linkedin {...iconProps} />;
    case favicons.gmail:
      return <Mail {...iconProps} />;
    case favicons.github:
      return <Github {...iconProps} />;
    case favicons.figma:
      return <Figma {...iconProps} />;
    case favicons.vercel:
      return <Triangle {...iconProps} />; // Vercel logo approx
    case favicons.coursera:
      return <Award {...iconProps} />;
    case favicons.google:
      return <Chrome {...iconProps} />; // Google fallback
    case favicons.calendar:
      return <Calendar {...iconProps} />;
    case favicons.maps:
      return <MapPin {...iconProps} />;
    case favicons.avatar:
      return <User {...iconProps} />;
    case favicons.site:
      return <Layout {...iconProps} />;
    default:
      // If it's a raw URL that we don't map, fallback
      return <Layout {...iconProps} />;
  }
}
