'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Language } from '@/lib/i18n/translations';
import { Globe, ChevronDown, Check } from 'lucide-react';

const USFlag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" className="w-5 h-4  shadow-sm">
        <path fill="#bd3d44" d="M0 0h640v480H0z" />
        <path stroke="#fff" strokeWidth="37" d="M0 55.4h640m-640 73.8h640m-640 73.9h640m-640 73.8h640m-640 73.9h640m-640 73.8h640" />
        <path fill="#192f5d" d="M0 0h256v258.5H0z" />
        <g fill="#fff">
            <g id="c">
                <g id="b">
                    <g id="a">
                        <path d="M30 35h5v5h-5z" />
                    </g>
                    <use href="#a" x="42" />
                    <use href="#a" x="84" />
                    <use href="#a" x="126" />
                    <use href="#a" x="168" />
                    <use href="#a" x="210" />
                </g>
                <use href="#b" y="42" />
                <use href="#b" y="84" />
                <use href="#b" y="126" />
                <use href="#b" y="168" />
                <use href="#b" y="210" />
            </g>
        </g>
    </svg>
);

const KaaFlag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 250" className="w-5 h-4  ">
        <rect width="500" height="250" fill="#0099B5" />
        <rect y="80" width="500" height="90" fill="#ED9121" />
        <rect y="170" width="500" height="80" fill="#1EB53A" />
        <rect y="75" width="500" height="5" fill="#CE1126" />
        <rect y="170" width="500" height="5" fill="#CE1126" />
        <circle cx="40" cy="40" r="25" fill="#fff" />
        <circle cx="50" cy="40" r="25" fill="#0099B5" />

    </svg>
);

export default function LanguageSwitcher() {
    const { language, setLanguage, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const languages = [
        { code: 'en' as Language, label: t.common.english, flag: <USFlag /> },
        { code: 'my' as Language, label: t.common.custom, flag: <KaaFlag /> },
    ];

    const currentLang = languages.find(l => l.code === language);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 dark:bg-gray-800 dark:hover:bg-gray-700 group"
            >
                <Globe className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentLang?.label}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in duration-200 dark:bg-gray-900 dark:border-gray-800">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400"
                        >
                            <div className="flex items-center space-x-3">
                                <span>{lang.flag}</span>
                                <span className={language === lang.code ? 'font-semibold' : ''}>{lang.label}</span>
                            </div>
                            {language === lang.code && <Check className="w-4 h-4 text-blue-500" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
