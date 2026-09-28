# 🎂 Birthday Dashboard

Panel moderno para gestionar y celebrar los cumpleaños del equipo. Diseñado para ser bonito, funcional y fácil de usar.

## ✨ Características

- **📅 Calendario interactivo** - Vista mensual con navegación, filtros por sucursal
- **🏢 Multi-sucursal** - Organización por sucursales con colores personalizados
- **🎨 Tarjetas de cumpleaños bonitas** - Generación de imágenes listas para WhatsApp
- **📱 Compartir por WhatsApp** - Individual o grupal (cumpleañeros del mes)
- **🔐 Autenticación Magic Link** - Acceso seguro sin contraseñas
- **🌙 PWA instalable** - Funciona como app nativa en móvil
- **🎨 Tema rosa/coral** - Diseño femenino, moderno y profesional

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Base de datos | SQLite + Prisma ORM |
| Autenticación | NextAuth v5 (Magic Link email) |
| UI | Componentes propios + Lucide React icons |
| Generación imágenes | html2canvas |
| Fechas | date-fns + date-fns-tz |
| Validación | Zod + React Hook Form |
| Deploy | Docker + Coolify |

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 20+
- Docker y Docker Compose (opcional, para desarrollo)
- Cuenta de email con SMTP (Gmail, Outlook, etc.)

### Desarrollo Local

```bash
# Clonar e instalar
git clone <repo-url>
cd birthday-dashboard
cp .env.example .env
# Editar .env con tus credenciales

# Con Docker (recomendado)
docker-compose up -d
# La app estará en http://localhost:3000

# Sin Docker
npm install
npx prisma db push
npm run dev
```

### Variables de Entorno (.env)

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-super-seguro-min-32-chars"

# Email (Magic Link) - Configura tu SMTP
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="tu-email@gmail.com"
EMAIL_SERVER_PASSWORD="tu-app-password"
EMAIL_FROM="Birthday Dashboard <noreply@tudominio.com>"

# App
NEXT_PUBLIC_APP_NAME="Birthday Dashboard"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Gmail App Password
1. Activa 2FA en tu cuenta Google
2. Ve a [App Passwords](https://myaccount.google.com/apppasswords)
3. Crea una nueva "App password" para "Mail"
4. Usa esa contraseña en `EMAIL_SERVER_PASSWORD`

## 📦 Deploy en Coolify

1. **Crear nuevo recurso** → **Docker Compose** o **Dockerfile**
2. **Conectar repositorio** GitHub
3. **Configurar variables de entorno** en Coolify (las mismas que .env)
4. **Añadir volumen persistente** para `/app/data` (base de datos SQLite)
5. **Configurar dominio** (ej: `cumple.tudominio.com`)
6. **Deploy!**

### Docker Compose para Coolify

```yaml
# docker-compose.coolify.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/app/data/prod.db
      - NEXTAUTH_URL=https://tu-dominio.com
      - NEXTAUTH_SECRET=...
      # ... resto de variables
    volumes:
      - birthday-data:/app/data
    restart: always

volumes:
  birthday-data:
```

## 📁 Estructura del Proyecto

```
birthday-dashboard/
├── prisma/
│   └── schema.prisma          # Esquema de BD
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Rutas protegidas
│   │   │   ├── page.tsx       # Dashboard principal
│   │   │   ├── components/    # Componentes UI
│   │   │   └── api/           # API Routes
│   │   ├── api/auth/          # NextAuth endpoints
│   │   ├── login/             # Página de login
│   │   ├── layout.tsx         # Layout raíz
│   │   ├── globals.css        # Estilos globales + Tailwind
│   │   └── providers.tsx      # SessionProvider
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma singleton
│   │   ├── auth.ts            # Config NextAuth
│   │   ├── email.ts           # Envío emails (nodemailer)
│   │   ├── utils.ts           # Utilidades fechas/formato
│   │   └── colors.ts          # Paleta de colores
│   ├── types/
│   │   └── index.ts           # Tipos TypeScript
│   └── middleware.ts          # Protección de rutas
├── public/                    # Assets estáticos
├── Dockerfile                 # Multi-stage build
├── docker-compose.yml         # Desarrollo local
├── tailwind.config.ts         # Config Tailwind + tema
├── next.config.js             # Config Next.js
└── package.json
```

## 🎯 Uso

1. **Accede** a `/login` e introduce tu email
2. **Revisa tu correo** y haz clic en el enlace mágico
3. **Dashboard principal**:
   - Ver calendario del mes actual
   - Filtrar por sucursal
   - Click en día vacío → Agregar cumpleaños
   - Click en cumpleaños existente → Editar/Eliminar
4. **Compartir**:
   - Botón "Compartir Mes" → Tarjeta grupal de todos los cumpleañeros del mes
   - Botón individual en cada tarjeta → Tarjeta personalizada

## 🎨 Personalización

### Colores de sucursal
Edita `src/lib/colors.ts` → `SUCURSALES_DEFAULT_COLORS`

### Tema global
Modifica `tailwind.config.ts` → `theme.extend.colors`

### Email templates
Edita `src/lib/email.ts` → funciones `sendMagicLink` y `sendWelcomeEmail`

## 📱 PWA

La app es instalable:
- Chrome/Edge: Menú → Instalar Birthday Dashboard
- Safari iOS: Compartir → Añadir a pantalla de inicio
- Funciona offline (cache básico)

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Iniciar producción
npm run lint         # ESLint
npm run db:push      # Sincronizar esquema Prisma
npm run db:studio    # Abrir Prisma Studio
```

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

---

**Hecho con ❤️ para el equipo de Erik Servicios**