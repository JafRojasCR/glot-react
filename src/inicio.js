// src/Inicio.js
import React from "react";
import Logo from "./img/GLOT Logo.png";
import LogoWhite from "./img/GLOT Logo White.png";

function Inicio({ isLoggedIn, onLogout, irAIdiomas, onGoPerfil }) {
  
  function handleLogoutClick(e) {
    e?.preventDefault?.();
    localStorage.clear();
    if (onLogout) onLogout();
  }

  return (
    <div className="bg-gray-50 text-gray-800 comfortaa min-h-screen">
      <nav className="flex items-center justify-between px-6 py-4 border-b w-full">
        <div className="flex items-center space-x-2">
          <img src={Logo} alt="G/LOT Logo" className="h-10 w-auto" />
        </div>
        <div className="flex space-x-8 text-lg">
          <a
            
            className="comfortaa text-green-400 font-bold transition duration-200 hover:text-blue-400 hover:scale-110"
          >
            Inicio
          </a>
          <a
            onClick={irAIdiomas}
            className="comfortaa text-black transition duration-200 hover:text-green-400 hover:scale-110"
          >
            Aprender
          </a>
           <button onClick={onGoPerfil} className="comfortaa text-black transition duration-200 hover:text-green-400 hover:scale-110">Mi Aprendizaje</button>
          {isLoggedIn && (
            <a

              className="comfortaa text-black transition duration-200 hover:text-red-400 hover:scale-110"
              onClick={handleLogoutClick}
            >
              Salir
            </a>
          )}
        </div>
      </nav>

      <header className="flex flex-col md:flex-row items-center justify-center p-10 bg-green-400 text-white">
        <div className="text-center md:text-left md:w-1/2 p-6">
          <h1 className="text-5xl font-bold mb-4">
            Aprende idiomas jugando, ¡crea y comparte!
          </h1>
          <p className="text-xl mb-8">
            Descubre un universo de juegos creados por la comunidad para dominar
            nuevas palabras. En G/LOT, puedes jugar para aprender o crear tus
            propios desafíos.
          </p>
          <a
            onClick={irAIdiomas}
            className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition duration-300"
          >
            Empieza a Jugar Ahora
          </a>
        </div>
        <div className="mt-8 md:mt-0 md:w-1/2 flex justify-center">
          <img
            src={LogoWhite}
            alt="Ilustración de juego de idiomas"
            className="rounded-xl shadow-2xl"
          />
        </div>
      </header>

      <section className="py-16 px-6 bg-white">
        <h2 className="text-4xl font-bold text-center mb-12">
          ¿Qué puedes hacer en G/LOT?
        </h2>
        <div className="flex flex-col md:flex-row justify-center items-center md:space-x-8 space-y-8 md:space-y-0">
          {/* Jugar y Aprender */}
          <div className="flex flex-col items-center text-center p-6 w-full md:w-1/3">
            <div className="bg-blue-400 text-white rounded-full p-4 mb-4 shadow-xl">
              {/* SVG omitted for brevity */}
            </div>
            <h3 className="text-2xl font-semibold mb-2">Jugar y Aprender</h3>
            <p className="text-gray-600">
              Explora una biblioteca de juegos de vocabulario en diferentes
              idiomas. ¡Es la forma más divertida de memorizar palabras!
            </p>
          </div>
          {/* Crear tu Juego */}
          <div className="flex flex-col items-center text-center p-6 w-full md:w-1/3">
            <div className="bg-yellow-400 text-white rounded-full p-4 mb-4 shadow-xl">
              {/* SVG omitted for brevity */}
            </div>
            <h3 className="text-2xl font-semibold mb-2">Crear tu Juego</h3>
            <p className="text-gray-600">
              ¿Quieres un juego específico? Crea tus propias listas de palabras
              y diseña tus propios juegos para ti o para la comunidad.
            </p>
          </div>
          {/* Comunidad */}
          <div className="flex flex-col items-center text-center p-6 w-full md:w-1/3">
            <div className="bg-pink-400 text-white rounded-full p-4 mb-4 shadow-xl">
              {/* SVG omitted for brevity */}
            </div>
            <h3 className="text-2xl font-semibold mb-2">Comunidad</h3>
            <p className="text-gray-600">
              Conecta con otros estudiantes de idiomas. Publica tus creaciones y
              ayuda a que otros aprendan.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-blue-400 text-white text-center py-16 px-6">
        <h2 className="text-4xl font-bold mb-4">
          ¡Únete a la comunidad de G/LOT hoy mismo!
        </h2>
        <p className="text-xl mb-8">
          No esperes más para dominar un nuevo idioma de la manera más
          divertida.
        </p>
    
      </section>

      <footer className="bg-gray-800 text-gray-300 text-center py-6 px-4 comfortaa">
        <p>&copy; 2025 G/LOT. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default Inicio;
