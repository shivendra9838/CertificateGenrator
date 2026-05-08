# Design Document: Certificate Generator System

## Overview

The Certificate Generator System is a full-stack web application that automates the creation, management, and distribution of digital certificates. The system consists of a React-based administrative frontend, a Node.js/Express REST API backend, and MongoDB (Atylas) for data persistence. Administrators can input participant information through a web interface, generate certificates in PDF or image formats, and manage certificate records through search and download capabilities.

### Technology Stack

**Frontend:**

- React 18+ for UI components and state management
- Axios for HTTP client communication
- React Router for navigation
- CSS Modules or Tailwind CSS for styling

**Backend:**

- Node.js (v18+) runtime environment
- Express.js (v4.x) for REST API framework
- Mongoose (v8.x) for MongoDB object modeling
- PDFKit for PDF generation
- Sharp for image conversion
- UUID for unique identifier generation

**Database:**

- MongoDB (Atylas cloud service) for document storage
- Mongoose schemas for data validation

**File Storage:**

- Local filesystem storage for generated certificates
- Organized directory structure: `/certificates/{year}/{month}/{certificateId}.{format}`

### Key Design Decisions

1. **Separation of Concerns**: Three-tier architecture (presentation, business logic, data access) ensures maintainability and testability
2. **RESTful API Design**: Standard HTTP methods and resource-based URLs provide predictable interface
3. **Template-Based Generation**: Certificate templates stored as configuration enable consistent branding without code changes
4. **Asynchronous Processing**: Non-blocking I/O for certificate generation supports concurrent requests
5. **UUID for Identification**: Cryptographically strong unique identifiers prevent collisions in distributed scenarios

## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Admin Panel]
    end

    subgraph "API Layer"
        API[Express REST API]
        Router[Route Handlers]
        Middleware[Middleware Stack]
    end

    subgraph "Business Logic Layer"
        CertGen[Certificate Generator Service]
        Validator[Input Validator Service]
        FileService[File Storage Service]
    end

    subgraph "Data Layer"
        MongoDB[(MongoDB Atylas)]
        FileSystem[(File System)]
    end

    UI -->|HTTP/JSON| API
    API --> Router
    Router --> Middleware
    Middleware --> CertGen
    Middleware --> Validator
    CertGen --> FileService
    CertGen --> MongoDB
    FileService --> FileSystem
    Validator --> MongoDB
