export interface Author {
  name: string;
  jobTitle: string;
  worksFor: string;
  image?: string;
  sameAs?: string[];
  knowsAbout?: string[];
  description: string;
}

export const authors: Record<string, Author> = {
  "Luc Richard": {
    name: "Luc Richard",
    jobTitle: "Founder & Lead Foundation Expert",
    worksFor: "Attack A Crack Foundation Repair",
    image: "https://www.attackacrack.com/images/team/luc.webp",
    sameAs: [
      "https://www.facebook.com/attackacrack",
      // Add LinkedIn or other profile if available
    ],
    knowsAbout: [
      "Foundation Repair",
      "Concrete Crack Injection",
      "Epoxy & Polyurethane Resin",
      "New England Soil Conditions",
      "Historic Home Foundations"
    ],
    description: "Founder of Attack A Crack with over 20 years of foundation repair experience in New England. Luc is a recognized expert in low-pressure injection techniques and believes in honest assessments over high-pressure sales."
  },
  "Matt": {
    name: "Matt",
    jobTitle: "Managing Partner",
    worksFor: "Attack A Crack Foundation Repair",
    image: "https://www.attackacrack.com/images/team/matt.webp",
    knowsAbout: [
      "Project Management",
      "Customer Consultation",
      "Massachusetts Foundation Repair Standards"
    ],
    description: "Managing Partner at Attack A Crack, leading Massachusetts operations. Matt brings technical expertise and a commitment to customer satisfaction to every project."
  }
};

export const getAuthorSchema = (name: string) => {
  const author = authors[name] || { name };
  return {
    "@type": "Person",
    "name": author.name,
    "jobTitle": (author as Author).jobTitle,
    "worksFor": {
      "@type": "Organization",
      "name": (author as Author).worksFor
    },
    "image": (author as Author).image,
    "sameAs": (author as Author).sameAs,
    "knowsAbout": (author as Author).knowsAbout,
    "description": (author as Author).description
  };
};
