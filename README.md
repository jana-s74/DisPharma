# 💊 DisPharma

> A full-stack **Pharmacy Management System** built with the MERN stack — designed to streamline medicine search, billing, stock management, and admin analytics for modern pharmacies.

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=flat&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat&logo=mongodb&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

---

## 📖 About

**DisPharma** is a feature-rich pharmacy management web application that helps pharmacy staff and administrators efficiently manage medicine inventory, process bills, search for medicines, and track business performance through an intuitive dashboard. It supports role-based access — separating regular staff from admin users — with secure JWT-based authentication.

---

## ✨ Features

### 👤 Staff / User
- 🔐 **Secure Authentication** — Register, Login, Forgot Password with email OTP
- 🔍 **Medicine Search** — Real-time search for medicines by name, category, or composition
- 🛒 **Billing System** — Generate itemized bills with PDF export support
- 📋 **Profile Management** — View and update user profile
- 📊 **Dashboard** — Quick overview of activity and recent bills

### 🛡️ Admin Panel
- 🔐 **Admin Login** — Separate secure admin authentication
- 📈 **Analytics Dashboard** — Revenue charts, stock trends, and transaction history using Recharts
- 📦 **Stock Management** — Add, update, and monitor medicine stock levels
- 👥 **User Management** — View and manage registered pharmacy staff
- 🗺️ **Map View** — Leaflet-powered location-based features
- 🤖 **AI Integration** — Powered by Google Gemini AI for intelligent insights

---

## 🛠️ Tech Stack

| Layer       | Technology                                      |
|-------------|--------------------------------------------------|
| **Frontend**| React 19, Vite, TailwindCSS, React Router DOM v7 |
| **Backend** | Node.js, Express.js                             |
| **Database**| MongoDB with Mongoose ODM                       |
| **Auth**    | JWT (JSON Web Tokens), bcryptjs                 |
| **AI**      | Google Gemini AI (`@google/genai`)              |
| **Charts**  | Recharts                                        |
| **Maps**    | Leaflet, React-Leaflet                          |
| **Email**   | Nodemailer                                      |
| **PDF**     | PDFKit                                          |
| **Upload**  | Multer (image/file uploads)                     |
| **Dev Tools**| Nodemon, Concurrently, ESLint                  |

---

## 📁 Project Structure

```
DisPharma/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components (Navbar, Admin Layout, etc.)
│   │   ├── context/           # Auth context (React Context API)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin dashboard & login
│   │   │   ├── BillPage.jsx
│   │   │   ├── SearchPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── LandingPage.jsx
│   │   └── utils/             # Helper utilities
│   └── public/
│
└── server/                    # Express backend
    ├── config/                # DB configuration
    ├── controllers/           # Route handler logic
    ├── middleware/             # Auth & error middleware
    ├── models/                # Mongoose schemas (User, Medicine, Stock, Transaction)
    ├── routes/                # API route definitions
    │   ├── authRoutes.js
    │   ├── stockRoutes.js
    │   ├── searchRoutes.js
    │   ├── billRoutes.js
    │   └── adminRoutes.js
    ├── seeds/                 # Database seed scripts
    ├── uploads/               # Uploaded files storage
    ├── utils/                 # Server-side helpers
    └── server.js              # Entry point
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or [MongoDB Atlas](https://cloud.mongodb.com/))
- **npm** v8+

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/DisPharma.git
cd DisPharma
```

### 2. Configure Environment Variables

Create a `.env` file in the **root directory**:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/dispharma

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Admin Credentials
ADMIN_EMAIL=admin@dispharma.com
ADMIN_PASSWORD=your_admin_password

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 4. Seed the Database (Optional)

```bash
cd server
npm run seed
```

### 5. Run the Application

```bash
# From the root directory — starts both frontend & backend concurrently
npm run dev
```

| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173       |
| Backend    | http://localhost:5000       |
| API Health | http://localhost:5000/api/health |
| Admin Panel| http://localhost:5173/admin |

---

## 🔌 API Endpoints

| Method | Endpoint              | Description              | Auth Required |
|--------|-----------------------|--------------------------|---------------|
| POST   | `/api/auth/register`  | Register new user        | ❌            |
| POST   | `/api/auth/login`     | User login               | ❌            |
| POST   | `/api/auth/forgot-password` | Send OTP to email | ❌            |
| GET    | `/api/search`         | Search medicines         | ✅            |
| GET    | `/api/stock`          | Get stock details        | ✅            |
| POST   | `/api/stock`          | Add new stock            | ✅ Admin      |
| POST   | `/api/bill`           | Generate a bill          | ✅            |
| GET    | `/api/admin/dashboard`| Admin analytics data     | ✅ Admin      |
| GET    | `/api/health`         | API health check         | ❌            |

---

## 📸 Screenshots

> *(Add screenshots of Landing Page, Search, Billing, and Admin Dashboard here)*

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Built with ❤️ for modern pharmacy management.

---

> ⭐ If you found this project useful, please give it a star on GitHub!