```

### Request Flow

1. **Certificate Generation Flow**:
   - Admin submits participant data via React form
   - Frontend validates input and sends POST request to `/api/certificates`
   - Express middleware validates request body
   - Input Validator Service checks required fields and formats
   - Certificate Generator Service creates unique ID
   - PDFKit generates PDF from template with participant data
   - Sharp converts PDF to image if requested
   - File Storage Service saves certificate to filesystem
   - Database Service persists certificate record to MongoDB
   - API returns certificate ID and download URL to frontend

2. **Certificate Retrieval Flow**:
   - Admin requests certificate list or searches by ID/name
   - Frontend sends GET request to `/api/certificates` with query parameters
   - Database Service queries MongoDB with filters
   - API returns paginated certificate records
   - Frontend displays results in table/grid view

3. **Certificate Download Flow**:
   - Admin clicks download button for specific certificate
   - Frontend sends GET request to `/api/certificates/{id}/download`
   - File Storage Service retrieves file from filesystem
   - API streams file to client with appropriate content-type headers
   - Browser initiates file download

## Components and Interfaces

### Frontend Components

#### 1. CertificateForm Component

**Purpose**: Input form for participant information

**Props**:

- `onSubmit: (data: CertificateFormData) => Promise<void>` - Callback for form submission
- `isLoading: boolean` - Loading state indicator

**State**:

```typescript
interface CertificateFormData {
  participantName: string;
  role: string;
  eventOrInternship: string;
  date: string;
  format: 'pdf' | 'image' | 'both';
}
```

**Responsibilities**:

- Render input fields for participant data
- Client-side validation (required fields, date format)
- Display validation errors
- Submit data to parent component

#### 2. CertificateList Component

**Purpose**: Display and manage certificate records

**Props**:

- `certificates: Certificate[]` - Array of certificate records
- `onDownload: (id: string) => void` - Download handler
- `onSearch: (query: string) => void` - Search handler

**State**:

```typescript
interface Certificate {
  id: string;
  participantName: string;
  role: string;
  eventOrInternship: string;
  date: string;
  uniqueCertificateId: string;
  generatedAt: string;
  format: string;
}
```

**Responsibilities**:

- Render certificate records in table format
- Provide search input with debouncing
- Handle download button clicks
- Display loading and error states

#### 3. SearchBar Component

**Purpose**: Search interface for filtering certificates

**Props**:

- `onSearch: (query: string, field: 'id' | 'name') => void` - Search callback
- `placeholder: string` - Input placeholder text

**Responsibilities**:

- Render search input and field selector
- Debounce search input (300ms delay)
- Emit search events to parent

### Backend API Endpoints

#### POST /api/certificates

**Purpose**: Generate new certificate

**Request Body**:

```json
{
  "participantName": "string (required, 1-200 chars)",
  "role": "string (required, 1-100 chars)",
  "eventOrInternship": "string (required, 1-200 chars)",
  "date": "string (required, ISO 8601 format)",
  "format": "string (required, enum: 'pdf' | 'image' | 'both')"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "certificateId": "uuid-v4-string",
    "uniqueCertificateId": "uuid-v4-string",
    "downloadUrls": {
      "pdf": "/api/certificates/{id}/download?format=pdf",
      "image": "/api/certificates/{id}/download?format=image"
    }
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid input data
- 500 Internal Server Error: Generation failure

#### GET /api/certificates

**Purpose**: Retrieve certificate list with optional filtering

**Query Parameters**:

- `search` (optional): Search term for name or ID
- `searchField` (optional): Field to search ('name' | 'id')
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Records per page

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": "mongodb-object-id",
        "participantName": "string",
        "role": "string",
        "eventOrInternship": "string",
        "date": "ISO-8601-string",
        "uniqueCertificateId": "uuid-v4-string",
        "generatedAt": "ISO-8601-string",
        "format": "string"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 100,
      "limit": 20
    }
  }
}
```

#### GET /api/certificates/:id

**Purpose**: Retrieve single certificate record

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "mongodb-object-id",
    "participantName": "string",
    "role": "string",
    "eventOrInternship": "string",
    "date": "ISO-8601-string",
    "uniqueCertificateId": "uuid-v4-string",
    "generatedAt": "ISO-8601-string",
    "format": "string",
    "filePaths": {
      "pdf": "/path/to/file.pdf",
      "image": "/path/to/file.png"
    }
  }
}
```

**Error Responses**:

- 404 Not Found: Certificate does not exist

#### GET /api/certificates/:id/download

**Purpose**: Download certificate file

**Query Parameters**:

- `format` (required): File format ('pdf' | 'image')

**Response** (200 OK):

- Content-Type: `application/pdf` or `image/png`
- Content-Disposition: `attachment; filename="certificate-{uniqueId}.{ext}"`
- Binary file stream

**Error Responses**:

- 404 Not Found: Certificate or file does not exist
- 400 Bad Request: Invalid format parameter

### Backend Services

#### CertificateGeneratorService

**Interface**:

```typescript
interface ICertificateGeneratorService {
  generateCertificate(data: CertificateInput): Promise<CertificateOutput>;
  generateUniqueId(): string;
}

interface CertificateInput {
  participantName: string;
  role: string;
  eventOrInternship: string;
  date: Date;
  format: 'pdf' | 'image' | 'both';
}

interface CertificateOutput {
  uniqueCertificateId: string;
  filePaths: {
    pdf?: string;
    image?: string;
  };
}
```

