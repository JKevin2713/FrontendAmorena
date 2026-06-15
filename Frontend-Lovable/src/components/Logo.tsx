import logoSvg from "@/assets/Logotipo.svg";

const TONE_FILTERS: Record<string, string> = {
  dark: "none",
  light: "brightness(0) invert(1)",
  green: "invert(21%) sepia(60%) saturate(600%) hue-rotate(110deg) brightness(90%)",
  brown: "brightness(0) saturate(100%) invert(20%) sepia(35%) saturate(900%) hue-rotate(10deg) brightness(85%) contrast(95%)",
  tan: "invert(78%) sepia(20%) saturate(500%) hue-rotate(345deg) brightness(95%) contrast(90%)", // #D2B48C
  emerald: "invert(22%) sepia(95%) saturate(1500%) hue-rotate(140deg) brightness(95%) contrast(105%)", // #006740
  pink: "invert(88%) sepia(15%) saturate(1500%) hue-rotate(280deg) brightness(105%) contrast(100%)", // #F8C8DC
};
export function Logo({ tone = "dark", className = "h-16" }: { tone?: "dark" | "light" | "green" | "brown"; className?: string }) {
  return (
    <img
      src={logoSvg}
      alt="Amorena Coffee & Garden"
      className={`${className} w-auto`}
      style={{ filter: TONE_FILTERS[tone] }}
    />
  );
}