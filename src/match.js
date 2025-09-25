import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Match({ onBack, onRequireLogin }) {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const [lesson, setLesson] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [tries, setTries] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [pairs, setPairs] = useState([]); // [{word, translation}]
  const [shuffledTranslations, setShuffledTranslations] = useState([]);
  const draggedRef = useRef(null); // { t: string } or null
  const [shakeT, setShakeT] = useState(null);
  const languageCode = useMemo(() => (localStorage.getItem("code") || "").toLowerCase(), []);

  useEffect(() => {
    const verify = async () => {
      if (!token) { onRequireLogin?.(); return; }
      try {
        const res = await fetch("http://localhost:3060/api/verify-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
        const result = await res.json();
        if (!result?.valid) { localStorage.removeItem("token"); onRequireLogin?.(); return; }
        await loadData();
      } catch { onRequireLogin?.(); }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    const username = localStorage.getItem("usuario");
    const lessonId = localStorage.getItem("lesson_id");
    if (!lessonId) { onBack?.(); return; }
    try {
      if (username) {
        const uRes = await fetch(`http://localhost:3060/api/usuarios/${encodeURIComponent(username)}`, { method: "GET", headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" } });
        if (uRes.ok) setUsuario(await uRes.json());
      }
    } catch {}
    const lRes = await fetch(`http://localhost:3060/api/lecciones/${lessonId}`, { method: "GET", headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" } });
    const lJson = await lRes.json();
    if (!lRes.ok) throw new Error(lJson?.error || "Error al obtener lección");
    setLesson(lJson);
    const ps = lJson.palabras.map((w, i) => ({ word: w, translation: lJson.traducciones[i] }));
    setPairs(ps);
    setShuffledTranslations(shuffle(lJson.traducciones));
    setCorrectMatches(0);
    setTries(0);
  }

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function handleDragStart(_e, translation) {
    draggedRef.current = { t: translation };
  }

  function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }
  function handleDragLeave(e) { e.currentTarget.classList.remove("drag-over"); }

  function handleDrop(e, expectedTranslation) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const dragged = draggedRef.current?.t;
    setTries((t) => t + 1);
    if (!dragged) return;

    if (dragged === expectedTranslation) {
      // fill drop zone
      e.currentTarget.textContent = dragged;
      e.currentTarget.classList.remove("drop-zone");
      e.currentTarget.classList.add("card", "bg-white", "text-gray-700");
      // remove dragged from pool
      setShuffledTranslations((arr) => arr.filter((t) => t !== dragged));
      setCorrectMatches((c) => {
        const nc = c + 1;
        if (lesson && nc === lesson.palabras.length) onWin();
        return nc;
      });
    } else {
      // Trigger shake on the dragged translation chip
      setShakeT(dragged);
      setTimeout(() => setShakeT(null), 500);
    }
    draggedRef.current = null;
  }

  function onWin() {
    if (!lesson) return;
    updateLessonCounter(lesson._id, { jugadas: (lesson.jugadas || 0) + 1 });
    if (usuario) tryUpdateUser(usuario, lesson);
    setShowWin(true);
  }

  async function updateLessonCounter(id, datos) {
    try {
      await fetch(`http://localhost:3060/api/lecciones/${id}/`, { method: "PUT", headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" }, body: JSON.stringify(datos) });
    } catch {}
  }

  async function tryUpdateUser(usuarioActual, leccion) {
    try {
      const idiomasSet = new Set(usuarioActual.idiomas || []);
      idiomasSet.add(leccion.idioma);
      await fetch(`http://localhost:3060/api/usuarios/${encodeURIComponent(usuarioActual.username)}`, { method: "PUT", headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" }, body: JSON.stringify({ idiomas: Array.from(idiomasSet), puntos: (usuarioActual.puntos || 0) + 1 }) });
    } catch {}
  }

  const [showWin, setShowWin] = useState(false);

  function handleBack() {
    localStorage.removeItem("lesson_id");
    onBack?.();
  }

  return (
    <div className="bg-white comfortaa min-h-screen flex flex-col items-center">
      <style>{`
        .card{width:180px;height:60px;display:flex;align-items:center;justify-content:center;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);font-weight:bold;font-size:1.1rem;cursor:pointer;transition:all .3s ease-in-out;user-select:none}
        .shake-animation{animation:shake .5s;animation-iteration-count:1}
        @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
        .drop-zone{width:180px;height:60px;background-color:#e5e7eb;border:2px dashed #9ca3af;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:1.1rem;font-weight:bold;transition:border-color .2s}
        .drop-zone.drag-over{border-color:#3b82f6}
        .dialogue-bubble{top:100%;right:50%;transform:translateX(50%) translateY(10px);z-index:10;opacity:0;pointer-events:none;transition:opacity .3s ease-in-out,transform .3s ease-in-out}
        .dialogue-bubble::before{content:"";position:absolute;bottom:100%;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:15px solid #fff}
        .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:50;opacity:0;pointer-events:none;transition:opacity .3s ease-in-out}
        .modal-overlay.active{opacity:1;pointer-events:auto}
        .modal-content{background-color:white;padding:2.5rem;border-radius:12px;text-align:center;box-shadow:0 10px 20px rgba(0,0,0,.2);transform:translateY(-20px);transition:transform .3s ease-in-out}
        .modal-overlay.active .modal-content{transform:translateY(0)}
      `}</style>

      {/* Header */}
      <header className="bg-white p-6 md:p-8 w-full flex items-center justify-between shadow-sm border-b">
        <div className="flex items-center space-x-4">
          <button onClick={handleBack} className="text-gray-600 hover:text-gray-900 transition duration-300" aria-label="Volver">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div className="relative help-button-container">
            <h1 className="text-3xl font-bold text-gray-800">Asociar <span className="text-gray-400 cursor-pointer">?</span></h1>
            <div className="dialogue-bubble absolute bg-white p-4 rounded-lg shadow-md w-64 text-sm text-left">
              <p className="font-bold mb-2">Cómo jugar:</p>
              <p>Arrastra las traducciones correctas y suéltalas al lado de cada palabra.</p>
            </div>
          </div>
        </div>
        {languageCode ? (<img src={`https://flagcdn.com/w160/${languageCode}.png`} alt="flag" className="w-10 md:w-12 h-auto rounded-md shadow-md" />) : <div />}
      </header>

      {/* Main */}
      <main className="container mx-auto p-8 flex flex-col items-center flex-grow justify-center">
        <div className="flex items-center space-x-12">
          {/* Words */}
          <div className="flex flex-col space-y-4">
            {pairs.map((pair, idx) => (
              <div key={idx} className="card bg-white text-gray-700">{pair.word}</div>
            ))}
          </div>

          {/* Arrows (decorative) */}
          <div className="flex flex-col space-y-8 text-gray-400">
            {[...Array(pairs.length)].map((_, i) => (
              <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            ))}
          </div>

          {/* Drop zones */}
          <div className="flex flex-col space-y-4">
            {pairs.map((pair, idx) => (
              <div key={idx}
                   className="drop-zone"
                   onDragOver={handleDragOver}
                   onDragLeave={handleDragLeave}
                   onDrop={(e) => handleDrop(e, pair.translation)}>
                &nbsp;
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Draggable translations */}
      <footer className="mt-8 flex justify-center flex-wrap gap-4 p-4 rounded-xl shadow-lg bg-gray-100">
        {shuffledTranslations.map((t) => (
          <div key={t}
               className={`card draggable-item ${shakeT === t ? 'shake-animation' : ''}`}
               draggable
               onDragStart={(e) => handleDragStart(e, t)}
               onDragEnd={() => { draggedRef.current = null; }}>
            {t}
          </div>
        ))}
      </footer>

  {/* Counters */}
      <div className="fixed bottom-8 right-8 bg-gray-200 px-6 py-3 rounded-full shadow-md"><span className="text-xl font-bold">{correctMatches}/{pairs.length}</span></div>
      <div className="fixed bottom-8 left-8 bg-gray-200 px-6 py-3 rounded-full shadow-md"><span className="text-xl font-bold">Intentos: {tries}</span></div>

      {/* Win Modal */}
      <div className={`modal-overlay ${showWin ? 'active' : ''}`}>
        <div className="modal-content">
          <h2 className="text-3xl font-bold text-green-500 mb-4">¡Felicidades!</h2>
          <p className="text-xl mb-6">¡Has completado el juego de asociar!</p>
          <p className="text-lg text-gray-700 mb-8">Número de intentos: {tries}</p>
          <button onClick={handleBack} className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition duration-300">Más lecciones</button>
        </div>
      </div>
    </div>
  );
}
