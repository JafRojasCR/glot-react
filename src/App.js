import React, { useEffect, useState } from 'react';
import Login from './login';             // asumimos que los componentes están en archivos separados
import Registro from './registro';
import Inicio from './inicio';
import Idiomas from './idiomas';
import Lecciones from './lecciones';
import Memory from './memory';
import Fill from './fill';
import Match from './match';
import Profile from './profile';

function App() {
  const [vistaActual, setVistaActual] = useState('login');
  const [token, setToken] = useState(null);

  // Inicializar token desde localStorage al montar
  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      setToken(t);
      setVistaActual('inicio');
    }
  }, []);

  // Cuando el login es exitoso:
  const handleLoginSuccess = (tokenRecibido) => {
    setToken(tokenRecibido);
    setVistaActual('inicio');   // pasamos a la vista principal de diseño
  };

  // Funciones para cambiar entre vistas (login/registro)
  const irARegistro = () => setVistaActual('registro');
  const irALogin = () => setVistaActual('login');
  const irAIdiomas = () => setVistaActual('idiomas');
  const irALecciones = () => setVistaActual('lecciones');
  const irAMemoria = () => setVistaActual('memoria');
  const irARellenar = () => setVistaActual('rellenar');
  const irAAsociar = () => setVistaActual('asociar');
  const irAPerfil = () => setVistaActual('perfil');
  const irAInicio = () => setVistaActual('inicio');

  // Cerrar sesión
  const handleLogout = () => {
    setToken(null);
    setVistaActual('login');
  };

  // Redirección a login si algún componente detecta token inválido
  const handleRequireLogin = () => {
    setToken(null);
    setVistaActual('login');
  };


  return (
    <div className="App">
      {token ? (
        // Si hay token (usuario autenticado), mostrar la interfaz principal
        <>
          {vistaActual === 'inicio' && 
            <Inicio isLoggedIn={!!token} onLogout={handleLogout} irAIdiomas={irAIdiomas} onGoPerfil={irAPerfil} />
          }
          {vistaActual === 'idiomas' && 
            <Idiomas
              onGoHome={irAInicio}
              onGoAprender={irAIdiomas}
              onGoPerfil={irAPerfil}
              onOpenLessons={() => irALecciones()}
              onRequireLogin={handleRequireLogin}
              onLogout={handleLogout}
            />
          }
          {vistaActual === 'lecciones' && (
            <Lecciones
              onBack={irAIdiomas}
              onGoHome={irAInicio}
              onGoAprender={irAIdiomas}
              onGoPerfil={irAPerfil}
              onRequireLogin={handleRequireLogin}
              onLogout={handleLogout}
              onOpenGame={({ tipo }) => {
                if (tipo === 'Memoria') irAMemoria();
                else if (tipo === 'Rellenar') irARellenar();
                else if (tipo === 'Asociar') irAAsociar();
              }}
            />
          )}
          {vistaActual === 'perfil' && (
            <Profile
              onGoHome={irAInicio}
              onGoAprender={irAIdiomas}
              onGoPerfil={irAPerfil}
              onRequireLogin={handleRequireLogin}
              onLogout={handleLogout}
            />
          )}
          {vistaActual === 'memoria' && (
            <Memory onBack={irALecciones} onRequireLogin={handleRequireLogin} />
          )}
          {vistaActual === 'rellenar' && (
            <Fill onBack={irALecciones} onRequireLogin={handleRequireLogin} />
          )}
          {vistaActual === 'asociar' && (
            <Match onBack={irALecciones} onRequireLogin={handleRequireLogin} />
          )}

         
          
        </>
      ) : (
        // Si no hay token, mostrar formulario de login o registro
        <>
          {vistaActual === 'login' && 
            <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={irARegistro} />
          }
          {vistaActual === 'registro' && 
            <Registro onSwitchToLogin={irALogin} />
          }
        </>
      )}
    </div>
  );
}

export default App;
