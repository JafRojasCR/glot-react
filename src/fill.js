import React, { useEffect, useMemo, useState } from "react";

export default function Fill({ onBack, onRequireLogin }) {
	const token = useMemo(() => localStorage.getItem("token"), []);
	const [lesson, setLesson] = useState(null);
	const [usuario, setUsuario] = useState(null);
	const [tries, setTries] = useState(0);
	const [correctMatches, setCorrectMatches] = useState(0);
	const [inputs, setInputs] = useState([]); // [{word, translation, randomIndex, value, status}]
	const [won, setWon] = useState(false);

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
		initInputs(lJson);
	}

	function initInputs(leccion) {
		const rows = leccion.palabras.map((word, i) => {
			const translation = leccion.traducciones[i];
			const randomIndex = Math.floor(Math.random() * translation.length);
			return { word, translation, randomIndex, value: "", status: "idle" }; // status: idle|correct|incorrect
		});
		setInputs(rows);
		setTries(0);
		setCorrectMatches(0);
		setWon(false);
	}

	const totalPairs = inputs.length;

	function onInputChange(idx, val) {
		const correctChar = inputs[idx].translation[inputs[idx].randomIndex].toLowerCase();
		const v = (val || "").toLowerCase();
		if (!v) {
			setInputs((arr) => arr.map((r, i) => (i === idx ? { ...r, value: "", status: "idle" } : r)));
			return;
		}
		if (v === correctChar) {
			setInputs((arr) => arr.map((r, i) => (i === idx ? { ...r, value: v, status: "correct" } : r)));
			setCorrectMatches((c) => {
				const nc = c + 1;
				if (nc === totalPairs) onWin();
				return nc;
			});
		} else {
			setInputs((arr) => arr.map((r, i) => (i === idx ? { ...r, value: v, status: "incorrect" } : r)));
			setTries((t) => t + 1);
			// auto reset after 1s
			setTimeout(() => {
				setInputs((arr) => arr.map((r, i) => (i === idx ? { ...r, value: "", status: "idle" } : r)));
			}, 1000);
		}
	}

	function onWin() {
		setWon(true);
		if (!lesson) return;
		updateLessonCounter(lesson._id, { jugadas: (lesson.jugadas || 0) + 1 });
		if (usuario) tryUpdateUser(usuario, lesson);
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

	function handleBack() {
		localStorage.removeItem("lesson_id");
		onBack?.();
	}

	return (
			<div className="bg-white comfortaa min-h-screen flex flex-col items-center">
				<style>{`
					.fill-input{width:40px;height:40px;text-align:center;border-radius:8px;font-size:1.25rem;font-weight:bold;transition:all .3s ease-in-out;outline:none;caret-color:#10b981}
					.fill-input:focus{background-color:white;border-color:#10b981}
					.fill-input.correct{background-color:#10b981;color:white;border-color:#10b981;pointer-events:none}
					.incorrect-border{border-color:#ef4444 !important}
					.incorrect-bg{background-color:#ef4444 !important;color:white;border-color:#ef4444 !important}
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
						<h1 className="text-3xl font-bold text-gray-800">Rellenar <span className="text-gray-400 cursor-pointer">?</span></h1>
						<div className="dialogue-bubble absolute bg-white p-4 rounded-lg shadow-md w-64 text-sm text-left">
							<p className="font-bold mb-2">Cómo jugar:</p>
							<p>Completa la letra que falta en la traducción de cada palabra.</p>
						</div>
					</div>
				</div>
				{languageCode ? (
					<img src={`https://flagcdn.com/w160/${languageCode}.png`} alt="flag" className="w-10 md:w-12 h-auto rounded-md shadow-md" />
				) : <div />}
			</header>

			{/* Main */}
			<main className="container mx-auto p-8 flex flex-col items-center flex-grow justify-center">
				<div className="space-y-8 w-full max-w-2xl">
					{inputs.map((row, idx) => (
						<div key={idx} className="flex flex-col md:flex-row items-center justify-between bg-gray-100 p-6 rounded-xl shadow-md">
							<div className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">"{row.word}" significa:</div>
							<div className="flex items-center space-x-1">
												{row.translation.split("").map((char, i) => (
									i === row.randomIndex ? (
										<input
											key={i}
											maxLength={1}
											value={row.status === 'correct' ? row.translation[row.randomIndex] : row.value}
											onChange={(e) => onInputChange(idx, e.target.value)}
															className={`fill-input bg-green-200 border-2 ${row.status === 'incorrect' ? 'incorrect-bg incorrect-border' : 'border-green-500'} ${row.status === 'correct' ? 'correct' : ''}`}
															disabled={row.status === 'correct'}
										/>
									) : (
										<span key={i} className="text-2xl font-bold text-gray-700">{char}</span>
									)
								))}
							</div>
						</div>
					))}
				</div>
			</main>

			{/* Counters */}
			<div className="fixed bottom-8 right-8 bg-gray-200 px-6 py-3 rounded-full shadow-md"><span className="text-xl font-bold">{correctMatches}/{totalPairs}</span></div>
			<div className="fixed bottom-8 left-8 bg-gray-200 px-6 py-3 rounded-full shadow-md"><span className="text-xl font-bold">Intentos: {tries}</span></div>

			{/* Win Modal */}
			<div className={`modal-overlay ${won ? 'active' : ''}`}>
				<div className="modal-content">
					<h2 className="text-3xl font-bold text-green-500 mb-4">¡Felicidades!</h2>
					<p className="text-xl mb-6">¡Has completado el juego de rellenar!</p>
					<p className="text-lg text-gray-700 mb-8">Número de intentos fallidos: {tries}</p>
					<button onClick={handleBack} className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition duration-300">Más lecciones</button>
				</div>
			</div>
		</div>
	);
}

