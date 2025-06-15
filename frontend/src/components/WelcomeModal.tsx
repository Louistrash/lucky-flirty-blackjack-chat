import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Coins, Sparkles, Gamepad2 } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-slate-800 border-slate-700 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-amber-400">
            <span className="text-2xl mr-3">🎉</span>
            Welkom bij Lucky Flirty Chat!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-slate-300 pt-4 space-y-3">
              <p className="flex items-center">
                <Sparkles className="w-5 h-5 mr-3 text-purple-400 flex-shrink-0" />
                <span>Je hebt automatisch <strong>Premium</strong> status gekregen!</span>
              </p>
              <p className="flex items-center">
                <Coins className="w-5 h-5 mr-3 text-yellow-400 flex-shrink-0" />
                <span>Je hebt <strong>1000 gratis coins</strong> ontvangen!</span>
              </p>
              <p className="flex items-center">
                <Gamepad2 className="w-5 h-5 mr-3 text-green-400 flex-shrink-0" />
                <span>Je kunt nu spelen, chatten en dealer outfits unlocken!</span>
              </p>
              <p className="pt-2">
                Veel plezier!
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose} 
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WelcomeModal; 