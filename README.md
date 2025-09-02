# Truco Online MVP

Un juego de Truco argentino multijugador en tiempo real construido con Next.js, Node.js y Socket.IO.

## 🎮 Características

- **Juego de Truco completo** con reglas argentinas tradicionales
- **Envido completo** con Real Envido y Falta Envido
- **Flor opcional** configurable por partida
- **Configuración de partidas** - jugar a 15 o 30 puntos
- **Sistema de salas mejorado** con códigos de acceso
- **Emparejamiento rápido** automático
- **Multijugador en tiempo real** usando Socket.IO
- **Interfaz moderna** con React y Tailwind CSS
- **Cartas españolas auténticas** con diseño tradicional
- **Reconexión automática** en caso de desconexión
- **Responsive design** para móviles y desktop

## 🚀 Inicio Rápido con Docker

### Prerrequisitos

- Docker
- Docker Compose

### Instalación

1. **Clonar el repositorio**
   \`\`\`bash
   git clone <repository-url>
   cd truco-online-mvp
   \`\`\`

2. **Ejecutar el script de configuración**
   \`\`\`bash
   chmod +x scripts/docker-setup.sh
   ./scripts/docker-setup.sh
   \`\`\`

3. **Acceder a la aplicación**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

### Comandos Docker

\`\`\`bash
# Desarrollo
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down

# Producción
docker-compose up -d
docker-compose down

# Ver logs
docker-compose logs -f

# Reconstruir imágenes
docker-compose build --no-cache
\`\`\`

## 🛠️ Desarrollo Local (sin Docker)

### Prerrequisitos

- Node.js 20+
- npm

### Backend

\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

### Frontend

\`\`\`bash
npm install
npm run dev
\`\`\`

## 🎯 Cómo Jugar

### Configuración de Partida
1. **Elegir configuración**
   - Puntos objetivo: 15 o 30 puntos
   - Con o sin Flor

2. **Crear o unirse a una sala**
   - Ingresa tu nombre
   - Crea una nueva sala (se genera un código de 6 caracteres)
   - Únete por código de sala
   - O usa emparejamiento rápido para encontrar oponente automáticamente

3. **Esperar al oponente**
   - Las partidas requieren exactamente 2 jugadores
   - Solo puedes unirte a salas con configuración compatible

### Fases del Juego

#### 1. Flor (si está habilitada)
- Si tienes 3 cartas del mismo palo, puedes cantar "Flor"
- Puntos: suma de las 3 cartas + 20
- El oponente puede aceptar o rechazar

#### 2. Envido
- **Envido**: 2 puntos si se acepta, 1 si se rechaza
- **Real Envido**: 3 puntos si se acepta, 1 si se rechaza  
- **Falta Envido**: puntos que faltan para ganar
- Puntos: suma de las 2 cartas más altas del mismo palo + 20

#### 3. Truco y Cartas
- Cada jugador recibe 3 cartas
- El objetivo es ganar 2 de 3 bazas
- **Truco**: 2 puntos si se acepta, 1 si se rechaza
- **ReTruco**: 3 puntos si se acepta, 2 si se rechaza
- **Vale 3**: 4 puntos si se acepta, 3 si se rechaza
- **Vale 4**: 5 puntos si se acepta, 4 si se rechaza

## 🃏 Jerarquía de Cartas (de mayor a menor)

1. **1♠** (Ancho de Espadas)
2. **1♣** (Ancho de Bastos)
3. **7♠** (Siete de Espadas)
4. **7♦** (Siete de Oros)
5. **3** (Todos los Tres)
6. **2** (Todos los Dos)
7. **1♦, 1♥** (Anchos falsos)
8. **12, 11, 10** (Figuras)
9. **7♥, 7♣** (Sietes falsos)
10. **6, 5, 4** (Números bajos)

## 🏗️ Arquitectura

\`\`\`
truco-online-mvp/
├── app/                    # Frontend Next.js
├── backend/               # Backend Node.js + Socket.IO
├── components/            # Componentes React
├── lib/                   # Utilidades y lógica del juego
├── types/                 # Definiciones TypeScript
├── docker-compose.yml     # Configuración Docker producción
├── docker-compose.dev.yml # Configuración Docker desarrollo
└── scripts/               # Scripts de configuración
\`\`\`

## 🔧 Variables de Entorno

### Frontend (.env.local)
\`\`\`
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
\`\`\`

### Backend (backend/.env)
\`\`\`
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
\`\`\`

## 🧪 Testing

\`\`\`bash
# Frontend
npm run test

# Backend
cd backend
npm run test
\`\`\`

## 📝 Licencia

MIT License - ver archivo LICENSE para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reportar Bugs

Si encuentras algún bug, por favor abre un issue en GitHub con:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si es aplicable

---

¡Que disfrutes jugando al Truco! 🎉
