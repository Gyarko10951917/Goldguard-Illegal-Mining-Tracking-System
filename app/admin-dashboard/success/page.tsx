"use client";
import { useTheme } from "../../component/ThemeContext";

export default function SearchSuccessPrompt() {
  const { theme } = useTheme();
  
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <svg
        className={`mx-auto mb-4 h-16 w-16 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="22" strokeWidth="3" className={theme === "dark" ? "text-gray-600" : "text-gray-200"} />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          d="M16 24h16"
          className={theme === "dark" ? "text-gray-500" : "text-gray-400"}
        />
      </svg>
      <h2 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>No Reports Found</h2>
      <p className={`mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>No reports match your search. Try a different keyword.</p>
    </div>
  );
}