**Responsibilities**:

- Generate UUID v4 for unique certificate identification
- Load certificate template configuration
- Create PDF using PDFKit with participant data
- Convert PDF to PNG using Sharp (if image format requested)
- Return file paths and unique ID

**Key Methods**:

- `generatePDF(data, templateConfig)`: Creates PDF document
- `convertToImage(pdfPath)`: Converts PDF to PNG image
- `ensureDirectoryExists(path)`: Creates directory structure if missing

#### InputValidatorService

**Interface**:

```typescript
interface IInputValidatorService {
  validateCertificateInput(data: any): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
}
```

**Responsibilities**:

- Validate required fields are present and non-empty
- Validate date format (ISO 8601)
- Validate string length constraints
- Validate enum values (format field)
- Return structured validation errors

**Validation Rules**:

- `participantName`: Required, 1-200 characters, non-whitespace
- `role`: Required, 1-100 characters, non-whitespace
- `eventOrInternship`: Required, 1-200 characters, non-whitespace
- `date`: Required, valid ISO 8601 date string
- `format`: Required, one of ['pdf', 'image', 'both']

#### FileStorageService

**Interface**:

```typescript
interface IFileStorageService {
  saveCertificate(buffer: Buffer, metadata: FileMetadata): Promise<string>;
  getCertificate(filePath: string): Promise<Buffer>;
  deleteCertificate(filePath: string): Promise<void>;
  generateFilePath(uniqueId: string, format: string): string;
}

interface FileMetadata {
  uniqueId: string;
  format: string;
  generatedAt: Date;
}
```

**Responsibilities**:

- Generate organized file paths based on date and ID
- Write certificate files to filesystem
- Read certificate files for download
- Handle file system errors gracefully
- Ensure directory structure exists

**File Organization**:

```
/certificates
  /2024
    /01
      /{uuid}.pdf
      /{uuid}.png
    /02
      /{uuid}.pdf
```

#### DatabaseService

**Interface**:

```typescript
interface IDatabaseService {
  createCertificate(record: CertificateRecord): Promise<Certificate>;
  getCertificateById(id: string): Promise<Certificate | null>;
  searchCertificates(query: SearchQuery): Promise<SearchResult>;
  getCertificateByUniqueId(uniqueId: string): Promise<Certificate | null>;
}

interface SearchQuery {
  searchTerm?: string;
  searchField?: 'name' | 'id';
  page: number;
  limit: number;
}

interface SearchResult {
  certificates: Certificate[];
  totalCount: number;
}
```

**Responsibilities**:

- Persist certificate records to MongoDB
- Query certificates by ID or unique ID
- Search certificates by participant name
- Implement pagination for list queries
- Handle database connection errors

## Data Models

### MongoDB Schema: Certificate

```javascript
const certificateSchema = new mongoose.Schema(
  {
    participantName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    eventOrInternship: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    date: {
      type: Date,
      required: true,
    },
    uniqueCertificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    format: {
      type: String,
      required: true,
      enum: ['pdf', 'image', 'both'],
    },
    filePaths: {
      pdf: {
        type: String,
        required: false,
      },
      image: {
        type: String,
        required: false,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
certificateSchema.index({ participantName: 'text' });
certificateSchema.index({ uniqueCertificateId: 1 }, { unique: true });
certificateSchema.index({ generatedAt: -1 });
```

**Indexes**:

- `participantName`: Text index for full-text search
- `uniqueCertificateId`: Unique index for fast lookups and collision prevention
- `generatedAt`: Descending index for chronological queries

### Certificate Template Configuration

