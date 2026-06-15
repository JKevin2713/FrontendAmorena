export type StaticGoogleReview = {
  id: string;
  name: string;
  text: string;
  translationKey?: string;
  rating: number;
  relativeTime?: string;
  relativeTimeKey?: string;
  url?: string;
};

export const googleReviewUrl =
  "https://www.google.com/search?q=Amorena+Coffee+%26+Garden+opiniones";

export const googleReviewSummary = {
  rating: 4.8,
  total: 123 as number | null,
};

export const staticGoogleReviews: StaticGoogleReview[] = [
  {
    id: "google-luis",
    name: "Luis Rojas",
    text: "Excelente atención, muy buena comida.",
    translationKey: "home.google.review.luis",
    rating: 5,
    relativeTime: "Reseña destacada",
    relativeTimeKey: "home.google.highlight",
  },
  {
    id: "google-ricardo",
    name: "Ricardo Herrera",
    text: "Lindo lugar, comida presentada con mucha dedicación. Bebida hermosa y el servicio muy fino.",
    translationKey: "home.google.review.ricardo",
    rating: 5,
    relativeTime: "Reseña destacada",
    relativeTimeKey: "home.google.highlight",
  },
  {
    id: "google-maria",
    name: "María Ramírez",
    text: "Un lugar súper lindo, el ambiente muy acogedor y la comida muy rica.",
    translationKey: "home.google.review.maria",
    rating: 5,
    relativeTime: "Reseña destacada",
    relativeTimeKey: "home.google.highlight",
  },
  {
    id: "google-daniela",
    name: "Daniela Moya",
    text: "Muy rico. El postre del día es imperdible.",
    translationKey: "home.google.review.daniela",
    rating: 5,
    relativeTime: "Reseña destacada",
    relativeTimeKey: "home.google.highlight",
  },
];
