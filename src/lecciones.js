import React, { useEffect, useMemo, useState } from "react";
import GlotLogo from "./img/GLOT Logo.png";
import ImgMemoria from "./img/Memoria.png";
import ImgAsociar from "./img/Asociar.png";
import ImgRellenar from "./img/Rellenar.png";

/**
 * Lecciones: Lista las lecciones del idioma seleccionado (desde localStorage.lang/code).
 * Props opcionales:
 * - onBack: () => void             // volver a Idiomas
 * - onRequireLogin: () => void      // si no hay token o inválido
 * - onLogout: () => void
 * - onOpenGame?: ({ tipo, lessonId }) => void  // opcional para navegar a juego
 * - onGoHome/onGoAprender/onGoPerfil opcionales para navbar
 */
export default function Lecciones({ onBack, onRequireLogin, onLogout, onOpenGame, onGoHome, onGoAprender, onGoPerfil }) {
  const [lecciones, setLecciones] = useState([]); // { _id, idioma, autor, jugadas, tipo }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const languageName = useMemo(() => localStorage.getItem("lang") || "", []);
  const languageCode = useMemo(() => localStorage.getItem("code") || "", []);
  const token = useMemo(() => localStorage.getItem("token"), []);

  const authHeaders = useMemo(() => ({
    Authorization: "Bearer " + (token || ""),
    "Content-Type": "application/json",
  }), [token]);

  useEffect(() => {
    // Limpiar lesson_id al cargar
    localStorage.removeItem("lesson_id");
  }, []);

  // Verificar token y cargar lecciones
  useEffect(() => {
    const verifyAndLoad = async () => {
      if (!token) {
        if (onRequireLogin) onRequireLogin();
        return;
      }
      try {
        const res = await fetch("http://localhost:3060/api/verify-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const result = await res.json().catch(() => ({ valid: false }));
        if (!result.valid) {
          localStorage.removeItem("token");
          if (onRequireLogin) onRequireLogin();
          return;
        }
        await loadLecciones();
      } catch (e) {
        if (onRequireLogin) onRequireLogin();
      }
    };
    verifyAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLecciones() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3060/api/lecciones", {
        method: "GET",
        headers: authHeaders,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error al obtener lecciones");
      const mapped = (json || []).map((l) => ({
        _id: l._id,
        idioma: l.idioma,
        autor: l.autor,
        jugadas: l.jugadas,
        tipo: l.tipo,
      }));
      setLecciones(mapped);
    } catch (e) {
      setError(e.message || "Error cargando lecciones");
    } finally {
      setLoading(false);
    }
  }

  const imagenesTipos = {
    Memoria: ImgMemoria,
    Asociar: ImgAsociar,
    Rellenar: ImgRellenar,
  };

  const filtered = useMemo(
    () => lecciones.filter((l) => l.idioma === languageName),
    [lecciones, languageName]
  );

  function handleBack() {
    localStorage.removeItem("lang");
    localStorage.removeItem("code");
    localStorage.removeItem("lesson_id");
    onBack?.();
  }

  function handleLogoutClick(e) {
    e?.preventDefault?.();
    localStorage.clear();
    onLogout?.();
  }

  function handleCardClick(leccion) {
    localStorage.setItem("lesson_id", leccion._id);
    if (onOpenGame) {
      onOpenGame({ tipo: leccion.tipo, lessonId: leccion._id });
    } else {
      // Placeholder hasta que existan las pantallas de juego
      alert(`Abrir juego: ${leccion.tipo} (pendiente)`);
    }
  }

  return (
    <div className="bg-gray-50 text-gray-800 comfortaa min-h-screen">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b w-full">
        <div className="flex items-center space-x-2">
          <img src={GlotLogo} alt="G/LOT Logo" className="h-10 w-auto" />
        </div>
        <div className="flex space-x-8 text-lg">
          <button onClick={onGoHome} className="comfortaa text-black transition duration-200 hover:text-green-400 hover:scale-110">Inicio</button>
          <button onClick={onGoAprender} className="comfortaa text-green-400 font-bold transition duration-200 hover:text-blue-400 hover:scale-110">Aprender</button>
          <button onClick={onGoPerfil} className="comfortaa text-black transition duration-200 hover:text-green-400 hover:scale-110">Mi Aprendizaje</button>
          {token ? (
            <button onClick={handleLogoutClick} className="comfortaa text-black transition duration-200 hover:text-red-400 hover:scale-110">Salir</button>
          ) : null}
        </div>
      </nav>

      {/* HEADER */}
      <header className="bg-white p-6 md:p-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="text-gray-600 hover:text-gray-900 transition duration-300" aria-label="Volver">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{languageName || "Cargando idioma..."}</h1>
        </div>
        {languageCode ? (
          <img
            src={`https://flagcdn.com/w160/${(languageCode || "").toLowerCase()}.png`}
            alt={`Bandera de ${languageName}`}
            className="w-10 md:w-12 h-auto rounded-md shadow-md"
          />
        ) : <div />}
      </header>

      <main className="container mx-auto p-8">
        {error ? <div className="text-red-600 mb-4">{error}</div> : null}
        {loading ? (
          <div className="text-gray-500">Cargando...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((leccion) => (
              <div
                key={leccion._id}
                className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center border-2 border-transparent hover:border-blue-400 transition duration-300 cursor-pointer"
                onClick={() => handleCardClick(leccion)}
              >
                <img
                  src={imagenesTipos[leccion.tipo] || ImgMemoria}
                  alt={`Imagen para ${leccion.tipo}`}
                  className="w-full h-auto rounded-md mb-4"
                />
                <h3 className="text-2xl font-semibold mb-2">{leccion.tipo}</h3>
                <p className="text-sm text-gray-500 mb-1">Autor: {leccion.autor}</p>
                <p className="text-sm text-gray-500">Jugadas: {leccion.jugadas}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