```javascript
const templateConfig = {
  pageSize: 'A4',
  orientation: 'landscape',
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
  },
  fonts: {
    title: {
      family: 'Helvetica-Bold',
      size: 36,
    },
    body: {
      family: 'Helvetica',
      size: 18,
    },
    footer: {
      family: 'Helvetica',
      size: 12,
    },
  },
  colors: {
    primary: '#2C3E50',
    secondary: '#3498DB',
    text: '#000000',
  },
  layout: {
    title: {
      text: 'Certificate of Achievement',
      y: 100,
    },
    participantName: {
      prefix: 'This is to certify that',
      y: 200,
    },
    role: {
      prefix: 'has successfully completed the role of',
      y: 280,
    },
    event: {
      prefix: 'in',
      y: 340,
    },
    date: {
      prefix: 'on',
      y: 400,
    },
    uniqueId: {
      prefix: 'Certificate ID:',
      y: 500,
    },
  },
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

This system combines CRUD operations, infrastructure integration, and business logic. Property-based testing applies to the business logic and validation layers, while example-based and integration tests cover the infrastructure and UI layers.

### Property 1: Certificate Generation Preserves Input Data

_For any_ valid participant information (name, role, event/internship, date), when a certificate is generated, the output certificate document SHALL contain all input fields with their original values.

**Validates: Requirements 1.1, 3.3, 7.2**

### Property 2: Required Fields Validation Rejects Invalid Inputs

_For any_ input where participantName, role, or eventOrInternship consists entirely of whitespace or is empty, the Input_Validator SHALL reject the input and return a validation error.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Date Validation Accepts Only Valid ISO 8601 Formats

_For any_ date string input, the Input_Validator SHALL accept the input if and only if it conforms to valid ISO 8601 date format.

**Validates: Requirements 2.4**

### Property 4: Validation Errors Identify Failing Fields

_For any_ invalid input, the validation error response SHALL contain the name of the specific field that failed validation.

**Validates: Requirements 2.5**

### Property 5: Certificate IDs Are Unique Under Concurrent Generation

_For any_ set of concurrent certificate generation requests, all generated Unique_Certificate_IDs SHALL be distinct from each other and from all previously generated identifiers.

**Validates: Requirements 1.4, 3.1, 3.2, 9.3**

### Property 6: Format Preservation Round-Trip

_For any_ certificate generation request specifying format F (where F is 'pdf' or 'image'), the downloaded certificate file SHALL be in format F.

**Validates: Requirements 4.5, 7.3**

### Property 7: Search Returns All Matching Records

_For any_ participant name N and certificate database state, searching by name N SHALL return all and only those certificate records where participantName contains N.

**Validates: Requirements 5.4**

### Property 8: Database Persistence Preserves All Fields

_For any_ certificate record created with fields (participantName, role, eventOrInternship, date, uniqueCertificateId, format), when retrieved from the database, all field values SHALL match the original values.

**Validates: Requirements 6.2**

### Property 9: Concurrent Requests Process Independently

_For any_ set of concurrent certificate generation requests with different input data, each request SHALL complete successfully and produce a certificate with the correct corresponding input data, independent of other concurrent requests.

**Validates: Requirements 9.1, 9.2**

## Error Handling

### Error Classification

1. **Validation Errors (400 Bad Request)**:
   - Missing required fields
   - Invalid date format
   - String length violations
   - Invalid enum values

2. **Not Found Errors (404 Not Found)**:
   - Certificate ID does not exist
   - Certificate file not found on filesystem

3. **Server Errors (500 Internal Server Error)**:
   - Database connection failures
   - File system write errors
   - PDF generation failures
   - Image conversion failures

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "participantName",
        "message": "Participant name is required"
      }
    ]
  }
}
```

### Error Handling Strategy

**Backend**:

- Centralized error handling middleware in Express
- Custom error classes for different error types
- Structured error logging with Winston or Pino
- Error details logged but sanitized in API responses
- Database errors caught and wrapped with context
- File system errors handled with retry logic (3 attempts)

**Frontend**:

- Global error boundary component for React errors
- Toast notifications for user-facing errors
- Error state management in components
- Retry mechanisms for network failures
- User-friendly error messages (no stack traces)

### Logging Strategy

**Log Levels**:

