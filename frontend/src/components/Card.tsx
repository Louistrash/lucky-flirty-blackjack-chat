import React from 'react';
import { Card as BlackjackCard } from '../utils/blackjackLogic';

interface CardProps {
  card: BlackjackCard;
}

const Card: React.FC<CardProps> = ({ card }) => {
  return (
    <div 
      className={`blackjack-card ${card.isFaceDown ? 'face-down' : (card.suit === "♥" || card.suit === "♦" ? 'red' : 'black')} card-deal-animation shadow-xl`}
    >
      {card.isFaceDown ? (
        <div className="logo-placeholder">🎰</div>
      ) : (
        <>
          <span className="rank">{card.rank}</span>
          <span className="suit">{card.suit}</span>
        </>
      )}
    </div>
  );
};

export default Card; 