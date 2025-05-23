# AI 聊天助手后端 - 用户系统

## 1. 项目简介 (Project Introduction)

本项目是 AI 聊天助手应用的后端服务。当前模块主要实现了用户系统（User System）的基础功能，包括用户注册、登录、信息获取与更新。
项目基于 [NestJS](https://nestjs.com/) 框架构建，使用 [PostgreSQL](https://www.postgresql.org/) 作为数据库。

## 2. 环境要求 (Prerequisites)

在开始之前，请确保您的开发环境中安装了以下软件：

*   **Node.js**: 推荐版本 v18 或 v20+ (可使用 [nvm](https://github.com/nvm-sh/nvm) 进行版本管理)
*   **npm**: (通常随 Node.js 一起安装) 或 **yarn**
*   **PostgreSQL**: 一个正在运行的 PostgreSQL 数据库服务实例

## 3. 项目配置与运行 (Configuration and Running)

### 3.1. 克隆项目 (Clone Project)

(假设您已通过其他方式获取到项目代码)

```bash
# git clone <repository_url>
# cd ai-chat-backend
```

### 3.2. 安装依赖 (Install Dependencies)

在项目根目录下执行以下命令安装项目所需的依赖包：

```bash
npm install
```
或者，如果您使用 yarn：
```bash
# yarn install
```

### 3.3. 环境变量配置 (Environment Variables Setup)

项目通过 `.env` 文件管理环境变量。请在项目根目录 (`ai-chat-backend`) 创建一个名为 `.env` 的文件。

以下是 `.env` 文件的配置模板，请根据您的实际环境进行修改：

```env
# .env 配置文件示例

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_db_user     # 您的PostgreSQL用户名
DB_PASSWORD=your_db_password # 您的PostgreSQL密码
DB_DATABASE=ai_chat_db       # 您希望使用的数据库名

# JWT 配置
JWT_SECRET=your_super_secret_jwt_key # 用于JWT签名的密钥，请替换为强随机字符串
JWT_EXPIRATION_TIME=3600s            # JWT 过期时间 (例如: 60, "2 days", "10h", "7d", "3600s")
```

**重要提示**:
*   请务必将 `your_db_user` 和 `your_db_password` 替换为您 PostgreSQL 数据库的真实凭据。
*   `JWT_SECRET` 应该是一个复杂且唯一的字符串，用于保证 JWT 的安全性。
*   关于 `DB_DATABASE`：由于在 `src/app.module.ts` 的 TypeORM 配置中 `synchronize: true` (通常用于开发环境)，如果指定的数据库在 PostgreSQL 中不存在，NestJS 应用在启动时会尝试自动创建它。在生产环境中，建议将 `synchronize` 设置为 `false`，并使用数据库迁移（migrations）来管理数据库结构。

### 3.4. 运行开发服务器 (Run Development Server)

配置好 `.env` 文件后，可以通过以下命令启动 NestJS 开发服务器：

```bash
npm run start:dev
```

服务启动后，默认会在 `http://localhost:3000` 上监听请求。

## 4. 主要技术栈与依赖 (Main Tech Stack & Dependencies)

*   **框架 (Framework):** [NestJS](https://nestjs.com/) (@nestjs/core, @nestjs/common, etc.)
*   **ORM:** [TypeORM](https://typeorm.io/) (与 PostgreSQL 交互)
*   **数据库 (Database):** [PostgreSQL](https://www.postgresql.org/)
*   **认证 (Authentication):**
    *   `@nestjs/jwt` & `passport-jwt`: 实现基于 JSON Web Token (JWT) 的认证策略。
    *   `@nestjs/passport` & `passport`: 认证中间件基础。
*   **密码处理 (Password Hashing):** `bcryptjs` (用于安全地哈希和比较用户密码)
*   **数据验证 (Data Validation):**
    *   `class-validator`: 基于装饰器的 DTO (Data Transfer Object) 验证。
    *   `class-transformer`: DTO 实例的转换。
*   **配置管理 (Configuration):** `@nestjs/config` (用于管理环境变量)

## 5. API 接口文档 (API Endpoints)

所有 API 均以 `/` 为基础路径。

---

### 5.1. 用户注册 (User Registration)

*   **Method:** `POST`
*   **Path:** `/auth/register`
*   **Description:** 注册一个新用户。
*   **Request Body:** `CreateUserDto`
    *   `username` (string, required, minLength: 3): 用户名
    *   `password` (string, required, minLength: 6): 密码
    *   `nickname` (string, optional): 昵称
    *   `avatarUrl` (string, optional, URL format): 头像链接
    *   **Example:**
        ```json
        {
          "username": "testuser",
          "password": "password123",
          "nickname": "测试用户",
          "avatarUrl": "https://example.com/avatar.png"
        }
        ```
*   **Success Response (201 Created):** 返回创建成功的用户信息 (不包含密码哈希)。
    *   **Example:**
        ```json
        {
          "id": 1,
          "username": "testuser",
          "nickname": "测试用户",
          "avatarUrl": "https://example.com/avatar.png",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "updatedAt": "2023-10-27T10:00:00.000Z"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: 请求体验证失败 (例如，用户名太短，密码不符合要求，avatarUrl格式错误)。
        ```json
        {
          "message": [
            "username must be longer than or equal to 3 characters",
            "password must be longer than or equal to 6 characters",
            "avatarUrl must be a URL address"
          ],
          "error": "Bad Request",
          "statusCode": 400
        }
        ```
    *   `409 Conflict`: 用户名已存在。
        ```json
        {
          "message": "Username already exists.",
          "error": "Conflict",
          "statusCode": 409
        }
        ```

---

### 5.2. 用户登录 (User Login)

*   **Method:** `POST`
*   **Path:** `/auth/login`
*   **Description:** 用户使用用户名和密码登录，成功后返回 JWT。
*   **Request Body:** `LoginUserDto`
    *   `username` (string, required): 用户名
    *   `password` (string, required): 密码
    *   **Example:**
        ```json
        {
          "username": "testuser",
          "password": "password123"
        }
        ```
*   **Success Response (200 OK):** 返回包含 `access_token` 的对象。
    *   **Example:**
        ```json
        {
          "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwic3ViIjoxLCJpYXQiOjE2Nzk5ODg4NjUsImV4cCI6MTY3OTk5MjQ2NX0.exampleTokenString"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: 请求体验证失败。
    *   `401 Unauthorized`: 用户名或密码错误。
        ```json
        {
          "message": "Invalid credentials",
          "error": "Unauthorized",
          "statusCode": 401
        }
        ```

---

### 5.3. 用户登出 (User Logout)

*   **Method:** `POST`
*   **Path:** `/auth/logout`
*   **Description:** 用户登出。对于基于 JWT 的无状态认证，后端通常不执行特定操作。此接口主要用于满足语义，客户端应负责清除本地存储的 JWT。
*   **Authentication:** JWT Bearer Token required in `Authorization` header.
    ```
    Authorization: Bearer your_jwt_token_here
    ```
*   **Success Response (200 OK):**
    *   **Example:**
        ```json
        {
          "message": "Logged out successfully"
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: 未提供有效的 JWT 或 JWT 已过期。

---

### 5.4. 获取当前用户信息 (Get Current User Profile)

*   **Method:** `GET`
*   **Path:** `/users/me`
*   **Description:** 获取当前已登录用户的个人信息。
*   **Authentication:** JWT Bearer Token required.
*   **Success Response (200 OK):** 返回当前用户信息 (不包含密码哈希)。
    *   **Example:**
        ```json
        {
          "id": 1,
          "username": "testuser",
          "nickname": "测试用户",
          "avatarUrl": "https://example.com/avatar.png",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "updatedAt": "2023-10-27T10:00:00.000Z"
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: 未提供有效的 JWT 或 JWT 已过期。
    *   `404 Not Found`: （理论上不应发生，因为 JWT 有效则用户应存在）用户在数据库中未找到。

---

### 5.5. 更新当前用户信息 (Update Current User Profile)

*   **Method:** `PUT`
*   **Path:** `/users/me`
*   **Description:** 更新当前已登录用户的个人信息 (例如昵称、头像)。
*   **Authentication:** JWT Bearer Token required.
*   **Request Body:** `UpdateUserDto`
    *   `nickname` (string, optional): 新的昵称
    *   `avatarUrl` (string, optional, URL format): 新的头像链接
    *   **Example:**
        ```json
        {
          "nickname": "新昵称",
          "avatarUrl": "https://example.com/new_avatar.png"
        }
        ```
*   **Success Response (200 OK):** 返回更新后的用户信息 (不包含密码哈希)。
    *   **Example:**
        ```json
        {
          "id": 1,
          "username": "testuser",
          "nickname": "新昵称",
          "avatarUrl": "https://example.com/new_avatar.png",
          "createdAt": "2023-10-27T10:00:00.000Z",
          "updatedAt": "2023-10-27T10:05:00.000Z"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: 请求体验证失败 (例如，avatarUrl格式错误)。
    *   `401 Unauthorized`: 未提供有效的 JWT 或 JWT 已过期。
    *   `404 Not Found`: 用户在数据库中未找到。

---
