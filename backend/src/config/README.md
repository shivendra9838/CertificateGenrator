# Database Configuration

This directory contains the MongoDB connection service for the Certificate Generator System.

## Database Connection Service

The `database.ts` module provides a singleton database connection service with the following features:

### Features

1. **Singleton Pattern**: Ensures only one database connection instance exists
2. **Connection Pooling**: Configures connection pool with min/max pool sizes
3. **Retry Logic**: Automatically retries failed connections with configurable attempts and delays
4. **Error Handling**: Comprehensive error handling with detailed logging
5. **Event Listeners**: Monitors connection status (connected, disconnected, error)
6. **Graceful Shutdown**: Handles SIGINT and SIGTERM signals for clean disconnection

### Usage

#### Basic Connection

```typescript
import { getDatabaseConnection } from './config/database';

// Get database connection instance
const db = getDatabaseConnection();

// Connect to MongoDB
await db.connect();

// Check connection status
if (db.getConnectionStatus()) {
  console.log('Database is connected');
}

// Get mongoose connection for queries
const connection = db.getConnection();
```

#### Custom Configuration

```typescript
import { getDatabaseConnection } from './config/database';

// Configure custom retry and pool settings
const db = getDatabaseConnection({
  maxRetries: 3, // Maximum connection retry attempts
  retryDelay: 3000, // Delay between retries in milliseconds
  poolSize: 20, // Maximum connection pool size (configured internally)
});

await db.connect();
```

#### Disconnection

```typescript
// Disconnect from MongoDB
await db.disconnect();
```

### Environment Variables

The following environment variables must be configured:

- `MONGODB_URI` (required): MongoDB connection string
  - Example: `mongodb+srv://username:password@cluster.atylas.mongodb.net/`
- `MONGODB_DB_NAME` (optional): Database name
  - Default: `certificate_generator`

### Connection Pool Configuration

The service configures the following connection pool settings:

- **maxPoolSize**: 10 connections
- **minPoolSize**: 2 connections
- **serverSelectionTimeoutMS**: 5000ms
- **socketTimeoutMS**: 45000ms

### Error Handling

The service handles the following error scenarios:

1. **Missing Environment Variables**: Throws error if `MONGODB_URI` is not defined
2. **Connection Failures**: Retries connection with exponential backoff
3. **Max Retries Exceeded**: Throws error after maximum retry attempts
4. **Disconnection Errors**: Logs and throws errors during disconnection

### Event Monitoring

The service monitors the following MongoDB events:

- **connected**: Logged when connection is established
- **error**: Logged when connection error occurs
- **disconnected**: Logged when connection is lost

### Testing

The database service includes comprehensive unit tests covering:

- Singleton instance creation
- Successful connection
- Connection retry logic
- Error handling
- Disconnection
- Connection status checks

Run tests with:

```bash
npm test -- database.test.ts
```

### Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 6.1**: Database service stores certificate records in MongoDB (Atylas)
- **Requirement 6.5**: Database service returns error status and logs failures

### Design Alignment

This implementation follows the design document specifications:

- Uses Mongoose (v8.x) for MongoDB object modeling
- Implements connection pooling for scalability
- Provides error handling and retry logic
- Supports MongoDB Atylas cloud service
