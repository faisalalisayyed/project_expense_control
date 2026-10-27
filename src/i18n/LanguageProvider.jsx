
"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import { translations } from "@/i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState("en");
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const savedLanguage = localStorage.getItem("language");

        if (savedLanguage === "en" || savedLanguage === "ar") {
            setLanguage(savedLanguage);
        }

        setReady(true);
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir =
            language === "ar" ? "rtl" : "ltr";
    }, [language]);

    function changeLanguage(nextLanguage) {
        if (nextLanguage !== "en" && nextLanguage !== "ar") {
            return;
        }

        localStorage.setItem("language", nextLanguage);
        setLanguage(nextLanguage);
    }

    const value = {
        language,
        isArabic: language === "ar",
        t: translations[language],
        changeLanguage,
        ready,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error(
            "useLanguage must be used inside LanguageProvider"
        );
    }

    return context;
}