- `error`: Certificate generation failures, database errors, file system errors
- `warn`: Validation failures, missing optional data
- `info`: Certificate generation success, API requests
- `debug`: Detailed execution flow (development only)

**Log Format**:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Certificate generated successfully",
  "context": {
    "uniqueCertificateId": "uuid-string",
    "participantName": "John Doe",
    "format": "pdf",
    "duration": 1234
  }
}
```

## Testing Strategy

### Dual Testing Approach

This system requires both **property-based tests** for business logic and validation, and **example-based/integration tests** for infrastructure, CRUD operations, and UI components.

**Property-Based Testing** (for business logic):

- Input validation rules
- Unique ID generation
- Data preservation across transformations
- Concurrent operation correctness

**Example-Based Testing** (for specific scenarios):

- File format support (PDF, image)
- Error handling scenarios
- UI component rendering
- Specific edge cases

**Integration Testing** (for infrastructure):

- Database operations (MongoDB)
- File system operations
- API endpoint behavior
- Performance requirements

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Test Configuration**:

- Minimum 100 iterations per property test
- Each property test MUST reference its design document property using a comment tag
- Tag format: `// Feature: certificate-generator, Property {number}: {property_text}`

**Example Property Test Structure**:

```javascript
// Feature: certificate-generator, Property 2: Required Fields Validation Rejects Invalid Inputs
test('property: required fields validation rejects whitespace inputs', () => {
  fc.assert(
    fc.property(
      fc.string().filter((s) => s.trim() === ''), // Generate whitespace strings
      (whitespaceString) => {
        const result = validator.validate({
          participantName: whitespaceString,
          role: 'Developer',
          eventOrInternship: 'Internship',
          date: '2024-01-15',
        });
        expect(result.isValid).toBe(false);
        expect(result.errors).toContainEqual(expect.objectContaining({ field: 'participantName' }));
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Backend Unit Tests**:

- **InputValidatorService**:
  - Property tests for validation rules (Properties 2, 3, 4)
  - Example tests for specific validation scenarios
- **CertificateGeneratorService**:
  - Property tests for data preservation (Property 1)
  - Property tests for unique ID generation (Property 5)
  - Example tests for PDF/image generation
- **FileStorageService**:
  - Example tests with mocked filesystem
  - Property tests for file path generation
- **DatabaseService**:
  - Property tests for data persistence (Property 8)
  - Example tests with mocked MongoDB

**Frontend Unit Tests**:

- **CertificateForm**: Example tests for form validation, submission, error display
- **CertificateList**: Example tests for rendering, search, download actions
- **SearchBar**: Example tests for debouncing, search emission

**Testing Tools**:

- Backend: Jest, fast-check for property-based testing, Supertest for API testing
- Frontend: Jest, React Testing Library
- Mocking: jest.mock() for external dependencies

### Integration Testing

**API Integration Tests**:

- Test complete request/response cycles for all endpoints
- Test database persistence and retrieval (Property 8)
- Test file generation and storage
- Test error scenarios (invalid input, missing files, database failures)
- Test concurrent certificate generation (Property 9)
- Test format preservation (Property 6)
- Test search functionality (Property 7)

**Test Scenarios**:

1. Generate certificate with valid data → verify database record and file creation (Property 1)
2. Search certificates by name → verify correct results returned (Property 7)
3. Download certificate → verify file stream and headers (Property 6)
4. Generate certificate with invalid data → verify 400 error response (Properties 2, 3, 4)
5. Request non-existent certificate → verify 404 error response
6. Concurrent generation requests → verify unique IDs and no race conditions (Property 5, 9)

**Testing Tools**:

- Supertest for HTTP assertions
- MongoDB Memory Server for isolated database testing
- Temporary filesystem directories for file testing
- fast-check for property-based integration tests

### End-to-End Testing

**E2E Test Scenarios**:

1. Admin opens application → sees certificate list
2. Admin fills form and submits → certificate generated and appears in list
3. Admin searches for certificate → finds correct record
4. Admin downloads certificate → file downloads successfully
5. Admin generates multiple certificates → all appear in list with unique IDs

**Testing Tools**:

- Playwright or Cypress for browser automation
- Test database instance (not production)
- Cleanup scripts to reset test data

### Performance Testing

**Load Testing Scenarios**:

- Concurrent certificate generation (10, 50, 100 requests)
- Large certificate list retrieval (1000+ records)
- Search performance with large dataset
- File download under load

**Performance Targets**:

- Certificate generation: < 5 seconds per certificate
- Database queries: < 500ms for single record, < 1 second for search
- File download: < 3 seconds for PDF/image
- API response time: < 2 seconds for generation, < 1 second for retrieval

**Testing Tools**:

- Apache JMeter or Artillery for load testing
- MongoDB profiling for query optimization
- Node.js profiler for bottleneck identification

## Deployment Considerations

### Environment Configuration

**Environment Variables**:

```bash
# Server
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.example.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.atylas.mongodb.net/certificates
MONGODB_DB_NAME=certificate_generator

