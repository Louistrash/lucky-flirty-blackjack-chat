import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/10 hover:text-white touch-target touch-manipulation min-w-[44px] h-[44px] sm:h-auto p-2 sm:px-3 sm:py-2"
        >
          <Globe className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="text-sm sm:text-base hidden sm:inline" style={{ fontSize: '16px' }}>{currentLanguage.flag}</span>
          <span className="text-base sm:hidden" style={{ fontSize: '18px' }}>{currentLanguage.flag}</span>
          <span className="sr-only">{t('header.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-slate-900/95 border-amber-500/20 text-white backdrop-blur-md w-48 sm:w-auto"
        sideOffset={8}
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer hover:bg-slate-800 touch-target touch-manipulation min-h-[44px] px-3 py-2 ${
              i18n.language === language.code ? 'bg-slate-700' : ''
            }`}
          >
            <div className="flex items-center w-full">
              <span className="mr-3 text-base flex-shrink-0" style={{ fontSize: '18px' }}>{language.flag}</span>
              <span className="text-sm sm:text-base">{language.name}</span>
              {i18n.language === language.code && (
                <span className="ml-auto text-amber-400 text-sm">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;