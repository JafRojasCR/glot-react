import React, { useEffect, useMemo, useState } from "react";

export default function Memory({ onBack, onRequireLogin }) {
	const token = useMemo(() => localStorage.getItem("token"), []);
	const [lesson, setLesson] = useState(null); // {_id, idioma, palabras[], traducciones[], jugadas}
	const [usuario, setUsuario] = useState(null); // {username, idiomas:[], puntos}
	const [cards, setCards] = useState([]); // {id,text,matchKey,isFlipped,isMatched}
	const [firstIdx, setFirstIdx] = useState(null);
	const [secondIdx, setSecondIdx] = useState(null);
	const [lockBoard, setLockBoard] = useState(false);
	const [matchesFound, setMatchesFound] = useState(0);
	const [tries, setTries] = useState(0);
	const [won, setWon] = useState(false);

	const languageCode = useMemo(() => (localStorage.getItem("code") || "").toLowerCase(), []);

	useEffect(() => {
		const verify = async () => {
			if (!token) {
				onRequireLogin?.();
				return;
			}
			try {
				const res = await fetch("http://localhost:3060/api/verify-token", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ token }),
				});
				const result = await res.json();
				if (!result?.valid) {
					localStorage.removeItem("token");
					onRequireLogin?.();
					return;
				}
				await loadData();
			} catch {
				onRequireLogin?.();
			}
		};
		verify();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function loadData() {
		const username = localStorage.getItem("usuario");
		const lessonId = localStorage.getItem("lesson_id");
		if (!lessonId) {
			// No lesson chosen, go back to lessons
			onBack?.();
			return;
		}
		// Usuario
		try {
			if (username) {
				const uRes = await fetch(`http://localhost:3060/api/usuarios/${encodeURIComponent(username)}`, {
					method: "GET",
					headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
				});
				if (uRes.ok) setUsuario(await uRes.json());
			}
		} catch {}
		// Leccion
		const lRes = await fetch(`http://localhost:3060/api/lecciones/${lessonId}`, {
			method: "GET",
			headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
		});
		const lJson = await lRes.json();
		if (!lRes.ok) throw new Error(lJson?.error || "Error al obtener lección");
		setLesson(lJson);
		initCards(lJson);
	}

	function initCards(leccion) {
		const pairs = [];
		leccion.palabras.forEach((word, index) => {
			pairs.push({ text: word, matchKey: `match-${index}` });
			pairs.push({ text: leccion.traducciones[index], matchKey: `match-${index}` });
		});
		const shuffled = shuffle(pairs).map((p, i) => ({ id: i, text: p.text, matchKey: p.matchKey, isFlipped: false, isMatched: false }));
		setCards(shuffled);
		setFirstIdx(null);
		setSecondIdx(null);
		setMatchesFound(0);
		setTries(0);
		setWon(false);
		setLockBoard(false);
	}

	function shuffle(array) {
		const arr = array.slice();
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function handleFlip(idx) {
		if (lockBoard) return;
		const c = cards[idx];
		if (!c || c.isMatched || c.isFlipped) return;
		const updated = cards.slice();
		updated[idx] = { ...updated[idx], isFlipped: true };
		setCards(updated);

		if (firstIdx === null) {
			setFirstIdx(idx);
			return;
		}

		if (idx === firstIdx) return; // same card
		setSecondIdx(idx);
		setTries((t) => t + 1);

		const first = updated[firstIdx];
		const second = updated[idx];
		if (first.matchKey === second.matchKey) {
			// match
			const next = updated.slice();
			next[firstIdx] = { ...first, isMatched: true };
			next[idx] = { ...second, isMatched: true };
			setCards(next);
			setFirstIdx(null);
			setSecondIdx(null);
			setMatchesFound((m) => {
				const nm = m + 1;
				const totalPairs = lesson?.palabras?.length || 0;
				if (nm === totalPairs) onWin();
				return nm;
			});
		} else {
			// unflip after delay
			setLockBoard(true);
			setTimeout(() => {
				const unflip = (arr) => arr.map((cc, i) => (i === firstIdx || i === idx ? { ...cc, isFlipped: false } : cc));
				setCards((arr) => unflip(arr));
				setFirstIdx(null);
				setSecondIdx(null);
				setLockBoard(false);
			}, 800);
		}
	}

	function onWin() {
		setWon(true);
		// Update counters and user
		if (!lesson) return;
		updateLessonCounter(lesson._id, { jugadas: (lesson.jugadas || 0) + 1 });
		if (usuario) {
			tryUpdateUser(usuario, lesson);
		}
	}

	async function updateLessonCounter(id, datos) {
		try {
			await fetch(`http://localhost:3060/api/lecciones/${id}/`, {
				method: "PUT",
				headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
				body: JSON.stringify(datos),
			});
		} catch {}
	}

	async function tryUpdateUser(usuarioActual, leccion) {
		try {
			const idiomasSet = new Set(usuarioActual.idiomas || []);
			idiomasSet.add(leccion.idioma);
			await fetch(`http://localhost:3060/api/usuarios/${encodeURIComponent(usuarioActual.username)}`, {
				method: "PUT",
				headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
				body: JSON.stringify({ idiomas: Array.from(idiomasSet), puntos: (usuarioActual.puntos || 0) + 1 }),
			});
		} catch {}
	}

	function handleBack() {
		localStorage.removeItem("lesson_id");
		onBack?.();
	}

	const totalPairs = lesson?.palabras?.length || 0;

	return (
		<div className="bg-white comfortaa min-h-screen">
			{/* Small CSS needed for flip effect */}
			<style>{`
				.card{transform-style:preserve-3d;transition:transform .6s ease-in-out;cursor:pointer;width:160px;height:120px}
				.card.flipped{transform:rotateY(180deg)}
				.card-inner{width:100%;height:100%;position:relative;transform-style:preserve-3d}
				.card-face{position:absolute;width:100%;height:100%;backface-visibility:hidden;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1)}
				.card-front{background-color:#d1d5db}
				.card-back{background-color:#f3f4f6;transform:rotateY(180deg);display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:bold;color:#4b5563;padding:.5rem;overflow:hidden;text-overflow:ellipsis;hyphens:auto;word-wrap:break-word;text-align:center}
				#game-board{display:grid;grid-template-columns:repeat(5,1fr);max-width:850px}
					.dialogue-bubble{top:100%;right:50%;transform:translateX(50%) translateY(10px);z-index:10;opacity:0;pointer-events:none;transition:opacity .3s ease-in-out,transform .3s ease-in-out}
					.dialogue-bubble::before{content:"";position:absolute;bottom:100%;left:50%;transform:translateX(-50%);width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:15px solid #fff}
				.modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);display:flex;justify-content:center;align-items:center;z-index:50;opacity:0;pointer-events:none;transition:opacity .3s ease-in-out}
				.modal-overlay.active{opacity:1;pointer-events:auto}
				.modal-content{background-color:white;padding:2.5rem;border-radius:12px;text-align:center;box-shadow:0 10px 20px rgba(0,0,0,.2);transform:translateY(-20px);transition:transform .3s ease-in-out}
				.modal-overlay.active .modal-content{transform:translateY(0)}
			`}</style>

			{/* Header */}
			<header className="bg-white p-6 md:p-8 flex items-center justify-between shadow-sm border-b">
				<div className="flex items-center space-x-4">
					<button onClick={handleBack} className="text-gray-600 hover:text-gray-900 transition duration-300" aria-label="Volver">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
					</button>
					<div className="relative help-button-container">
						<h1 className="text-3xl font-bold text-gray-800">Memoria <span className="text-gray-400 cursor-pointer">?</span></h1>
						<div className="dialogue-bubble absolute bg-white p-4 rounded-lg shadow-md w-64 text-sm text-left">
							<p className="font-bold mb-2">Cómo jugar:</p>
							<p>Encuentra las parejas de palabras. Una tarjeta tiene la palabra en un idioma y la otra su traducción.</p>
						</div>
					</div>
				</div>
				{languageCode ? (
					<img src={`https://flagcdn.com/w160/${languageCode}.png`} alt="flag" className="w-10 md:w-12 h-auto rounded-md shadow-md" />
				) : <div />}
			</header>

			{/* Main */}
			<main className="container mx-auto p-8 flex flex-col items-center">
				<div id="game-board" className="gap-4 mt-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', maxWidth: 850 }}>
					{cards.map((c, idx) => (
						<div key={c.id} className={`card ${c.isFlipped ? 'flipped' : ''}`} onClick={() => handleFlip(idx)}>
							<div className="card-inner">
								<div className="card-face card-front" />
								<div className="card-face card-back">{c.text}</div>
							</div>
						</div>
					))}
				</div>

				{/* Counters */}
				<div className="fixed bottom-8 right-8 bg-gray-200 px-6 py-3 rounded-full shadow-md">
					<span className="text-xl font-bold">{matchesFound}/{totalPairs}</span>
				</div>
				<div className="fixed bottom-8 left-8 bg-gray-200 px-6 py-3 rounded-full shadow-md">
					<span className="text-xl font-bold">Intentos: {tries}</span>
				</div>
			</main>

			{/* Win Modal */}
			<div className={`modal-overlay ${won ? 'active' : ''}`}>
				<div className="modal-content">
					<h2 className="text-3xl font-bold text-green-500 mb-4">¡Felicidades!</h2>
					<p className="text-xl mb-6">¡Has completado el juego de memoria!</p>
					<p className="text-lg text-gray-700 mb-8">Número de intentos: {tries}</p>
					<button onClick={handleBack} className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition duration-300">Más lecciones</button>
				</div>
			</div>
		</div>
	);
}