# File Storage
CERTIFICATE_STORAGE_PATH=/var/certificates
MAX_FILE_SIZE_MB=10

# Security
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://admin.example.com

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/certificate-generator.log
```

### Scalability Considerations

1. **Horizontal Scaling**: Stateless API design allows multiple backend instances behind load balancer
2. **File Storage**: Consider cloud storage (AWS S3, Azure Blob) for distributed deployments
3. **Database**: MongoDB Atylas provides automatic scaling and replication
4. **Caching**: Implement Redis for frequently accessed certificate records
5. **CDN**: Serve static frontend assets through CDN for global performance

### Security Considerations

1. **Authentication**: Implement JWT-based authentication for admin access
2. **Authorization**: Role-based access control for certificate management
3. **Input Sanitization**: Prevent XSS and injection attacks
4. **Rate Limiting**: Prevent abuse with request rate limits (100 requests/minute per IP)
5. **HTTPS**: Enforce TLS for all API communication
6. **CORS**: Configure allowed origins for frontend access
7. **File Validation**: Validate file types and sizes before processing
8. **SQL Injection Prevention**: Mongoose parameterized queries prevent NoSQL injection

### Monitoring and Observability

**Metrics to Track**:

- Certificate generation success/failure rate
- API response times (p50, p95, p99)
- Database query performance
- File storage usage
- Error rates by endpoint
- Concurrent request count

**Monitoring Tools**:

- Application Performance Monitoring (APM): New Relic, Datadog, or Application Insights
- Log Aggregation: ELK Stack (Elasticsearch, Logstash, Kibana) or CloudWatch Logs
- Uptime Monitoring: Pingdom or UptimeRobot
- Database Monitoring: MongoDB Atlas built-in monitoring

### Backup and Recovery

1. **Database Backups**: MongoDB Atylas automated daily backups with point-in-time recovery
2. **File Backups**: Daily incremental backups of certificate files to cloud storage
3. **Backup Retention**: 30 days for database, 90 days for files
4. **Recovery Testing**: Quarterly restore tests to verify backup integrity
5. **Disaster Recovery Plan**: Documented procedures for data restoration

## Future Enhancements

1. **Batch Certificate Generation**: Upload CSV file to generate multiple certificates
2. **Email Distribution**: Automatically email certificates to participants
3. **Template Editor**: Visual editor for customizing certificate templates
4. **Digital Signatures**: Add cryptographic signatures for verification
5. **QR Code Integration**: Embed QR codes for online verification
6. **Multi-language Support**: Generate certificates in multiple languages
7. **Analytics Dashboard**: Track certificate generation trends and statistics
8. **API Rate Limiting**: Implement tiered rate limits for different user roles
9. **Webhook Notifications**: Notify external systems when certificates are generated
10. **Certificate Revocation**: Mark certificates as revoked with audit trail
