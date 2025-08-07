// src/hooks/useAuthActions.js
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

export const useAuthActions = () => {
  const [user] = useAuthState(auth);

  const requireAuth = (action, options = {}) => {
    const { 
      message = 'Debes iniciar sesión para realizar esta acción',
      onLogin = null 
    } = options;

    if (!user) {
      if (window.confirm(`${message}\n\n¿Deseas iniciar sesión ahora?`)) {
        if (onLogin) {
          onLogin();
        } else {
          // Buscar y disparar el modal de auth
          const authButton = document.querySelector('[data-auth-trigger]');
          if (authButton) {
            authButton.click();
          } else {
            // Fallback: recargar página o redirigir
            alert('Por favor, inicia sesión desde la barra de navegación');
          }
        }
      }
      return false;
    }
    
    // Usuario autenticado, ejecutar acción
    action();
    return true;
  };

  const protectedAction = (action, authMessage) => {
    return () => requireAuth(action, { message: authMessage });
  };

  return {
    user,
    isAuthenticated: !!user,
    requireAuth,
    protectedAction
  };
};