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
sudo pm2 logs institute-backend
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
