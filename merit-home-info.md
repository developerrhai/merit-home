# Merit Home Project & Server Deployment Info

This document contains all the deployment details, server configuration, database schema, and commands needed to manage the **Merit Home** application.

---

## 🖥️ Server & Deployment Details

* **Server Instance**: AWS EC2 instance (HealthCoreX)
* **Instance ID**: `i-091965c3bf9b746d0`
* **Public IP Address**: `13.204.199.132`
* **Public DNS**: `ec2-13-204-199-132.ap-south-1.compute.amazonaws.com`
* **SSH Login**:
  ```bash
  ssh -i node-key.pem ec2-user@13.204.199.132
  ```
  *(The private SSH key `node-key.pem` is located locally in your `C:\Users\admin\Desktop\freelance_backend` directory).*

---

## ⚙️ Backend Application Configuration

* **Local Code Path**: `C:\Users\admin\Desktop\freelance_backend\institutemanagement`
* **Server Code Path**: `/var/www/html/institutemanagement/`
* **Running Port**: `5001`
* **Process Manager**: PM2
  * **App Name in PM2**: `institute-backend`
  * **PM2 Run command**:
    ```bash
    cd /var/www/html/institutemanagement/
    sudo pm2 start server.js --name "institute-backend"
    ```
  * **Save configuration (for auto-start on reboot)**:
    ```bash
    sudo pm2 save
    ```
* **Logs location**:
  * **Output Logs**: `/root/.pm2/logs/institute-backend-out.log`
  * **Error Logs**: `/root/.pm2/logs/institute-backend-error.log`

---

## 🛢️ Database Configuration (MariaDB)

* **Port**: `3306` (MySQL/MariaDB)
* **Database Name**: `vidyapeeth`
* **User**: `root`
* **Password**: `""` (Empty password - socket connection or blank root login enabled)
* **Connection String (Local config)**:
  ```env
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=vidyapeeth
  PORT=5001
  JWT_SECRET=supersecretkeyrhai12345
  ```

### 📋 Database Tables (Restored & Active)
The `vidyapeeth` database contains the following tables:
* **`users`** (Contains user logins/credentials)
* **`teachers`**
* **`standards`**
* **`subjects`**
* **`batches`**
* **`boards`**
* **`inquiries`**
* **`inquiry_student`**
* **`attendance`**
* **`marks`**
* **`notes`**
* **`appointments`**
* **`chapters`**
* **`topics`**

---

## 🛠️ Operations & Maintenance Guide

### 1. How to restart the backend:
```bash
# Log in to server and run:
sudo pm2 restart institute-backend
```

### 2. How to check live server logs:
```bash
# To check active logs of backend server under ec2-user:
pm2 logs institutemanagement
```

### 3. How to backup the database (Local file creation):
```bash
# Log in to server and run:
sudo mysqldump -u root vidyapeeth > /home/ec2-user/backup_$(date +%F).sql
```

### 4. How to restore the database from a backup file:
```bash
# Log in to server and run:
sudo mariadb vidyapeeth < /home/ec2-user/merit.sql
```

---

## 📋 Biometric Integration & EC2 Server Synced Paths

### 💻 Local Deployment Directories
* **Monorepo (Frontend + Backend):** `C:\Users\admin\Desktop\freelance\merit-home`
* **EC2 Deployment Workspace:** `C:\Users\admin\Desktop\freelance_backend\institutemanagement`

### 🖥️ EC2 Deployment Workspace Paths & Commands
* **App Root Path on EC2:** `/app/institutemanagement`
* **Sync & Deploy workflow from Local:**
  ```bash
  # Step 1: Copy modified files to EC2 workspace excluding environment variables and node_modules
  robocopy c:\Users\admin\Desktop\freelance\merit-home\backend C:\Users\admin\Desktop\freelance_backend\institutemanagement /MIR /XD node_modules .git /XF .env node-key.pem

  # Step 2: Push changes to fork remote branch
  cd C:\Users\admin\Desktop\freelance_backend\institutemanagement
  git add .
  git commit -m "feat: deploy biometric updates"
  git push fork feature/otp-password-reset

  # Step 3: Pull changes and restart backend on EC2 server
  ssh -i C:\Users\admin\Desktop\freelance_backend\node-key.pem ec2-user@13.204.199.132 "cd /app/institutemanagement && git pull fork feature/otp-password-reset && npm install && pm2 restart 0"
  ```

### 🔑 Environment Variables (.env)
Add these variables to `backend/.env` (and server `/app/institutemanagement/.env`) to connect the biometric sync:
```bash
# Biometric API (Placeholder defaults, replace with real values)
SMARTOFFICE_BASE_URL=http://your-smartoffice-ip-or-domain
SMARTOFFICE_API_KEY=your_smartoffice_api_key_here
SMARTOFFICE_SERIAL_NUMBER=your_device_serial_number_here

# WhatsApp configurations
WHATSAPP_APP_KEY=your_whatsapp_app_key_here
WHATSAPP_AUTH_KEY=your_whatsapp_auth_key_here
WHATSAPP_TEMPLATE_ID=your_whatsapp_template_id_here
```
