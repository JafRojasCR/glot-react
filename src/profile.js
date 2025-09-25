import React, { useEffect, useMemo, useState } from "react";
import GlotLogo from "./img/GLOT Logo.png";

export default function Profile({ onGoHome, onGoAprender, onGoPerfil, onRequireLogin, onLogout }) {
  const token = useMemo(() => localStorage.getItem("token"), []);
  const username = useMemo(() => localStorage.getItem("usuario"), []);

  const [usuario, setUsuario] = useState(null); // {username,email,puntos,registrado_el,idiomas}
  const [idiomas, setIdiomas] = useState([]);   // [{nombre,codigo,...}]
  const [lecciones, setLecciones] = useState([]); // [{_id,idioma,palabras,traducciones,tipo}]

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editLang, setEditLang] = useState("");
  const [editType, setEditType] = useState("Memoria");
  const [editWords, setEditWords] = useState(["", "", "", "", ""]);
  const [editTranslations, setEditTranslations] = useState(["", "", "", "", ""]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!token) { onRequireLogin?.(); return; }
      try {
        const res = await fetch("http://localhost:3060/api/verify-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
        const result = await res.json();
        if (!result?.valid) { localStorage.removeItem("token"); onRequireLogin?.(); return; }
        await loadAll();
      } catch {
        onRequireLogin?.();
      }
    };
    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true); setError("");
    try {
      // usuario
      if (username) {
        const uRes = await fetch(`http://localhost:3060/api/usuarios/${encodeURIComponent(username)}`, {
          method: "GET",
          headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" },
        });
        if (!uRes.ok) throw new Error("Error al cargar usuario");
        setUsuario(await uRes.json());
      }
      // idiomas
      const iRes = await fetch("http://localhost:3060/api/idiomas", {
        method: "GET",
        headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" },
      });
      const iJson = await iRes.json();
      if (!iRes.ok) throw new Error(iJson?.error || "Error al obtener idiomas");
      setIdiomas(iJson);
      // lecciones propias
      const lRes = await fetch(`http://localhost:3060/api/lecciones?autor=${encodeURIComponent(username || "")}`, {
        method: "GET",
        headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" },
      });
      const lJson = await lRes.json();
      if (!lRes.ok) throw new Error(lJson?.error || "Error al obtener lecciones");
      setLecciones(lJson);
    } catch (e) {
      setError(e.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(id) {
    const l = lecciones.find((x) => x._id === id);
    if (!l) return;
    setEditing(l);
    setEditLang(l.idioma);
    setEditType(l.tipo || "Memoria");
    const words = [...(l.palabras || [])];
    const trans = [...(l.traducciones || [])];
    setEditWords([0,1,2,3,4].map((i)=> words[i] || ""));
    setEditTranslations([0,1,2,3,4].map((i)=> trans[i] || ""));
    setEditOpen(true);
  }

  function closeEditModal() {
    setEditOpen(false);
    setEditing(null);
  }

  async function saveEdit(e) {
    e?.preventDefault?.();
    if (!editing) return;
    const datos = {
      idioma: editLang,
      palabras: editWords.map((w) => w.trim()),
      traducciones: editTranslations.map((t) => t.trim()),
      tipo: editType,
    };
    try {
      const res = await fetch(`http://localhost:3060/api/lecciones/${editing._id}`, {
        method: "PUT",
        headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!res.ok) {
        let j=null; try{j=await res.json();}catch{}
        throw new Error(j?.error || `Error al actualizar (HTTP ${res.status})`);
      }
      setEditOpen(false);
      await loadAll();
    } catch (err) {
      alert(err.message || "Error al guardar cambios");
    }
  }

  async function deleteLesson(id) {
    const ok = window.confirm("¿Eliminar esta lección? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      const res = await fetch(`http://localhost:3060/api/lecciones/${id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        let j=null; try{j=await res.json();}catch{}
        throw new Error(j?.error || `Error al eliminar (HTTP ${res.status})`);
      }
      await loadAll();
    } catch (err) {
      alert(err.message || "Error al eliminar lección");
    }
  }

  function handleLogoutClick() {
    localStorage.clear();
    onLogout?.();
  }

  return (
    <div className="bg-gray-50 text-gray-800 comfortaa min-h-screen">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b w-full">
        <div className="flex items-center space-x-2"><img src={GlotLogo} alt="G/LOT Logo" className="h-10 w-auto" /></div>
        <div className="flex space-x-8 text-lg">
          <button onClick={onGoHome} className="hover:text-green-400 hover:scale-110 transition">Inicio</button>
          <button onClick={onGoAprender} className="hover:text-green-400 hover:scale-110 transition">Aprender</button>
          <button onClick={onGoPerfil} className="font-bold text-green-400">Mi Aprendizaje</button>
          <button onClick={handleLogoutClick} className="hover:text-red-400 hover:scale-110 transition">Salir</button>
        </div>
      </nav>

      <main className="container mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel usuario */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Perfil</h2>
          {error ? <div className="text-red-600 mb-2">{error}</div> : null}
          {loading ? (
            <div className="text-gray-500">Cargando...</div>
          ) : usuario ? (
            <>
              <p><span className="font-bold">Usuario:</span> <span>{usuario.username}</span></p>
              <p><span className="font-bold">Email:</span> <span>{usuario.email}</span></p>
              <p><span className="font-bold">Juegos Ganados:</span> <span>{usuario.puntos}</span></p>
              <p><span className="font-bold">Registrado:</span> <span>{new Date(usuario.registrado_el).toLocaleDateString()}</span></p>
              <div className="mt-6">
                <button
                  onClick={async () => {
                    const ok = window.confirm("¿Eliminar tu cuenta? Esto eliminará tu usuario y todas tus lecciones asociadas. No se puede deshacer.");
                    if (!ok) return;
                    try {
                      const res = await fetch(`http://localhost:3060/api/usuarios/${encodeURIComponent(usuario.username)}`, {
                        method: "DELETE",
                        headers: { Authorization: "Bearer "+token, "Content-Type": "application/json" },
                      });
                      if (!res.ok) {
                        let j=null; try{j=await res.json();}catch{}
                        throw new Error(j?.error || `Error al eliminar (HTTP ${res.status})`);
                      }
                      localStorage.clear();
                      onRequireLogin?.();
                    } catch (err) {
                      alert(err.message || "Error al eliminar usuario");
                    }
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition"
                >Eliminar Cuenta</button>
              </div>
            </>
          ) : null}
        </div>

        {/* CRUD Lecciones */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Mis Lecciones</h2>
          </div>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">Idioma</th>
                <th className="p-2">Palabras</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lecciones.map((l) => (
                <tr key={l._id}>
                  <td className="p-2">{l.idioma}</td>
                  <td className="p-2">{(l.palabras || []).join(', ')}</td>
                  <td className="p-2">{l.tipo}</td>
                  <td className="p-2 flex gap-2">
                    <button className="bg-yellow-400 px-3 py-1 rounded-full" onClick={() => openEditModal(l._id)}>Editar</button>
                    <button className="bg-red-400 text-white px-3 py-1 rounded-full" onClick={() => deleteLesson(l._id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Edit Modal */}
      <div className={`fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300 ${editOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="bg-white p-10 rounded-xl text-left shadow-2xl w-[90%] max-w-[600px]">
          <h2 className="text-2xl font-bold mb-4">Editar Lección</h2>
          <form onSubmit={saveEdit} className="space-y-4">
            <div>
              <label className="block mb-1">Idioma</label>
              <select value={editLang} onChange={(e)=>setEditLang(e.target.value)} className="w-full border rounded-md px-3 py-2">
                {idiomas.map((i) => (
                  <option key={i.nombre} value={i.nombre}>{i.nombre}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {(editWords || []).map((w, idx) => (
                  <input key={idx} className="w-full border px-2 py-1 mb-2" value={w} onChange={(e)=>setEditWords((arr)=>arr.map((v,i)=> i===idx? e.target.value : v))} />
                ))}
              </div>
              <div>
                {(editTranslations || []).map((t, idx) => (
                  <input key={idx} className="w-full border px-2 py-1 mb-2" value={t} onChange={(e)=>setEditTranslations((arr)=>arr.map((v,i)=> i===idx? e.target.value : v))} />
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-1">Tipo de juego</label>
              <select value={editType} onChange={(e)=>setEditType(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="Memoria">Memoria</option>
                <option value="Asociar">Asociar</option>
                <option value="Rellenar">Rellenar</option>
              </select>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button type="button" onClick={closeEditModal} className="bg-gray-300 px-4 py-2 rounded-full">Cancelar</button>
              <button type="submit" className="bg-blue-400 text-white px-4 py-2 rounded-full">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
