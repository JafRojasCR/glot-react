import { useEffect, useMemo, useRef, useState } from "react";
import GlotLogo from "../img/GLOT Logo.png";

/**
 * LoadingOverlay: pantallazo con barra de progreso falsa y texto "Bienvenido a"
 * Props:
 * - open: boolean -> muestra u oculta el overlay
 * - onContinue: function -> callback al pulsar el botón cuando finaliza la barra
 */
export default function LoadingOverlay({ open, onContinue }) {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [langIdx, setLangIdx] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const durationRef = useRef(0);
  const intervalRef = useRef(null);

  const welcomeLangs = useMemo(
    () => [
      "Bienvenido a",
      "Welcome to",
      "Bienvenue à",
      "Willkommen bei",
      "Benvenuto a",
      "Bem-vindo ao",
      "欢迎来到",
      "ようこそ",
      "Добро пожаловать в",
      "Welkom bij",
      "Witamy w",
      "Välkommen till",
      "환영합니다",
    ],
    []
  );

  // Inyecta keyframes para el efecto de fade del texto (una sola vez)
  useEffect(() => {
    const id = "glot-loading-keyframes";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = `
      @keyframes fadeInOut { 0% { opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; } }
      .animate-fade { animation: fadeInOut 0.7s; }
    `;
      document.head.appendChild(style);
    }
  }, []);

  // Control de apertura/cierre
  useEffect(() => {
    if (open) {
      setVisible(true);
      // pequeña pausa para permitir transición CSS
      const t = setTimeout(() => setAnimateIn(true), 10);
      // setup barra de progreso (4 a 7 segundos)
      durationRef.current = Math.floor(Math.random() * 3000) + 4000;
      startRef.current = null;
      setProgress(0);
      setShowButton(false);

      const step = (ts) => {
        if (startRef.current == null) startRef.current = ts;
        const elapsed = ts - startRef.current;
        const pct = Math.min(elapsed / durationRef.current, 1);
        setProgress(Math.round(pct * 100));
        if (pct < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setShowButton(true);
        }
      };
      rafRef.current = requestAnimationFrame(step);

      // rotación del texto de bienvenida
      intervalRef.current = setInterval(() => {
        setLangIdx((i) => (i + 1) % welcomeLangs.length);
      }, 700);

      return () => {
        clearInterval(intervalRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        clearTimeout(t);
      };
    } else {
      // cerrar con transición y desmontar al final
      setAnimateIn(false);
      const t = setTimeout(() => setVisible(false), 200); // coincide con duration-200 por defecto
      clearInterval(intervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return () => clearTimeout(t);
    }
  }, [open, welcomeLangs.length]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-white z-[100] transition-all duration-200 ${
        animateIn ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center mb-6">
          <span key={langIdx} className="text-4xl font-bold text-green-400 comfortaa mr-4 animate-fade">
            {welcomeLangs[langIdx]}&nbsp;
          </span>
          <img src={GlotLogo} alt="G/LOT Logo" className="h-16 w-auto inline-block" />
        </div>
        <div className="w-80 h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-green-400 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        {showButton ? (
          <button
            onClick={onContinue}
            className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-8 rounded-full text-lg shadow-lg transition duration-300"
          >
            Comenzar a Aprender
          </button>
        ) : null}
      </div>
    </div>
  );
}
