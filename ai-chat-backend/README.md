# AI 聊天助手后端 - 用户系统

## 1. 项目简介 (Project Introduction)

本项目是 AI 聊天助手应用的后端服务。当前模块主要实现了用户系统（User System）的基础功能，包括用户注册、登录、信息获取与更新。后续扩展了群组 (Group) 和实时聊天 (Chat) 功能。
项目基于 [NestJS](https://nestjs.com/) 框架构建，使用 [PostgreSQL](https://www.postgresql.org/) 作为数据库，并采用 [Socket.IO](https://socket.io/) 实现 WebSocket 通信。

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
*   **WebSocket:** `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`
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

### 5.6. 创建群组 (Create Group)

*   **Method:** `POST`
*   **Path:** `/groups`
*   **Description:** 创建一个新的群组，当前用户将成为群主。
*   **Authentication:** JWT Bearer Token required.
*   **Request Body:** `CreateGroupDto`
    *   `name` (string, required, minLength: 3, maxLength: 50): 群组名称
    *   **Example:**
        ```json
        {
          "name": "我的技术研讨小组"
        }
        ```
*   **Success Response (201 Created):** 返回创建成功的群组对象 (包含群主信息，群主信息已脱敏)。
    *   **Example:**
        ```json
        {
          "id": 1,
          "name": "我的技术研讨小组",
          "owner": {
            "id": 1,
            "username": "ownerUser",
            "nickname": "群主昵称",
            "avatarUrl": null,
            "createdAt": "2023-10-27T09:00:00.000Z",
            "updatedAt": "2023-10-27T09:00:00.000Z"
          },
          "createdAt": "2023-10-28T12:00:00.000Z",
          "updatedAt": "2023-10-28T12:00:00.000Z"
        }
        ```
*   **Error Responses:**
    *   `400 Bad Request`: 请求体验证失败 (例如，群组名称不符合要求)。
    *   `401 Unauthorized`: 未提供有效的 JWT 或 JWT 已过期。
    *   `404 Not Found`: (理论上创建者用户应存在) 群主用户ID未找到。

---

### 5.7. 加入群组 (Join Group)

*   **Method:** `POST`
*   **Path:** `/groups/:groupId/join`
*   **Description:** 当前用户加入指定的群组。
*   **Authentication:** JWT Bearer Token required.
*   **Params:**
    *   `groupId` (integer, required): 目标群组的ID。
*   **Success Response (201 Created):** 返回 `GroupMember` 对象，表示成功加入。
    *   **Example:**
        ```json
        {
          "id": 10, // GroupMember 记录的 ID
          "user": { // 加入群组的用户信息 (已脱敏)
            "id": 2,
            "username": "joiningUser",
            "nickname": "小明",
            "avatarUrl": null,
            "createdAt": "2023-10-27T10:00:00.000Z",
            "updatedAt": "2023-10-27T10:00:00.000Z"
          },
          "group": { // 所加入的群组信息 (部分)
            "id": 1,
            "name": "我的技术研讨小组",
            "owner": { "id": 1, "username": "ownerUser" }, // 通常仅包含ID和关键信息
            "createdAt": "2023-10-28T12:00:00.000Z",
            "updatedAt": "2023-10-28T12:00:00.000Z"
          },
          "joinedAt": "2023-10-28T13:00:00.000Z"
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: 未提供有效的 JWT 或 JWT 已过期。
    *   `404 Not Found`: 指定的 `userId` (当前用户) 或 `groupId` 未找到。
    *   `409 Conflict`: 用户已经是该群组的成员。

---

### 5.8. 获取用户加入的群组列表 (List Groups for User)

*   **Method:** `GET`
*   **Path:** `/groups`
*   **Description:** 获取当前登录用户已加入的所有群组列表。
*   **Authentication:** JWT Bearer Token required.
*   **Success Response (200 OK):** 返回一个群组对象的数组 (群主信息已脱敏)。
    *   **Example:**
        ```json
        [
          {
            "id": 1,
            "name": "我的技术研讨小组",
            "owner": { "id": 1, "username": "ownerUser", ... },
            "createdAt": "...",
            "updatedAt": "..."
          },
          {
            "id": 2,
            "name": "羽毛球爱好者",
            "owner": { "id": 3, "username": "anotherUser", ... },
            "createdAt": "...",
            "updatedAt": "..."
          }
        ]
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: 未提供有效的 JWT 或 JWT 已过期。
    *   `404 Not Found`: (理论上当前用户应存在) 当前用户ID未找到。

---

### 5.9. 获取特定群组信息 (Get Specific Group Details)

*   **Method:** `GET`
*   **Path:** `/groups/:groupId`
*   **Description:** 获取指定群组的详细信息。要求用户必须是该群组的成员。
*   **Authentication:** JWT Bearer Token required.
*   **Params:**
    *   `groupId` (integer, required): 目标群组的ID。
*   **Success Response (200 OK):** 返回群组对象，包含群主信息和成员列表 (所有用户信息均已脱敏)。
    *   **Example:**
        ```json
        {
          "id": 1,
          "name": "我的技术研讨小组",
          "owner": { "id": 1, "username": "ownerUser", ... },
          "members": [
            {
              "id": 1, // GroupMember ID
              "user": { "id": 1, "username": "ownerUser", ... },
              "joinedAt": "..."
            },
            {
              "id": 10, // GroupMember ID
              "user": { "id": 2, "username": "joiningUser", ... },
              "joinedAt": "..."
            }
          ],
          "createdAt": "...",
          "updatedAt": "..."
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: 未提供有效的 JWT 或 JWT 已过期。
    *   `403 Forbidden`: 当前用户不是该群组的成员。
    *   `404 Not Found`: 指定的 `groupId` 未找到。

---

### 5.10. 获取群组历史消息 (Get Group Message History)

*   **Method:** `GET`
*   **Path:** `/groups/:groupId/messages`
*   **Description:** 获取指定群组的聊天历史消息。要求用户必须是该群组的成员。
*   **Authentication:** JWT Bearer Token required.
*   **Params:**
    *   `groupId` (integer, required): 目标群组的ID。
*   **Query Params:**
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 50, max: 100): 每页消息数量。
*   **Success Response (200 OK):** 返回一个包含消息数组和总消息数的对象。消息中包含发送者信息 (已脱敏)。
    *   **Example:**
        ```json
        {
          "messages": [
            {
              "id": 1,
              "content": "大家好",
              "user": { "id": 1, "username": "testuser", "nickname": "测试用户", ... },
              "group": { "id": 1 }, // 通常只包含ID，或根据需要扩展
              "createdAt": "2023-10-28T14:00:00.000Z"
            },
            {
              "id": 2,
              "content": "你好！",
              "user": { "id": 2, "username": "anotherUser", "nickname": "小明", ... },
              "group": { "id": 1 },
              "createdAt": "2023-10-28T14:01:00.000Z"
            }
          ],
          "total": 250
        }
        ```
*   **Error Responses:**
    *   `401 Unauthorized`: 未提供有效的 JWT 或 JWT 已过期。
    *   `403 Forbidden`: 当前用户不是该群组的成员。
    *   `404 Not Found`: 指定的 `groupId` 未找到。

---

## 6. WebSocket 接口文档 (WebSocket API Documentation)

### 6.1. 命名空间 (Namespace)

*   `/chat`

### 6.2. 认证 (Authentication)

客户端在建立 WebSocket 连接时，必须通过 `socket.handshake.auth.token` 或 `socket.handshake.headers.authorization` (Bearer Token 格式) 提供有效的 JWT。
如果认证失败，服务器将发送一个 `auth_error` 事件给客户端，并断开连接。

### 6.3. 客户端事件 (Client Emitted Events)

以下是客户端可以向服务器发送的事件：

#### 6.3.1. `joinRoom`

*   **Payload:**
    ```json
    {
      "groupId": number // 要加入的群组ID
    }
    ```
*   **Description:** 客户端在成功连接 WebSocket 后，请求加入指定群组的聊天室。服务器会验证用户是否为该群组成员。
*   **Server Response (Acknowledgement/Callback):**
    *   成功: ` { status: 'success', message: 'Joined room for group <groupId>' } `
    *   失败: 通过 `WsException` 抛出错误，客户端通常会收到一个包含错误信息的对象，例如 ` { status: 'error', message: 'User not authenticated.' } ` 或 ` { status: 'error', message: 'You are not a member of this group.' } `。

#### 6.3.2. `leaveRoom`

*   **Payload:**
    ```json
    {
      "groupId": number // 要离开的群组ID
    }
    ```
*   **Description:** 客户端请求离开指定群组的聊天室。
*   **Server Response (Acknowledgement/Callback):**
    *   成功: ` { status: 'success', message: 'Left room for group <groupId>' } `

#### 6.3.3. `sendMessage`

*   **Payload:**
    ```json
    {
      "groupId": number,  // 消息目标群组ID
      "content": string   // 消息内容
    }
    ```
*   **Description:** 客户端向指定的群组发送一条消息。服务器会验证用户是否为该群组成员，然后将消息保存并广播给房间内的其他成员。
*   **Server Response:**
    *   如果消息处理失败（例如，用户无权在群组发言，或内容验证失败），服务器会向**发送方客户端**发送一个 `sendMessageError` 事件。
        *   **Event:** `sendMessageError`
        *   **Payload:** ` { status: 'error', message: string, groupId: number } `

### 6.4. 服务端事件 (Server Emitted Events)

以下是服务器会向客户端发送的事件：

#### 6.4.1. `newMessage`

*   **Payload:** Message object (与 HTTP `/groups/:groupId/messages` 接口返回的消息对象结构一致，包含已脱敏的发送者用户信息)。
    ```json
    {
      "id": 3,
      "content": "这是一条新消息",
      "user": { "id": 1, "username": "senderUser", "nickname": "发送者", ... },
      "group": { "id": 1 }, // 可能仅包含ID
      "createdAt": "2023-10-28T15:00:00.000Z"
    }
    ```
*   **Description:** 当有新消息发送到某个群组时，服务器会将此消息广播给所有在该群组聊天室（room）中的客户端。

#### 6.4.2. `auth_error`

*   **Payload:**
    ```json
    {
      "message": string // 描述认证失败的原因
    }
    ```
*   **Description:** 如果客户端在 WebSocket 连接握手阶段的认证失败，服务器会向该客户端发送此事件，并随后断开连接。

---
