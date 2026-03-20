import React, { useState } from "react";

interface DiceButtonProps {
  onClick: () => void;
  title?: string;
}

export const DiceButton: React.FC<DiceButtonProps> = ({ onClick, title }) => {
  const [isRolling, setIsRolling] = useState(false);

  const handleClick = () => {
    setIsRolling(true);
    onClick();
    setTimeout(() => setIsRolling(false), 180);
  };

  return (
    <button
      type="button"
      className="champion-reroll-btn"
      title={title || "Reroll"}
      onClick={handleClick}
      disabled={isRolling}
      style={{
        position: "relative",
        width: "2.5rem",
        height: "2.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      🎲
    </button>
  );
};
