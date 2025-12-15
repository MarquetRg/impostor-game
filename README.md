# Impostor Local - Juego Web

Un juego de deducción social estilo "Among Us" o "Spyfall" pero local, para jugar en grupo con un solo dispositivo o cada uno con el suyo si se despliega.

## 🚀 Cómo jugar

1.  Abre el juego en tu navegador.
2.  Agrega los nombres de los jugadores.
3.  Selecciona las categorías de palabras.
4.  Pasa el dispositivo a cada jugador para que vea su rol (Impostor o Inocente).
5.  ¡Empieza el debate y encuentra al impostor!

## 🌐 Cómo jugar con amigos (Online/Móvil)

Para jugar desde el móvil sin cables o compartirlo con amigos, necesitas "subir" (desplegar) el juego a internet. Aquí tienes las opciones más fáciles y gratuitas:

### Opción 1: Vercel (Recomendada)
1.  Sube este código a un repositorio de **GitHub**.
2.  Ve a [Vercel.com](https://vercel.com) y regístrate.
3.  Haz clic en "Add New..." -> "Project".
4.  Selecciona tu repositorio de GitHub.
5.  Dale a "Deploy".
6.  ¡Listo! Te dará un link (ej: `impostor-game.vercel.app`) que puedes enviar a tus amigos por WhatsApp.

### Opción 2: GitHub Pages
1.  En tu repositorio de GitHub, ve a **Settings**.
2.  Ve a la sección **Pages**.
3.  En "Source", selecciona `main` (o `master`) branch.
4.  Guarda y espera unos minutos. Tu juego estará en `tu-usuario.github.io/tu-repo`.

## 📱 Instalar en el móvil (PWA)

Este juego es una **Progressive Web App (PWA)**. Esto significa que puedes instalarlo como si fuera una app nativa:

1.  Abre el link de tu juego en Chrome (Android) o Safari (iOS).
2.  **Android**: Te aparecerá un botón "Instalar App" o ve al menú (3 puntos) -> "Instalar aplicación".
3.  **iOS**: Botón Compartir -> "Añadir a la pantalla de inicio".
4.  Ahora podrás jugar **offline** (sin internet) desde el icono en tu pantalla de inicio.

## 🛠️ Desarrollo Local

Si quieres editar el código:

1.  Clona el repositorio.
2.  Abre `index.html` en tu navegador.
3.  Para probar las funciones PWA (Service Worker), necesitas un servidor local. Si tienes VS Code, usa la extensión "Live Server".
