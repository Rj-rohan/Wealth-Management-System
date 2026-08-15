import { useEffect, useState } from "react";

export default function TypewriterText({ text = "", speed = 18, onComplete, className = "", style = {} }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={className} style={style}>
      {displayed}
      {!done && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "1em",
            background: "#7c3aed",
            marginLeft: "2px",
            animation: "blink 0.8s step-end infinite",
            verticalAlign: "text-bottom",
          }}
        />
      )}
      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}
