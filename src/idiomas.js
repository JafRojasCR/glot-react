import React, { useEffect, useMemo, useRef, useState } from "react";
import GlotLogo from "./img/GLOT Logo.png";

/**
 * Idiomas: Página para listar idiomas, añadir idiomas y registrar lecciones.
 * Props opcionales para navegación:
 * - onGoHome, onGoAprender, onGoPerfil
 * - onOpenLessons({ nombre, codigo }) -> abrir vista de lecciones
 * - onRequireLogin / onLogout -> volver a login si no hay token
 */
export default function Idiomas({ onGoHome, onGoAprender, onGoPerfil, onOpenLessons, onRequireLogin, onLogout }) {
  const [idiomas, setIdiomas] = useState([]); // { nombre, codigo, cantidad_lecciones, usuarios_aprendiendo }
  const [lecciones, setLecciones] = useState([]); // { _id, idioma, autor, jugadas, tipo }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("idioma"); // "idioma" | "leccion"

  // Form estados: idioma
  const [langName, setLangName] = useState("");
  const [langCode, setLangCode] = useState("");

  // Form estados: lección
  const [lessonLanguage, setLessonLanguage] = useState("");
  const [lessonGameType, setLessonGameType] = useState("");
  const [words, setWords] = useState(["", "", "", "", ""]);
  const [translations, setTranslations] = useState(["", "", "", "", ""]);
  const [submittingLang, setSubmittingLang] = useState(false);
  const [submittingLesson, setSubmittingLesson] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const overlayRef = useRef(null);

  // Autor: usar exactamente el mismo origen que en el HTML (localStorage.usuario)
  const getAuthor = () => localStorage.getItem("usuario") || "";

  useEffect(() => {
    // Borrar lesson_id como en HTML
    localStorage.removeItem("lesson_id");

    // Verificar token
    const verify = async () => {
      if (!token) {
        if (onRequireLogin) onRequireLogin();
        else if (onLogout) onLogout();
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
          localStorage.removeItem("datosToken");
          localStorage.removeItem("usuario");
          if (onRequireLogin) onRequireLogin();
          else if (onLogout) onLogout();
          return;
        }
        // Cargar datos tras verificación
        await loadData();
      } catch (err) {
        if (onRequireLogin) onRequireLogin();
        else if (onLogout) onLogout();
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authHeaders = useMemo(() => ({
    Authorization: "Bearer " + (token || ""),
    "Content-Type": "application/json",
  }), [token]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      // Obtener idiomas y lecciones en paralelo
      const [idiomasRes, leccionesRes] = await Promise.all([
        fetch("http://localhost:3060/api/idiomas", { method: "GET", headers: authHeaders }),
        fetch("http://localhost:3060/api/lecciones", { method: "GET", headers: authHeaders }),
      ]);

      const idiomasJson = await idiomasRes.json();
      const leccionesJson = await leccionesRes.json();

      if (!idiomasRes.ok) throw new Error(idiomasJson?.error || "Error al obtener idiomas");
      if (!leccionesRes.ok) throw new Error(leccionesJson?.error || "Error al obtener lecciones");

      const mappedIdiomas = (idiomasJson || []).map((i) => ({
        nombre: i.nombre,
        codigo: i.codigo,
        cantidad_lecciones: i.cantidad_lecciones ?? 0,
        usuarios_aprendiendo: i.usuarios_aprendiendo ?? 0,
      }));
      const mappedLecciones = (leccionesJson || []).map((l) => ({
        _id: l._id,
        idioma: l.idioma,
        autor: l.autor,
        jugadas: l.jugadas,
        tipo: l.tipo,
      }));

      setIdiomas(mappedIdiomas);
      setLecciones(mappedLecciones);
    } catch (e) {
      setError(e.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    // Preseleccionar idioma en pestaña de lección
    if (idiomas.length > 0) setLessonLanguage((curr) => curr || idiomas[0].nombre);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setActiveTab("idioma");
    // Reset forms
    setLangName("");
    setLangCode("");
    setLessonLanguage("");
    setLessonGameType("");
    setWords(["", "", "", "", ""]);
    setTranslations(["", "", "", "", ""]);
  }

  // Cerrar modal con tecla ESC
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  // Si se abre el modal y aún no hay idioma seleccionado para lección, selecciona el primero disponible
  useEffect(() => {
    if (modalOpen && !lessonLanguage && idiomas.length > 0) {
      setLessonLanguage(idiomas[0].nombre);
    }
  }, [modalOpen, idiomas, lessonLanguage]);

  async function handleRegisterLanguage(e) {
    e?.preventDefault?.();
    const name = langName.trim();
    const code = langCode.trim().toUpperCase();
    if (!name || code.length !== 2) {
      alert("Completa nombre y código de 2 letras (ISO) para registrar el idioma.");
      return;
    }

    const datos = { nombre: name, codigo: code, cantidad_lecciones: 0, usuarios_aprendiendo: 0 };
    try {
      setSubmittingLang(true);
      const res = await fetch("http://localhost:3060/api/idiomas", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(datos),
      });
      let json = null;
      try { json = await res.json(); } catch {}
      if (!res.ok) throw new Error(json?.error || `Error al registrar idioma (HTTP ${res.status})`);

      setIdiomas((prev) => [...prev, datos]);
      closeModal();
    } catch (err) {
      alert(err.message || "Error al registrar idioma");
    } finally {
      setSubmittingLang(false);
    }
  }

  async function handleRegisterLesson(e) {
    e?.preventDefault?.();
    if (!lessonLanguage || !lessonGameType) {
      alert("Selecciona idioma y tipo de juego.");
      return;
    }
    if (words.some((w) => !w.trim()) || translations.some((t) => !t.trim())) {
      alert("Completa las 5 palabras y sus 5 traducciones.");
      return;
    }

    const autor = getAuthor();
    if (!autor) {
      alert("No se encontró el usuario en la sesión. Inicia sesión nuevamente.");
      return;
    }

    const lessonData = {
      idioma: lessonLanguage,
      palabras: words.map((w) => w.trim()),
      traducciones: translations.map((t) => t.trim()),
      tipo: lessonGameType,
      jugadas: 0,
      autor,
    };

    try {
      setSubmittingLesson(true);
      const res = await fetch("http://localhost:3060/api/lecciones", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(lessonData),
      });
      let created = null;
      try { created = await res.json(); } catch {}
      if (!res.ok) throw new Error(created?.error || `Error al registrar lección (HTTP ${res.status})`);
      console.log("Lección registrada:", created);

      // Actualizar contador del idioma
      const idiomaNombre = lessonData.idioma;
      const currentCount = idiomas.find((i) => i.nombre === idiomaNombre)?.cantidad_lecciones ?? 0;
      const updateRes = await fetch(`http://localhost:3060/api/idiomas/${idiomaNombre}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ cantidad_lecciones: currentCount + 1 }),
      });
      let updateJson = null;
      try { updateJson = await updateRes.json(); } catch {}
      if (!updateRes.ok) throw new Error(updateJson?.error || `Error al actualizar idioma (HTTP ${updateRes.status})`);
      console.log("Idioma actualizado:", updateJson);

      // Refrescar datos desde el servidor para evitar desincronización
      await loadData();
      closeModal();
    } catch (err) {
      alert(err.message || "Error al registrar lección");
    } finally {
      setSubmittingLesson(false);
    }
  }

  function lessonsCountFor(idiomaNombre) {
    // Si el backend no trae cantidad_lecciones, calcular con lecciones
    const viaLecciones = lecciones.filter((l) => l.idioma === idiomaNombre).length;
    const viaIdioma = idiomas.find((i) => i.nombre === idiomaNombre)?.cantidad_lecciones ?? 0;
    return Math.max(viaLecciones, viaIdioma);
  }

  function handleCardClick(idioma) {
    localStorage.setItem("lang", idioma.nombre);
    localStorage.setItem("code", idioma.codigo);
    if (onOpenLessons) onOpenLessons({ nombre: idioma.nombre, codigo: idioma.codigo });
  }

  function handleLogoutClick(e) {
    e?.preventDefault?.();
    localStorage.clear();
    if (onLogout) onLogout();
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

      <main className="container mx-auto p-8">
        {error ? (
          <div className="text-red-600 mb-4">{error}</div>
        ) : null}
        {loading ? (
          <div className="text-gray-500">Cargando...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="idioma-container">
              {idiomas.map((idioma) => {
                const count = lessonsCountFor(idioma.nombre);
                return (
                  <div
                    key={`${idioma.nombre}-${idioma.codigo}`}
                    className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center border-2 border-transparent hover:border-blue-400 transition duration-300 cursor-pointer"
                    onClick={() => handleCardClick(idioma)}
                  >
                    <img
                      src={`https://flagcdn.com/w160/${idioma.codigo?.toLowerCase?.() || ""}.png`}
                      alt={`Bandera de ${idioma.nombre}`}
                      className="w-20 h-auto rounded-lg mb-4 border border-black"
                    />
                    <h3 className="text-2xl font-semibold mb-2">{idioma.nombre}</h3>
                    <p className="text-sm text-gray-500 mb-1">Lecciones: {count}</p>
                    {/* Placeholder de usuarios aprendiendo si no viene del backend */}
                    <p className="text-sm text-gray-500">&nbsp;</p>
                  </div>
                );
              })}
            </div>

            {/* Floating add button */}
            <div className="fixed bottom-8 right-8 z-50">
              <button
                onClick={openModal}
                className="bg-blue-400 hover:bg-blue-500 text-white p-6 rounded-full shadow-lg transition duration-300 transform hover:scale-110"
                aria-label="Agregar idioma o lección"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </>
        )}
      </main>

      {/* MODAL */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${
          modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!modalOpen}
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) closeModal(); }}
      >
        <div
          className={`bg-white p-10 rounded-xl text-center shadow-2xl w-[90%] max-w-[600px] transition-transform duration-300 ${
            modalOpen ? "translate-y-0" : "-translate-y-5"
          }`}
        >
          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <button
              className={`tab-button text-gray-500 font-bold px-4 py-2 mx-2 transition duration-300 ease-in-out hover:text-blue-400 ${
                activeTab === "idioma" ? "border-b-2 border-blue-400 text-blue-400" : ""
              }`}
              onClick={() => setActiveTab("idioma")}
            >
              Idioma
            </button>
            <button
              className={`tab-button text-gray-500 font-bold px-4 py-2 mx-2 transition duration-300 ease-in-out hover:text-blue-400 ${
                activeTab === "leccion" ? "border-b-2 border-blue-400 text-blue-400" : ""
              }`}
              onClick={() => setActiveTab("leccion")}
            >
              Lección
            </button>
          </div>

          {/* Forms area - render ONLY the active form so the other truly disappears (display:none) */}
          <div className="relative overflow-hidden min-h-[300px]">
            {activeTab === "idioma" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Agregar Nuevo Idioma</h2>
                <form onSubmit={handleRegisterLanguage} className="space-y-4">
                  <div className="text-left">
                    <label className="block mb-1">Nombre</label>
                    <input
                      type="text"
                      value={langName}
                      onChange={(e) => setLangName(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Ej: Portugués"
                      required
                    />
                  </div>
                  <div className="text-left">
                    <label className="block mb-1 flex items-center gap-2">Código
                      <span className="relative inline-block group select-none">
                        <span className="text-gray-400 cursor-pointer text-xl leading-none">?</span>
                        <span className="absolute left-1/2 -translate-x-1/2 top-6 bg-white p-4 rounded-lg shadow-md w-64 text-sm text-left opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                          <p className="font-bold mb-2">Códigos de Países:</p>
                          <p>El código debe ser de 2 letras, basado en el estándar de banderas de países.</p>
                          <p>Ejemplo: Español = ES</p>
                          <p className="mt-2">Busca tu código <a href="https://www.iso.org/obp/ui/#search" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">aquí</a>.</p>
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={langCode}
                      onChange={(e) => {
                        const onlyLetters = e.target.value.replace(/[^A-Za-z]/g, "").toUpperCase();
                        setLangCode(onlyLetters);
                      }}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase"
                      placeholder="Ej: BR"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button type="button" onClick={closeModal} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-full transition duration-300">Cancelar</button>
                    <button type="submit" disabled={submittingLang} className={`font-bold py-2 px-4 rounded-full transition duration-300 text-white ${submittingLang ? "bg-blue-300 cursor-not-allowed" : "bg-blue-400 hover:bg-blue-500"}`}>{submittingLang ? "Registrando..." : "Registrar Idioma"}</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "leccion" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Agregar Nueva Lección</h2>
                <form onSubmit={handleRegisterLesson} className="space-y-4 text-left">
                  <div>
                    <label className="block mb-1">Selecciona el idioma</label>
                    <select
                      value={lessonLanguage}
                      onChange={(e) => setLessonLanguage(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="" disabled>Selecciona un idioma</option>
                      {idiomas.map((i) => (
                        <option key={i.nombre} value={i.nombre}>{i.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1">Palabras Base</label>
                      {words.map((w, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={w}
                          onChange={(e) => setWords((arr) => arr.map((v, i) => (i === idx ? e.target.value : v)))}
                          placeholder={`Palabra ${idx + 1}`}
                          className={`w-full border rounded-md px-3 py-2 ${idx < 4 ? "mb-2" : ""} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                          required
                        />
                      ))}
                    </div>
                    <div>
                      <label className="block mb-1">Traducciones</label>
                      {translations.map((t, idx) => (
                        <input
                          key={idx}
                          type="text"
                          value={t}
                          onChange={(e) => setTranslations((arr) => arr.map((v, i) => (i === idx ? e.target.value : v)))}
                          placeholder={`Traducción ${idx + 1}`}
                          className={`w-full border rounded-md px-3 py-2 ${idx < 4 ? "mb-2" : ""} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                          required
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1">Tipo de juego</label>
                    <select
                      value={lessonGameType}
                      onChange={(e) => setLessonGameType(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    >
                      <option value="">Selecciona un tipo</option>
                      <option value="Memoria">Memoria</option>
                      <option value="Asociar">Asociar</option>
                      <option value="Rellenar">Rellenar</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button type="button" onClick={closeModal} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-full transition duration-300">Cancelar</button>
                    <button type="submit" disabled={submittingLesson} className={`font-bold py-2 px-4 rounded-full transition duration-300 text-white ${submittingLesson ? "bg-blue-300 cursor-not-allowed" : "bg-blue-400 hover:bg-blue-500"}`}>{submittingLesson ? "Registrando..." : "Registrar Lección"}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
