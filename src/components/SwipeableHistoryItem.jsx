import { useState, useRef } from "react";
import { useAnimate, motion as Motion } from "framer-motion";

const clickSound = new Audio("/click_low.wav");

export default function SwipeableHistoryItem({ game, onDelete, onView }) {
  const [x, setX] = useState(0);
  const startX = useRef(0);
  const [scope, animate] = useAnimate();

  const MAX_LEFT = -90; // Enough to reveal delete text

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const deltaX = e.touches[0].clientX - startX.current;

    // Swipe left (open)
    if (deltaX < 0 && deltaX > MAX_LEFT) {
      setX(deltaX);
    }

    // Swipe right (close)
    if (deltaX > 0 && x < 0) {
      setX(Math.min(deltaX + MAX_LEFT, 0));
    }
  };

  const handleTouchEnd = () => {
    if (x < MAX_LEFT / 2) setX(MAX_LEFT);
    else setX(0);
  };

  const handleDelete = () => {
    clickSound.play().catch(() => {});

    // Pop animation
    animate(scope.current, { scale: [1, 0.9, 1] }, { duration: 0.15 });

    // Shake animation
    animate(scope.current, { x: [-2, 2, -2, 2, 0] }, { duration: 0.25 });

    setTimeout(() => {
      onDelete();
    }, 200);
  };

  return (
    <div className="relative w-full mb-4 overflow-hidden">

      {/* RED DELETE BACKGROUND */}
      <div className="
        absolute inset-0 bg-red-600 rounded-xl z-0
        flex items-center justify-end pr-6
      ">
        {/* ⭐ SMALL DELETE TEXT (NO WHITE BOX) */}
        <button
          className="text-white font-bold text-lg"
          onClick={handleDelete}
          style={{ touchAction: "manipulation" }}
        >
          Delete
        </button>
      </div>

      {/* SWIPEABLE CARD */}
      <Motion.div
        ref={scope}
        className={`${ 
          game.scoreTeam > game.scoreOpp 
            ? "bg-green-100 dark:bg-green-800" 
            : game.scoreTeam < game.scoreOpp
              ? "bg-red-100 dark:bg-red-800"
              : "bg-gray-100 dark:bg-gray-800"
        } p-4 rounded-xl shadow relative z-10`}
        style={{ x }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        <button className="w-full text-left" onClick={onView}>
          <div className="text-xl font-bold">{game.date}</div>
          <div className="text-lg">
            {game.teamName} {game.scoreTeam} — {game.scoreOpp} {game.opponent}
          </div>
        </button>
      </Motion.div>

    </div>
  );
}
