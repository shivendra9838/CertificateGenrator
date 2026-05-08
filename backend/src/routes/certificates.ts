import { Router, Request, Response, NextFunction } from 'express';
import { inputValidatorService } from '../services/InputValidatorService';
import { certificateGeneratorService } from '../services/CertificateGeneratorService';
import { fileStorageService } from '../services/FileStorageService';
import { databaseService } from '../services/DatabaseService';
import { connectToDatabase } from '../config/database';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    const validationResult = inputValidatorService.validateCertificateInput(req.body);

    if (!validationResult.isValid) {
      console.warn('Certificate generation failed: validation errors', {
        errors: validationResult.errors,
      });

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: validationResult.errors,
        },
      });
    }

    await connectToDatabase();

    const certificateInput = {
      participantName: req.body.participantName,
      role: req.body.role,
      eventOrInternship: req.body.eventOrInternship,
      date: new Date(req.body.date),
      format: req.body.format as 'pdf' | 'image' | 'both',
    };

    const certificateOutput =
      await certificateGeneratorService.generateCertificate(certificateInput);

    const certificateRecord = await databaseService.createCertificate({
      participantName: certificateInput.participantName,
      role: certificateInput.role,
      eventOrInternship: certificateInput.eventOrInternship,
      date: certificateInput.date,
      uniqueCertificateId: certificateOutput.uniqueCertificateId,
      format: certificateInput.format,
      filePaths: certificateOutput.filePaths,
      issuedBy: certificateOutput.issuedBy,
      generatedAt: certificateOutput.issuedAt,
    });

    const downloadUrls: { pdf?: string; image?: string } = {};
    if (certificateOutput.filePaths.pdf) {
      downloadUrls.pdf = `/api/certificates/${certificateRecord._id}/download?format=pdf`;
    }
    if (certificateOutput.filePaths.image) {
      downloadUrls.image = `/api/certificates/${certificateRecord._id}/download?format=image`;
    }

    const duration = Date.now() - startTime;
    console.log('Certificate generated successfully', {
      certificateId: certificateRecord._id,
      uniqueCertificateId: certificateOutput.uniqueCertificateId,
      participantName: certificateInput.participantName,
      format: certificateInput.format,
      duration,
    });

    return res.status(201).json({
      success: true,
      data: {
        certificateId: certificateRecord._id,
        uniqueCertificateId: certificateOutput.uniqueCertificateId,
        issuedAt: certificateOutput.issuedAt,
        issuedBy: certificateOutput.issuedBy,
        downloadUrls,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Certificate generation failed', {
      error: errorMessage,
      duration,
      body: req.body,
    });

    return next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    await connectToDatabase();

    const searchTerm = req.query.search as string | undefined;
    const searchField = req.query.searchField as 'name' | 'id' | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (page < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Page number must be greater than 0',
        },
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Limit must be between 1 and 100',
        },
      });
    }

    const searchResult = await databaseService.searchCertificates({
      searchTerm,
      searchField,
      page,
      limit,
    });

    const totalPages = Math.ceil(searchResult.totalCount / limit);

    const duration = Date.now() - startTime;
    console.log('Certificate list retrieved', {
      searchTerm,
      searchField,
      page,
      limit,
      totalCount: searchResult.totalCount,
      duration,
    });

    return res.status(200).json({
      success: true,
      data: {
        certificates: searchResult.certificates,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: searchResult.totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Failed to retrieve certificate list', {
      error: errorMessage,
      duration,
      query: req.query,
    });

    return next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    await connectToDatabase();

    const certificateId = req.params.id;

    const certificate = await databaseService.getCertificateById(certificateId);

    if (!certificate) {
      const duration = Date.now() - startTime;
      console.warn('Certificate not found', {
        certificateId,
        duration,
      });

      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Certificate not found',
        },
      });
    }

    const duration = Date.now() - startTime;
    console.log('Certificate retrieved', {
      certificateId,
      uniqueCertificateId: certificate.uniqueCertificateId,
      duration,
    });

    return res.status(200).json({
      success: true,
      data: {
        id: certificate._id,
        participantName: certificate.participantName,
        role: certificate.role,
        eventOrInternship: certificate.eventOrInternship,
        date: certificate.date,
        uniqueCertificateId: certificate.uniqueCertificateId,
        generatedAt: certificate.generatedAt,
        issuedAt: certificate.generatedAt,
        issuedBy: certificate.issuedBy,
        format: certificate.format,
        filePaths: certificate.filePaths,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Failed to retrieve certificate', {
      error: errorMessage,
      duration,
      certificateId: req.params.id,
    });

    return next(error);
  }
});

router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    await connectToDatabase();

    const certificateId = req.params.id;
    const format = req.query.format as string;

    if (!format || (format !== 'pdf' && format !== 'image')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Format parameter is required and must be either "pdf" or "image"',
        },
      });
    }

    const certificate = await databaseService.getCertificateById(certificateId);

    if (!certificate) {
      const duration = Date.now() - startTime;
      console.warn('Certificate not found for download', {
        certificateId,
        format,
        duration,
      });

      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Certificate not found',
        },
      });
    }

    const filePath = format === 'pdf' ? certificate.filePaths.pdf : certificate.filePaths.image;

    if (!filePath) {
      const duration = Date.now() - startTime;
      console.warn('Certificate file not found', {
        certificateId,
        uniqueCertificateId: certificate.uniqueCertificateId,
        format,
        duration,
      });

      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Certificate file not found in ${format} format`,
        },
      });
    }

    const fileBuffer = await fileStorageService.getCertificate(filePath);

    const contentType = format === 'pdf' ? 'application/pdf' : 'image/png';
    const extension = format === 'pdf' ? 'pdf' : 'png';
    const filename = `certificate-${certificate.uniqueCertificateId}.${extension}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    const duration = Date.now() - startTime;
    console.log('Certificate file downloaded', {
      certificateId,
      uniqueCertificateId: certificate.uniqueCertificateId,
      format,
      fileSize: fileBuffer.length,
      duration,
    });

    return res.status(200).send(fileBuffer);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Failed to download certificate', {
      error: errorMessage,
      duration,
      certificateId: req.params.id,
      format: req.query.format,
    });

    return next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  try {
    await connectToDatabase();

    const certificateId = req.params.id;
    const certificate = await databaseService.getCertificateById(certificateId);

    if (!certificate) {
      const duration = Date.now() - startTime;
      console.warn('Certificate not found for deletion', {
        certificateId,
        duration,
      });

      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Certificate not found',
        },
      });
    }

    const pathsToDelete = [certificate.filePaths.pdf, certificate.filePaths.image].filter(
      (filePath): filePath is string => Boolean(filePath)
    );

    await Promise.all(
      pathsToDelete.map((filePath) => fileStorageService.deleteCertificate(filePath))
    );
    await databaseService.deleteCertificateById(certificateId);

    const duration = Date.now() - startTime;
    console.log('Certificate deleted', {
      certificateId,
      uniqueCertificateId: certificate.uniqueCertificateId,
      duration,
    });

    return res.status(200).json({
      success: true,
      data: {
        certificateId,
        uniqueCertificateId: certificate.uniqueCertificateId,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error('Failed to delete certificate', {
      error: errorMessage,
      duration,
      certificateId: req.params.id,
    });

    return next(error);
  }
});

export default router;
